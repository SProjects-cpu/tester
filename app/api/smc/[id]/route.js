import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    
    // Get the current startup stage before updating
    const existingMeeting = await prisma.sMCMeeting.findUnique({
      where: { id },
      include: { startup: { select: { stage: true } } }
    });
    
    // Store the stage at which this SMC was completed in the agenda field
    // Format: timeSlot|completionTime|stageAtCompletion
    const stageAtCompletion = body.completionData?.stageAtCompletion || existingMeeting?.startup?.stage || '';
    const agendaData = body.timeSlot 
      ? `${body.timeSlot}|${body.completionData?.time || ''}|${stageAtCompletion}`
      : undefined;
    
    // Map frontend status to database status
    let dbStatus = 'scheduled';
    if (body.status === 'Completed') dbStatus = 'completed';
    else if (body.status === 'Not Done') dbStatus = 'not_done';
    
    const meeting = await prisma.sMCMeeting.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        agenda: agendaData,
        decisions: body.completionData?.feedback,
        attendees: body.completionData?.panelistName,
        status: dbStatus
      },
      include: { startup: { select: { id: true, name: true, founder: true } } }
    });

    return NextResponse.json({
      id: meeting.id,
      startupId: meeting.startupId,
      date: meeting.date?.toISOString().split('T')[0],
      timeSlot: body.timeSlot,
      status: body.status,
      completionData: body.completionData,
      startup: meeting.startup ? {
        id: meeting.startup.id,
        companyName: meeting.startup.name,
        founderName: meeting.startup.founder
      } : null
    });
  } catch (error) {
    console.error('Error updating SMC meeting:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await prisma.sMCMeeting.delete({ where: { id } });
    return NextResponse.json({ message: 'SMC meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting SMC meeting:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
