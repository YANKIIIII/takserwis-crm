import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';

export const POST = withErrorHandler(async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  const estimateId = Number(params.id);

  // 1. Получаем смету со всеми позициями
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: { items: true }
  });

  if (!estimate) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
  }

  if (estimate.status === 'converted') {
    return NextResponse.json({ error: 'Estimate already converted' }, { status: 400 });
  }

  // 2. Создаем заказ-наряд (WorkOrder) и позиции (OrderItem) в транзакции
  const newWorkOrder = await prisma.$transaction(async (tx) => {
    // Получаем список колонок для заказ-нарядов, чтобы назначить статус
    const firstTag = await tx.tag.findFirst({
      where: { entity: 'work_order_status' },
      orderBy: { order: 'asc' }
    });
    const initialStatus = firstTag ? firstTag.name : 'pending';

    // Создаем WorkOrder
    const workOrder = await tx.workOrder.create({
      data: {
        vehicleId: estimate.vehicleId,
        description: estimate.description,
        totalAmount: estimate.totalAmount,
        status: initialStatus, // Динамический статус первой колонки
        items: {
          create: estimate.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            type: item.type,
            // mechanicPay можно оставить по умолчанию (0)
          }))
        }
      }
    });

    // Обновляем статус сметы
    await tx.estimate.update({
      where: { id: estimateId },
      data: { status: 'converted' }
    });

    return workOrder;
  });

  // Возвращаем ID нового заказ-наряда, чтобы фронтенд мог сделать редирект
  return NextResponse.json({ success: true, workOrderId: newWorkOrder.id });
});
