'use client';

import { motion } from 'framer-motion';
import { CreditCard, Lock, Clock } from 'lucide-react';

interface TrustBadgesProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export default function TrustBadges({ variant = 'light', className = '' }: TrustBadgesProps) {
  const badges = [
    {
      icon: CreditCard,
      text: 'No credit card',
    },
    {
      icon: Lock,
      text: 'Private',
    },
    {
      icon: Clock,
      text: '6-min results',
    },
  ];

  const isDark = variant === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
      className={`flex flex-wrap items-center justify-center gap-3 ${className}`}
    >
      {badges.map((badge, index) => (
        <div
          key={badge.text}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
            isDark
              ? 'bg-white/10 text-white/80 backdrop-blur-sm border border-white/20'
              : 'bg-gray-50/80 text-gray-600 backdrop-blur-sm border border-gray-100'
          }`}
        >
          <badge.icon className="w-3.5 h-3.5" strokeWidth={2} />
          <span>{badge.text}</span>
          {index < badges.length - 1 && (
            <span className={`ml-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>•</span>
          )}
        </div>
      ))}
    </motion.div>
  );
}
