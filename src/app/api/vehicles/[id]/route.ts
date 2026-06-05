import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: true,
        workOrders: {
          include: {
            mechanic: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();

    // Map string registrationDate to Date object if needed
    if (body.registrationDate) {
      body.registrationDate = new Date(body.registrationDate);
    }
    
    // Ensure ints are actually numbers
    if (body.capacity !== undefined) body.capacity = body.capacity ? parseInt(body.capacity) : null;
    if (body.enginePower !== undefined) body.enginePower = body.enginePower ? parseInt(body.enginePower) : null;
    if (body.mileage !== undefined) body.mileage = body.mileage ? parseInt(body.mileage) : null;
    if (body.year !== undefined) body.year = body.year ? parseInt(body.year) : null;
    if (body.customerId !== undefined) body.customerId = parseInt(body.customerId);

    // Filter out fields that shouldn't be patched or are relations
    const { customer, workOrders, createdAt, updatedAt, id: bodyId, ...updateData } = body;

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        workOrders: {
          include: { mechanic: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.vehicle.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
