import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: parseInt(id) },
    include: {
      tags: true,
      vehicle: { include: { customer: { include: { tags: true } } } },
      mechanic: true,
      items: { orderBy: { createdAt: 'asc' } },
      warehouseDocs: true,
    },
  });

  if (!workOrder) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  console.log("API GOT ITEMS:", workOrder.items);
  return NextResponse.json(workOrder);
}

// PATCH /api/work-orders/[id] — обновить статус / данные
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingWorkOrder = await prisma.workOrder.findUnique({ where: { id: parseInt(id) } });

    const data: any = {};
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === 'done') {
        data.completedAt = new Date();
      }
    }
    if (body.mechanicId !== undefined) {
      data.mechanicId = body.mechanicId ? parseInt(body.mechanicId) : null;
    }
    if (body.description !== undefined) data.description = body.description;
    if (body.totalAmount !== undefined) data.totalAmount = parseFloat(body.totalAmount);
    if (body.returnParts !== undefined) data.returnParts = body.returnParts;
    if (body.testDrive !== undefined) data.testDrive = body.testDrive;
    if (body.registrationCert !== undefined) data.registrationCert = body.registrationCert;
    if (body.fillFluids !== undefined) data.fillFluids = body.fillFluids;
    if (body.fillLights !== undefined) data.fillLights = body.fillLights;
    if (body.tagIds !== undefined) {
      data.tags = { set: body.tagIds.map((tid: number) => ({ id: tid })) };
    }

    const workOrder = await prisma.workOrder.update({
      where: { id: parseInt(id) },
      data,
      include: {
        tags: true,
        vehicle: { include: { customer: { include: { tags: true } } } },
        mechanic: true,
        items: true,
      },
    });

    if (body.mechanicId !== undefined) {
      const newMechanicId = body.mechanicId ? parseInt(body.mechanicId) : null;
      if (existingWorkOrder?.mechanicId && existingWorkOrder.mechanicId !== newMechanicId) {
        await prisma.mechanic.update({
          where: { id: existingWorkOrder.mechanicId },
          data: { status: 'available' }
        });
      }
    }

    if (body.mechanicId) {
      await prisma.mechanic.update({
        where: { id: parseInt(body.mechanicId) },
        data: { status: 'busy' }
      });
    }

    return NextResponse.json(workOrder);
  } catch (error: any) {
    console.error("PATCH ERROR:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

// DELETE /api/work-orders/[id] — удалить заказ-наряд (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.workOrder.update({
      where: { id: parseInt(id) },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ error: 'Failed to delete work order' }, { status: 500 });
  }
}
