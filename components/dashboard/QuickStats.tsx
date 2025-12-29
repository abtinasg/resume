'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import { FileText, Target, Calendar, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  bgColor: string;
  iconBgColor: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, trend, color, bgColor, iconBgColor, onClick }: StatCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'text-green-500' : trend && trend < 0 ? 'text-red-500' : 'text-gray-400';

  return (
    <Card 
      className={`!${bgColor} hover:!shadow-xl transition-all duration-300 cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-xs ${trendColor}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconBgColor}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface QuickStatsProps {
  userId: string;
  currentScore?: number;
  resumeCount?: number;
}

export function QuickStats({ userId, currentScore, resumeCount = 0 }: QuickStatsProps) {
  const [stats, setStats] = useState({
    applicationsThisWeek: 0,
    interviewsScheduled: 0,
    tasksCompletedToday: 0,
    daysInMode: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch analytics metrics
      const metricsRes = await fetch(`/api/analytics/metrics?user_id=${userId}&period=weekly`);
      
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        if (metricsData.success && metricsData.metrics) {
          setStats(prev => ({
            ...prev,
            applicationsThisWeek: metricsData.metrics.applications?.total_applications || 0,
            interviewsScheduled: metricsData.metrics.applications?.interviews_received || 0,
          }));
        }
      }

      // Fetch daily plan for tasks completed
      const planRes = await fetch('/api/plan/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (planRes.ok) {
        const planData = await planRes.json();
        // Tasks are from the plan; for demo, assume none completed yet
        setStats(prev => ({
          ...prev,
          tasksCompletedToday: 0,
          daysInMode: 7, // Mock value for demo
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="!bg-white">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Resume Score"
        value={currentScore ?? '--'}
        icon={<FileText className="w-6 h-6 text-blue-600" />}
        trend={5}
        color="text-blue-700"
        bgColor="!bg-gradient-to-br !from-blue-50 !to-blue-100 !border-blue-200"
        iconBgColor="bg-blue-100"
      />
      
      <StatCard
        label="Applications This Week"
        value={stats.applicationsThisWeek}
        icon={<Target className="w-6 h-6 text-green-600" />}
        trend={12}
        color="text-green-700"
        bgColor="!bg-gradient-to-br !from-green-50 !to-emerald-100 !border-green-200"
        iconBgColor="bg-green-100"
      />
      
      <StatCard
        label="Interviews Scheduled"
        value={stats.interviewsScheduled}
        icon={<Calendar className="w-6 h-6 text-purple-600" />}
        color="text-purple-700"
        bgColor="!bg-gradient-to-br !from-purple-50 !to-purple-100 !border-purple-200"
        iconBgColor="bg-purple-100"
      />
      
      <StatCard
        label="Tasks Completed Today"
        value={`${stats.tasksCompletedToday}/5`}
        icon={<CheckCircle className="w-6 h-6 text-teal-600" />}
        color="text-teal-700"
        bgColor="!bg-gradient-to-br !from-teal-50 !to-teal-100 !border-teal-200"
        iconBgColor="bg-teal-100"
      />
    </div>
  );
}
