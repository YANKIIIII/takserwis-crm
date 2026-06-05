import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/settings - Fetch all settings
export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany();
    // Convert array of key-value pairs to object
    const settingsObj = settings.reduce((acc: Record<string, string>, s: { key: string, value: string }) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    
    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Błąd pobierania ustawień' }, { status: 500 });
  }
}

// POST /api/settings - Save or update settings
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Iterate through object keys and upsert them to database
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        await prisma.appSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Błąd zapisu ustawień' }, { status: 500 });
  }
}
