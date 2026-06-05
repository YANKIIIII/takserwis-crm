import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const purchases = await prisma.warehouseDocument.findMany({
      where: { type: 'PZ' },
      include: { _count: { select: { items: true } } },
      take: 200,
      orderBy: { date: 'desc' },
    });

    const mappedPurchases = purchases.map(p => ({
      id: p.id,
      documentNumber: p.documentNumber,
      contractorName: p.contractorName || 'Brak dostawcy',
      itemsCount: p._count.items,
      totalValue: p.totalValue,
      status: p.status,
      date: p.date,
    }));

    return NextResponse.json(mappedPurchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
