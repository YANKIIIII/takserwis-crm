import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await prisma.tireStorage.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        vehicle: true
      }
    });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch storage record' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const record = await prisma.tireStorage.update({
      where: { id: parseInt(id) },
      data: {
        status: body.status,
        returnDate: body.status === 'Wydane' ? new Date() : null,
        storageLocation: body.storageLocation,
        notes: body.notes
      }
    });

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update storage record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.tireStorage.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete storage record' }, { status: 500 });
  }
}
