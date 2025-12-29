import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/adminAuth';

/**
 * GET /api/admin/users
 * Get all users with their stats
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
    // Get all users with related data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            resumes: true,
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name || 'N/A',
      createdAt: user.createdAt,
      stats: {
        resumeCount: user._count.resumes,
        applicationCount: user._count.applications,
        badgeCount: 0, // Badge model not in current schema
        eventCount: 0, // Analytics events model not in current schema
      },
    }));

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
