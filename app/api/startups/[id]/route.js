import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

// Increase timeout for file uploads
export const maxDuration = 60;

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
  // Onboarding details
  onboardingDescription: startup.onboardingDescription,
  agreementDate: startup.agreementDate ? startup.agreementDate.toISOString().split('T')[0] : null,
  engagementMedium: startup.engagementMedium,
  agreementCopy: startup.agreementCopy,
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
  progressHistory: startup.progressHistory || [],
  revenueEntries: startup.revenueEntries || [],
  // Transform SMC meetings to pitch history format
  pitchHistory: transformSmcToPitchHistory(startup.smcMeetings),
  // Transform One-on-One meetings to history format
  oneOnOneHistory: transformOneOnOneToHistory(startup.oneOnOneMeetings),
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
  
  // Handle stage field
  if (body.stage !== undefined) data.stage = body.stage;
  
  // Handle status field - map status to stage for database
  // Status values: 'Active', 'Onboarded', 'Graduated', 'Rejected', 'Inactive'
  if (body.status !== undefined) {
    if (body.status === 'Onboarded') {
      data.stage = 'Onboarded';
      data.onboardedDate = new Date();
    } else if (body.status === 'Graduated') {
      data.stage = 'Graduated';
      data.graduatedDate = new Date();
    } else if (body.status === 'Rejected') {
      data.stage = 'Rejected';
    } else if (body.status === 'Inactive') {
      data.stage = 'Inactive';
    }
    // 'Active' status doesn't change stage - it's derived from stage
  }
  
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
  if (body.onboardedDate !== undefined) 
    data.onboardedDate = body.onboardedDate ? new Date(body.onboardedDate) : null;
  
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
  
  // Onboarding details
  if (body.onboardingDescription !== undefined) data.onboardingDescription = body.onboardingDescription;
  if (body.agreementDate !== undefined) 
    data.agreementDate = body.agreementDate ? new Date(body.agreementDate) : null;
  if (body.engagementMedium !== undefined) data.engagementMedium = body.engagementMedium;
  if (body.agreementCopy !== undefined) data.agreementCopy = body.agreementCopy;
  
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
        smcMeetings: { orderBy: { date: 'asc' } },
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
    
    // Get current startup to check for stage change
    const currentStartup = await prisma.startup.findUnique({
      where: { id },
      select: { stage: true }
    });

    if (!currentStartup) {
      return NextResponse.json({ message: 'Startup not found' }, { status: 404 });
    }

    const updateData = transformToDb(body);
    
    // Determine the new stage (from body.stage or body.status mapping)
    let newStage = updateData.stage || currentStartup.stage;
    
    // Check if stage is changing
    const isStageChanging = newStage && newStage !== currentStartup.stage;
    
    // If stage is changing, add tracking fields and record history
    if (isStageChanging) {
      updateData.previousStage = currentStartup.stage;
      updateData.stageChangedAt = new Date();
      updateData.stageChangeReason = body.stageChangeReason || null;
      
      // Handle special transitions
      if (newStage === 'Graduated' && !updateData.graduatedDate) {
        updateData.graduatedDate = new Date();
      }
      
      // If moving to One-on-One, cancel pending SMC meetings
      if (newStage === 'One-on-One') {
        await prisma.sMCMeeting.updateMany({
          where: {
            startupId: id,
            status: 'scheduled'
          },
          data: {
            status: 'cancelled'
          }
        });
      }
    }
    
    const startup = await prisma.startup.update({
      where: { id },
      data: updateData,
      include: {
        achievements: { orderBy: { date: 'desc' } },
        progressHistory: { orderBy: { date: 'desc' } },
        revenueEntries: { orderBy: { date: 'desc' } }
      }
    });

    // Record stage transition in history table
    if (isStageChanging) {
      try {
        await prisma.stageTransitionHistory.create({
          data: {
            startupId: id,
            fromStage: currentStartup.stage,
            toStage: newStage,
            reason: body.stageChangeReason || null,
            performedBy: user.email || 'admin'
          }
        });
      } catch (historyError) {
        // Log but don't fail the main operation
        console.error('Failed to record stage transition history:', historyError);
      }
    }

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
