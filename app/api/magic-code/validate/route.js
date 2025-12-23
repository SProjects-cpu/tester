import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Validate magic code format: MAGIC-XXXX (4 digits)
const MAGIC_CODE_PATTERN = /^MAGIC-\d{4}$/;

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { code, excludeStartupId } = await request.json();

    if (!code) {
      return NextResponse.json({
        isValid: false,
        isAvailable: false,
        error: 'Magic code is required'
      }, { status: 400 });
    }

    // Validate format
    if (!MAGIC_CODE_PATTERN.test(code)) {
      return NextResponse.json({
        isValid: false,
        isAvailable: false,
        error: 'Magic code must be in format MAGIC-XXXX (4 digits)'
      });
    }

    // Check uniqueness
    const whereClause = { magicCode: code };
    if (excludeStartupId) {
      whereClause.NOT = { id: excludeStartupId };
    }

    const existing = await prisma.startup.findFirst({
      where: whereClause,
      select: { id: true }
    });

    return NextResponse.json({
      isValid: true,
      isAvailable: !existing,
      error: existing ? 'This magic code is already in use' : null
    });
  } catch (error) {
    console.error('Error validating magic code:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
