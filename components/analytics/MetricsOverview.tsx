'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import { TrendingUp, Download, Calendar } from 'lucide-react';

interface MetricsOverviewProps {
  userId: string;
}

interface MetricsData {
  applications: {
    total_applications: number;
    interviews_received: number;
    offers_received: number;
    avg_days_to_response: number;
    conversion_rates: {
      interview_rate: number;
      offer_rate: number;
      overall_conversion_rate: number;
    };
  };
  resume: {
    initial_score: number;
    current_score: number;
    improvement_percentage: number;
    rewrites_applied: number;
    score_history: Array<{ date: string; score: number }>;
  };
  strategy: {
    outcomes_per_mode: Array<{
      mode: string;
      applications_count: number;
      interviews_count: number;
      offers_count: number;
      interview_rate: number;
      avg_time_in_mode_days: number;
    }>;
    avg_time_in_mode: number;
    mode_transitions: Array<{
      from: string;
      to: string;
      changed_at: string;
      reason: string;
    }>;
  };
}

export function MetricsOverview({ userId }: MetricsOverviewProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('monthly');

  useEffect(() => {
    fetchMetrics();
  }, [userId, period]);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/analytics/metrics?user_id=${userId}&period=${period}`);
      
      if (!res.ok) {
        throw new Error('Failed to load metrics');
      }
      
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="!bg-white">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="!bg-red-50 !border-red-200">
        <div className="text-center py-4">
          <p className="text-red-700">{error}</p>
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="!bg-gray-50">
        <div className="text-center py-8">
          <p className="text-gray-500">No metrics available yet</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700 font-medium">Time Period</span>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['weekly', 'monthly', 'all_time'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                period === p 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {p === 'weekly' ? 'Week' : p === 'monthly' ? 'Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Applications"
          value={metrics.applications.total_applications}
          color="blue"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          label="Interview Rate"
          value={`${(metrics.applications.conversion_rates.interview_rate * 100).toFixed(1)}%`}
          color="green"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          label="Current Resume Score"
          value={metrics.resume.current_score}
          color="purple"
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle={`+${metrics.resume.improvement_percentage.toFixed(1)}% improvement`}
        />
        <MetricCard
          label="Avg Days to Response"
          value={metrics.applications.avg_days_to_response.toFixed(1)}
          color="orange"
          icon={<Calendar className="w-5 h-5" />}
          subtitle="days"
        />
      </div>

      {/* Application Funnel */}
      <Card className="!bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Funnel</h3>
        <div className="space-y-4">
          <FunnelRow 
            label="Applications" 
            value={metrics.applications.total_applications} 
            total={metrics.applications.total_applications}
            color="bg-blue-500"
          />
          <FunnelRow 
            label="Interviews" 
            value={metrics.applications.interviews_received} 
            total={metrics.applications.total_applications}
            color="bg-indigo-500"
          />
          <FunnelRow 
            label="Offers" 
            value={metrics.applications.offers_received} 
            total={metrics.applications.total_applications}
            color="bg-green-500"
          />
        </div>
      </Card>

      {/* Score History Chart */}
      <Card className="!bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resume Score Trend</h3>
        <ScoreChart data={metrics.resume.score_history} />
      </Card>

      {/* Strategy Performance */}
      {metrics.strategy.outcomes_per_mode.length > 0 && (
        <Card className="!bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Strategy Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Mode</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Applications</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Interviews</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Offers</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Interview Rate</th>
                </tr>
              </thead>
              <tbody>
                {metrics.strategy.outcomes_per_mode.map((outcome, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 text-sm font-medium text-gray-800">
                      {outcome.mode.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-center">{outcome.applications_count}</td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-center">{outcome.interviews_count}</td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-center">{outcome.offers_count}</td>
                    <td className="py-3 px-3 text-sm text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        outcome.interview_rate > 0.2 ? 'bg-green-100 text-green-800' :
                        outcome.interview_rate > 0.1 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(outcome.interview_rate * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  icon: React.ReactNode;
  subtitle?: string;
}

function MetricCard({ label, value, color, icon, subtitle }: MetricCardProps) {
  const colors = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
  };

  return (
    <Card className={`!bg-gradient-to-br ${colors[color]} !border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${colors[color].split(' ').slice(-1)}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-white/50 ${colors[color].split(' ').slice(-1)}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface FunnelRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function FunnelRow({ label, value, total, color }: FunnelRowProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-4">
      <span className="w-24 text-sm text-gray-600">{label}</span>
      <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
        <div 
          className={`h-full ${color} flex items-center justify-end px-3 transition-all`}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        >
          {percentage > 15 && (
            <span className="text-white text-sm font-medium">{value}</span>
          )}
        </div>
      </div>
      <span className="w-16 text-sm font-medium text-gray-800 text-right">
        {value} ({percentage.toFixed(0)}%)
      </span>
    </div>
  );
}

interface ScoreChartProps {
  data: Array<{ date: string; score: number }>;
}

function ScoreChart({ data }: ScoreChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400">
        <p>No score history available</p>
      </div>
    );
  }

  const maxScore = Math.max(...data.map(d => d.score), 100);
  const minScore = Math.min(...data.map(d => d.score), 0);
  const range = maxScore - minScore || 1;

  return (
    <div className="h-40 flex items-end gap-2">
      {data.slice(-14).map((entry, idx, arr) => {
        const height = ((entry.score - minScore) / range) * 100;
        const isLast = idx === arr.length - 1;
        const date = new Date(entry.date);
        
        return (
          <div 
            key={idx} 
            className="flex-1 flex flex-col items-center group"
          >
            <div 
              className={`w-full rounded-t transition-all duration-300 ${
                isLast 
                  ? 'bg-gradient-to-t from-blue-500 to-indigo-500' 
                  : 'bg-blue-200 group-hover:bg-blue-300'
              }`}
              style={{ height: `${Math.max(height, 5)}%` }}
            />
            <div className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {entry.score}
            </div>
            <div className="text-[8px] text-gray-300">
              {date.getMonth() + 1}/{date.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
