import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      storage: 'PostgreSQL',
      database: 'Connected',
      framework: 'Next.js 14'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      storage: 'PostgreSQL',
      database: 'Disconnected',
      error: error.message
    }, { status: 500 });
  }
}
