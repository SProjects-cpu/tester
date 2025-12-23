import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the highest existing magic code sequence number
    const startups = await prisma.startup.findMany({
      where: {
        magicCode: {
          startsWith: 'MAGIC-'
        }
      },
      select: { magicCode: true },
      orderBy: { magicCode: 'desc' },
      take: 1
    });

    let nextSequence = 1;

    if (startups.length > 0 && startups[0].magicCode) {
      // Extract the number from MAGIC-XXXX format
      const match = startups[0].magicCode.match(/MAGIC-(\d+)/);
      if (match) {
        nextSequence = parseInt(match[1], 10) + 1;
      }
    }

    // Generate the new code with zero-padding
    const newCode = `MAGIC-${String(nextSequence).padStart(4, '0')}`;

    // Verify the code doesn't exist (handle edge cases)
    const existing = await prisma.startup.findFirst({
      where: { magicCode: newCode }
    });

    if (existing) {
      // If somehow exists, find next available
      const allCodes = await prisma.startup.findMany({
        where: { magicCode: { startsWith: 'MAGIC-' } },
        select: { magicCode: true }
      });
      
      const usedNumbers = new Set(
        allCodes
          .map(s => s.magicCode?.match(/MAGIC-(\d+)/)?.[1])
          .filter(Boolean)
          .map(n => parseInt(n, 10))
      );

      let candidate = 1;
      while (usedNumbers.has(candidate)) {
        candidate++;
      }
      
      return NextResponse.json({
        code: `MAGIC-${String(candidate).padStart(4, '0')}`,
        sequence: candidate
      });
    }

    return NextResponse.json({
      code: newCode,
      sequence: nextSequence
    });
  } catch (error) {
    console.error('Error generating magic code:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
