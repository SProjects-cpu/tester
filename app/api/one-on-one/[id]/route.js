import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

export const PUT = requireAuth(async (request, { params }) => {
  try {
    const { id } = params;
    const body = await request.json();
    
    const meeting = await prisma.oneOnOneMeeting.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        mentor: body.mentor,
        topic: body.topic,
        notes: body.notes,
        actionItems: body.actionItems,
        status: body.status
      },
      include: { startup: { select: { id: true, name: true, founder: true } } }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error updating one-on-one meeting:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
});

export const DELETE = requireAuth(async (request, { params }) => {
  try {
    const { id } = params;
    await prisma.oneOnOneMeeting.delete({ where: { id } });
    return NextResponse.json({ message: 'One-on-one meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting one-on-one meeting:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
});
