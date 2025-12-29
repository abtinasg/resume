'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, FileText, CheckSquare, Award } from 'lucide-react';

interface ScoreDimension {
  name: string;
  score: number;
  max: number;
  icon: React.ReactNode;
  color: string;
}

interface ResumeScoreData {
  resume_score: number;
  level: string;
  dimensions: {
    content_quality: number;
    ats_compatibility: number;
    impact_metrics: number;
    professional_presentation: number;
  };
  strengths?: string[];
  weak_bullets?: Array<{ original: string; issue: string }>;
}

interface ResumeScoreCardProps {
  resumeContent?: string;
  userId: string;
  previousScore?: number;
}

export function ResumeScoreCard({ resumeContent, userId, previousScore }: ResumeScoreCardProps) {
  const [scoreData, setScoreData] = useState<ResumeScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resumeContent && userId) {
      fetchScore();
    }
  }, [resumeContent, userId]);

  const fetchScore = async () => {
    if (!resumeContent) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeContent, userId }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to analyze resume');
      }
      
      const data = await res.json();
      if (data.success && data.evaluation) {
        setScoreData({
          resume_score: data.evaluation.resume_score,
          level: data.evaluation.level,
          dimensions: data.evaluation.dimensions || {
            content_quality: 70,
            ats_compatibility: 75,
            impact_metrics: 65,
            professional_presentation: 80,
          },
          strengths: data.evaluation.strengths,
          weak_bullets: data.evaluation.weak_bullets,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load score');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number): string => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getTrendIcon = () => {
    if (!previousScore || !scoreData) return null;
    const diff = scoreData.resume_score - previousScore;
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (diff < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const dimensions: ScoreDimension[] = scoreData ? [
    {
      name: 'Content Quality',
      score: scoreData.dimensions.content_quality,
      max: 100,
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-blue-500',
    },
    {
      name: 'ATS Compatibility',
      score: scoreData.dimensions.ats_compatibility,
      max: 100,
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'bg-purple-500',
    },
    {
      name: 'Impact & Metrics',
      score: scoreData.dimensions.impact_metrics,
      max: 100,
      icon: <Target className="w-4 h-4" />,
      color: 'bg-indigo-500',
    },
    {
      name: 'Presentation',
      score: scoreData.dimensions.professional_presentation,
      max: 100,
      icon: <Award className="w-4 h-4" />,
      color: 'bg-teal-500',
    },
  ] : [];

  if (loading) {
    return (
      <Card className="!bg-white">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
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

  if (!scoreData) {
    return (
      <Card className="!bg-gradient-to-br !from-gray-50 !to-gray-100">
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No Resume Score Available</p>
          <p className="text-gray-500 text-sm mt-1">Upload a resume to see your score</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="!bg-white hover:!shadow-xl transition-all duration-300">
      <div className="space-y-6">
        {/* Header with Score */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Resume Score</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={scoreData.resume_score >= 80 ? 'low' : scoreData.resume_score >= 60 ? 'medium' : 'high'}>
                {scoreData.level}
              </Badge>
              {getTrendIcon()}
              {previousScore && scoreData.resume_score !== previousScore && (
                <span className={`text-xs ${scoreData.resume_score > previousScore ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreData.resume_score > previousScore ? '+' : ''}{scoreData.resume_score - previousScore} pts
                </span>
              )}
            </div>
          </div>
          
          {/* Circular Score Display */}
          <div className="relative">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getScoreGradient(scoreData.resume_score)} flex items-center justify-center shadow-lg`}>
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(scoreData.resume_score)}`}>
                  {Math.round(scoreData.resume_score)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dimension Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Score Breakdown</p>
          {dimensions.map((dim, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  {dim.icon}
                  <span>{dim.name}</span>
                </div>
                <span className="font-medium text-gray-800">{dim.score}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${dim.color} rounded-full transition-all duration-500`}
                  style={{ width: `${(dim.score / dim.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Strengths Preview */}
        {scoreData.strengths && scoreData.strengths.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Top Strengths</p>
            <ul className="space-y-1">
              {scoreData.strengths.slice(0, 3).map((strength, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="line-clamp-1">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Issues Preview */}
        {scoreData.weak_bullets && scoreData.weak_bullets.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Areas to Improve</p>
            <p className="text-sm text-gray-500">
              {scoreData.weak_bullets.length} bullet{scoreData.weak_bullets.length !== 1 ? 's' : ''} need attention
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
