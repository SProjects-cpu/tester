import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/startups/:id - Get single startup
export const GET = requireAuth(async (request, { params }) => {
  try {
    const { id } = params;
    
    const startup = await prisma.startup.findUnique({
      where: { id },
      include: {
        achievements: {
          orderBy: { date: 'desc' }
        },
        progressHistory: {
          orderBy: { date: 'desc' }
        },
        oneOnOneMeetings: {
          orderBy: { date: 'desc' }
        },
        smcMeetings: {
          orderBy: { date: 'desc' }
        },
        agreements: {
          orderBy: { uploadDate: 'desc' }
        }
      }
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(startup);
  } catch (error) {
    console.error('Error fetching startup:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});

// PUT /api/startups/:id - Update startup
export const PUT = requireAuth(async (request, { params }) => {
  try {
    const { id } = params;
    const body = await request.json();
    
    const startup = await prisma.startup.update({
      where: { id },
      data: {
        name: body.name,
        founder: body.founder,
        email: body.email,
        phone: body.phone,
        sector: body.sector,
        stage: body.stage,
        description: body.description,
        website: body.website,
        fundingReceived: body.fundingReceived,
        employeeCount: body.employeeCount,
        revenueGenerated: body.revenueGenerated,
        dpiitNo: body.dpiitNo,
        recognitionDate: body.recognitionDate ? new Date(body.recognitionDate) : null,
        bhaskarId: body.bhaskarId,
        graduatedDate: body.graduatedDate ? new Date(body.graduatedDate) : null
      }
    });

    return NextResponse.json(startup);
  } catch (error) {
    console.error('Error updating startup:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});

// DELETE /api/startups/:id - Delete startup
export const DELETE = requireAuth(async (request, { params }) => {
  try {
    const { id } = params;
    
    await prisma.startup.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Startup deleted successfully' });
  } catch (error) {
    console.error('Error deleting startup:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
