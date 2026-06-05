import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id, 10);
    const data = await request.json();
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color
      }
    });
    
    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: 'Error updating tag' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const tag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    if (tag.entity === 'work_order_status') {
      await prisma.workOrder.updateMany({
        where: { status: tag.name },
        data: { isDeleted: true, deletedAt: new Date() }
      });
    } else if (tag.entity === 'task_status') {
      await prisma.task.updateMany({
        where: { status: tag.name },
        data: { isDeleted: true, deletedAt: new Date() }
      });
    }

    await prisma.tag.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Error deleting tag' }, { status: 500 });
  }
}
