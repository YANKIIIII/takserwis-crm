import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ type: string; id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  // Restore
  try {
    const { type, id } = await params;
    const itemId = parseInt(id);
    if (type === 'work-order') {
      await prisma.workOrder.update({ where: { id: itemId }, data: { isDeleted: false, deletedAt: null } });
    } else if (type === 'task') {
      await prisma.task.update({ where: { id: itemId }, data: { isDeleted: false, deletedAt: null } });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Hard Delete
  try {
    const { type, id } = await params;
    const itemId = parseInt(id);
    if (type === 'work-order') {
      await prisma.workOrder.delete({ where: { id: itemId } });
    } else if (type === 'task') {
      await prisma.task.delete({ where: { id: itemId } });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
