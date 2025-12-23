import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get stage transition history with optional filters
export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fromStage = searchParams.get('fromStage');
    const toStage = searchParams.get('toStage');
    const startupId = searchParams.get('startupId');

    // Build where clause
    const where = {};
    if (fromStage) where.fromStage = fromStage;
    if (toStage) where.toStage = toStage;
    if (startupId) where.startupId = startupId;

    // Get transitions with startup info using Prisma's include
    const transitions = await prisma.stageTransitionHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            founder: true,
            sector: true,
            stage: true
          }
        }
      }
    });

    // Transform data to include startup info at top level for frontend compatibility
    const transformedTransitions = transitions.map(t => ({
      id: t.id,
      startupId: t.startupId,
      fromStage: t.fromStage,
      toStage: t.toStage,
      reason: t.reason,
      performedBy: t.performedBy,
      createdAt: t.createdAt,
      startupName: t.startup?.name || 'Unknown Startup',
      founderName: t.startup?.founder || null,
      sector: t.startup?.sector || null,
      currentStage: t.startup?.stage || null
    }));

    return NextResponse.json(transformedTransitions);
  } catch (error) {
    console.error('Error fetching stage history:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Record a stage transition
export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.startupId || !body.fromStage || !body.toStage) {
      return NextResponse.json(
        { message: 'startupId, fromStage, and toStage are required' },
        { status: 400 }
      );
    }

    const transition = await prisma.stageTransitionHistory.create({
      data: {
        startupId: body.startupId,
        fromStage: body.fromStage,
        toStage: body.toStage,
        reason: body.reason,
        performedBy: body.performedBy || user.email || 'admin'
      }
    });

    return NextResponse.json(transition, { status: 201 });
  } catch (error) {
    console.error('Error recording stage transition:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
