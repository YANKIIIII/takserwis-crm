import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    const data = await request.json();
    const updatedProduct = await prisma.inventoryItem.update({
      where: { id },
      data: {
        itemCode: data.itemCode,
        name: data.name,
        category: data.category,
        quantity: parseFloat(data.quantity),
        minStock: parseFloat(data.minStock),
        unit: data.unit,
        purchasePrice: parseFloat(data.purchasePrice),
        sellPrice: parseFloat(data.sellPrice),
      }
    });
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id);
    await prisma.inventoryItem.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
