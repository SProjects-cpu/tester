import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Hash the password properly
    const hashedPassword = await bcrypt.hash('magic2024', 10);
    
    // Check if admin exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@magic.com' }
    });
    
    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { email: 'admin@magic.com' },
        data: { password: hashedPassword }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Admin password reset to magic2024',
        email: 'admin@magic.com'
      });
    } else {
      // Create new admin user
      await prisma.user.create({
        data: {
          email: 'admin@magic.com',
          password: hashedPassword,
          name: 'Admin',
          role: 'admin'
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created with password magic2024',
        email: 'admin@magic.com'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
