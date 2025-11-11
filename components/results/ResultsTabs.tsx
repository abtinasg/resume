'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/button';
import AIReport from '@/components/AIReport';
import ResumeCoachChatDocked from '@/components/ResumeCoachChatDocked';
import type { AnalysisResult } from '@/lib/types/analysis';

interface ResultsTabsProps {
  analysis: AnalysisResult;
  onReset?: () => void;
}

/**
 * ResultsTabs Component - Two Column Layout
 * Displays Hybrid AI Analysis and Resume Coach AI side by side
 * Responsive design: side-by-side on desktop, stacked on mobile
 */
const ResultsTabs: React.FC<ResultsTabsProps> = ({ analysis, onReset }) => {
  // Extract score breakdown
  const contentScore = analysis?.local_scoring?.content ?? 0;
  const tailoringScore = analysis?.local_scoring?.tailoring ?? 0;
  const overallScore = analysis?.local_scoring?.overall_score ?? analysis?.summary?.overall ?? 0;

  return (
    <div className="w-full px-8 lg:px-12 space-y-8">
      {/* Two Column Layout: Hybrid AI Analysis + Resume Coach AI */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Hybrid AI Analysis */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 basis-1/2 w-full"
        >
          <AIReport
            verdict={analysis.ai_verdict ?? null}
            hybridScore={analysis.hybrid_score}
            localScore={analysis.local_scoring?.overall_score ?? analysis.summary?.overall}
            aiStatus={analysis.ai_status}
            contentScore={contentScore}
            tailoringScore={tailoringScore}
            overallScore={overallScore}
          />
        </motion.div>

        {/* Right Column: Resume Coach AI */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 basis-1/2 w-full"
        >
          <ResumeCoachChatDocked analysis={analysis} />
        </motion.div>
      </div>

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
