import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

// GET all progress entries for a startup
export const GET = requireAuth(async (request, { params }) => {
  try {
    const { startupId } = params;
    
    const progressHistory = await prisma.progressHistory.findMany({
      where: { startupId },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(progressHistory);
  } catch (error) {
    console.error('Error fetching progress history:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
});

// POST create new progress entry
export const POST = requireAuth(async (request, { params }) => {
  try {
    const { startupId } = params;
    const body = await request.json();
    
    const progress = await prisma.progressHistory.create({
      data: {
        startupId,
        metric: body.metric || 'Progress Update',
        value: parseFloat(body.value) || 0,
        date: body.date ? new Date(body.date) : new Date(),
        notes: JSON.stringify({
          proofOfConcept: body.proofOfConcept,
          prototypeDevelopment: body.prototypeDevelopment,
          productDevelopment: body.productDevelopment,
          fieldTrials: body.fieldTrials,
          marketLaunch: body.marketLaunch,
          numberOfEmployees: body.numberOfEmployees,
          ipRegistrations: body.ipRegistrations,
          gemPortalProducts: body.gemPortalProducts,
          successStories: body.successStories,
          loans: body.loans,
          angelFunding: body.angelFunding,
          vcFunding: body.vcFunding,
          quarterlyTurnover: body.quarterlyTurnover,
          quarterlyGST: body.quarterlyGST,
          updatedBy: body.updatedBy || 'Admin'
        })
      }
    });

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error('Error creating progress entry:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
});
