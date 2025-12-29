'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import {
  Users,
  FileText,
  Award,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    newUsersLast24h: number;
    newUsersLast7d: number;
    newUsersLast30d: number;
    totalResumes: number;
    resumesLast24h: number;
    resumesLast7d: number;
    totalBadgesEarned: number;
    badgesEarnedLast7d: number;
    totalEvents: number;
    eventsLast24h: number;
    exitFeedbackCount: number;
  };
  resumeStats: {
    average: number;
    highest: number;
    lowest: number;
  };
  eventStats: Array<{ event: string; count: number }>;
  topUsers: Array<{
    id: number;
    email: string;
    name: string;
    resumeCount: number;
    badgeCount: number;
  }>;
  recentFeedback: Array<{
    id: number;
    rating: number | null;
    likelihoodToReturn: number | null;
    reason: string | null;
    comment: string | null;
    createdAt: string;
    user: { email: string; name: string | null } | null;
  }>;
}

export default function AdminOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (response.ok) {
          const analyticsData = await response.json();
          setData(analyticsData);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load analytics data</p>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    change,
    changeLabel,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number;
    change?: number;
    changeLabel?: string;
    icon: any;
    color: string;
  }) => (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {change >= 0 ? (
                <TrendingUp size={16} className="text-green-600" />
              ) : (
                <TrendingDown size={16} className="text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change >= 0 ? '+' : ''}
                {change} {changeLabel}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analytics Overview
        </h2>
        <p className="text-gray-600">
          Real-time insights into your platform activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={data.overview.totalUsers}
          change={data.overview.newUsersLast24h}
          changeLabel="last 24h"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Resumes"
          value={data.overview.totalResumes}
          change={data.overview.resumesLast24h}
          changeLabel="last 24h"
          icon={FileText}
          color="bg-green-500"
        />
        <StatCard
          title="Badges Earned"
          value={data.overview.totalBadgesEarned}
          change={data.overview.badgesEarnedLast7d}
          changeLabel="last 7d"
          icon={Award}
          color="bg-purple-500"
        />
        <StatCard
          title="Events Tracked"
          value={data.overview.totalEvents}
          change={data.overview.eventsLast24h}
          changeLabel="last 24h"
          icon={Activity}
          color="bg-orange-500"
        />
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="User Growth">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last 24 hours</span>
              <span className="font-semibold text-green-600">
                +{data.overview.newUsersLast24h}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last 7 days</span>
              <span className="font-semibold text-green-600">
                +{data.overview.newUsersLast7d}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last 30 days</span>
              <span className="font-semibold text-green-600">
                +{data.overview.newUsersLast30d}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Resume Analysis Stats">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Score</span>
              <span className="font-semibold text-blue-600">
                {data.resumeStats.average}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Highest Score</span>
              <span className="font-semibold text-green-600">
                {data.resumeStats.highest}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Lowest Score</span>
              <span className="font-semibold text-orange-600">
                {data.resumeStats.lowest}%
              </span>
            </div>
          </div>
        </Card>

        <Card title="Exit Feedback">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Submissions</span>
              <span className="font-semibold">
                {data.overview.exitFeedbackCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Recent (last 5)</span>
              <span className="font-semibold">{data.recentFeedback.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Stats */}
      <Card title="Event Breakdown (Top 10)">
        <div className="space-y-2">
          {data.eventStats.map((event, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-700 font-medium">{event.event}</span>
              <span className="text-gray-900 font-semibold">{event.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Users */}
      <Card title="Top Users by Resume Count">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Resumes
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Badges
                </th>
              </tr>
            </thead>
            <tbody>
              {data.topUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.name}</td>
                  <td className="py-3 px-4 text-sm text-center font-semibold text-green-600">
                    {user.resumeCount}
                  </td>
                  <td className="py-3 px-4 text-sm text-center font-semibold text-purple-600">
                    {user.badgeCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Feedback */}
      <Card title="Recent Exit Feedback">
        <div className="space-y-4">
          {data.recentFeedback.map((feedback) => (
            <div
              key={feedback.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {feedback.user?.name || feedback.user?.email || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  {feedback.rating && (
                    <span className="text-gray-600">
                      Rating: <strong>{feedback.rating}/5</strong>
                    </span>
                  )}
                  {feedback.likelihoodToReturn && (
                    <span className="text-gray-600">
                      Return: <strong>{feedback.likelihoodToReturn}/5</strong>
                    </span>
                  )}
                </div>
              </div>
              {feedback.reason && (
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Reason:</strong> {feedback.reason}
                </p>
              )}
              {feedback.comment && (
                <p className="text-sm text-gray-600 italic">&quot;{feedback.comment}&quot;</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
