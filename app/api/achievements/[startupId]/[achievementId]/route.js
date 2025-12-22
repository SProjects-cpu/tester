import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

// PUT update achievement
export const PUT = requireAuth(async (request, { params }) => {
  try {
    const { achievementId } = params;
    const body = await request.json();
    
    const achievement = await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        date: body.date ? new Date(body.date) : undefined,
        mediaUrl: body.mediaUrl,
        isGraduated: body.isGraduated
      }
    });

    return NextResponse.json(achievement);
  } catch (error) {
    console.error('Error updating achievement:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
});

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
