import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const type = body.type || 'PA'; // PA or FV

    const order = await prisma.workOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        vehicle: {
          include: { customer: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const contractorName = `${order.vehicle.customer.firstName} ${order.vehicle.customer.lastName}`.trim();
    
    // Auto-generate document number (e.g. PA-2025/001)
    const year = new Date().getFullYear();
    const prefix = type;
    const count = await prisma.warehouseDocument.count({
      where: { type, documentNumber: { startsWith: `${prefix}-${year}/` } }
    });
    const docNum = `${prefix}-${year}/${(count + 1).toString().padStart(3, '0')}`;

    const newDoc = await prisma.warehouseDocument.create({
      data: {
        type,
        documentNumber: docNum,
        date: new Date(),
        contractorName,
        status: 'paid', // Assumed paid if generating receipt/invoice at the end
        totalValue: order.totalAmount,
        workOrderId: parseInt(id),
        items: {
          create: order.items.map(i => ({
            itemCode: i.type === 'service' ? 'USL' : 'CZ',
            name: i.name,
            quantity: i.quantity,
            price: i.unitPrice * (1 - (i.discount || 0) / 100)
          }))
        }
      }
    });

    // Option: mark the work order as having an invoice? 
    // We could add an invoiceId to WorkOrder in schema, but for now just returning success.
    // Also, we do NOT deduct inventory here because it was already deducted when items were added to the Work Order!

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
