import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const deletedWorkOrders = await prisma.workOrder.findMany({
      where: { isDeleted: true },
      include: { vehicle: true }
    });
    const deletedTasks = await prisma.task.findMany({
      where: { isDeleted: true }
    });
    return NextResponse.json({ workOrders: deletedWorkOrders, tasks: deletedTasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
