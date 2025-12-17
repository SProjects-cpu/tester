import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// PUT /api/auth/update-admin-credentials - Update admin email and/or password
export const PUT = requireRole(['admin'])(async (request) => {
  try {
    const { currentPassword, newEmail, newPassword } = await request.json();

    // Validation
    if (!currentPassword) {
      return NextResponse.json(
        { message: 'Current password is required' },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const updates = {};

    // Update email if provided
    if (newEmail && newEmail !== user.email) {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail.toLowerCase() }
      });
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { message: 'Email already in use' },
          { status: 400 }
        );
      }
      updates.email = newEmail.toLowerCase();
    }

    // Update password if provided
    if (newPassword) {
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: 'No updates provided' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates
    });

    return NextResponse.json({ 
      message: 'Admin credentials updated successfully',
      updated: Object.keys(updates)
    });
  } catch (error) {
    console.error('Update admin credentials error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
