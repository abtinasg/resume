'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import {
  Trophy,
  Lock,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Star,
  Zap,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Achievement {
  badge: {
    id: number;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    criteria: string;
  };
  earned: boolean;
  earnedAt: string | null;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

interface AchievementsSummary {
  total: number;
  earned: number;
  completionRate: number;
}

export default function AchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [summary, setSummary] = useState<AchievementsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/achievements');
    } else if (status === 'authenticated') {
      fetchAchievements();
    }
  }, [status]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/achievements');
      const data = await response.json();

      if (response.ok) {
        setAchievements(data.achievements || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-gray-100 text-gray-700 border-gray-300',
      rare: 'bg-blue-100 text-blue-700 border-blue-300',
      epic: 'bg-purple-100 text-purple-700 border-purple-300',
      legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    return colors[rarity.toLowerCase()] || colors.common;
  };

  const getRarityIcon = (rarity: string) => {
    const icons: Record<string, JSX.Element> = {
      common: <Star className="w-4 h-4" />,
      rare: <Sparkles className="w-4 h-4" />,
      epic: <Trophy className="w-4 h-4" />,
      legendary: <Award className="w-4 h-4" />,
    };
    return icons[rarity.toLowerCase()] || icons.common;
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      trophy: <Trophy className="w-12 h-12" />,
      target: <Target className="w-12 h-12" />,
      'trending-up': <TrendingUp className="w-12 h-12" />,
      zap: <Zap className="w-12 h-12" />,
      award: <Award className="w-12 h-12" />,
      sparkles: <Sparkles className="w-12 h-12" />,
      star: <Star className="w-12 h-12" />,
      'check-circle': <CheckCircle className="w-12 h-12" />,
    };
    return icons[iconName] || <Trophy className="w-12 h-12" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === 'earned') return achievement.earned;
    if (filter === 'locked') return !achievement.earned;
    return true;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2">
            <Trophy className="w-4 h-4 inline mr-2" />
            Your Progress
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Achievements
            </span>{' '}
            Gallery
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track your progress and unlock badges as you improve your resume
          </p>
        </motion.div>

        {/* Summary */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <Card className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo-600 mb-2">
                    {summary.earned}
                  </div>
                  <div className="text-gray-600">Badges Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {summary.completionRate}%
                  </div>
                  <div className="text-gray-600">Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {summary.total - summary.earned}
                  </div>
                  <div className="text-gray-600">Remaining</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm font-medium text-gray-700">{summary.completionRate}%</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${summary.completionRate}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-4 mb-8"
        >
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({achievements.length})
          </Button>
          <Button
            variant={filter === 'earned' ? 'primary' : 'outline'}
            onClick={() => setFilter('earned')}
          >
            Earned ({achievements.filter((a) => a.earned).length})
          </Button>
          <Button
            variant={filter === 'locked' ? 'primary' : 'outline'}
            onClick={() => setFilter('locked')}
          >
            Locked ({achievements.filter((a) => !a.earned).length})
          </Button>
        </motion.div>

        {/* Achievements Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredAchievements.map((achievement, idx) => (
            <motion.div
              key={achievement.badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <Card
                className={`p-6 ${
                  achievement.earned
                    ? 'bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200'
                    : 'bg-gray-50 opacity-75'
                }`}
              >
                {/* Badge Icon */}
                <div
                  className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    achievement.earned
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {achievement.earned ? (
                    getIconComponent(achievement.badge.icon)
                  ) : (
                    <Lock className="w-12 h-12" />
                  )}
                </div>

                {/* Badge Name */}
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  {achievement.badge.name}
                </h3>

                {/* Rarity */}
                <div className="flex justify-center mb-3">
                  <Badge className={`${getRarityColor(achievement.badge.rarity)} flex items-center gap-1`}>
                    {getRarityIcon(achievement.badge.rarity)}
                    {achievement.badge.rarity}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-center text-sm mb-4">
                  {achievement.badge.description}
                </p>

                {/* Progress or Earned Date */}
                {achievement.earned ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Unlocked</span>
                    </div>
                    {achievement.earnedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(achievement.earnedAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    {achievement.progress ? (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress.current} / {achievement.progress.target}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-400 to-purple-500"
                            style={{ width: `${achievement.progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-gray-500">
                        Criteria: {achievement.badge.criteria}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <Card className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No achievements found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'earned'
                ? 'Start analyzing your resume to earn your first badge!'
                : 'All achievements unlocked!'}
            </p>
            {filter === 'earned' && (
              <Link href="/">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  Analyze Resume
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <Card className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Keep Improving!</h3>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Upload your resume regularly to track your progress and unlock more achievements
            </p>
            <Link href="/">
              <Button className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold">
                Analyze Resume
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
