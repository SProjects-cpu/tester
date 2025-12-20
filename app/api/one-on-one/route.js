import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get('startupId');
    const where = startupId ? { startupId } : {};

    const meetings = await prisma.oneOnOneMeeting.findMany({
      where,
      include: { startup: { select: { id: true, name: true, founder: true } } },
      orderBy: { date: 'desc' }
    });

    // Transform to frontend format
    const transformed = meetings.map(m => ({
      id: m.id,
      startupId: m.startupId,
      date: m.date?.toISOString().split('T')[0],
      time: m.topic?.split('|')[0] || '10:00 AM',
      status: m.status === 'completed' ? 'Completed' : 'Scheduled',
      completionData: m.status === 'completed' ? {
        mentorName: m.mentor,
        feedback: m.notes,
        progress: m.actionItems
      } : null,
      startup: m.startup ? {
        id: m.startup.id,
        companyName: m.startup.name,
        founderName: m.startup.founder
      } : null,
      createdAt: m.createdAt
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching one-on-one meetings:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const meeting = await prisma.oneOnOneMeeting.create({
      data: {
        startupId: body.startupId,
        date: new Date(body.date),
        mentor: body.completionData?.mentorName || '',
        topic: body.time || '',
        notes: body.completionData?.feedback || '',
        actionItems: body.completionData?.progress || '',
        status: body.status === 'Completed' ? 'completed' : 'scheduled'
      },
      include: { startup: { select: { id: true, name: true, founder: true } } }
    });

    return NextResponse.json({
      id: meeting.id,
      startupId: meeting.startupId,
      date: meeting.date?.toISOString().split('T')[0],
      time: body.time,
      status: body.status || 'Scheduled',
      completionData: body.completionData,
      startup: meeting.startup ? {
        id: meeting.startup.id,
        companyName: meeting.startup.name,
        founderName: meeting.startup.founder
      } : null
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating one-on-one meeting:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
