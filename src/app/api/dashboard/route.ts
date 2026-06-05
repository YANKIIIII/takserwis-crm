import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/dashboard — статистика для дашборда
export async function GET() {
  const [
    totalCustomers,
    totalVehicles,
    pendingOrders,
    inProgressOrders,
    doneOrders,
    availableMechanics,
    totalMechanics,
    recentOrders,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.workOrder.count({ where: { status: 'pending' } }),
    prisma.workOrder.count({ where: { status: 'in_progress' } }),
    prisma.workOrder.count({ where: { status: 'done' } }),
    prisma.mechanic.count({ where: { status: 'available' } }),
    prisma.mechanic.count(),
    prisma.workOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { include: { customer: true } },
        mechanic: true,
      },
    }),
  ]);

  // Подсчет дохода (сумма завершенных нарядов)
  const revenueResult = await prisma.workOrder.aggregate({
    where: { status: 'done' },
    _sum: { totalAmount: true },
  });

  return NextResponse.json({
    totalCustomers,
    totalVehicles,
    pendingOrders,
    inProgressOrders,
    doneOrders,
    availableMechanics,
    totalMechanics,
    revenue: revenueResult._sum.totalAmount || 0,
    recentOrders,
  });
}
