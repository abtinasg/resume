'use client';

import React from 'react';
import Tabs from '@/components/ui/tabs';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';

interface AnalysisData {
  score: number;
  summary: {
    overall: string;
    topStrength: string;
    topWeakness: string;
  };
  strengths: Array<{
    title: string;
    description: string;
    example: string;
    category: 'content' | 'format' | 'ats';
  }>;
  suggestions: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    beforeExample: string;
    afterExample: string;
    actionSteps: string[];
  }>;
}

interface ResultsTabsProps {
  analysis: AnalysisData | null;
  onReset: () => void;
}

const ResultsTabs: React.FC<ResultsTabsProps> = ({ analysis, onReset }) => {
  if (!analysis) {
    return (
      <div className="text-center py-12 px-6">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No resume analyzed yet
          </h3>
          <p className="text-sm text-gray-500">
            Upload a resume to get started with AI-powered analysis
          </p>
        </div>
      </div>
    );
  }

  // Summary Tab Content
  const summaryContent = (
    <div className="space-y-6">
      {/* Score Circle */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-32 h-32 md:w-40 md:h-40">
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
              strokeDasharray={`${(analysis.score / 100) * 283} 283`}
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
                {analysis.score}
              </div>
              <div className="text-xs text-gray-500 font-medium">out of 100</div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {analysis.score >= 80
              ? 'Excellent'
              : analysis.score >= 60
              ? 'Good'
              : analysis.score >= 40
              ? 'Fair'
              : 'Needs Improvement'}
          </h3>
        </div>
      </div>

      {/* Overall Summary */}
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
        <p className="text-gray-700 leading-relaxed">{analysis.summary.overall}</p>
      </Card>

      {/* Top Strength */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Top Strength
        </h4>
        <p className="text-gray-700 leading-relaxed">{analysis.summary.topStrength}</p>
      </Card>

      {/* Top Weakness */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Area for Improvement
        </h4>
        <p className="text-gray-700 leading-relaxed">{analysis.summary.topWeakness}</p>
      </Card>
    </div>
  );

  // Strengths Tab Content
  const strengthsContent = (
    <div className="space-y-4">
      {analysis.strengths.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No strengths identified yet
        </div>
      ) : (
        analysis.strengths.map((strength, index) => (
          <Card
            key={index}
            className="hover:border-blue-200 transition-all duration-100"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <h4 className="text-lg font-semibold text-gray-900">
                {strength.title}
              </h4>
              <Badge variant={strength.category}>
                {strength.category.toUpperCase()}
              </Badge>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed">
              {strength.description}
            </p>
            {strength.example && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Example from your resume
                    </p>
                    <p className="text-sm text-gray-700 italic leading-relaxed">
                      "{strength.example}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );

  // Suggestions Tab Content
  const suggestionsContent = (
    <div className="space-y-4">
      {analysis.suggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No suggestions available
        </div>
      ) : (
        analysis.suggestions.map((suggestion, index) => (
          <Card
            key={index}
            className="hover:border-blue-200 transition-all duration-100"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <h4 className="text-lg font-semibold text-gray-900">
                {suggestion.title}
              </h4>
              <Badge variant={suggestion.priority}>
                {suggestion.priority.toUpperCase()} PRIORITY
              </Badge>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed">
              {suggestion.description}
            </p>

            {/* Before/After Examples */}
            {(suggestion.beforeExample || suggestion.afterExample) && (
              <div className="space-y-3 mb-4">
                {suggestion.beforeExample && (
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
                          {suggestion.beforeExample}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {suggestion.afterExample && (
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
                          {suggestion.afterExample}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Steps */}
            {suggestion.actionSteps && suggestion.actionSteps.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                  Action Steps
                </h5>
                <ul className="space-y-2">
                  {suggestion.actionSteps.map((step, stepIndex) => (
                    <li
                      key={stepIndex}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-semibold flex-shrink-0 mt-0.5">
                        {stepIndex + 1}
                      </span>
                      <span className="flex-1 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );

  const tabs = [
    { label: 'Summary', content: summaryContent },
    { label: 'Strengths', content: strengthsContent },
    { label: 'Suggestions', content: suggestionsContent },
  ];

  return (
    <div className="w-full">
      <Tabs tabs={tabs} className="shadow-lg rounded-xl overflow-hidden" />

      {/* Analyze Another Resume Button */}
      <div className="mt-6 text-center">
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
      </div>
    </div>
  );
};

export default ResultsTabs;
