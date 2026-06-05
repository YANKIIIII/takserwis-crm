import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/order-items — добавить позицию в наряд
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { workOrderId, name, type, quantity, unitPrice, inventoryItemId } = body;

  const parsedQty = parseFloat(quantity) || 1;

  const item = await prisma.orderItem.create({
    data: {
      workOrderId: parseInt(workOrderId),
      name,
      type: type || 'service',
      quantity: parsedQty,
      unitPrice: parseFloat(unitPrice),
      inventoryItemId: inventoryItemId ? parseInt(inventoryItemId) : null,
    },
  });

  if (inventoryItemId) {
    await prisma.inventoryItem.update({
      where: { id: parseInt(inventoryItemId) },
      data: {
        quantity: { decrement: parsedQty }
      }
    });
  }

  // Пересчитать общую сумму заказ-наряда
  const allItems = await prisma.orderItem.findMany({
    where: { workOrderId: parseInt(workOrderId) },
  });
  const total = allItems.reduce((sum, i) => sum + i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100), 0);

  await prisma.workOrder.update({
    where: { id: parseInt(workOrderId) },
    data: { totalAmount: total },
  });

  return NextResponse.json({ item, totalAmount: total }, { status: 201 });
}

// DELETE /api/order-items?id=X — удалить позицию
export async function DELETE(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get('id');
  if (!itemId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const item = await prisma.orderItem.findUnique({ where: { id: parseInt(itemId) } });
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (item.inventoryItemId) {
    await prisma.inventoryItem.update({
      where: { id: item.inventoryItemId },
      data: {
        quantity: { increment: item.quantity }
      }
    });
  }

  await prisma.orderItem.delete({ where: { id: parseInt(itemId) } });

  // Пересчитать
  const allItems = await prisma.orderItem.findMany({
    where: { workOrderId: item.workOrderId },
  });
  const total = allItems.reduce((sum, i) => sum + i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100), 0);

  await prisma.workOrder.update({
    where: { id: item.workOrderId },
    data: { totalAmount: total },
  });

  return NextResponse.json({ totalAmount: total });
}
