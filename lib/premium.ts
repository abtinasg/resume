/**
 * Premium Tier Logic
 *
 * This module handles:
 * - Feature flags and tier management
 * - Subscription status checks
 * - Usage limits and enforcement
 * - Subscription lifecycle operations
 */

// Note: prisma import removed - Subscription and UsageLimit models not in current schema
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
 * Note: Subscription model not in current schema - returns mock data
 */
export async function getOrCreateSubscription(userId: number) {
  // Subscription model not in current schema - returning mock data
  console.log('[Premium] getOrCreateSubscription skipped - Subscription model not available');
  return {
    id: userId,
    userId,
    tier: 'free' as SubscriptionTier,
    status: 'active' as SubscriptionStatus,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000),
    user: {
      id: userId,
      email: '',
      name: null,
    },
  };
}

/**
 * Get or create usage limits for a user
 * Note: UsageLimit model not in current schema - returns mock data
 */
export async function getOrCreateUsageLimit(userId: number, tier: SubscriptionTier = 'free') {
  // UsageLimit model not in current schema - returning mock data
  console.log('[Premium] getOrCreateUsageLimit skipped - UsageLimit model not available');
  const limits = TIER_LIMITS[tier];
  return {
    id: userId,
    userId,
    resumeScans: limits.resumeScans === -1 ? 999999 : limits.resumeScans,
    maxResumeScans: limits.resumeScans === -1 ? 999999 : limits.resumeScans,
    jobMatches: limits.jobMatches === -1 ? 999999 : limits.jobMatches,
    maxJobMatches: limits.jobMatches === -1 ? 999999 : limits.jobMatches,
    lastResetDate: new Date(),
  };
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
 * Note: Subscription model not in current schema - returns default free tier access
 */
export async function checkFeatureAccess(
  _userId: string | number,
  feature: Feature
): Promise<{ hasAccess: boolean; reason?: string; subscription?: { tier: string; status: string } }> {
  const tier: SubscriptionTier = 'free';
  const hasAccess = canAccessFeature(tier, feature);

  if (!hasAccess) {
    return {
      hasAccess: false,
      reason: `Feature requires higher tier`,
      subscription: { tier, status: 'active' },
    };
  }

  return { hasAccess: true, subscription: { tier, status: 'active' } };
}

/**
 * Check if a user has remaining usage for a specific action
 * Note: UsageLimit model not in current schema - returns default free tier limits
 */
export async function checkUsageLimit(
  _userId: string | number,
  action: 'resumeScan' | 'jobMatch'
): Promise<{ allowed: boolean; remaining: number; limit: number; reason?: string }> {
  const tier: SubscriptionTier = 'free';
  const tierConfig = TIER_LIMITS[tier];
  
  if (action === 'resumeScan') {
    const scans = tierConfig.resumeScans as number;
    return {
      allowed: scans > 0 || scans === -1,
      remaining: scans,
      limit: scans,
    };
  } else if (action === 'jobMatch') {
    const matches = tierConfig.jobMatches as number;
    return {
      allowed: matches > 0 || matches === -1,
      remaining: matches,
      limit: matches,
      reason: matches === 0 ? 'Job match not available in free tier' : undefined,
    };
  }

  return { allowed: false, remaining: 0, limit: 0, reason: 'Invalid action' };
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
 * Note: UsageLimit model not in current schema - no-op
 */
export async function decrementUsage(
  _userId: string | number,
  _action: 'resumeScan' | 'jobMatch'
): Promise<void> {
  // UsageLimit model not in current schema - no-op
  console.log('[Premium] Usage decrement skipped - UsageLimit model not available');
}

/**
 * Reset usage limits to tier defaults
 * Note: UsageLimit model not in current schema - no-op
 */
export async function resetUsageLimits(_userId: string | number, _tier: SubscriptionTier): Promise<void> {
  // UsageLimit model not in current schema - no-op
  console.log('[Premium] Usage reset skipped - UsageLimit model not available');
}

/**
 * Upgrade a user's subscription tier
 * Note: Subscription model not in current schema - no-op
 */
export async function upgradeSubscription(
  _userId: string | number,
  _newTier: SubscriptionTier,
  _periodInDays: number = SUBSCRIPTION_PERIOD_DAYS
): Promise<{ tier: string; status: string }> {
  // Subscription model not in current schema - returning default
  console.log('[Premium] Upgrade skipped - Subscription model not available');
  return { tier: 'free', status: 'active' };
}

/**
 * Cancel a subscription (at period end)
 * Note: Subscription model not in current schema - no-op
 */
export async function cancelSubscription(_userId: string | number): Promise<{ success: boolean }> {
  // Subscription model not in current schema - returning success
  console.log('[Premium] Cancel skipped - Subscription model not available');
  return { success: true };
}

/**
 * Reactivate a canceled subscription
 * Note: Subscription model not in current schema - no-op
 */
export async function reactivateSubscription(_userId: string | number): Promise<{ success: boolean }> {
  // Subscription model not in current schema - returning success
  console.log('[Premium] Reactivate skipped - Subscription model not available');
  return { success: true };
}

/**
 * Downgrade a subscription to free tier
 * Note: Subscription model not in current schema - no-op
 */
export async function downgradeToFree(_userId: string | number): Promise<{ tier: string; status: string }> {
  // Subscription model not in current schema - returning default
  console.log('[Premium] Downgrade skipped - Subscription model not available');
  return { tier: 'free', status: 'active' };
}

/**
 * Get subscription details with usage information
 * Note: Subscription and UsageLimit models not in current schema
 * Returns default free tier configuration
 */
export async function getSubscriptionDetails(userId: string | number) {
  const tier: SubscriptionTier = 'free';
  const tierConfig = TIER_LIMITS[tier];
  const now = new Date();

  return {
    subscription: {
      id: `sub_${userId}`,
      userId,
      tier,
      status: 'active' as SubscriptionStatus,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000),
      isActive: true,
      price: TIER_PRICING[tier],
    },
    usage: {
      resumeScans: {
        used: 0,
        remaining: tierConfig.resumeScans,
        limit: tierConfig.resumeScans,
      },
      jobMatches: {
        used: 0,
        remaining: tierConfig.jobMatches,
        limit: tierConfig.jobMatches,
      },
      lastResetDate: now,
      nextResetDate: new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000),
    },
    features: Object.values(FEATURES).filter(feature =>
      canAccessFeature(tier, feature)
    ),
  };
}

/**
 * Check if subscription needs renewal (expired)
 * Note: Subscription model not in current schema - no-op
 */
export async function checkAndUpdateExpiredSubscriptions(): Promise<void> {
  // Subscription model not in current schema - no-op
  console.log('[Premium] Subscription check skipped - Subscription model not available');
}

/**
 * Feature flag check - can be used for A/B testing or gradual rollouts
 */
export function isFeatureEnabled(feature: string, _userId?: string | number): boolean {
  // This can be extended to use a feature flag service
  // For now, all features are enabled
  const enabledFeatures = Object.values(FEATURES);
  return enabledFeatures.includes(feature as Feature);
}
