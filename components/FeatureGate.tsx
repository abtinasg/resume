'use client';

import React from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import PremiumBadge from './PremiumBadge';
import { Feature, canAccessFeature, getFeatureDisplayName } from '@/lib/featureGating';

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * FeatureGate component - wraps premium features and shows upgrade prompts
 *
 * Usage:
 * <FeatureGate feature={FEATURES.RESUME_COACH}>
 *   <ResumeChatBot />
 * </FeatureGate>
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const user = useAuthStore((state) => state.user);
  const hasAccess = canAccessFeature(user?.subscriptionTier, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <PremiumBadge
        variant="locked"
        showUpgradeButton={true}
        featureName={getFeatureDisplayName(feature)}
      />
    );
  }

  return null;
};

export default FeatureGate;
