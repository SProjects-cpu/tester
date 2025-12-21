import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

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

    const emailLower = username.toLowerCase();

    // First try to find admin user
    let user = await prisma.user.findUnique({
      where: { email: emailLower }
    });
    
    let isGuest = false;

    // If not found in users, check guests table
    if (!user) {
      const guest = await prisma.guest.findUnique({
        where: { email: emailLower }
      });

      if (guest) {
        // Check if guest is active
        if (!guest.isActive) {
          return NextResponse.json(
            { message: 'Guest account is deactivated' },
            { status: 401 }
          );
        }

        // Check if guest account has expired
        if (guest.expiresAt && new Date(guest.expiresAt) < new Date()) {
          return NextResponse.json(
            { message: 'Guest account has expired' },
            { status: 401 }
          );
        }

        // Convert guest to user-like object for password check
        user = {
          id: guest.id,
          email: guest.email,
          password: guest.password,
          name: guest.name,
          role: 'guest'
        };
        isGuest = true;
      }
    }
    
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

    const token = signToken({ id: user.id, role: isGuest ? 'guest' : user.role });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.email,
        role: isGuest ? 'guest' : user.role,
        email: user.email,
        name: user.name
      },
      expiresIn: 30 * 24 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
