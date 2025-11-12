'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, Users } from 'lucide-react';

interface TrackingData {
  overview: {
    totalVersions: number;
    totalScoreRecords: number;
    avgImprovement: number;
    positiveImprovements: number;
    negativeImprovements: number;
  };
  recentVersions: Array<{
    id: number;
    version: number;
    score: number;
    createdAt: string;
    user: { id: number; email: string; name: string | null };
  }>;
  recentScoreHistory: Array<{
    id: number;
    score: number;
    previousScore: number | null;
    change: number | null;
    recordedAt: string;
    user: { id: number; email: string; name: string | null };
    resume: { id: number; fileName: string };
  }>;
  topUsers: Array<{
    user: { id: number; email: string; name: string | null } | undefined;
    versionCount: number;
  }>;
}

export default function ProgressTracking() {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracking();
  }, []);

  const fetchTracking = async () => {
    try {
      const response = await fetch('/api/admin/tracking');
      if (response.ok) {
        const trackingData = await response.json();
        setData(trackingData);
      }
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <p className="text-gray-600">Failed to load tracking data</p>
      </div>
    );
  }

  const improvementRate =
    data.overview.positiveImprovements + data.overview.negativeImprovements > 0
      ? (
          (data.overview.positiveImprovements /
            (data.overview.positiveImprovements +
              data.overview.negativeImprovements)) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Progress Tracking Overview
        </h2>
        <p className="text-gray-600">
          Monitor user resume improvements and version history
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Versions</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.overview.totalVersions}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <BarChart3 size={24} className="text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Score Records</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.overview.totalScoreRecords}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Improvement</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.overview.avgImprovement > 0 ? '+' : ''}
                {data.overview.avgImprovement}%
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                data.overview.avgImprovement >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {data.overview.avgImprovement >= 0 ? (
                <TrendingUp size={24} className="text-white" />
              ) : (
                <TrendingDown size={24} className="text-white" />
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Improvement Rate</p>
              <p className="text-3xl font-bold text-gray-900">{improvementRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500">
              <Users size={24} className="text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Improvement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Improvement Breakdown">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                <span className="text-gray-700">Positive Improvements</span>
              </div>
              <span className="font-semibold text-green-600">
                {data.overview.positiveImprovements}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingDown size={20} className="text-red-600" />
                <span className="text-gray-700">Negative Changes</span>
              </div>
              <span className="font-semibold text-red-600">
                {data.overview.negativeImprovements}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Success Rate</span>
                <span className="font-semibold text-blue-600">
                  {improvementRate}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Top Users by Version Count">
          <div className="space-y-2">
            {data.topUsers.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.user?.email || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.user?.name || 'N/A'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {item.versionCount} versions
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Score History */}
      <Card title="Recent Score Changes (Last 100)">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Resume
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Previous
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Current
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Change
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentScoreHistory.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {record.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.user.name || 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {record.resume.fileName}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">
                    {record.previousScore || '-'}
                  </td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-gray-900">
                    {record.score}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {record.change !== null && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          record.change > 0
                            ? 'bg-green-100 text-green-800'
                            : record.change < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {record.change > 0 ? (
                          <TrendingUp size={14} />
                        ) : record.change < 0 ? (
                          <TrendingDown size={14} />
                        ) : null}
                        {record.change > 0 ? '+' : ''}
                        {record.change}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(record.recordedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Versions */}
      <Card title="Recent Resume Versions (Last 100)">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  User
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Version #
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Score
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentVersions.map((version) => (
                <tr key={version.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {version.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {version.user.name || 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-blue-600">
                    v{version.version}
                  </td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-gray-900">
                    {version.score}%
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
