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

    const where = {};
    if (fromStage) where.fromStage = fromStage;
    if (toStage) where.toStage = toStage;
    if (startupId) where.startupId = startupId;

    // Get transitions with startup info
    const transitions = await prisma.$queryRaw`
      SELECT 
        sth.id,
        sth.startup_id as "startupId",
        sth.from_stage as "fromStage",
        sth.to_stage as "toStage",
        sth.reason,
        sth.performed_by as "performedBy",
        sth.created_at as "createdAt",
        s.name as "startupName",
        s.founder as "founderName",
        s.sector,
        s.stage as "currentStage"
      FROM stage_transition_history sth
      LEFT JOIN startups s ON sth.startup_id = s.id
      WHERE 1=1
        ${fromStage ? prisma.$queryRaw`AND sth.from_stage = ${fromStage}` : prisma.$queryRaw``}
        ${toStage ? prisma.$queryRaw`AND sth.to_stage = ${toStage}` : prisma.$queryRaw``}
        ${startupId ? prisma.$queryRaw`AND sth.startup_id = ${startupId}` : prisma.$queryRaw``}
      ORDER BY sth.created_at DESC
    `;

    return NextResponse.json(transitions);
  } catch (error) {
    console.error('Error fetching stage history:', error);
    
    // Fallback to simpler query if raw query fails
    try {
      const { searchParams } = new URL(request.url);
      const fromStage = searchParams.get('fromStage');
      
      const where = {};
      if (fromStage) where.fromStage = fromStage;

      const transitions = await prisma.stageTransitionHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(transitions);
    } catch (fallbackError) {
      return NextResponse.json(
        { message: 'Server error', error: error.message },
        { status: 500 }
      );
    }
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
