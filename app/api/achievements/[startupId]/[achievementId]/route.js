import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

export const DELETE = requireAuth(async (request, { params }) => {
  try {
    const { achievementId } = params;
    await prisma.achievement.delete({ where: { id: achievementId } });
    return NextResponse.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
});
