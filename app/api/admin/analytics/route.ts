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
      totalBadgesEarned,
      badgesEarnedLast7d,
      totalEvents,
      eventsLast24h,
      eventsByType,
      topUsers,
      exitFeedbackCount,
      recentFeedback,
    ] = await Promise.all([
      // User stats
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last24Hours } } }),
      prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.user.count({ where: { createdAt: { gte: last30Days } } }),

      // Resume stats
      prisma.resume.count({ where: { isArchived: false } }),
      prisma.resume.count({
        where: { createdAt: { gte: last24Hours }, isArchived: false },
      }),
      prisma.resume.count({
        where: { createdAt: { gte: last7Days }, isArchived: false },
      }),

      // Badge stats
      prisma.userBadge.count(),
      prisma.userBadge.count({ where: { earnedAt: { gte: last7Days } } }),

      // Analytics events
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.count({
        where: { createdAt: { gte: last24Hours } },
      }),

      // Event breakdown by type
      prisma.analyticsEvent.groupBy({
        by: ['event'],
        _count: { event: true },
        orderBy: { _count: { event: 'desc' } },
        take: 10,
      }),

      // Top users by resume count
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          _count: { select: { resumes: true, userBadges: true } },
        },
        orderBy: { resumes: { _count: 'desc' } },
        take: 10,
      }),

      // Exit feedback stats
      prisma.exitFeedback.count(),

      // Recent feedback
      prisma.exitFeedback.findMany({
        select: {
          id: true,
          rating: true,
          likelihoodToReturn: true,
          reason: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Format event stats
    const eventStats = eventsByType.map((e) => ({
      event: e.event,
      count: e._count.event,
    }));

    // Calculate average score
    const resumesWithScores = await prisma.resume.aggregate({
      _avg: { score: true },
      _max: { score: true },
      _min: { score: true },
      where: { isArchived: false },
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
        totalBadgesEarned,
        badgesEarnedLast7d,
        totalEvents,
        eventsLast24h,
        exitFeedbackCount,
      },
      resumeStats: {
        average: Math.round(resumesWithScores._avg.score || 0),
        highest: resumesWithScores._max.score || 0,
        lowest: resumesWithScores._min.score || 0,
      },
      eventStats,
      topUsers: topUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || 'N/A',
        resumeCount: u._count.resumes,
        badgeCount: u._count.userBadges,
      })),
      recentFeedback,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
