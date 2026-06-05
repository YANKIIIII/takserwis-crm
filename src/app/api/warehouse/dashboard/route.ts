import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const documents = await prisma.warehouseDocument.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { items: true }
    });

    const itemsCount = await prisma.inventoryItem.count();

    return NextResponse.json({
      documents,
      totalItems: itemsCount,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd pobierania magazynu' }, { status: 500 });
  }
}
