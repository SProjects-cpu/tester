import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/startups - Get all startups
export const GET = requireAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');
    
    const where = {};
    if (stage) {
      where.stage = stage;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { founder: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const startups = await prisma.startup.findMany({
      where,
      include: {
        achievements: {
          orderBy: { date: 'desc' },
          take: 5
        },
        progressHistory: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(startups);
  } catch (error) {
    console.error('Error fetching startups:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});

// POST /api/startups - Create new startup
export const POST = requireAuth(async (request) => {
  try {
    const body = await request.json();
    
    const startup = await prisma.startup.create({
      data: {
        name: body.name,
        founder: body.founder,
        email: body.email,
        phone: body.phone,
        sector: body.sector,
        stage: body.stage || 'Onboarded',
        description: body.description,
        website: body.website,
        fundingReceived: body.fundingReceived || 0,
        employeeCount: body.employeeCount || 0,
        revenueGenerated: body.revenueGenerated || 0,
        dpiitNo: body.dpiitNo,
        recognitionDate: body.recognitionDate ? new Date(body.recognitionDate) : null,
        bhaskarId: body.bhaskarId
      }
    });

    return NextResponse.json(startup, { status: 201 });
  } catch (error) {
    console.error('Error creating startup:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
