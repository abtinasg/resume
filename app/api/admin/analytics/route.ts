import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/adminAuth';

/**
 * GET /api/admin/analytics
 * Get analytics overview for admin dashboard
 */
export async function GET(request: NextRequest) {
  // Verify admin auth
  const authResult = await verifyAdminAuth(request);
  if (!authResult.isAuthorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  try {
    // Get date ranges
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      totalUsers,
      newUsersLast24h,
      newUsersLast7d,
      newUsersLast30d,
      totalResumes,
      resumesLast24h,
      resumesLast7d,
      totalApplications,
      applicationsLast7d,
      topUsers,
    ] = await Promise.all([
      // User stats
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last24Hours } } }),
      prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.user.count({ where: { createdAt: { gte: last30Days } } }),

      // Resume stats
      prisma.resumeVersion.count(),
      prisma.resumeVersion.count({
        where: { createdAt: { gte: last24Hours } },
      }),
      prisma.resumeVersion.count({
        where: { createdAt: { gte: last7Days } },
      }),

      // Application stats
      prisma.application.count(),
      prisma.application.count({ where: { createdAt: { gte: last7Days } } }),

      // Top users by resume count
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          _count: { select: { resumes: true, applications: true } },
        },
        orderBy: { resumes: { _count: 'desc' } },
        take: 10,
      }),
    ]);

    // Calculate average score
    const resumesWithScores = await prisma.resumeVersion.aggregate({
      _avg: { overallScore: true },
      _max: { overallScore: true },
      _min: { overallScore: true },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsersLast24h,
        newUsersLast7d,
        newUsersLast30d,
        totalResumes,
        resumesLast24h,
        resumesLast7d,
        totalApplications,
        applicationsLast7d,
        totalBadgesEarned: 0, // Badges not in current schema
        badgesEarnedLast7d: 0,
        totalEvents: 0,
        eventsLast24h: 0,
        exitFeedbackCount: 0,
      },
      resumeStats: {
        average: Math.round(resumesWithScores._avg.overallScore || 0),
        highest: resumesWithScores._max.overallScore || 0,
        lowest: resumesWithScores._min.overallScore || 0,
      },
      eventStats: [],
      topUsers: topUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || 'N/A',
        resumeCount: u._count.resumes,
        applicationCount: u._count.applications,
      })),
      recentFeedback: [],
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
