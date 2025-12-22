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
  email: startup.email,
  founderMobile: startup.phone,
  mobile: startup.phone,
  sector: startup.sector,
  stage: startup.stage,
  status: startup.stage === 'Graduated' ? 'Graduated' : 
          startup.stage === 'Rejected' ? 'Rejected' : 
          startup.stage === 'Inactive' ? 'Inactive' :
          startup.stage === 'Onboarded' ? 'Onboarded' : 'Active',
  description: startup.description,
  problemSolving: startup.description,
  website: startup.website,
  fundingReceived: startup.fundingReceived,
  teamSize: startup.employeeCount,
  totalRevenue: startup.revenueGenerated,
  dpiitNo: startup.dpiitNo,
  recognitionDate: startup.recognitionDate ? startup.recognitionDate.toISOString().split('T')[0] : null,
  bhaskarId: startup.bhaskarId,
  onboardedDate: startup.onboardedDate ? startup.onboardedDate.toISOString().split('T')[0] : null,
  graduatedDate: startup.graduatedDate ? startup.graduatedDate.toISOString().split('T')[0] : null,
  createdAt: startup.createdAt ? startup.createdAt.toISOString().split('T')[0] : null,
  updatedAt: startup.updatedAt,
  // Registration Info fields
  magicCode: startup.magicCode,
  city: startup.city,
  stageOfIdea: startup.stageOfIdea,
  solution: startup.solution,
  hasPatent: startup.hasPatent,
  patentNumber: startup.patentNumber,
  isRegistered: startup.isRegistered,
  registrationDate: startup.registrationDate ? startup.registrationDate.toISOString().split('T')[0] : null,
  socialMedia: startup.socialMedia,
  founderAge: startup.founderAge,
  founderGender: startup.founderGender,
  college: startup.college,
  address: startup.address,
  referredFrom: startup.referredFrom,
  sessionNumber: startup.sessionNumber,
  date: startup.registeredDate ? startup.registeredDate.toISOString().split('T')[0] : null,
  registeredDate: startup.registeredDate ? startup.registeredDate.toISOString().split('T')[0] : null,
  month: startup.month,
  timeSlot: startup.timeSlot,
  clinicalMentoring: startup.clinicalMentoring || false,
  followUpRemark: startup.followUpRemark,
  domain: startup.domain,
  logo: startup.logo,
  officePhoto: startup.officePhoto,
  achievements: startup.achievements || [],
  progressHistory: startup.progressHistory || []
});

// Transform frontend data to database format
const transformToDb = (body) => ({
  name: body.companyName || body.name,
  founder: body.founderName || body.founder,
  email: body.founderEmail || body.email,
  phone: body.founderMobile || body.phone || body.mobile,
  sector: body.sector || 'Other',
  stage: body.stage || 'S0',
  description: body.description || body.problemSolving,
  website: body.website,
  fundingReceived: parseFloat(body.fundingReceived) || 0,
  employeeCount: parseInt(body.teamSize || body.employeeCount) || 0,
  revenueGenerated: parseFloat(body.totalRevenue || body.revenueGenerated) || 0,
  dpiitNo: body.dpiitNo,
  recognitionDate: body.recognitionDate ? new Date(body.recognitionDate) : null,
  bhaskarId: body.bhaskarId,
  // Registration Info fields
  magicCode: body.magicCode,
  city: body.city,
  stageOfIdea: body.stageOfIdea,
  solution: body.solution,
  hasPatent: body.hasPatent,
  patentNumber: body.patentNumber,
  isRegistered: body.isRegistered,
  registrationDate: body.registrationDate ? new Date(body.registrationDate) : null,
  socialMedia: body.socialMedia,
  founderAge: parseInt(body.founderAge) || null,
  founderGender: body.founderGender,
  college: body.college,
  address: body.address,
  referredFrom: body.referredFrom,
  sessionNumber: body.sessionNumber,
  registeredDate: (body.date || body.registeredDate) ? new Date(body.date || body.registeredDate) : null,
  month: body.month,
  timeSlot: body.timeSlot,
  clinicalMentoring: Boolean(body.clinicalMentoring),
  followUpRemark: body.followUpRemark,
  domain: body.domain,
  logo: body.logo,
  officePhoto: body.officePhoto
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
      else if (status === 'Onboarded') where.stage = 'Onboarded';
      else if (status === 'Active') {
        // Active means any stage that's not Graduated, Rejected, Inactive, or Onboarded
        where.stage = { notIn: ['Graduated', 'Rejected', 'Inactive', 'Onboarded'] };
      }
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
