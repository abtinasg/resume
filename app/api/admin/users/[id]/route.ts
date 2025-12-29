import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/adminAuth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/users/[id]
 * Update user (e.g., change role)
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
    const userId = params.id; // User ID is a string (cuid)
    const body = await request.json();

    // Validate user ID
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    const updateData: { name?: string } = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (soft delete - could be implemented later)
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
    const userId = params.id; // User ID is a string (cuid)

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Don't allow deleting yourself
    if (authResult.userId && userId === String(authResult.userId)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
