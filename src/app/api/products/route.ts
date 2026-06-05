import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newProduct = await prisma.inventoryItem.create({
      data: {
        itemCode: data.itemCode,
        name: data.name,
        category: data.category || 'Inne',
        quantity: parseFloat(data.quantity) || 0,
        minStock: parseFloat(data.minStock) || 0,
        unit: data.unit || 'szt.',
        purchasePrice: parseFloat(data.purchasePrice) || 0,
        sellPrice: parseFloat(data.sellPrice) || 0,
      }
    });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
