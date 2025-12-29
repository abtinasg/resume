import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Posts API - Feature not yet available (Post model not in schema)
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      data: {
        items: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        },
      },
      message: 'Posts feature not yet available',
    },
    { status: 200 }
  );
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Posts feature not yet available',
      },
    },
    { status: 501 }
  );
}

export async function PUT(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Posts feature not yet available',
      },
    },
    { status: 501 }
  );
}
