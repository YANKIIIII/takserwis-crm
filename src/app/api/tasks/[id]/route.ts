import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    const task = await prisma.task.findUnique({
      where: { id }
    });
    
    if (!task) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
    
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd pobierania zadania' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    await prisma.task.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd usuwania zadania' }, { status: 500 });
  }
}
