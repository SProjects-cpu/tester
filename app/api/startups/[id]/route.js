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
  progressHistory: startup.progressHistory || [],
  oneOnOneMeetings: startup.oneOnOneMeetings || [],
  smcMeetings: startup.smcMeetings || [],
  agreements: startup.agreements || []
});

// Transform frontend data to database format
const transformToDb = (body) => {
  const data = {};
  
  if (body.companyName !== undefined || body.name !== undefined) 
    data.name = body.companyName || body.name;
  if (body.founderName !== undefined || body.founder !== undefined) 
    data.founder = body.founderName || body.founder;
  if (body.founderEmail !== undefined || body.email !== undefined) 
    data.email = body.founderEmail || body.email;
  if (body.founderMobile !== undefined || body.phone !== undefined) 
    data.phone = body.founderMobile || body.phone;
  if (body.sector !== undefined) data.sector = body.sector;
  if (body.stage !== undefined) data.stage = body.stage;
  if (body.description !== undefined || body.problemSolving !== undefined) 
    data.description = body.description || body.problemSolving;
  if (body.website !== undefined) data.website = body.website;
  if (body.fundingReceived !== undefined) 
    data.fundingReceived = parseFloat(body.fundingReceived) || 0;
  if (body.teamSize !== undefined || body.employeeCount !== undefined) 
    data.employeeCount = parseInt(body.teamSize || body.employeeCount) || 0;
  if (body.totalRevenue !== undefined || body.revenueGenerated !== undefined) 
    data.revenueGenerated = parseFloat(body.totalRevenue || body.revenueGenerated) || 0;
  if (body.dpiitNo !== undefined) data.dpiitNo = body.dpiitNo;
  if (body.recognitionDate !== undefined) 
    data.recognitionDate = body.recognitionDate ? new Date(body.recognitionDate) : null;
  if (body.bhaskarId !== undefined) data.bhaskarId = body.bhaskarId;
  if (body.graduatedDate !== undefined) 
    data.graduatedDate = body.graduatedDate ? new Date(body.graduatedDate) : null;
  
  return data;
};

export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    const startup = await prisma.startup.findUnique({
      where: { id },
      include: {
        achievements: { orderBy: { date: 'desc' } },
        progressHistory: { orderBy: { date: 'desc' } },
        oneOnOneMeetings: { orderBy: { date: 'desc' } },
        smcMeetings: { orderBy: { date: 'desc' } },
        agreements: { orderBy: { uploadDate: 'desc' } }
      }
    });

    if (!startup) {
      return NextResponse.json({ message: 'Startup not found' }, { status: 404 });
    }

    return NextResponse.json(transformStartup(startup));
  } catch (error) {
    console.error('Error fetching startup:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    
    const startup = await prisma.startup.update({
      where: { id },
      data: transformToDb(body),
      include: {
        achievements: { orderBy: { date: 'desc' } },
        progressHistory: { orderBy: { date: 'desc' } }
      }
    });

    return NextResponse.json(transformStartup(startup));
  } catch (error) {
    console.error('Error updating startup:', error);
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
    await prisma.startup.delete({ where: { id } });
    return NextResponse.json({ message: 'Startup deleted successfully' });
  } catch (error) {
    console.error('Error deleting startup:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
