import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST /api/achievements/:startupId - Add achievement
export const POST = requireAuth(async (request, { params }) => {
  try {
    const { startupId } = params;
    const body = await request.json();
    
    const achievement = await prisma.achievement.create({
      data: {
        startupId,
        title: body.title,
        description: body.description,
        type: body.type,
        date: body.date ? new Date(body.date) : new Date(),
        mediaUrl: body.mediaUrl,
        isGraduated: body.isGraduated || false
      }
    });

    return NextResponse.json(achievement, { status: 201 });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
