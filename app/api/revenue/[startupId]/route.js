import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get all revenue entries for a startup
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { startupId } = params;

    const entries = await prisma.revenueEntry.findMany({
      where: { startupId },
      orderBy: { date: 'desc' }
    });

    // Calculate total
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

    return NextResponse.json({ entries, total });
  } catch (error) {
    console.error('Error fetching revenue entries:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new revenue entry
export async function POST(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { startupId } = params;
    const body = await request.json();

    // Verify startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId }
    });

    if (!startup) {
      return NextResponse.json({ message: 'Startup not found' }, { status: 404 });
    }

    const entry = await prisma.revenueEntry.create({
      data: {
        startupId,
        amount: parseFloat(body.amount) || 0,
        date: body.date ? new Date(body.date) : new Date(),
        description: body.description,
        source: body.source
      }
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating revenue entry:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
