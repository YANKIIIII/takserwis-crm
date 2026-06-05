import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const documents = await prisma.cashDocument.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent transactions
    });
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd pobierania dokumentów kasowych' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const doc = await prisma.cashDocument.create({
      data: {
        type: data.type, // 'KP' or 'KW'
        documentNumber: data.documentNumber,
        date: new Date(data.date),
        amount: parseFloat(data.amount),
        description: data.description || '',
        clientName: data.clientName || ''
      }
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Error creating cash document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
