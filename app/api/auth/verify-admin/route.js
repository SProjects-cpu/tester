import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';

// POST /api/auth/verify-admin - Verify admin credentials for sensitive operations
export const POST = requireRole(['admin'])(async (request) => {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { verified: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { verified: false, message: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return NextResponse.json(
        { verified: false, message: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Log the verification attempt
    console.log(`Admin verification successful for ${email} at ${new Date().toISOString()}`);

    return NextResponse.json({
      verified: true,
      message: 'Admin credentials verified successfully',
      admin: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { verified: false, message: 'Server error during verification', error: error.message },
      { status: 500 }
    );
  }
});
