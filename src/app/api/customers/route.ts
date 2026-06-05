import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api-handler';

// GET /api/customers — список клиентов
export const GET = withErrorHandler(async (request: NextRequest) => {
  const search = request.nextUrl.searchParams.get('search') || '';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
  const skip = (page - 1) * limit;

  const customers = await prisma.customer.findMany({
    take: limit,
    skip: skip,
    where: search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined,
    include: {
      vehicles: true,
      tags: true,
      _count: { select: { vehicles: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(customers);
});

// POST /api/customers — создать клиента
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { firstName, lastName, phone, email, notes, vehicle } = body;

  const customer = await prisma.customer.create({
    data: {
      firstName,
      lastName,
      phone,
      email: email || null,
      notes: notes || null,
      vehicles: vehicle
        ? {
            create: {
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year ? parseInt(vehicle.year) : null,
              vin: vehicle.vin || null,
              plate: vehicle.plate,
              mileage: vehicle.mileage ? parseInt(vehicle.mileage) : null,
            },
          }
        : undefined,
    },
    include: { vehicles: true },
  });

  return NextResponse.json(customer, { status: 201 });
});
