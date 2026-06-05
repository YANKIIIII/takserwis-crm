import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const vehicleId = searchParams.get('vehicleId');

  const where: any = {};
  
  if (vehicleId) {
    where.vehicleId = Number(vehicleId);
  } else if (customerId) {
    where.vehicle = { customerId: Number(customerId) };
  }

  const estimates = await prisma.estimate.findMany({
    where,
    include: {
      vehicle: {
        include: { customer: true }
      },
      _count: {
        select: { items: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(estimates);
});

export const POST = withErrorHandler(async (request: Request) => {
  const data = await request.json();
  const { vehicleId, description, validUntil, items, status, totalAmount } = data;

  const estimate = await prisma.estimate.create({
    data: {
      vehicleId: Number(vehicleId),
      description,
      status: status || 'draft',
      totalAmount: totalAmount || 0,
      validUntil: validUntil ? new Date(validUntil) : null,
      items: {
        create: items?.map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
          type: item.type || 'part'
        })) || []
      }
    },
    include: {
      items: true,
      vehicle: true
    }
  });

  return NextResponse.json(estimate);
});
