import { SubscriptionTier } from './store/authStore';

export type UserRole = 'user' | 'admin';

/**
 * Check if user is admin
 */
export function isAdmin(role?: string): boolean {
  return role === 'admin';
}

/**
 * Feature definitions with their required subscription tiers
 */
export const FEATURES = {
  UNLIMITED_SCANS: 'unlimited-scans',
  JOB_MATCHING: 'job-matching',
  RESUME_COACH: 'resume-coach',
  ACHIEVEMENT_BADGES: 'achievement-badges',
  RESUME_COMPARISON: 'resume-comparison',
  CUSTOM_TEMPLATES: 'custom-templates',
  LINKEDIN_OPTIMIZATION: 'linkedin-optimization',
  COVER_LETTER_ANALYSIS: 'cover-letter-analysis',
  PRIORITY_SUPPORT: 'priority-support',
  CONSULTATION: 'consultation',
  VERSION_HISTORY: 'version-history',
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

/**
 * Get the minimum required tier for a feature
 */
export function getRequiredTier(feature: Feature): SubscriptionTier {
  const tierMap: Record<Feature, SubscriptionTier> = {
    [FEATURES.UNLIMITED_SCANS]: 'premium',
    [FEATURES.JOB_MATCHING]: 'premium',
    [FEATURES.RESUME_COACH]: 'premium',
    [FEATURES.ACHIEVEMENT_BADGES]: 'premium',
    [FEATURES.RESUME_COMPARISON]: 'premium',
    [FEATURES.CUSTOM_TEMPLATES]: 'pro_plus',
    [FEATURES.LINKEDIN_OPTIMIZATION]: 'pro_plus',
    [FEATURES.COVER_LETTER_ANALYSIS]: 'pro_plus',
    [FEATURES.PRIORITY_SUPPORT]: 'pro_plus',
    [FEATURES.CONSULTATION]: 'pro_plus',
    [FEATURES.VERSION_HISTORY]: 'pro_plus',
  };

  return tierMap[feature];
}

/**
 * Get human-readable tier name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const displayNames: Record<SubscriptionTier, string> = {
    free: 'Free',
    premium: 'Premium',
    pro_plus: 'Pro+',
  };

  return displayNames[tier];
}

/**
 * Get feature display name
 */
export function getFeatureDisplayName(feature: Feature): string {
  const displayNames: Record<Feature, string> = {
    [FEATURES.UNLIMITED_SCANS]: 'Unlimited Resume Scans',
    [FEATURES.JOB_MATCHING]: 'Job Description Matching',
    [FEATURES.RESUME_COACH]: 'Resume Coach Chat',
    [FEATURES.ACHIEVEMENT_BADGES]: 'Achievement Badges',
    [FEATURES.RESUME_COMPARISON]: 'Resume Comparison Tool',
    [FEATURES.CUSTOM_TEMPLATES]: 'Custom Templates',
    [FEATURES.LINKEDIN_OPTIMIZATION]: 'LinkedIn Profile Optimization',
    [FEATURES.COVER_LETTER_ANALYSIS]: 'Cover Letter Analysis',
    [FEATURES.PRIORITY_SUPPORT]: 'Priority Support',
    [FEATURES.CONSULTATION]: '1-on-1 Consultation',
    [FEATURES.VERSION_HISTORY]: 'Resume Version History',
  };

  return displayNames[feature];
}

/**
 * Check if a user can access a feature based on their tier
 */
export function canAccessFeature(
  userTier: SubscriptionTier | undefined,
  feature: Feature
): boolean {
  const tier = userTier || 'free';
  const requiredTier = getRequiredTier(feature);

  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    premium: 1,
    pro_plus: 2,
  };

  return tierHierarchy[tier] >= tierHierarchy[requiredTier];
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(feature: Feature): string {
  const requiredTier = getRequiredTier(feature);
  const featureName = getFeatureDisplayName(feature);
  const tierName = getTierDisplayName(requiredTier);

  return `Upgrade to ${tierName} to unlock ${featureName}`;
}
