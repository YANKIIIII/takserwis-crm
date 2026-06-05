import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    
    const where = entity ? { entity } : {};
    const tags = await prisma.tag.findMany({ 
      where, 
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ] 
    });
    
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.name || !data.entity) {
      return NextResponse.json({ error: 'Name and entity are required' }, { status: 400 });
    }
    
    const tag = await prisma.tag.create({ data });
    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Error creating tag, might be a duplicate' }, { status: 500 });
  }
}
