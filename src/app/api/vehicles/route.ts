import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    include: { customer: true, _count: { select: { workOrders: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(vehicles);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const vehicle = await prisma.vehicle.create({
      data: {
        brand: data.brand,
        model: data.model,
        year: data.year ? parseInt(data.year) : null,
        vin: data.vin || null,
        plate: data.plate,
        mileage: data.mileage ? parseInt(data.mileage) : null,
        customerId: parseInt(data.customerId),
      }
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
