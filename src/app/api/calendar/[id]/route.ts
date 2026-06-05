import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    const body = await req.json();
    
    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: body.title,
        date: body.date,
        hour: body.hour,
        mechanic: body.mechanic,
        color: body.color
      }
    });
    
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd aktualizacji wydarzenia' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    await prisma.calendarEvent.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd usuwania wydarzenia' }, { status: 500 });
  }
}
