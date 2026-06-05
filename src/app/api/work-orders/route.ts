import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

// GET /api/work-orders — список заказ-нарядов
export const GET = withErrorHandler(async (request: NextRequest) => {
  const status = request.nextUrl.searchParams.get('status');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
  const skip = (page - 1) * limit;

  const workOrders = await prisma.workOrder.findMany({
    take: limit,
    skip: skip,
    where: {
      isDeleted: false,
      ...(status ? { status } : {})
    },
    include: {
      tags: true,
      vehicle: {
        include: { customer: { include: { tags: true } } },
      },
      mechanic: true,
      _count: { select: { items: true } },
    },
    orderBy: [{ order: 'asc' }, { receivedAt: 'desc' }],
  });

  const groupCounts = await prisma.workOrder.groupBy({
    by: ['status'],
    where: { isDeleted: false },
    _count: { _all: true }
  });

  const counts: Record<string, number> = {};
  for (const row of groupCounts) {
    counts[row.status] = (row._count as any)._all || 0;
  }

  return NextResponse.json({ data: workOrders, counts });
});

// POST /api/work-orders — создать заказ-наряд
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { vehicleId, mechanicId, description, status: orderStatus, returnParts, testDrive, registrationCert, fillFluids, fillLights } = body;

  const workOrder = await prisma.workOrder.create({
    data: {
      vehicleId: parseInt(vehicleId),
      mechanicId: mechanicId ? parseInt(mechanicId) : null,
      description: description || null,
      status: orderStatus || 'pending',
      returnParts: returnParts || false,
      testDrive: testDrive || false,
      registrationCert: registrationCert || false,
      fillFluids: fillFluids || false,
      fillLights: fillLights || false,
    },
    include: {
      vehicle: { include: { customer: true } },
      mechanic: true,
      items: true,
    },
  });

  if (mechanicId) {
    await prisma.mechanic.update({
      where: { id: parseInt(mechanicId) },
      data: { status: 'busy' }
    });
  }

  return NextResponse.json(workOrder, { status: 201 });
});
