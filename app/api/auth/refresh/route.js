import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token (even if expired, we can still decode it)
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Generate new token
    const newToken = signToken({ id: user.id, role: user.role });

    return NextResponse.json({
      token: newToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      },
      expiresIn: 30 * 24 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Token refresh error:', error.message);
    return NextResponse.json(
      { message: 'Token refresh failed' },
      { status: 401 }
    );
  }
}
