'use client';

import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { MapPin, Building2, Clock, ExternalLink, AlertTriangle, HelpCircle } from 'lucide-react';

export interface RankedJob {
  job_id: string;
  job_title: string;
  company: string;
  location?: string;
  work_arrangement?: string;
  fit_score: number;
  category: 'reach' | 'target' | 'safety' | 'avoid';
  category_reasoning?: string;
  should_apply: boolean;
  application_priority?: number;
  score_breakdown?: {
    skills_match: number;
    experience_fit: number;
    seniority_fit: number;
    location_fit: number;
  };
  flags?: Array<{ type: string; message: string }>;
  quick_insights?: string[];
  career_capital?: {
    skills_gain: string[];
    growth_potential: string;
    market_value_impact: string;
  };
  scam_detection?: {
    risk_level: string;
    red_flags: string[];
  };
  requirements?: string[];
  salary_range?: { min: number; max: number; currency: string };
  metadata?: { job_url?: string };
}

interface JobCardProps {
  job: RankedJob;
  isSelected?: boolean;
  onSelect?: () => void;
  onViewDetails?: () => void;
  onExplain?: () => void;
}

export function JobCard({ job, isSelected, onSelect, onViewDetails, onExplain }: JobCardProps) {
  const getCategoryBadge = () => {
    const variants: Record<string, { variant: 'high' | 'medium' | 'low' | 'default'; label: string }> = {
      reach: { variant: 'high', label: 'Reach' },
      target: { variant: 'medium', label: 'Target' },
      safety: { variant: 'low', label: 'Safety' },
      avoid: { variant: 'default', label: 'Avoid' },
    };
    const cat = variants[job.category] || variants.target;
    return <Badge variant={cat.variant}>{cat.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const hasWarnings = (job.scam_detection?.red_flags?.length ?? 0) > 0 || job.category === 'avoid';

  return (
    <Card className={`!bg-white hover:!shadow-xl transition-all duration-300 ${
      isSelected ? '!border-blue-400 !ring-2 !ring-blue-200' : ''
    }`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={onSelect}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{job.job_title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{job.company}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Score Circle */}
          <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${getScoreColor(job.fit_score)}`}>
            <span className="text-lg font-bold">{job.fit_score}</span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
          )}
          {job.work_arrangement && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {job.work_arrangement}
            </span>
          )}
          {getCategoryBadge()}
        </div>

        {/* Score Breakdown */}
        {job.score_breakdown && (
          <div className="grid grid-cols-4 gap-2 text-xs">
            <ScoreBar label="Skills" value={job.score_breakdown.skills_match} />
            <ScoreBar label="Experience" value={job.score_breakdown.experience_fit} />
            <ScoreBar label="Seniority" value={job.score_breakdown.seniority_fit} />
            <ScoreBar label="Location" value={job.score_breakdown.location_fit} />
          </div>
        )}

        {/* Quick Insights */}
        {job.quick_insights && job.quick_insights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.quick_insights.slice(0, 3).map((insight, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                {insight}
              </span>
            ))}
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="text-amber-700">
              {job.category === 'avoid' 
                ? 'This job may not be a good fit' 
                : 'Some concerns detected'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {job.should_apply && (
            <Button 
              className="flex-1"
              onClick={() => job.metadata?.job_url && window.open(job.metadata.job_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Apply
            </Button>
          )}
          <Button variant="secondary" onClick={onViewDetails} className="flex-1">
            View Details
          </Button>
          {onExplain && (
            <button
              onClick={onExplain}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Why this ranking?"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
}

function ScoreBar({ label, value }: ScoreBarProps) {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-green-500';
    if (v >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="text-center">
      <p className="text-gray-500 mb-1">{label}</p>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-gray-700 font-medium mt-1">{value}%</p>
    </div>
  );
}
