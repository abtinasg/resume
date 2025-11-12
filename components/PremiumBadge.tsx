'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Lock, Zap } from 'lucide-react';
import Link from 'next/link';

interface PremiumBadgeProps {
  variant?: 'pro' | 'premium' | 'locked' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showUpgradeButton?: boolean;
  className?: string;
  featureName?: string;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  variant = 'pro',
  size = 'md',
  showIcon = true,
  showUpgradeButton = false,
  className = '',
  featureName,
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const variantConfig = {
    pro: {
      icon: Crown,
      text: 'PRO',
      styles: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/30',
      iconColor: 'text-white',
    },
    premium: {
      icon: Sparkles,
      text: 'PREMIUM',
      styles: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30',
      iconColor: 'text-white',
    },
    locked: {
      icon: Lock,
      text: 'LOCKED',
      styles: 'bg-gray-100 text-gray-600 border border-gray-200',
      iconColor: 'text-gray-500',
    },
    inline: {
      icon: Zap,
      text: 'PRO',
      styles: 'bg-amber-50 text-amber-700 border border-amber-200',
      iconColor: 'text-amber-600',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  if (showUpgradeButton) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">
            {featureName || 'Premium Feature'}
          </h3>
        </div>
        <p className="text-sm text-gray-600 text-center max-w-md">
          Upgrade to unlock {featureName ? featureName.toLowerCase() : 'this feature'} and get access to advanced insights.
        </p>
        <Link href="/pricing">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </span>
          </motion.button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${sizeStyles[size]} ${config.styles} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor}`} />}
      <span>{config.text}</span>
    </motion.span>
  );
};

export default PremiumBadge;
