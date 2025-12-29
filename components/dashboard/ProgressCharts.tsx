'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface ScoreHistoryEntry {
  date: string;
  score: number;
}

interface MetricsData {
  applications: {
    total_applications: number;
    interviews_received: number;
    offers_received: number;
    conversion_rates: {
      interview_rate: number;
      offer_rate: number;
    };
  };
  resume: {
    initial_score: number;
    current_score: number;
    improvement_percentage: number;
    score_history: ScoreHistoryEntry[];
  };
}

interface ProgressChartsProps {
  userId: string;
}

export function ProgressCharts({ userId }: ProgressChartsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      <Card className="!bg-white">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </Card>
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

  return (
    <Card className="!bg-white hover:!shadow-xl transition-all duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Progress & Analytics</h3>
              <p className="text-sm text-gray-500">Track your improvement over time</p>
            </div>
          </div>
          
          {/* Period Selector */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(['weekly', 'monthly', 'all_time'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  period === p 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {p === 'weekly' ? 'Week' : p === 'monthly' ? 'Month' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {!isCollapsed && metrics && (
          <>
            {/* Score Trend Chart */}
            <div className="pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Resume Score Trend</h4>
              <div className="relative h-32">
                <ScoreTrendChart data={metrics.resume.score_history} />
              </div>
              {metrics.resume.improvement_percentage > 0 && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium">
                    +{metrics.resume.improvement_percentage.toFixed(1)}% improvement
                  </span>
                  <span className="text-gray-500">since first analysis</span>
                </div>
              )}
            </div>

            {/* Application Funnel */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Application Funnel</h4>
              <ApplicationFunnel 
                applications={metrics.applications.total_applications}
                interviews={metrics.applications.interviews_received}
                offers={metrics.applications.offers_received}
                interviewRate={metrics.applications.conversion_rates.interview_rate}
                offerRate={metrics.applications.conversion_rates.offer_rate}
              />
            </div>

            {/* Quick Metrics Grid */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricItem 
                label="Interview Rate" 
                value={`${(metrics.applications.conversion_rates.interview_rate * 100).toFixed(0)}%`}
                color="text-blue-600"
              />
              <MetricItem 
                label="Offer Rate" 
                value={`${(metrics.applications.conversion_rates.offer_rate * 100).toFixed(0)}%`}
                color="text-green-600"
              />
              <MetricItem 
                label="Current Score" 
                value={metrics.resume.current_score.toString()}
                color="text-purple-600"
              />
              <MetricItem 
                label="Applications" 
                value={metrics.applications.total_applications.toString()}
                color="text-teal-600"
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

interface ScoreTrendChartProps {
  data: ScoreHistoryEntry[];
}

function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p className="text-sm">No score history available</p>
      </div>
    );
  }

  const maxScore = Math.max(...data.map(d => d.score), 100);
  const minScore = Math.min(...data.map(d => d.score), 0);
  // When all scores are identical, range would be 0, so default to 1 for division safety
  const range = maxScore - minScore || 1;

  return (
    <div className="h-full flex items-end gap-1">
      {data.slice(-12).map((entry, idx, arr) => {
        const height = ((entry.score - minScore) / range) * 100;
        const isLast = idx === arr.length - 1;
        
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
          </div>
        );
      })}
    </div>
  );
}

interface ApplicationFunnelProps {
  applications: number;
  interviews: number;
  offers: number;
  interviewRate: number;
  offerRate: number;
}

function ApplicationFunnel({ applications, interviews, offers, interviewRate, offerRate }: ApplicationFunnelProps) {
  const maxWidth = 100;
  const interviewWidth = applications > 0 ? (interviews / applications) * maxWidth : 0;
  const offerWidth = interviews > 0 ? (offers / interviews) * interviewWidth : 0;

  return (
    <div className="space-y-2">
      <FunnelBar 
        label="Applications" 
        value={applications} 
        width={maxWidth} 
        color="bg-blue-500"
      />
      <FunnelBar 
        label="Interviews" 
        value={interviews} 
        width={Math.max(interviewWidth, applications > 0 ? 10 : 0)} 
        color="bg-indigo-500"
        rate={interviewRate}
      />
      <FunnelBar 
        label="Offers" 
        value={offers} 
        width={Math.max(offerWidth, interviews > 0 ? 5 : 0)} 
        color="bg-green-500"
        rate={offerRate}
      />
    </div>
  );
}

interface FunnelBarProps {
  label: string;
  value: number;
  width: number;
  color: string;
  rate?: number;
}

function FunnelBar({ label, value, width, color, rate }: FunnelBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-24">{label}</span>
      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 flex items-center justify-end pr-2`}
          style={{ width: `${width}%` }}
        >
          {width > 20 && (
            <span className="text-xs text-white font-medium">{value}</span>
          )}
        </div>
      </div>
      <span className="text-sm text-gray-800 font-medium w-8">{value}</span>
      {rate !== undefined && (
        <span className="text-xs text-gray-500 w-12">({(rate * 100).toFixed(0)}%)</span>
      )}
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  color: string;
}

function MetricItem({ label, value, color }: MetricItemProps) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
