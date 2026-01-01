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

    const meetings = await prisma.fMCMeeting.findMany({
      where,
      include: { startup: { select: { id: true, name: true, founder: true } } },
      orderBy: { date: 'desc' }
    });

    // Transform to frontend format
    const transformed = meetings.map(m => {
      // Parse agenda field: timeSlot|completionTime|stageAtCompletion
      const agendaParts = m.agenda?.split('|') || [];
      const timeSlot = agendaParts[0] || '10:00 AM - 11:00 AM';
      const completionTime = agendaParts[1] || '';
      const stageAtCompletion = agendaParts[2] || '';
      
      // Map database status to frontend status
      let frontendStatus = 'Scheduled';
      if (m.status === 'completed') frontendStatus = 'Completed';
      else if (m.status === 'not_done') frontendStatus = 'Not Done';
      
      return {
        id: m.id,
        startupId: m.startupId,
        date: m.date?.toISOString().split('T')[0],
        timeSlot,
        status: frontendStatus,
        completionData: (m.status === 'completed' || m.status === 'not_done') ? {
          panelistName: m.attendees,
          feedback: m.decisions,
          time: completionTime,
          stageAtCompletion: stageAtCompletion || undefined
        } : null,
        startup: m.startup ? {
          id: m.startup.id,
          companyName: m.startup.name,
          founderName: m.startup.founder
        } : null,
        createdAt: m.createdAt
      };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching FMC meetings:', error);
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
    
    const meeting = await prisma.fMCMeeting.create({
      data: {
        startupId: body.startupId,
        date: new Date(body.date),
        agenda: `${body.timeSlot}|${body.completionData?.time || ''}`,
        decisions: body.completionData?.feedback || '',
        attendees: body.completionData?.panelistName || '',
        status: body.status === 'Completed' ? 'completed' : 'scheduled'
      },
      include: { startup: { select: { id: true, name: true, founder: true } } }
    });

    return NextResponse.json({
      id: meeting.id,
      startupId: meeting.startupId,
      date: meeting.date?.toISOString().split('T')[0],
      timeSlot: body.timeSlot,
      status: body.status || 'Scheduled',
      completionData: body.completionData,
      startup: meeting.startup ? {
        id: meeting.startup.id,
        companyName: meeting.startup.name,
        founderName: meeting.startup.founder
      } : null
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating FMC meeting:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
