import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

// PUT update progress entry
export const PUT = requireAuth(async (request, { params }) => {
  try {
    const { progressId } = params;
    const body = await request.json();
    
    const progress = await prisma.progressHistory.update({
      where: { id: progressId },
      data: {
        metric: body.metric || 'Progress Update',
        value: parseFloat(body.value) || 0,
        date: body.date ? new Date(body.date) : undefined,
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

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating progress entry:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
});

// DELETE progress entry
export const DELETE = requireAuth(async (request, { params }) => {
  try {
    const { progressId } = params;
    await prisma.progressHistory.delete({ where: { id: progressId } });
    return NextResponse.json({ message: 'Progress entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting progress entry:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
});
