import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Public endpoint - no authentication required
// Returns aggregated statistics for the landing page
export async function GET() {
  try {
    // Get startup counts by stage
    const [
      totalCount,
      registeredCount,
      mentoredCount,
      onboardedCount,
      graduatedCount,
      // Get monthly registration data for the last 6 months
      monthlyData,
      // Get total revenue
      revenueData,
      // Get achievements count
      achievementsCount
    ] = await Promise.all([
      // Total startups
      prisma.startup.count(),
      
      // Registered (S0 stage)
      prisma.startup.count({
        where: { stage: 'S0' }
      }),
      
      // Mentored (One-on-One stage or has completed one-on-one sessions)
      prisma.startup.count({
        where: {
          OR: [
            { stage: 'One-on-One' },
            { oneOnOneMeetings: { some: { status: 'completed' } } }
          ]
        }
      }),
      
      // Onboarded
      prisma.startup.count({
        where: { stage: 'Onboarded' }
      }),
      
      // Graduated
      prisma.startup.count({
        where: { stage: 'Graduated' }
      }),
      
      // Monthly registration data (last 6 months)
      getMonthlyRegistrations(),
      
      // Total revenue from all startups
      prisma.startup.aggregate({
        _sum: { revenueGenerated: true }
      }),
      
      // Total achievements
      prisma.achievement.count()
    ]);

    // Calculate success metrics
    const successRate = totalCount > 0 
      ? Math.round(((onboardedCount + graduatedCount) / totalCount) * 100) 
      : 0;
    
    const fundingSecuredRate = await calculateFundingRate();
    const marketReadyRate = await calculateMarketReadyRate();
    const revenueGrowthRate = await calculateRevenueGrowthRate();

    return NextResponse.json({
      // Startup distribution
      distribution: {
        total: totalCount,
        registered: registeredCount,
        mentored: mentoredCount,
        onboarded: onboardedCount,
        graduated: graduatedCount
      },
      
      // Monthly growth data (last 6 months)
      monthlyGrowth: monthlyData,
      
      // Success metrics
      successMetrics: {
        successRate,
        fundingSecured: fundingSecuredRate,
        marketReady: marketReadyRate,
        revenueGrowth: revenueGrowthRate
      },
      
      // Summary stats
      summary: {
        totalRevenue: revenueData._sum.revenueGenerated || 0,
        totalAchievements: achievementsCount,
        activeStartups: totalCount - graduatedCount
      },
      
      // Last updated timestamp
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get monthly registration data
async function getMonthlyRegistrations() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    
    const count = await prisma.startup.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });
    
    months.push({
      month: monthNames[date.getMonth()],
      year: date.getFullYear(),
      count,
      // Calculate percentage relative to max for chart display
      percentage: 0 // Will be calculated after all months are fetched
    });
  }
  
  // Calculate percentages based on max count
  const maxCount = Math.max(...months.map(m => m.count), 1);
  months.forEach(m => {
    m.percentage = Math.round((m.count / maxCount) * 100);
  });
  
  return months;
}

// Calculate funding secured rate based on startups with funding
async function calculateFundingRate() {
  const [totalWithFunding, total] = await Promise.all([
    prisma.startup.count({
      where: { fundingReceived: { gt: 0 } }
    }),
    prisma.startup.count()
  ]);
  
  return total > 0 ? Math.round((totalWithFunding / total) * 100) : 0;
}

// Calculate market ready rate (onboarded + graduated)
async function calculateMarketReadyRate() {
  const [marketReady, total] = await Promise.all([
    prisma.startup.count({
      where: {
        stage: { in: ['Onboarded', 'Graduated'] }
      }
    }),
    prisma.startup.count()
  ]);
  
  return total > 0 ? Math.round((marketReady / total) * 100) : 0;
}

// Calculate revenue growth rate
async function calculateRevenueGrowthRate() {
  const [startupsWithRevenue, total] = await Promise.all([
    prisma.startup.count({
      where: { revenueGenerated: { gt: 0 } }
    }),
    prisma.startup.count()
  ]);
  
  return total > 0 ? Math.round((startupsWithRevenue / total) * 100) : 0;
}
