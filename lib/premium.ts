/**
 * Premium Tier Logic
 *
 * This module handles:
 * - Feature flags and tier management
 * - Subscription status checks
 * - Usage limits and enforcement
 * - Subscription lifecycle operations
 */

import { prisma } from './prisma';
import { FEATURES, type Feature, canAccessFeature } from './featureGating';

// Subscription tier types
export type SubscriptionTier = 'free' | 'premium' | 'pro_plus';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired';

// Tier configuration with usage limits
export const TIER_LIMITS = {
  free: {
    resumeScans: 3,
    jobMatches: 0,
    resumeComparisons: 0,
    aiCoachMessages: 0,
  },
  premium: {
    resumeScans: -1, // -1 means unlimited
    jobMatches: 50,
    resumeComparisons: -1,
    aiCoachMessages: 100,
  },
  pro_plus: {
    resumeScans: -1,
    jobMatches: -1,
    resumeComparisons: -1,
    aiCoachMessages: -1,
  },
} as const;

// Tier pricing (monthly)
export const TIER_PRICING = {
  free: 0,
  premium: 9.99,
  pro_plus: 19.99,
} as const;

// Subscription period duration (in days)
export const SUBSCRIPTION_PERIOD_DAYS = 30;

/**
 * Get or create subscription for a user
 */
export async function getOrCreateSubscription(userId: number) {
  let subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!subscription) {
    // Create default free subscription
    subscription = await prisma.subscription.create({
      data: {
        userId,
        tier: 'free',
        status: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  return subscription;
}

/**
 * Get or create usage limits for a user
 */
export async function getOrCreateUsageLimit(userId: number, tier: SubscriptionTier = 'free') {
  let usageLimit = await prisma.usageLimit.findUnique({
    where: { userId },
  });

  if (!usageLimit) {
    const limits = TIER_LIMITS[tier];
    usageLimit = await prisma.usageLimit.create({
      data: {
        userId,
        resumeScans: limits.resumeScans === -1 ? 999999 : limits.resumeScans,
        maxResumeScans: limits.resumeScans === -1 ? 999999 : limits.resumeScans,
        jobMatches: limits.jobMatches === -1 ? 999999 : limits.jobMatches,
        maxJobMatches: limits.jobMatches === -1 ? 999999 : limits.jobMatches,
      },
    });
  }

  return usageLimit;
}

/**
 * Check if a subscription is active and valid
 */
export function isSubscriptionActive(subscription: {
  status: string;
  currentPeriodEnd: Date | null;
}): boolean {
  if (subscription.status !== 'active') {
    return false;
  }

  // If there's a period end date, check if it's in the future
  if (subscription.currentPeriodEnd) {
    return new Date() < new Date(subscription.currentPeriodEnd);
  }

  // If no period end date and status is active, consider it active
  return true;
}

/**
 * Check if a user has access to a feature
 */
export async function checkFeatureAccess(
  userId: number,
  feature: Feature
): Promise<{ hasAccess: boolean; reason?: string; subscription?: any }> {
  const subscription = await getOrCreateSubscription(userId);

  if (!subscription) {
    return { hasAccess: false, reason: 'No subscription found' };
  }

  // Check if subscription is active
  if (!isSubscriptionActive(subscription)) {
    return {
      hasAccess: false,
      reason: 'Subscription is not active',
      subscription,
    };
  }

  // Check tier access
  const tier = subscription.tier as SubscriptionTier;
  const hasAccess = canAccessFeature(tier, feature);

  if (!hasAccess) {
    return {
      hasAccess: false,
      reason: `Feature requires higher tier`,
      subscription,
    };
  }

  return { hasAccess: true, subscription };
}

/**
 * Check if a user has remaining usage for a specific action
 */
export async function checkUsageLimit(
  userId: number,
  action: 'resumeScan' | 'jobMatch'
): Promise<{ allowed: boolean; remaining: number; limit: number; reason?: string }> {
  const subscription = await getOrCreateSubscription(userId);
  const tier = subscription.tier as SubscriptionTier;
  const usageLimit = await getOrCreateUsageLimit(userId, tier);

  // Check if limits need to be reset (monthly reset)
  const daysSinceReset = Math.floor(
    (Date.now() - new Date(usageLimit.lastResetDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceReset >= SUBSCRIPTION_PERIOD_DAYS) {
    // Reset usage limits
    await resetUsageLimits(userId, tier);
    const refreshedLimit = await getOrCreateUsageLimit(userId, tier);
    return checkCurrentUsage(refreshedLimit, action);
  }

  return checkCurrentUsage(usageLimit, action);
}

/**
 * Check current usage without reset
 */
function checkCurrentUsage(
  usageLimit: { resumeScans: number; maxResumeScans: number; jobMatches: number; maxJobMatches: number },
  action: 'resumeScan' | 'jobMatch'
): { allowed: boolean; remaining: number; limit: number; reason?: string } {
  if (action === 'resumeScan') {
    // Check if unlimited (999999)
    if (usageLimit.maxResumeScans >= 999999) {
      return { allowed: true, remaining: -1, limit: -1 };
    }

    const allowed = usageLimit.resumeScans > 0;
    return {
      allowed,
      remaining: usageLimit.resumeScans,
      limit: usageLimit.maxResumeScans,
      reason: allowed ? undefined : 'Resume scan limit reached',
    };
  } else if (action === 'jobMatch') {
    // Check if unlimited
    if (usageLimit.maxJobMatches >= 999999) {
      return { allowed: true, remaining: -1, limit: -1 };
    }

    const allowed = usageLimit.jobMatches > 0;
    return {
      allowed,
      remaining: usageLimit.jobMatches,
      limit: usageLimit.maxJobMatches,
      reason: allowed ? undefined : 'Job match limit reached',
    };
  }

  return { allowed: false, remaining: 0, limit: 0, reason: 'Invalid action' };
}

/**
 * Decrement usage limit after an action
 */
export async function decrementUsage(
  userId: number,
  action: 'resumeScan' | 'jobMatch'
): Promise<void> {
  const usageLimit = await prisma.usageLimit.findUnique({
    where: { userId },
  });

  if (!usageLimit) {
    return;
  }

  if (action === 'resumeScan' && usageLimit.resumeScans > 0 && usageLimit.maxResumeScans < 999999) {
    await prisma.usageLimit.update({
      where: { userId },
      data: { resumeScans: { decrement: 1 } },
    });
  } else if (action === 'jobMatch' && usageLimit.jobMatches > 0 && usageLimit.maxJobMatches < 999999) {
    await prisma.usageLimit.update({
      where: { userId },
      data: { jobMatches: { decrement: 1 } },
    });
  }
}

/**
 * Reset usage limits to tier defaults
 */
export async function resetUsageLimits(userId: number, tier: SubscriptionTier): Promise<void> {
  const limits = TIER_LIMITS[tier];

  await prisma.usageLimit.upsert({
    where: { userId },
    create: {
      userId,
      resumeScans: limits.resumeScans === -1 ? 999999 : limits.resumeScans,
      maxResumeScans: limits.resumeScans === -1 ? 999999 : limits.resumeScans,
      jobMatches: limits.jobMatches === -1 ? 999999 : limits.jobMatches,
      maxJobMatches: limits.jobMatches === -1 ? 999999 : limits.jobMatches,
      lastResetDate: new Date(),
    },
    update: {
      resumeScans: limits.resumeScans === -1 ? 999999 : limits.resumeScans,
      maxResumeScans: limits.resumeScans === -1 ? 999999 : limits.resumeScans,
      jobMatches: limits.jobMatches === -1 ? 999999 : limits.jobMatches,
      maxJobMatches: limits.jobMatches === -1 ? 999999 : limits.jobMatches,
      lastResetDate: new Date(),
    },
  });
}

/**
 * Upgrade a user's subscription tier
 */
export async function upgradeSubscription(
  userId: number,
  newTier: SubscriptionTier,
  periodInDays: number = SUBSCRIPTION_PERIOD_DAYS
): Promise<any> {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + periodInDays * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier: newTier,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    update: {
      tier: newTier,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  // Reset usage limits to new tier
  await resetUsageLimits(userId, newTier);

  return subscription;
}

/**
 * Cancel a subscription (at period end)
 */
export async function cancelSubscription(userId: number): Promise<any> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  return await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
    },
  });
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(userId: number): Promise<any> {
  return await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: false,
      status: 'active',
    },
  });
}

/**
 * Downgrade a subscription to free tier
 */
export async function downgradeToFree(userId: number): Promise<any> {
  const subscription = await prisma.subscription.update({
    where: { userId },
    data: {
      tier: 'free',
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
    },
  });

  // Reset usage limits to free tier
  await resetUsageLimits(userId, 'free');

  return subscription;
}

/**
 * Get subscription details with usage information
 */
export async function getSubscriptionDetails(userId: number) {
  const subscription = await getOrCreateSubscription(userId);
  const usageLimit = await getOrCreateUsageLimit(userId, subscription.tier as SubscriptionTier);
  const tierConfig = TIER_LIMITS[subscription.tier as SubscriptionTier];

  return {
    subscription: {
      ...subscription,
      isActive: isSubscriptionActive(subscription),
      price: TIER_PRICING[subscription.tier as SubscriptionTier],
    },
    usage: {
      resumeScans: {
        used: usageLimit.maxResumeScans - usageLimit.resumeScans,
        remaining: usageLimit.resumeScans >= 999999 ? -1 : usageLimit.resumeScans,
        limit: usageLimit.maxResumeScans >= 999999 ? -1 : usageLimit.maxResumeScans,
      },
      jobMatches: {
        used: usageLimit.maxJobMatches - usageLimit.jobMatches,
        remaining: usageLimit.jobMatches >= 999999 ? -1 : usageLimit.jobMatches,
        limit: usageLimit.maxJobMatches >= 999999 ? -1 : usageLimit.maxJobMatches,
      },
      lastResetDate: usageLimit.lastResetDate,
      nextResetDate: new Date(
        new Date(usageLimit.lastResetDate).getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000
      ),
    },
    features: Object.values(FEATURES).filter(feature =>
      canAccessFeature(subscription.tier as SubscriptionTier, feature)
    ),
  };
}

/**
 * Check if subscription needs renewal (expired)
 */
export async function checkAndUpdateExpiredSubscriptions(): Promise<void> {
  const now = new Date();

  // Find all subscriptions that should expire
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'active',
      currentPeriodEnd: {
        lt: now,
      },
    },
  });

  // Update expired subscriptions
  for (const sub of expiredSubscriptions) {
    if (sub.cancelAtPeriodEnd) {
      // Downgrade to free
      await downgradeToFree(sub.userId);
    } else {
      // Mark as expired but keep tier (in case of payment retry)
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
    }
  }
}

/**
 * Feature flag check - can be used for A/B testing or gradual rollouts
 */
export function isFeatureEnabled(feature: string, userId?: number): boolean {
  // This can be extended to use a feature flag service
  // For now, all features are enabled
  const enabledFeatures = Object.values(FEATURES);
  return enabledFeatures.includes(feature as Feature);
}
