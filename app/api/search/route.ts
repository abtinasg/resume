import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const SearchQuerySchema = z.object({
  query: z.string().trim().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  includeDrafts: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
});

/**
 * Search API - Feature not yet available (Post model not in schema)
 */
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const queryValue = params.query ?? params.q;
    const parsed = SearchQuerySchema.safeParse({
      query: queryValue,
      limit: params.limit,
      includeDrafts: params.includeDrafts,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: parsed.error.issues[0]?.message ?? 'Invalid search parameters',
          },
        },
        { status: 400 }
      );
    }

    const { query } = parsed.data;

    // Search functionality not available - Post model not in schema
    return NextResponse.json(
      {
        success: true,
        data: {
          query,
          posts: [],
        },
        message: 'Search feature not yet available',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Search API] Failed to perform search:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to perform search. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}
