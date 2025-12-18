import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// DELETE /api/admin/clear-all-data - Clear all data from database (admin only)
export async function DELETE(request) {
  try {
    // Verify authentication
    const user = getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized - Please login again' },
        { status: 401 }
      );
    }

    // Only admin can clear all data
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Delete all data in the correct order (respecting foreign key constraints)
    // Child tables first, then parent tables
    
    const deletedAchievements = await prisma.achievement.deleteMany({});
    const deletedProgress = await prisma.progressHistory.deleteMany({});
    const deletedOneOnOne = await prisma.oneOnOneMeeting.deleteMany({});
    const deletedSMC = await prisma.smcMeeting.deleteMany({});
    const deletedAgreements = await prisma.agreement.deleteMany({});
    const deletedStartups = await prisma.startup.deleteMany({});
    const deletedSettings = await prisma.settings.deleteMany({});

    // Note: We do NOT delete users - admin account should remain

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully from database',
      deleted: {
        startups: deletedStartups.count,
        achievements: deletedAchievements.count,
        progressHistory: deletedProgress.count,
        oneOnOneMeetings: deletedOneOnOne.count,
        smcMeetings: deletedSMC.count,
        agreements: deletedAgreements.count,
        settings: deletedSettings.count
      }
    });

  } catch (error) {
    console.error('Clear all data error:', error);
    return NextResponse.json(
      { message: 'Failed to clear data: ' + error.message },
      { status: 500 }
    );
  }
}
