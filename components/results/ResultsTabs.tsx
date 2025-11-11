'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Tabs from '@/components/ui/tabs';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import AIReport from '@/components/AIReport';
import ResumeCoachChatDocked from '@/components/ResumeCoachChatDocked';
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
  const strengths = analysis?.strengths ?? [];
  const suggestions = analysis?.suggestions ?? [];

  // Extract score breakdown
  const contentScore = analysis?.local_scoring?.content ?? 0;
  const tailoringScore = analysis?.local_scoring?.tailoring ?? 0;
  const overallScore = analysis?.local_scoring?.overall_score ?? analysis?.summary?.overall ?? 0;

  // Priority variant mapping
  const getPriorityVariant = (priority: string): 'default' | 'high' | 'medium' | 'low' => {
    const p = priority?.toUpperCase();
    if (p === 'HIGH') return 'high';
    if (p === 'MEDIUM') return 'medium';
    if (p === 'LOW') return 'low';
    return 'default';
  };

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
    { label: 'Strengths', content: strengthsContent },
    { label: 'Suggestions', content: suggestionsContent },
  ];

  return (
    <div className="w-full space-y-8">
      {/* AI Report Section - Hybrid AI Analysis (Top) */}
      <AIReport
        verdict={analysis.ai_verdict ?? null}
        hybridScore={analysis.hybrid_score}
        localScore={analysis.local_scoring?.overall_score ?? analysis.summary?.overall}
        aiStatus={analysis.ai_status}
        contentScore={contentScore}
        tailoringScore={tailoringScore}
        overallScore={overallScore}
      />

      {/* Divider with heading for Strengths & Suggestions */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Strengths & Suggestions
          </span>
        </div>
      </div>

      {/* Strengths & Suggestions Tabs - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs tabs={tabs} className="shadow-lg rounded-xl overflow-hidden" />
      </motion.div>

      {/* Divider with heading for Coach */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Resume Coach
          </span>
        </div>
      </div>

      {/* Resume Coach Chat - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full"
      >
        <ResumeCoachChatDocked analysis={analysis} />
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
