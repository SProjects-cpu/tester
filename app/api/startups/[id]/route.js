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
          startup.stage === 'Inactive' ? 'Inactive' : 'Active',
  description: startup.description,
  problemSolving: startup.description,
  website: startup.website,
  fundingReceived: startup.fundingReceived,
  teamSize: startup.employeeCount,
  totalRevenue: startup.revenueGenerated,
  dpiitNo: startup.dpiitNo,
  recognitionDate: startup.recognitionDate ? startup.recognitionDate.toISOString().split('T')[0] : null,
  bhaskarId: startup.bhaskarId,
  onboardedDate: startup.onboardedDate,
  graduatedDate: startup.graduatedDate,
  createdAt: startup.createdAt,
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
  if (body.founderMobile !== undefined || body.phone !== undefined || body.mobile !== undefined) 
    data.phone = body.founderMobile || body.phone || body.mobile;
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
  
  // Registration Info fields
  if (body.magicCode !== undefined) data.magicCode = body.magicCode;
  if (body.city !== undefined) data.city = body.city;
  if (body.stageOfIdea !== undefined) data.stageOfIdea = body.stageOfIdea;
  if (body.solution !== undefined) data.solution = body.solution;
  if (body.hasPatent !== undefined) data.hasPatent = body.hasPatent;
  if (body.patentNumber !== undefined) data.patentNumber = body.patentNumber;
  if (body.isRegistered !== undefined) data.isRegistered = body.isRegistered;
  if (body.registrationDate !== undefined) 
    data.registrationDate = body.registrationDate ? new Date(body.registrationDate) : null;
  if (body.socialMedia !== undefined) data.socialMedia = body.socialMedia;
  if (body.founderAge !== undefined) data.founderAge = parseInt(body.founderAge) || null;
  if (body.founderGender !== undefined) data.founderGender = body.founderGender;
  if (body.college !== undefined) data.college = body.college;
  if (body.address !== undefined) data.address = body.address;
  if (body.referredFrom !== undefined) data.referredFrom = body.referredFrom;
  if (body.sessionNumber !== undefined) data.sessionNumber = body.sessionNumber;
  if (body.date !== undefined || body.registeredDate !== undefined) 
    data.registeredDate = (body.date || body.registeredDate) ? new Date(body.date || body.registeredDate) : null;
  if (body.month !== undefined) data.month = body.month;
  if (body.timeSlot !== undefined) data.timeSlot = body.timeSlot;
  if (body.clinicalMentoring !== undefined) data.clinicalMentoring = Boolean(body.clinicalMentoring);
  if (body.followUpRemark !== undefined) data.followUpRemark = body.followUpRemark;
  if (body.domain !== undefined) data.domain = body.domain;
  if (body.logo !== undefined) data.logo = body.logo;
  if (body.officePhoto !== undefined) data.officePhoto = body.officePhoto;
  
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
