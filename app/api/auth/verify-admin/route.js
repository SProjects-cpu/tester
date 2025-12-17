import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // First verify the session token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'No token provided', verified: false },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid or expired token', verified: false },
        { status: 401 }
      );
    }

    // Get the credentials from request body
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required', verified: false },
        { status: 400 }
      );
    }

    // Find the admin user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid admin credentials', verified: false },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin privileges required', verified: false },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid admin credentials', verified: false },
        { status: 401 }
      );
    }

    // All checks passed
    return NextResponse.json({
      verified: true,
      message: 'Admin verified successfully'
    });

  } catch (error) {
    console.error('Verify admin error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message, verified: false },
      { status: 500 }
    );
  }
}
