import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  const estimate = await prisma.estimate.findUnique({
    where: { id: Number(params.id) },
    include: {
      items: true,
      vehicle: {
        include: { customer: true }
      }
    }
  });

  if (!estimate) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(estimate);
});

export const PUT = withErrorHandler(async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  const id = Number(params.id);
  const data = await request.json();
  const { description, validUntil, status, totalAmount, items } = data;

  // Если переданы items, мы удаляем старые и создаем новые
  // Это самый простой способ обновить 1-to-many отношение
  const updateData: any = {
    description,
    status,
    totalAmount,
    validUntil: validUntil ? new Date(validUntil) : null,
  };

  if (items) {
    updateData.items = {
      deleteMany: {},
      create: items.map((item: any) => ({
        name: item.name,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        discount: Number(item.discount) || 0,
        type: item.type || 'part'
      }))
    };
  }

  const estimate = await prisma.estimate.update({
    where: { id },
    data: updateData,
    include: { items: true, vehicle: true }
  });

  return NextResponse.json(estimate);
});

export const DELETE = withErrorHandler(async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  await prisma.estimate.delete({
    where: { id: Number(params.id) }
  });
  return NextResponse.json({ success: true });
});
