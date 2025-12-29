import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { verifyToken } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';

export const runtime = 'nodejs';

const FeedbackSchema = z.object({
  experienceRating: z.number().int().min(1).max(5).optional(),
  likelihoodToReturn: z.number().int().min(1).max(5).optional(),
  primaryReason: z.string().min(1).max(200).optional(),
  comments: z.string().max(2000).optional(),
  email: z.string().email().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
        },
        { status: 400 }
      );
    }

    let payload: z.infer<typeof FeedbackSchema>;
    try {
      payload = FeedbackSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: error.issues[0]?.message ?? 'Invalid feedback payload',
            },
          },
          { status: 400 }
        );
      }

      throw error;
    }

    const tokenValue = req.cookies.get('token')?.value;
    const authenticatedUser = tokenValue ? verifyToken(tokenValue) : null;

    // Note: exitFeedback model not in current schema - logging only
    console.log('[Feedback API] Received feedback:', {
      userId: authenticatedUser?.userId,
      rating: payload.experienceRating,
      likelihoodToReturn: payload.likelihoodToReturn,
      reason: payload.primaryReason,
      hasComment: Boolean(payload.comments),
    });

    await trackEvent('exit_feedback_submitted', {
      userId: authenticatedUser?.userId,
      request: req,
      metadata: {
        rating: payload.experienceRating,
        likelihoodToReturn: payload.likelihoodToReturn,
        reason: payload.primaryReason,
        hasComment: Boolean(payload.comments),
      },
    });

    return NextResponse.json(
      {
        success: true,
        feedbackId: `feedback_${Date.now()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Feedback API] Failed to record exit feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to record feedback. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}
