import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/startups/stats/overview - Get startup statistics
export const GET = requireAuth(async (request) => {
  try {
    const total = await prisma.startup.count();
    
    const byStage = await prisma.startup.groupBy({
      by: ['stage'],
      _count: true
    });

    const bySector = await prisma.startup.groupBy({
      by: ['sector'],
      _count: true
    });

    const totalFunding = await prisma.startup.aggregate({
      _sum: {
        fundingReceived: true
      }
    });

    const totalRevenue = await prisma.startup.aggregate({
      _sum: {
        revenueGenerated: true
      }
    });

    const totalEmployees = await prisma.startup.aggregate({
      _sum: {
        employeeCount: true
      }
    });

    const stats = {
      total,
      byStage: byStage.reduce((acc, item) => {
        acc[item.stage] = item._count;
        return acc;
      }, {}),
      bySector: bySector.reduce((acc, item) => {
        acc[item.sector] = item._count;
        return acc;
      }, {}),
      totalFunding: totalFunding._sum.fundingReceived || 0,
      totalRevenue: totalRevenue._sum.revenueGenerated || 0,
      totalEmployees: totalEmployees._sum.employeeCount || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
