import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by email (username is actually email in the database)
    const user = await prisma.user.findUnique({
      where: { email: username.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = signToken({ id: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.email, // Use email as username for compatibility
        role: user.role,
        email: user.email,
        name: user.name
      },
      expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
