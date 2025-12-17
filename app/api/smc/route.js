import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/smc - Get all SMC meetings
export const GET = requireAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get('startupId');
    
    const where = startupId ? { startupId } : {};

    const meetings = await prisma.sMCMeeting.findMany({
      where,
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            founder: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error fetching SMC meetings:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});

// POST /api/smc - Create SMC meeting
export const POST = requireAuth(async (request) => {
  try {
    const body = await request.json();
    
    const meeting = await prisma.sMCMeeting.create({
      data: {
        startupId: body.startupId,
        date: new Date(body.date),
        agenda: body.agenda,
        decisions: body.decisions,
        attendees: body.attendees,
        status: body.status || 'scheduled'
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

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Error creating SMC meeting:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
