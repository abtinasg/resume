'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AIReportProps {
  verdict: {
    ai_final_score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    improvement_suggestions?: string[];
    before_after_rewrites?: {
      title: string;
      before: string;
      after: string;
      reasoning?: string;
      priority?: string;
    }[];
    confidence_level?: string;
  } | null;
}

const AIReport: React.FC<AIReportProps> = ({ verdict }) => {
  if (!verdict) return null;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-indigo-600';
    if (score >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getConfidenceBadgeColor = (level?: string): string => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'bg-green-100 text-green-700 border-green-200';
    if (l === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (l === 'low') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityBadgeColor = (priority?: string): string => {
    const p = priority?.toLowerCase();
    if (p === 'high') return 'bg-red-100 text-red-700 border-red-200';
    if (p === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (p === 'low') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full space-y-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">AI Analysis Report</h2>
        {verdict.confidence_level && (
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${getConfidenceBadgeColor(
              verdict.confidence_level
            )}`}
          >
            {verdict.confidence_level} Confidence
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 h-full flex flex-col items-center justify-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="10"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="url(#aiScoreGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(verdict.ai_final_score / 100) * 283} 283`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="aiScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={getScoreColor(verdict.ai_final_score).split(' ')[0].replace('from-', '')} />
                    <stop offset="100%" className={getScoreColor(verdict.ai_final_score).split(' ')[1].replace('to-', '')} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(
                    verdict.ai_final_score
                  )} bg-clip-text text-transparent`}>
                    {verdict.ai_final_score}
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-1">AI Score</div>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 font-medium">Final AI Assessment</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100 h-full hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Summary
            </h3>
            <p className="text-gray-700 leading-relaxed">{verdict.summary}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-full hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-green-600 text-xl">✅</span>
              Strengths
            </h3>
            <ul className="space-y-3">
              {verdict.strengths.map((strength, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                  className="flex items-start gap-3 text-gray-700"
                >
                  <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <span className="leading-relaxed">{strength}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-full hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-amber-600 text-xl">⚠️</span>
              Weaknesses
            </h3>
            <ul className="space-y-3">
              {verdict.weaknesses.map((weakness, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                  className="flex items-start gap-3 text-gray-700"
                >
                  <span className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-2" />
                  <span className="leading-relaxed">{weakness}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      {verdict.improvement_suggestions && verdict.improvement_suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-purple-600 text-xl">💡</span>
              Improvement Suggestions
            </h3>
            <ul className="space-y-3">
              {verdict.improvement_suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                  className="flex items-start gap-3 text-gray-700"
                >
                  <span className="flex-shrink-0 text-purple-600 font-bold">{index + 1}.</span>
                  <span className="leading-relaxed">{suggestion}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {verdict.before_after_rewrites && verdict.before_after_rewrites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-indigo-600 text-xl">🔄</span>
              Before/After Rewrites
            </h3>
            <div className="space-y-6">
              {verdict.before_after_rewrites.map((rewrite, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                  className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900">{rewrite.title}</h4>
                    {rewrite.priority && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityBadgeColor(
                          rewrite.priority
                        )}`}
                      >
                        {rewrite.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                          Before
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{rewrite.before}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                          After
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{rewrite.after}</p>
                    </div>
                  </div>
                  {rewrite.reasoning && (
                    <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Why this matters</span>
                          <p className="text-sm text-blue-800 mt-1 leading-relaxed">{rewrite.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIReport;
