'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ResumeData {
  id: number;
  fileName: string;
  score: number;
  summary: string | null;
  data: any;
  version: number;
  createdAt: string;
}

interface ComparisonData {
  resume1: ResumeData;
  resume2: ResumeData;
  scoreDifference: number;
}

interface ComparisonViewProps {
  resumeId1: number;
  resumeId2: number;
  onClose?: () => void;
}

export default function ComparisonView({
  resumeId1,
  resumeId2,
  onClose,
}: ComparisonViewProps) {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComparison();
  }, [resumeId1, resumeId2]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/resumes/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId1, resumeId2 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch comparison');
      }

      const data = await res.json();
      setComparison(data.comparison);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreDiffColor = (diff: number) => {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="p-8">
        <p className="text-gray-600 text-center">No comparison data available</p>
      </div>
    );
  }

  const { resume1, resume2, scoreDifference } = comparison;

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Resume Comparison</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ✕ Close
            </button>
          )}
        </div>
        <p className="text-gray-600 mt-2">
          Side-by-side comparison of your resume versions
        </p>
      </div>

      {/* Score Difference Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
      >
        <div className="flex items-center justify-center gap-4">
          <span className="text-2xl">📊</span>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Score Difference</p>
            <p className={`text-3xl font-bold ${getScoreDiffColor(scoreDifference)}`}>
              {scoreDifference > 0 ? '+' : ''}
              {scoreDifference} points
            </p>
          </div>
          <span className="text-2xl">
            {scoreDifference > 0 ? '📈' : scoreDifference < 0 ? '📉' : '➡️'}
          </span>
        </div>
      </motion.div>

      {/* Side-by-Side Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Resume 1 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg border-2 border-gray-200 shadow-lg"
        >
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Version {resume1.version}</h3>
              <span className="text-xs text-gray-500">
                {new Date(resume1.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 truncate">{resume1.fileName}</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Score */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Overall Score</p>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${getScoreColor(resume1.score)}`}>
                  {resume1.score}
                </span>
                <span className="text-gray-500">/ 100</span>
              </div>
            </div>

            {/* Summary */}
            {resume1.summary && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Summary</p>
                <p className="text-sm text-gray-600 leading-relaxed">{resume1.summary}</p>
              </div>
            )}

            {/* Key Metrics */}
            {resume1.data?.scores && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Scores Breakdown</p>
                <div className="space-y-2">
                  {Object.entries(resume1.data.scores).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Items Count */}
            {resume1.data?.actionables && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Actionable Items</span>
                  <span className="text-lg font-bold text-blue-600">
                    {resume1.data.actionables.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Resume 2 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg border-2 border-blue-300 shadow-lg"
        >
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Version {resume2.version}</h3>
              <span className="text-xs text-gray-500">
                {new Date(resume2.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 truncate">{resume2.fileName}</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Score */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Overall Score</p>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${getScoreColor(resume2.score)}`}>
                  {resume2.score}
                </span>
                <span className="text-gray-500">/ 100</span>
                {scoreDifference !== 0 && (
                  <span
                    className={`text-sm font-semibold ${getScoreDiffColor(scoreDifference)}`}
                  >
                    ({scoreDifference > 0 ? '+' : ''}
                    {scoreDifference})
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
            {resume2.summary && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Summary</p>
                <p className="text-sm text-gray-600 leading-relaxed">{resume2.summary}</p>
              </div>
            )}

            {/* Key Metrics */}
            {resume2.data?.scores && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Scores Breakdown</p>
                <div className="space-y-2">
                  {Object.entries(resume2.data.scores).map(([key, value]: [string, any]) => {
                    const oldValue = resume1.data?.scores?.[key] || 0;
                    const diff = (value as number) - oldValue;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{value}</span>
                          {diff !== 0 && (
                            <span
                              className={`text-xs ${getScoreDiffColor(diff)}`}
                            >
                              ({diff > 0 ? '+' : ''}
                              {diff})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actionable Items Count */}
            {resume2.data?.actionables && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Actionable Items</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">
                      {resume2.data.actionables.length}
                    </span>
                    {resume1.data?.actionables && (
                      <span
                        className={`text-xs ${getScoreDiffColor(
                          resume2.data.actionables.length - resume1.data.actionables.length
                        )}`}
                      >
                        ({resume2.data.actionables.length - resume1.data.actionables.length > 0
                          ? '+'
                          : ''}
                        {resume2.data.actionables.length - resume1.data.actionables.length})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">📝 Insights</h3>
        <div className="space-y-3">
          {scoreDifference > 0 && (
            <p className="text-green-700 bg-green-50 p-3 rounded-lg">
              ✅ Great progress! Your resume score improved by {scoreDifference} points.
            </p>
          )}
          {scoreDifference < 0 && (
            <p className="text-red-700 bg-red-50 p-3 rounded-lg">
              ⚠️ Your score decreased by {Math.abs(scoreDifference)} points. Consider reviewing
              the changes.
            </p>
          )}
          {scoreDifference === 0 && (
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
              ➡️ No change in overall score. Review specific metrics for detailed differences.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
