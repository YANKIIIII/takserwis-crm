import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Body should be an array of { id: number, order: number }
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Execute all updates in a transaction
    await prisma.$transaction(
      body.map((item) =>
        prisma.tag.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering tags:', error);
    return NextResponse.json({ error: 'Failed to reorder tags' }, { status: 500 });
  }
}
