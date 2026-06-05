import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: { isDeleted: false },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd pobierania zadań' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        title: body.title,
        assignee: body.assignee,
        priority: body.priority,
        status: body.status,
        due: body.due,
      }
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd tworzenia zadania' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Błąd aktualizacji zadania' }, { status: 500 });
  }
}
