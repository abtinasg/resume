import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/badges/[id]
 * Update a badge - Feature not yet available (Badge model not in schema)
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

  return NextResponse.json({
    message: 'Badge management feature is not yet available',
    error: 'Feature not implemented',
  }, { status: 501 });
}

/**
 * DELETE /api/admin/badges/[id]
 * Delete a badge - Feature not yet available (Badge model not in schema)
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

  return NextResponse.json({
    message: 'Badge management feature is not yet available',
    error: 'Feature not implemented',
  }, { status: 501 });
}
