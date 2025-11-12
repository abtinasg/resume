import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/adminAuth';

/**
 * GET /api/admin/tracking
 * Get progress tracking overview for all users
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
    // Get all resume versions with user info
    const versions = await prisma.resumeVersion.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to recent 100 versions
    });

    // Get all score history with user info
    const scoreHistory = await prisma.resumeScoreHistory.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        resume: {
          select: {
            id: true,
            fileName: true,
          },
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
      take: 100, // Limit to recent 100 records
    });

    // Calculate aggregate stats
    const totalVersions = await prisma.resumeVersion.count();
    const totalScoreRecords = await prisma.resumeScoreHistory.count();

    // Calculate average improvement
    const improvements = await prisma.resumeScoreHistory.findMany({
      where: {
        change: { not: null },
      },
      select: {
        change: true,
      },
    });

    const avgImprovement =
      improvements.length > 0
        ? improvements.reduce((sum, i) => sum + (i.change || 0), 0) /
          improvements.length
        : 0;

    // Get users with most versions
    const userVersionCounts = await prisma.resumeVersion.groupBy({
      by: ['userId'],
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Get user details for top users
    const topUserIds = userVersionCounts.map((u) => u.userId);
    const topUsers = await prisma.user.findMany({
      where: {
        id: { in: topUserIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const topUsersWithCounts = userVersionCounts.map((uvc) => {
      const user = topUsers.find((u) => u.id === uvc.userId);
      return {
        user,
        versionCount: uvc._count.userId,
      };
    });

    return NextResponse.json({
      overview: {
        totalVersions,
        totalScoreRecords,
        avgImprovement: Math.round(avgImprovement * 10) / 10,
        positiveImprovements: improvements.filter((i) => (i.change || 0) > 0)
          .length,
        negativeImprovements: improvements.filter((i) => (i.change || 0) < 0)
          .length,
      },
      recentVersions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        score: v.score,
        createdAt: v.createdAt,
        user: v.user,
      })),
      recentScoreHistory: scoreHistory.map((sh) => ({
        id: sh.id,
        score: sh.score,
        previousScore: sh.previousScore,
        change: sh.change,
        recordedAt: sh.recordedAt,
        user: sh.user,
        resume: sh.resume,
      })),
      topUsers: topUsersWithCounts,
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}
