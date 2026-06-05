import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const records = await prisma.tireStorage.findMany({
      include: { customer: true, vehicle: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Tire storage fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch storage records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const record = await prisma.tireStorage.create({
      data: {
        customerId: Number(body.customerId),
        vehicleId: body.vehicleId ? Number(body.vehicleId) : null,
        season: body.season,
        type: body.type,
        brandAndModel: body.brandAndModel,
        size: body.size,
        treadDepth: body.treadDepth || null,
        storageLocation: body.storageLocation || null,
        notes: body.notes || null,
        status: 'W magazynie'
      }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Tire storage creation error:', error);
    return NextResponse.json({ error: 'Failed to create storage record' }, { status: 500 });
  }
}
