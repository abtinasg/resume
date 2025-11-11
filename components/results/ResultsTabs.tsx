'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Tabs from '@/components/ui/tabs';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import AIReport from '@/components/AIReport';
import type { AnalysisResult } from '@/lib/types/analysis';

interface ResultsTabsProps {
  analysis: AnalysisResult;
  onReset?: () => void;
}

/**
 * ResultsTabs Component - Refactored for safety and polish
 * Displays analysis results with premium design and error-proof guards
 * Only renders when valid data is available (controlled by ResultsContainer)
 */
const ResultsTabs: React.FC<ResultsTabsProps> = ({ analysis, onReset }) => {
  // Safe extraction with defaults
  const score = analysis?.summary?.overall ?? 0;
  const summaryText = analysis?.summary?.text ?? 'No summary available';
  const strengths = analysis?.strengths ?? [];
  const suggestions = analysis?.suggestions ?? [];

  // Score rating helper
  const getScoreRating = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // Score color helper
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-indigo-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  // Priority variant mapping
  const getPriorityVariant = (priority: string): 'default' | 'high' | 'medium' | 'low' => {
    const p = priority?.toUpperCase();
    if (p === 'HIGH') return 'high';
    if (p === 'MEDIUM') return 'medium';
    if (p === 'LOW') return 'low';
    return 'default';
  };

  // Summary Tab Content
  const summaryContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Score Circle with Gradient Glow */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-32 h-32 md:w-40 md:h-40">
          {/* Ambient glow behind circle */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${getScoreColor(
              score
            )} blur-2xl opacity-30 rounded-full`}
          />

          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 283} 283`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                {score}
              </div>
              <div className="text-xs text-gray-500 font-medium">out of 100</div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            {getScoreRating(score)}
          </h3>
        </motion.div>
      </div>

      {/* Overall Summary Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Overall Assessment
        </h4>
        <p className="text-gray-700 leading-relaxed">{summaryText}</p>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 text-center">
          <div className="text-2xl font-bold text-green-600">
            {strengths.length}
          </div>
          <div className="text-sm text-gray-600 font-medium">Strengths</div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {suggestions.length}
          </div>
          <div className="text-sm text-gray-600 font-medium">Suggestions</div>
        </Card>
      </div>
    </motion.div>
  );

  // Strengths Tab Content
  const strengthsContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {strengths.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No strengths identified yet</p>
        </div>
      ) : (
        strengths.map((strength, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:border-green-200 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  {strength?.title ?? 'Untitled Strength'}
                </h4>
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                  {strength?.category?.toUpperCase() ?? 'GENERAL'}
                </Badge>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {strength?.description ?? 'No description available'}
              </p>
            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
  );

  // Suggestions Tab Content
  const suggestionsContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No suggestions available</p>
        </div>
      ) : (
        suggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:border-blue-200 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  {suggestion?.title ?? 'Untitled Suggestion'}
                </h4>
                <Badge variant={getPriorityVariant(suggestion?.priority ?? 'MEDIUM')}>
                  {suggestion?.priority?.toUpperCase() ?? 'MEDIUM'} PRIORITY
                </Badge>
              </div>

              {/* Before/After Examples */}
              <div className="space-y-3">
                {suggestion?.before && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                          Before
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {suggestion.before}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {suggestion?.after && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                          After
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {suggestion.after}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
  );

  const tabs = [
    { label: 'Summary', content: summaryContent },
    { label: 'Strengths', content: strengthsContent },
    { label: 'Suggestions', content: suggestionsContent },
  ];

  return (
    <div className="w-full space-y-8">
      {/* AI Report Section */}
      <AIReport
        verdict={analysis.ai_verdict ?? null}
        hybridScore={analysis.hybrid_score}
        localScore={analysis.local_scoring?.overall_score ?? analysis.summary?.overall}
        aiStatus={analysis.ai_status}
      />

      {/* Divider with heading for Local Scoring Results */}
      {analysis.ai_verdict && (
        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Detailed Breakdown
            </span>
          </div>
        </div>
      )}

      {/* Local Scoring Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs tabs={tabs} className="shadow-lg rounded-xl overflow-hidden" />
      </motion.div>

      {/* Analyze Another Resume Button */}
      {onReset && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <Button variant="secondary" onClick={onReset} className="w-full sm:w-auto">
            <svg
              className="w-4 h-4 mr-2 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Analyze Another Resume
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ResultsTabs;
