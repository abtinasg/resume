import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/adminAuth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/badges/[id]
 * Update a badge
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  // Verify admin auth
  const authResult = await verifyAdminAuth(request);
  if (!authResult.isAuthorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  try {
    const params = await context.params;
    const badgeId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(badgeId)) {
      return NextResponse.json(
        { error: 'Invalid badge ID' },
        { status: 400 }
      );
    }

    // Update badge
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.description) updateData.description = body.description;
    if (body.icon) updateData.icon = body.icon;
    if (body.criteria) updateData.criteria = JSON.stringify(body.criteria);
    if (body.rarity) updateData.rarity = body.rarity;

    const badge = await prisma.badge.update({
      where: { id: badgeId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Badge updated successfully',
      badge: {
        ...badge,
        criteria: JSON.parse(badge.criteria),
      },
    });
  } catch (error) {
    console.error('Error updating badge:', error);
    return NextResponse.json(
      { error: 'Failed to update badge' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/badges/[id]
 * Delete a badge
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  // Verify admin auth
  const authResult = await verifyAdminAuth(request);
  if (!authResult.isAuthorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  try {
    const params = await context.params;
    const badgeId = parseInt(params.id);

    if (isNaN(badgeId)) {
      return NextResponse.json(
        { error: 'Invalid badge ID' },
        { status: 400 }
      );
    }

    await prisma.badge.delete({
      where: { id: badgeId },
    });

    return NextResponse.json({
      message: 'Badge deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting badge:', error);
    return NextResponse.json(
      { error: 'Failed to delete badge' },
      { status: 500 }
    );
  }
}
