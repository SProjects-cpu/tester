import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

// Transform database startup to frontend format
const transformStartup = (startup) => ({
  id: startup.id,
  companyName: startup.name,
  founderName: startup.founder,
  founderEmail: startup.email,
  founderMobile: startup.phone,
  sector: startup.sector,
  stage: startup.stage,
  status: startup.stage === 'Graduated' ? 'Graduated' : 
          startup.stage === 'Rejected' ? 'Rejected' : 
          startup.stage === 'Inactive' ? 'Inactive' : 'Active',
  description: startup.description,
  website: startup.website,
  fundingReceived: startup.fundingReceived,
  teamSize: startup.employeeCount,
  totalRevenue: startup.revenueGenerated,
  dpiitNo: startup.dpiitNo,
  recognitionDate: startup.recognitionDate,
  bhaskarId: startup.bhaskarId,
  onboardedDate: startup.onboardedDate,
  graduatedDate: startup.graduatedDate,
  createdAt: startup.createdAt,
  updatedAt: startup.updatedAt,
  achievements: startup.achievements || [],
  progressHistory: startup.progressHistory || []
});

// Transform frontend data to database format
const transformToDb = (body) => ({
  name: body.companyName || body.name,
  founder: body.founderName || body.founder,
  email: body.founderEmail || body.email,
  phone: body.founderMobile || body.phone,
  sector: body.sector,
  stage: body.stage || 'S0',
  description: body.description || body.problemSolving,
  website: body.website,
  fundingReceived: parseFloat(body.fundingReceived) || 0,
  employeeCount: parseInt(body.teamSize || body.employeeCount) || 0,
  revenueGenerated: parseFloat(body.totalRevenue || body.revenueGenerated) || 0,
  dpiitNo: body.dpiitNo,
  recognitionDate: body.recognitionDate ? new Date(body.recognitionDate) : null,
  bhaskarId: body.bhaskarId
});

export async function GET(request) {
  try {
    // Verify authentication
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const where = {};
    if (stage) {
      where.stage = stage;
    }
    if (status) {
      // Map status to stage for filtering
      if (status === 'Graduated') where.stage = 'Graduated';
      else if (status === 'Rejected') where.stage = 'Rejected';
      else if (status === 'Inactive') where.stage = 'Inactive';
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

    // Transform to frontend format
    const transformedStartups = startups.map(transformStartup);

    return NextResponse.json(transformedStartups);
  } catch (error) {
    console.error('Error fetching startups:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Verify authentication
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const startup = await prisma.startup.create({
      data: transformToDb(body)
    });

    return NextResponse.json(transformStartup(startup), { status: 201 });
  } catch (error) {
    console.error('Error creating startup:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
