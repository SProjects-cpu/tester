import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

// Transform SMC meetings to pitch history format
const transformSmcToPitchHistory = (smcMeetings) => {
  if (!smcMeetings || smcMeetings.length === 0) return [];
  
  return smcMeetings
    .filter(m => m.status === 'completed')
    .map((meeting) => {
      const agendaParts = meeting.agenda?.split('|') || [];
      // Format: timeSlot|completionTime|stageAtCompletion
      const stage = agendaParts[2] || 'S0'; // Default to S0 if not stored
      return {
        stage: stage,
        date: meeting.date ? meeting.date.toISOString().split('T')[0] : null,
        time: agendaParts[1] || agendaParts[0] || '',
        panelistName: meeting.attendees || '',
        feedback: meeting.decisions || ''
      };
    });
};

// Transform One-on-One meetings to history format
const transformOneOnOneToHistory = (oneOnOneMeetings) => {
  if (!oneOnOneMeetings || oneOnOneMeetings.length === 0) return [];
  
  return oneOnOneMeetings
    .filter(m => m.status === 'completed')
    .map(meeting => ({
      date: meeting.date ? meeting.date.toISOString().split('T')[0] : null,
      time: meeting.topic || '',
      mentorName: meeting.mentor || '',
      feedback: meeting.notes || '',
      progress: meeting.actionItems || ''
    }));
};

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
  // Handle both full relations and counts
  achievements: startup.achievements || [],
  progressHistory: startup.progressHistory || [],
  revenueEntries: startup.revenueEntries || [],
  // Transform SMC meetings to pitch history format
  pitchHistory: transformSmcToPitchHistory(startup.smcMeetings),
  // Transform One-on-One meetings to history format
  oneOnOneHistory: transformOneOnOneToHistory(startup.oneOnOneMeetings),
  // Include counts if available (for list view optimization)
  achievementsCount: startup._count?.achievements ?? startup.achievements?.length ?? 0,
  progressHistoryCount: startup._count?.progressHistory ?? startup.progressHistory?.length ?? 0,
  revenueEntriesCount: startup._count?.revenueEntries ?? startup.revenueEntries?.length ?? 0
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

    // Add retry logic for connection issues
    let retries = 2;
    let startups;
    
    while (retries > 0) {
      try {
        // For list views, don't include heavy relations unless specifically requested
        // Always include full relations for Onboarded and Graduated statuses since they need achievements
        const includeRelations = searchParams.get('includeRelations') === 'true' || 
                                 status === 'Onboarded' || 
                                 status === 'Graduated';
        
        startups = await prisma.startup.findMany({
          where,
          include: includeRelations ? {
            achievements: {
              orderBy: { date: 'desc' }
            },
            progressHistory: {
              orderBy: { date: 'desc' }
            },
            revenueEntries: {
              orderBy: { date: 'desc' }
            },
            smcMeetings: {
              orderBy: { date: 'desc' }
            },
            oneOnOneMeetings: {
              orderBy: { date: 'desc' }
            }
          } : {
            // Include SMC and One-on-One meetings for pitch history even in list view
            smcMeetings: {
              where: { status: 'completed' },
              orderBy: { date: 'asc' }
            },
            oneOnOneMeetings: {
              where: { status: 'completed' },
              orderBy: { date: 'asc' }
            },
            // Only include counts for list view performance
            _count: {
              select: {
                achievements: true,
                progressHistory: true,
                revenueEntries: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        break; // Success, exit retry loop
      } catch (dbError) {
        retries--;
        if (retries === 0) throw dbError;
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

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
