'use client';

import { X, MapPin, Building2, ExternalLink, Clock, DollarSign, Briefcase } from 'lucide-react';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { RankedJob } from './JobCard';

interface JobDetailsModalProps {
  job: RankedJob | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JobDetailsModal({ job, isOpen, onClose }: JobDetailsModalProps) {
  if (!isOpen || !job) return null;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      reach: 'bg-purple-100 text-purple-800',
      target: 'bg-green-100 text-green-800',
      safety: 'bg-blue-100 text-blue-800',
      avoid: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-xl font-bold text-gray-800 truncate">{job.job_title}</h2>
              <div className="flex items-center gap-3 mt-2 text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {job.company}
                </span>
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Score and Category */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Fit Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(job.fit_score)}`}>
                {job.fit_score}
              </p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(job.category)}`}>
                  {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
                </span>
                {job.work_arrangement && (
                  <Badge variant="default">
                    <Clock className="w-3 h-3 mr-1" />
                    {job.work_arrangement}
                  </Badge>
                )}
              </div>
              {job.category_reasoning && (
                <p className="text-sm text-gray-600">{job.category_reasoning}</p>
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          {job.score_breakdown && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Fit Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <ScoreItem label="Skills Match" value={job.score_breakdown.skills_match} />
                <ScoreItem label="Experience Fit" value={job.score_breakdown.experience_fit} />
                <ScoreItem label="Seniority Fit" value={job.score_breakdown.seniority_fit} />
                <ScoreItem label="Location Fit" value={job.score_breakdown.location_fit} />
              </div>
            </div>
          )}

          {/* Salary Range */}
          {job.salary_range && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">
                  {job.salary_range.currency}{job.salary_range.min.toLocaleString()} - {job.salary_range.currency}{job.salary_range.max.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Career Capital */}
          {job.career_capital && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Career Value</h3>
              <div className="space-y-3">
                {job.career_capital.skills_gain.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Skills You&apos;ll Gain</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {job.career_capital.skills_gain.map((skill, idx) => (
                        <Badge key={idx} variant="content">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Growth Potential</p>
                    <p className="font-medium text-gray-800">{job.career_capital.growth_potential}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Market Value Impact</p>
                    <p className="font-medium text-gray-800">{job.career_capital.market_value_impact}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Insights */}
          {job.quick_insights && job.quick_insights.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Key Insights</h3>
              <div className="space-y-2">
                {job.quick_insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <span>💡</span>
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags/Warnings */}
          {job.flags && job.flags.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Things to Note</h3>
              <div className="space-y-2">
                {job.flags.map((flag, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-sm text-amber-800">
                    <span>⚠️</span>
                    <div>
                      <p className="font-medium">{flag.type}</p>
                      <p className="text-amber-700">{flag.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 flex gap-3">
          {job.should_apply && job.metadata?.job_url && (
            <Button
              className="flex-1"
              onClick={() => window.open(job.metadata?.job_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Apply Now
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ScoreItemProps {
  label: string;
  value: number;
}

function ScoreItem({ label, value }: ScoreItemProps) {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-green-500';
    if (v >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${getColor(value)}`} style={{ width: `${value}%` }} />
        </div>
        <span className="text-sm font-medium text-gray-800 w-10 text-right">{value}%</span>
      </div>
    </div>
  );
}
