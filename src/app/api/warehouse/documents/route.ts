import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const documents = await prisma.warehouseDocument.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd pobierania dokumentów' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Calculate total value
    const totalValue = data.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the document
      const doc = await tx.warehouseDocument.create({
        data: {
          type: data.type,
          documentNumber: data.documentNumber,
          date: new Date(data.date),
          contractorName: data.contractorName,
          status: 'sent',
          totalValue,
          items: {
            create: data.items.map((item: any) => ({
              itemCode: item.itemCode,
              name: item.name,
              quantity: parseFloat(item.quantity),
              price: parseFloat(item.price)
            }))
          }
        }
      });

      // 2. Update stock
      for (const item of data.items) {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.price);
        
        // Find existing inventory item by itemCode
        const existing = await tx.inventoryItem.findUnique({
          where: { itemCode: item.itemCode }
        });

        if (existing) {
          if (data.type === 'PZ') {
            await tx.inventoryItem.update({
              where: { id: existing.id },
              data: {
                quantity: existing.quantity + qty,
                purchasePrice: price // update last purchase price
              }
            });
          } else if (data.type === 'WZ' || data.type === 'FV' || data.type === 'PA') {
            await tx.inventoryItem.update({
              where: { id: existing.id },
              data: {
                quantity: existing.quantity - qty
              }
            });
          }
        } else if (data.type === 'PZ') {
          // If it's a purchase and item doesn't exist, create it
          await tx.inventoryItem.create({
            data: {
              itemCode: item.itemCode,
              name: item.name,
              quantity: qty,
              purchasePrice: price
            }
          });
        }
      }

      return doc;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
