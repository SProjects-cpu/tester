import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT - Update a revenue entry
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { startupId, entryId } = params;
    const body = await request.json();

    // Verify entry exists and belongs to startup
    const existing = await prisma.revenueEntry.findFirst({
      where: { id: entryId, startupId }
    });

    if (!existing) {
      return NextResponse.json({ message: 'Revenue entry not found' }, { status: 404 });
    }

    const entry = await prisma.revenueEntry.update({
      where: { id: entryId },
      data: {
        amount: body.amount !== undefined ? parseFloat(body.amount) : existing.amount,
        date: body.date ? new Date(body.date) : existing.date,
        description: body.description !== undefined ? body.description : existing.description,
        source: body.source !== undefined ? body.source : existing.source
      }
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating revenue entry:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a revenue entry
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { startupId, entryId } = params;

    // Verify entry exists and belongs to startup
    const existing = await prisma.revenueEntry.findFirst({
      where: { id: entryId, startupId }
    });

    if (!existing) {
      return NextResponse.json({ message: 'Revenue entry not found' }, { status: 404 });
    }

    await prisma.revenueEntry.delete({
      where: { id: entryId }
    });

    return NextResponse.json({ message: 'Revenue entry deleted' });
  } catch (error) {
    console.error('Error deleting revenue entry:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
