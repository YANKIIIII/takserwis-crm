import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    const mechanic = await prisma.mechanic.findUnique({
      where: { id }
    });
    if (!mechanic) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
    return NextResponse.json(mechanic);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd pobierania mechanika' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    const data = await req.json();
    const updated = await prisma.mechanic.update({
      where: { id },
      data: {
        name: data.name,
        specialization: data.specialization,
        phone: data.phone,
        status: data.status,
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd aktualizacji mechanika' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    await prisma.mechanic.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd usuwania mechanika' }, { status: 500 });
  }
}
