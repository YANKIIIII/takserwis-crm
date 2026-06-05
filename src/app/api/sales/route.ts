import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const warehouseSales = await prisma.warehouseDocument.findMany({
      where: { type: { in: ['FV', 'WZ', 'PA'] } },
      include: { _count: { select: { items: true } } },
      take: 200,
      orderBy: { date: 'desc' },
    });

    const mappedWarehouseSales = warehouseSales.map(ws => ({
      id: `ws-${ws.id}`,
      documentNumber: ws.documentNumber,
      contractorName: ws.contractorName || 'Nieznany klient',
      itemsCount: ws._count.items,
      totalValue: ws.totalValue,
      status: ws.status,
      date: ws.date,
      type: ws.type,
    }));

    const allSales = [...mappedWarehouseSales].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(allSales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
