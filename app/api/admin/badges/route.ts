import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/adminAuth';

/**
 * GET /api/admin/badges
 * Get all badges with stats
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
    const badges = await prisma.badge.findMany({
      include: {
        _count: {
          select: { userBadges: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedBadges = badges.map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      criteria: JSON.parse(badge.criteria),
      rarity: badge.rarity,
      earnedCount: badge._count.userBadges,
      createdAt: badge.createdAt,
    }));

    return NextResponse.json({
      badges: formattedBadges,
      total: formattedBadges.length,
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/badges
 * Create a new badge
 */
export async function POST(request: NextRequest) {
  // Verify admin auth
  const authResult = await verifyAdminAuth(request);
  if (!authResult.isAuthorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.description || !body.icon || !body.criteria) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create badge
    const badge = await prisma.badge.create({
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon,
        criteria: JSON.stringify(body.criteria),
        rarity: body.rarity || 'common',
      },
    });

    return NextResponse.json({
      message: 'Badge created successfully',
      badge: {
        ...badge,
        criteria: JSON.parse(badge.criteria),
      },
    });
  } catch (error) {
    console.error('Error creating badge:', error);
    return NextResponse.json(
      { error: 'Failed to create badge' },
      { status: 500 }
    );
  }
}
