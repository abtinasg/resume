import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PostStatus } from '@prisma/client';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/adminAuth';

export const runtime = 'nodejs';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ])
);

const CreatePostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(slugRegex, {
      message:
        'Slug must contain only lowercase letters, numbers, and hyphens (no leading or trailing hyphen).',
    }),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  coverImage: z.string().trim().min(1).optional().nullable(),
  publishedAt: z.union([z.coerce.date(), z.null()]).optional(),
  metadata: JsonValueSchema.optional(),
});

const UpdatePostSchema = z
  .object({
    id: z.number().int().positive(),
    title: z.string().trim().min(1).max(200).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(slugRegex, {
        message:
          'Slug must contain only lowercase letters, numbers, and hyphens (no leading or trailing hyphen).',
      })
      .optional(),
    excerpt: z.string().max(500).optional().nullable(),
    content: z.string().min(1).optional(),
    status: z.nativeEnum(PostStatus).optional(),
    coverImage: z.string().trim().min(1).optional().nullable(),
    publishedAt: z.union([z.coerce.date(), z.null()]).optional(),
    metadata: JsonValueSchema.optional(),
  })
  .refine(
    (payload) => {
      const { title, slug, excerpt, content, status, coverImage, publishedAt, metadata } = payload;
      return (
        payload.id !== undefined &&
        [title, slug, excerpt, content, status, coverImage, publishedAt, metadata].some(
          (value) => value !== undefined
        )
      );
    },
    {
      message: 'At least one field besides `id` must be provided for update.',
      path: ['id'],
    }
  );

const GetPostsQuerySchema = z.object({
  slug: z.string().trim().min(1).optional(),
  status: z.nativeEnum(PostStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeDrafts: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value === 'true'),
});

function normalizeOptionalString(value?: string | null) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function GET(req: NextRequest) {
  try {
    const rawQuery = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsedQuery = GetPostsQuerySchema.safeParse(rawQuery);

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: parsedQuery.error.issues[0]?.message ?? 'Invalid query parameters',
          },
        },
        { status: 400 }
      );
    }

    const { slug, status, page, limit, includeDrafts } = parsedQuery.data;

    if (slug) {
      const post = await prisma.post.findUnique({
        where: { slug },
      });

      if (!post || (!includeDrafts && post.status !== PostStatus.PUBLISHED)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Post not found',
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: post,
        },
        { status: 200 }
      );
    }

    const where: Prisma.PostWhereInput = {};

    if (status) {
      where.status = status;
    } else if (!includeDrafts) {
      where.status = PostStatus.PUBLISHED;
    }

    const skip = (page - 1) * limit;

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          items: posts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Posts API] Failed to fetch posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch posts. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Verify admin authentication
  const authResult = await verifyAdminAuth(req);
  if (!authResult.isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: authResult.error || 'Admin access required',
        },
      },
      { status: authResult.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  try {
    const json = await req.json().catch(() => null);

    if (!json) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON.',
          },
        },
        { status: 400 }
      );
    }

    const parsedPayload = CreatePostSchema.safeParse(json);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsedPayload.error.issues[0]?.message ?? 'Invalid post payload',
          },
        },
        { status: 400 }
      );
    }

    const payload = parsedPayload.data;

    const publishedAt =
      payload.publishedAt ?? (payload.status === PostStatus.PUBLISHED ? new Date() : null);

    const createdPost = await prisma.post.create({
      data: {
        title: payload.title,
        slug: payload.slug,
        excerpt: normalizeOptionalString(payload.excerpt ?? undefined),
        content: payload.content,
        status: payload.status,
        coverImage: normalizeOptionalString(payload.coverImage ?? undefined),
        publishedAt,
        metadata:
          payload.metadata !== undefined ? (payload.metadata as Prisma.JsonValue) : undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: createdPost,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Posts API] Failed to create post:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_SLUG',
              message: 'A post with this slug already exists.',
            },
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create post. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Verify admin authentication
  const authResult = await verifyAdminAuth(req);
  if (!authResult.isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: authResult.error || 'Admin access required',
        },
      },
      { status: authResult.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  try {
    const json = await req.json().catch(() => null);

    if (!json) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON.',
          },
        },
        { status: 400 }
      );
    }

    const parsedPayload = UpdatePostSchema.safeParse(json);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsedPayload.error.issues[0]?.message ?? 'Invalid post payload',
          },
        },
        { status: 400 }
      );
    }

    const payload = parsedPayload.data;

    const existingPost = await prisma.post.findUnique({
      where: { id: payload.id },
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Post not found.',
          },
        },
        { status: 404 }
      );
    }

    const nextPublishedAt =
      payload.publishedAt === null
        ? null
        : payload.publishedAt ??
          (payload.status === PostStatus.PUBLISHED
            ? existingPost.publishedAt ?? new Date()
            : existingPost.publishedAt);

    const updatedPost = await prisma.post.update({
      where: { id: payload.id },
      data: {
        title: payload.title ?? undefined,
        slug: payload.slug ?? undefined,
        excerpt: payload.excerpt !== undefined ? normalizeOptionalString(payload.excerpt) : undefined,
        content: payload.content ?? undefined,
        status: payload.status ?? undefined,
        coverImage:
          payload.coverImage !== undefined ? normalizeOptionalString(payload.coverImage) : undefined,
        publishedAt: nextPublishedAt,
        metadata:
          payload.metadata !== undefined ? (payload.metadata as Prisma.JsonValue) : undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Posts API] Failed to update post:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_SLUG',
              message: 'A post with this slug already exists.',
            },
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update post. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}
