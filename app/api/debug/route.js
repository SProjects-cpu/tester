import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  const result = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2', // Force redeploy
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      dbUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET',
    },
    database: {
      connected: false,
      error: null,
      userCount: null
    }
  };

  try {
    // Test database connection
    await prisma.$connect();
    result.database.connected = true;
    
    // Try to count users
    const userCount = await prisma.user.count();
    result.database.userCount = userCount;
  } catch (error) {
    result.database.error = error.message;
    result.status = 'DB_ERROR';
  }

  return NextResponse.json(result);
}
