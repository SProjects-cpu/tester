import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// DELETE /api/achievements/:startupId/:achievementId - Delete achievement
export const DELETE = requireAuth(async (request, { params }) => {
  try {
    const { achievementId } = params;
    
    await prisma.achievement.delete({
      where: { id: achievementId }
    });

    return NextResponse.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
