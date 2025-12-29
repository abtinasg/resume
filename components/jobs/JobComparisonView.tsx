'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { X, Loader2, Check, X as XIcon } from 'lucide-react';
import { RankedJob } from './JobCard';

interface JobComparisonViewProps {
  jobs: RankedJob[];
  userId: string;
  onClose: () => void;
}

interface ComparisonResult {
  jobs: Array<{
    job_id: string;
    job_title: string;
    company: string;
    fit_score: number;
  }>;
  comparison_matrix: {
    fit_scores: number[];
    skill_matches: number[];
    experience_fits: number[];
    overall_recommendation: string;
    unique_requirements: Record<string, string[]>;
    difficulty_ranking: string[];
  };
  best_fit_job_id: string;
  recommendation: string;
}

export function JobComparisonView({ jobs, userId, onClose }: JobComparisonViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    fetchComparison();
  }, [jobs]);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/jobs/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          job_ids: jobs.map(j => j.job_id),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to compare jobs');
      }

      const data = await res.json();
      if (data.success && data.comparison) {
        setComparison(data.comparison);
      } else {
        // Use local comparison if API fails
        setComparison(generateLocalComparison(jobs));
      }
    } catch {
      // Use local comparison as fallback
      setComparison(generateLocalComparison(jobs));
    } finally {
      setLoading(false);
    }
  };

  const generateLocalComparison = (jobs: RankedJob[]): ComparisonResult => {
    const sortedByScore = [...jobs].sort((a, b) => b.fit_score - a.fit_score);
    
    return {
      jobs: jobs.map(j => ({
        job_id: j.job_id,
        job_title: j.job_title,
        company: j.company,
        fit_score: j.fit_score,
      })),
      comparison_matrix: {
        fit_scores: jobs.map(j => j.fit_score),
        skill_matches: jobs.map(j => j.score_breakdown?.skills_match ?? j.fit_score),
        experience_fits: jobs.map(j => j.score_breakdown?.experience_fit ?? j.fit_score),
        overall_recommendation: `Based on fit scores, ${sortedByScore[0].job_title} at ${sortedByScore[0].company} appears to be the best match.`,
        unique_requirements: {},
        difficulty_ranking: sortedByScore.map(j => j.job_title),
      },
      best_fit_job_id: sortedByScore[0].job_id,
      recommendation: `We recommend focusing on ${sortedByScore[0].job_title} at ${sortedByScore[0].company} as your primary target.`,
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const isBestFit = (jobId: string) => comparison?.best_fit_job_id === jobId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Job Comparison</h2>
              <p className="text-sm text-gray-500">{jobs.length} jobs selected</p>
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
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          {comparison && !loading && (
            <div className="space-y-6">
              {/* Recommendation Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2">Our Recommendation</h3>
                <p className="text-blue-800">{comparison.recommendation}</p>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-600 bg-gray-50">
                        Criteria
                      </th>
                      {jobs.map((job) => (
                        <th 
                          key={job.job_id} 
                          className={`p-3 text-center text-sm font-medium bg-gray-50 ${
                            isBestFit(job.job_id) ? 'text-blue-600' : 'text-gray-800'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {isBestFit(job.job_id) && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Best Fit
                              </span>
                            )}
                            <span className="font-semibold">{job.job_title}</span>
                            <span className="text-xs text-gray-500">{job.company}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Fit Score Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-700">
                        Overall Fit Score
                      </td>
                      {jobs.map((job) => (
                        <td key={job.job_id} className="p-3 text-center">
                          <div className="inline-flex items-center justify-center">
                            <div className={`w-12 h-12 rounded-full ${getScoreColor(job.fit_score)} text-white flex items-center justify-center font-bold`}>
                              {job.fit_score}
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Skills Match Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-700">
                        Skills Match
                      </td>
                      {jobs.map((job) => (
                        <td key={job.job_id} className="p-3">
                          <ComparisonBar value={job.score_breakdown?.skills_match ?? job.fit_score} />
                        </td>
                      ))}
                    </tr>

                    {/* Experience Fit Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-700">
                        Experience Fit
                      </td>
                      {jobs.map((job) => (
                        <td key={job.job_id} className="p-3">
                          <ComparisonBar value={job.score_breakdown?.experience_fit ?? job.fit_score} />
                        </td>
                      ))}
                    </tr>

                    {/* Seniority Fit Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-700">
                        Seniority Fit
                      </td>
                      {jobs.map((job) => (
                        <td key={job.job_id} className="p-3">
                          <ComparisonBar value={job.score_breakdown?.seniority_fit ?? job.fit_score} />
                        </td>
                      ))}
                    </tr>

                    {/* Should Apply Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-700">
                        Recommended to Apply
                      </td>
                      {jobs.map((job) => (
                        <td key={job.job_id} className="p-3 text-center">
                          {job.should_apply ? (
                            <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                              <Check className="w-5 h-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                              <XIcon className="w-5 h-5 text-red-600" />
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Category Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-700">
                        Category
                      </td>
                      {jobs.map((job) => (
                        <td key={job.job_id} className="p-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            job.category === 'target' ? 'bg-green-100 text-green-800' :
                            job.category === 'reach' ? 'bg-purple-100 text-purple-800' :
                            job.category === 'safety' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Overall Analysis */}
              {comparison.comparison_matrix.overall_recommendation && (
                <Card className="!bg-gray-50">
                  <h3 className="font-semibold text-gray-800 mb-2">Analysis</h3>
                  <p className="text-gray-700">{comparison.comparison_matrix.overall_recommendation}</p>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ComparisonBarProps {
  value: number;
}

function ComparisonBar({ value }: ComparisonBarProps) {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-green-500';
    if (v >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${getColor(value)} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700 w-10 text-right">{value}%</span>
    </div>
  );
}
