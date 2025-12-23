import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get stage transition history for a specific startup
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { startupId } = params;

    const transitions = await prisma.stageTransitionHistory.findMany({
      where: { startupId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(transitions);
  } catch (error) {
    console.error('Error fetching startup stage history:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
