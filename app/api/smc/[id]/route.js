import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// PUT /api/smc/:id - Update SMC meeting
export const PUT = requireAuth(async (request, { params }) => {
  try {
    const { id } = params;
    const body = await request.json();
    
    const meeting = await prisma.sMCMeeting.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        agenda: body.agenda,
        decisions: body.decisions,
        attendees: body.attendees,
        status: body.status
      },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            founder: true
          }
        }
      }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error updating SMC meeting:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});

// DELETE /api/smc/:id - Delete SMC meeting
export const DELETE = requireAuth(async (request, { params }) => {
  try {
    const { id } = params;
    
    await prisma.sMCMeeting.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'SMC meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting SMC meeting:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
