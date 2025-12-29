/**
 * Subscription Management API
 *
 * Handles subscription CRUD operations without external payment providers.
 * This is an internal subscription system for testing and manual management.
 *
 * Endpoints:
 * - GET: Retrieve user's subscription details
 * - POST: Create/upgrade subscription
 * - PATCH: Update subscription (cancel, reactivate, change tier)
 * - DELETE: Delete/downgrade subscription to free
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  getSubscriptionDetails,
  upgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  downgradeToFree,
  type SubscriptionTier,
  TIER_PRICING,
  SUBSCRIPTION_PERIOD_DAYS,
} from '@/lib/premium';
import {
  cacheUserSubscription,
  invalidateUserSubscription,
  invalidateUsageLimits,
} from '@/lib/cache';
import { trackEvent } from '@/lib/analytics';
import { z } from 'zod';

// Request validation schemas
const CreateSubscriptionSchema = z.object({
  tier: z.enum(['free', 'premium', 'pro_plus']),
  periodInDays: z.number().optional().default(30),
});

const UpdateSubscriptionSchema = z.object({
  action: z.enum(['cancel', 'reactivate', 'change_tier']),
  tier: z.enum(['free', 'premium', 'pro_plus']).optional(),
});

/**
 * GET /api/subscription
 * Retrieve user's subscription details including usage information
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
          },
        },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // Get subscription details with usage
    const details = await getSubscriptionDetails(userId);

    // Cache the result
    await cacheUserSubscription(userId, details);

    // Track analytics
    await trackEvent('subscription_viewed', {
      userId,
      request: req,
      metadata: {
        tier: details.subscription.tier,
        status: details.subscription.status,
      },
    });

    return NextResponse.json({
      success: true,
      data: details,
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve subscription',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription
 * Create or upgrade a subscription
 *
 * Body: { tier: 'premium' | 'pro_plus', periodInDays?: number }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
          },
        },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // Parse and validate request body
    const body = await req.json();
    const validation = CreateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { tier, periodInDays } = validation.data;

    // Don't allow "upgrading" to free tier via this endpoint
    if (tier === 'free') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TIER',
            message: 'Use DELETE endpoint to downgrade to free tier',
          },
        },
        { status: 400 }
      );
    }

    // Upgrade/create subscription
    const subscription = await upgradeSubscription(userId, tier, periodInDays);

    // Invalidate cache
    await invalidateUserSubscription(userId);
    await invalidateUsageLimits(userId);

    // Get updated details
    const details = await getSubscriptionDetails(userId);

    // Track analytics
    await trackEvent('subscription_created', {
      userId,
      request: req,
      metadata: {
        tier,
        periodInDays,
        price: TIER_PRICING[tier],
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: `Successfully upgraded to ${tier} tier`,
          subscription: details,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create subscription',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscription
 * Update subscription (cancel, reactivate, or change tier)
 *
 * Body: { action: 'cancel' | 'reactivate' | 'change_tier', tier?: 'premium' | 'pro_plus' }
 */
export async function PATCH(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
          },
        },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // Parse and validate request body
    const body = await req.json();
    const validation = UpdateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { action, tier } = validation.data;

    let message = '';

    // Handle different actions
    switch (action) {
      case 'cancel':
        await cancelSubscription(userId);
        message = 'Subscription will be canceled at the end of the current period';
        await trackEvent('subscription_canceled', {
          userId,
          request: req,
          metadata: { action: 'cancel' },
        });
        break;

      case 'reactivate':
        await reactivateSubscription(userId);
        message = 'Subscription reactivated successfully';
        await trackEvent('subscription_reactivated', {
          userId,
          request: req,
          metadata: { action: 'reactivate' },
        });
        break;

      case 'change_tier':
        if (!tier) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'MISSING_TIER',
                message: 'Tier is required for change_tier action',
              },
            },
            { status: 400 }
          );
        }

        if (tier === 'free') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_TIER',
                message: 'Use DELETE endpoint to downgrade to free tier',
              },
            },
            { status: 400 }
          );
        }

        await upgradeSubscription(userId, tier);
        message = `Successfully changed to ${tier} tier`;
        await trackEvent('subscription_tier_changed', {
          userId,
          request: req,
          metadata: { newTier: tier },
        });
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action specified',
            },
          },
          { status: 400 }
        );
    }

    // Invalidate cache
    await invalidateUserSubscription(userId);
    await invalidateUsageLimits(userId);

    // Get updated details
    const details = await getSubscriptionDetails(userId);

    return NextResponse.json({
      success: true,
      data: {
        message,
        subscription: details,
      },
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update subscription',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscription
 * Downgrade subscription to free tier immediately
 */
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
          },
        },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // Downgrade to free
    const subscription = await downgradeToFree(userId);

    // Invalidate cache
    await invalidateUserSubscription(userId);
    await invalidateUsageLimits(userId);

    // Get updated details
    const details = await getSubscriptionDetails(userId);

    // Track analytics
    await trackEvent('subscription_downgraded', {
      userId,
      request: req,
      metadata: { newTier: 'free' },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Successfully downgraded to free tier',
        subscription: details,
      },
    });
  } catch (error: any) {
    console.error('Delete subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to downgrade subscription',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
