import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getSubscriptionDetails } from '@/lib/premium';
import { getCachedUserSubscription, cacheUserSubscription } from '@/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Try to get subscription from cache first
    let subscriptionDetails = await getCachedUserSubscription(user.id);

    // If not in cache, fetch from database
    if (!subscriptionDetails) {
      subscriptionDetails = await getSubscriptionDetails(user.id);
      // Cache for future requests
      await cacheUserSubscription(user.id, subscriptionDetails);
    }

    // Build response with subscription information
    const response = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Subscription information
      subscriptionTier: subscriptionDetails.subscription.tier,
      subscriptionStatus: subscriptionDetails.subscription.status,
      subscriptionEndDate: subscriptionDetails.subscription.currentPeriodEnd,
      // Usage information
      resumeScansRemaining: subscriptionDetails.usage.resumeScans.remaining,
      jobMatchesRemaining: subscriptionDetails.usage.jobMatches.remaining,
      // Feature flags
      isPremium: subscriptionDetails.subscription.tier === 'premium' || subscriptionDetails.subscription.tier === 'pro_plus',
      isProPlus: subscriptionDetails.subscription.tier === 'pro_plus',
    };

    return NextResponse.json(
      {
        success: true,
        user: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
