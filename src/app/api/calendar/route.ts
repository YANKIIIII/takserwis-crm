import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    
    const where = date ? { date } : {};
    
    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { hour: 'asc' }
    });
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd pobierania wizyt' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = await prisma.calendarEvent.create({
      data: {
        title: body.title,
        date: body.date,
        hour: body.hour,
        mechanic: body.mechanic,
        color: body.color || '#4A7BF7'
      }
    });
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd tworzenia wizyty' }, { status: 500 });
  }
}
