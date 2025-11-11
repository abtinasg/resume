'use client';

import { useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Tabs from '@/components/ui/tabs';
import Badge from '@/components/ui/badge';
import type { Tab } from '@/components/ui/tabs';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { ChatBot } from './ChatBot';

interface Results3DProps {
  result: {
    success: true;
    hybrid_mode: boolean;
    overall_score: number;
    sections: {
      structure: number;
      content: number;
      tailoring: number;
    };
    summary: string;
    actionables: Array<{
      title: string;
      points: number;
      fix: string;
      category?: 'structure' | 'content' | 'tailoring';
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    ai_status: 'success' | 'fallback' | 'disabled';
    metadata: {
      processingTime: number;
      timestamp: string;
      model?: string;
    };
    estimatedImprovementTime?: number;
    targetScore?: number;
  };
}

export function Results3D({ result }: Results3DProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { overall_score, sections, summary, actionables, estimatedImprovementTime, targetScore } = result;

  // Calculate percentage for each section
  const structurePercent = Math.round((sections.structure / 40) * 100);
  const contentPercent = Math.round((sections.content / 60) * 100);
  const tailoringPercent = Math.round((sections.tailoring / 40) * 100);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Get priority badge style
  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border border-red-200 text-xs px-2 py-1 rounded';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs px-2 py-1 rounded';
      case 'LOW':
        return 'bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2 py-1 rounded';
    }
  };

  // Build tabs content
  const tabs: Tab[] = [
    // Overview Tab
    {
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* 3D Score Breakdown */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              3D Score Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Structure */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Structure</span>
                  <span className="text-lg font-bold text-gray-900">
                    {sections.structure}/40
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${structurePercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Completeness of sections
                </p>
              </div>

              {/* Content */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Content</span>
                  <span className="text-lg font-bold text-gray-900">
                    {sections.content}/60
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${contentPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Clarity, metrics, action verbs
                </p>
              </div>

              {/* Tailoring */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Tailoring</span>
                  <span className="text-lg font-bold text-gray-900">
                    {sections.tailoring}/40
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${tailoringPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Match to job description
                </p>
              </div>
            </div>
          </div>

          {/* Actionables */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Actionable Improvements
              <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded">
                {actionables.length}
              </span>
            </h3>
            <div className="space-y-3">
              {actionables.map((actionable, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      {actionable.priority === 'HIGH' ? (
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{actionable.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{actionable.fix}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {actionable.priority && (
                        <span className={getPriorityStyle(actionable.priority)}>
                          {actionable.priority}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-red-600">
                        {actionable.points} pts
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Structure Tab
    {
      label: `Structure (${sections.structure}/40)`,
      content: (
        <div className="space-y-4">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Score:</span>
              <span className="text-2xl font-bold">{sections.structure}/40</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full"
                style={{ width: `${structurePercent}%` }}
              />
            </div>
          </div>
          <div className="space-y-3">
            {actionables.filter((a) => a.category === 'structure').map((actionable, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-gray-900 mb-2">{actionable.title}</p>
                <p className="text-sm text-gray-600">{actionable.fix}</p>
              </div>
            ))}
            {actionables.filter((a) => a.category === 'structure').length === 0 && (
              <p className="text-gray-600">No structure issues found. Great job!</p>
            )}
          </div>
        </div>
      ),
    },
    // Content Tab
    {
      label: `Content (${sections.content}/60)`,
      content: (
        <div className="space-y-4">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Score:</span>
              <span className="text-2xl font-bold">{sections.content}/60</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full"
                style={{ width: `${contentPercent}%` }}
              />
            </div>
          </div>
          <div className="space-y-3">
            {actionables.filter((a) => a.category === 'content').map((actionable, index) => (
              <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-gray-900 mb-2">{actionable.title}</p>
                <p className="text-sm text-gray-600">{actionable.fix}</p>
              </div>
            ))}
            {actionables.filter((a) => a.category === 'content').length === 0 && (
              <p className="text-gray-600">No content issues found. Excellent!</p>
            )}
          </div>
        </div>
      ),
    },
    // Tailoring Tab
    {
      label: `Tailoring (${sections.tailoring}/40)`,
      content: (
        <div className="space-y-4">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Score:</span>
              <span className="text-2xl font-bold">{sections.tailoring}/40</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full"
                style={{ width: `${tailoringPercent}%` }}
              />
            </div>
          </div>
          <div className="space-y-3">
            {actionables.filter((a) => a.category === 'tailoring').map((actionable, index) => (
              <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="font-medium text-gray-900 mb-2">{actionable.title}</p>
                <p className="text-sm text-gray-600">{actionable.fix}</p>
              </div>
            ))}
            {actionables.filter((a) => a.category === 'tailoring').length === 0 && (
              <p className="text-gray-600">
                {sections.tailoring === 0
                  ? 'No job description provided for tailoring analysis.'
                  : 'No tailoring issues found. Perfect match!'}
              </p>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-6">
      {/* Overall Score Card */}
      <Card className={`p-8 border-2 ${getScoreBgColor(overall_score)}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-3">
              <div className={`text-6xl font-bold ${getScoreColor(overall_score)}`}>
                {overall_score}
                <span className="text-3xl">%</span>
              </div>
              {result.ai_status === 'success' && (
                <div className="bg-purple-100 text-purple-700 border border-purple-200 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Verified
                </div>
              )}
            </div>
            <p className="text-lg text-gray-600 mb-2">Overall Score</p>
            {estimatedImprovementTime && targetScore && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  ~{estimatedImprovementTime} mins to reach {targetScore}%
                </span>
              </div>
            )}
          </div>

          <div className="text-center md:text-right">
            <p className="text-gray-700 leading-relaxed max-w-md mb-4">{summary}</p>
            <Button
              onClick={() => setIsChatOpen(true)}
              variant="primary"
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <MessageSquare className="w-4 h-4 mr-2 inline" />
              Chat with AI Coach
            </Button>
          </div>
        </div>
      </Card>

      {/* 3D Scores Tabs */}
      <Tabs tabs={tabs} defaultTab={0} />

      {/* ChatBot */}
      <ChatBot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        resumeContext={{
          overall_score,
          sections,
          summary,
          actionables,
        }}
        autoOpenDelay={4000}
      />
    </div>
  );
}
