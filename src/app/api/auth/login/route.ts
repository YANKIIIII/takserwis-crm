import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Brak danych logowania' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { username } });

    // "First run" setup logic: if NO users exist, create the first one
    if (!user) {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: {
            username,
            password: hashedPassword,
            role: 'admin',
          }
        });
      } else {
        return NextResponse.json({ error: 'Nieprawidłowe dane logowania' }, { status: 401 });
      }
    } else {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Nieprawidłowe dane logowania' }, { status: 401 });
      }
    }

    const token = await signToken({ userId: user.id, username: user.username, role: user.role });

    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas logowania' }, { status: 500 });
  }
}
