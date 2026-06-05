import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/mechanics — список механиков
export async function GET() {
  const mechanics = await prisma.mechanic.findMany({
    include: {
      _count: { select: { workOrders: true } },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(mechanics);
}

// POST /api/mechanics — создать механика
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, specialization, phone } = body;

  const mechanic = await prisma.mechanic.create({
    data: {
      name,
      specialization: specialization || null,
      phone: phone || null,
    },
  });

  return NextResponse.json(mechanic, { status: 201 });
}
