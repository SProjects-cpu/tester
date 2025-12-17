import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/one-on-one - Get all one-on-one meetings
export const GET = requireAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get('startupId');
    
    const where = startupId ? { startupId } : {};

    const meetings = await prisma.oneOnOneMeeting.findMany({
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
    console.error('Error fetching one-on-one meetings:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});

// POST /api/one-on-one - Create one-on-one meeting
export const POST = requireAuth(async (request) => {
  try {
    const body = await request.json();
    
    const meeting = await prisma.oneOnOneMeeting.create({
      data: {
        startupId: body.startupId,
        date: new Date(body.date),
        mentor: body.mentor,
        topic: body.topic,
        notes: body.notes,
        actionItems: body.actionItems,
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
    console.error('Error creating one-on-one meeting:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
