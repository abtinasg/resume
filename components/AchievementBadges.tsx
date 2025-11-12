'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  earnedAt?: string;
}

interface AchievementBadgesProps {
  userId?: number;
  showAll?: boolean;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-yellow-600',
};

const rarityBorderColors = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-yellow-400',
};

export default function AchievementBadges({ userId, showAll = false }: AchievementBadgesProps) {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBadge, setNewBadge] = useState<string | null>(null);

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      setLoading(true);

      if (showAll) {
        // Fetch all badges
        const [earnedRes, allRes] = await Promise.all([
          fetch('/api/badges/user'),
          fetch('/api/badges'),
        ]);

        if (earnedRes.ok) {
          const earnedData = await earnedRes.json();
          setEarnedBadges(earnedData.badges || []);
        }

        if (allRes.ok) {
          const allData = await allRes.json();
          setAllBadges(allData.badges || []);
        }
      } else {
        // Fetch only earned badges
        const res = await fetch('/api/badges/user');
        if (res.ok) {
          const data = await res.json();
          setEarnedBadges(data.badges || []);
        }
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewBadges = async () => {
    try {
      const res = await fetch('/api/badges/check', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.newBadges && data.newBadges.length > 0) {
          setNewBadge(data.newBadges[0]);
          setTimeout(() => setNewBadge(null), 5000);
          fetchBadges(); // Refresh badges
        }
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id));
  const displayBadges = showAll
    ? allBadges.map((badge) => ({
        ...badge,
        earned: earnedBadgeIds.has(badge.id),
      }))
    : earnedBadges.map((badge) => ({ ...badge, earned: true }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Badge Notification */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-4 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold">New Badge Earned!</p>
                <p className="text-sm">{newBadge}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayBadges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`relative group`}
          >
            <div
              className={`
                p-4 rounded-lg border-2 transition-all duration-300
                ${
                  'earned' in badge && badge.earned
                    ? `${rarityBorderColors[badge.rarity as keyof typeof rarityBorderColors]} bg-white shadow-md hover:shadow-lg`
                    : 'border-gray-300 bg-gray-100 opacity-50'
                }
              `}
            >
              {/* Badge Icon */}
              <div className="text-4xl text-center mb-2">{badge.icon}</div>

              {/* Badge Name */}
              <h3 className="text-sm font-bold text-center text-gray-800 mb-1">
                {badge.name}
              </h3>

              {/* Rarity Indicator */}
              <div
                className={`
                  text-xs text-center font-semibold py-1 rounded
                  bg-gradient-to-r ${rarityColors[badge.rarity as keyof typeof rarityColors]}
                  text-white
                `}
              >
                {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
                  <p className="font-bold mb-1">{badge.name}</p>
                  <p className="text-gray-300">{badge.description}</p>
                  {badge.earnedAt && (
                    <p className="text-gray-400 mt-2 text-xs">
                      Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Locked Overlay */}
              {'earned' in badge && !badge.earned && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75 rounded-lg">
                  <span className="text-3xl">🔒</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {!showAll && earnedBadges.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">No badges earned yet!</p>
          <p className="text-gray-500">
            Complete challenges to earn your first badge.
          </p>
        </div>
      )}

      {/* Check Badges Button (for testing) */}
      {userId && (
        <div className="text-center">
          <button
            onClick={checkForNewBadges}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Check for New Badges
          </button>
        </div>
      )}
    </div>
  );
}
