'use client';

import { useState } from 'react';
import { HelpCircle, MessageCircle, Book, X, ChevronRight, Loader2 } from 'lucide-react';
import Button from '@/components/ui/button';

interface HelpWidgetProps {
  userId: string;
}

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'resume_score',
    title: 'Understanding Your Score',
    description: 'Learn how your resume score is calculated and what it means.',
    icon: <span className="text-blue-500">📊</span>,
  },
  {
    id: 'strategy_modes',
    title: 'Strategy Modes',
    description: 'Understand the different job search strategies available.',
    icon: <span className="text-purple-500">🎯</span>,
  },
  {
    id: 'daily_tasks',
    title: 'Daily Tasks',
    description: 'How to get the most out of your daily task recommendations.',
    icon: <span className="text-green-500">✓</span>,
  },
  {
    id: 'job_ranking',
    title: 'Job Rankings',
    description: 'How jobs are categorized and ranked for you.',
    icon: <span className="text-orange-500">⭐</span>,
  },
];

export function HelpWidget({ userId }: HelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [helpContent, setHelpContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHelpContent = async (topicId: string) => {
    setLoading(true);
    setSelectedTopic(topicId);
    
    try {
      const res = await fetch('/api/coach/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          topic_id: topicId,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setHelpContent(data.content || getDefaultHelpContent(topicId));
      } else {
        setHelpContent(getDefaultHelpContent(topicId));
      }
    } catch {
      setHelpContent(getDefaultHelpContent(topicId));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultHelpContent = (topicId: string): string => {
    const defaults: Record<string, string> = {
      resume_score: `## Understanding Your Resume Score

Your resume score is calculated based on four key dimensions:

1. **Content Quality** - How well your achievements and responsibilities are described
2. **ATS Compatibility** - Whether your resume will pass Applicant Tracking Systems
3. **Impact & Metrics** - The presence of quantifiable achievements
4. **Professional Presentation** - Overall formatting and structure

Each dimension is scored out of 100, and your overall score is a weighted average.`,

      strategy_modes: `## Strategy Modes Explained

Based on your resume and job search activity, we recommend one of these modes:

- **Build Mode** - Focus on improving your resume before applying
- **Sprint Mode** - Aggressive application strategy for urgent searches
- **Balanced Mode** - Mix of applications and resume improvements
- **Recovery Mode** - Reassess strategy after rejections

Your mode changes based on your progress and results.`,

      daily_tasks: `## Getting the Most from Daily Tasks

Daily tasks are personalized based on:

- Your current strategy mode
- Resume improvement areas
- Application pipeline status
- Time availability

**Tips:**
- Complete high-priority tasks first
- Use the "Why?" button to understand each task&apos;s purpose
- Mark tasks complete to track your progress`,

      job_ranking: `## How Job Rankings Work

Jobs are categorized into four buckets:

- **Target** - Great fits with 70-85% match score
- **Reach** - Stretch opportunities above 85%
- **Safety** - Lower competition, 50-70% match
- **Avoid** - Poor fits or potential red flags

Rankings consider skills match, experience level, location, and career trajectory.`,
    };
    
    return defaults[topicId] || 'Help content not available for this topic.';
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center z-40"
        aria-label="Help"
      >
        <HelpCircle className="w-7 h-7 text-white" />
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={() => {
              setIsOpen(false);
              setSelectedTopic(null);
              setHelpContent(null);
            }}
          />
          
          <div className="absolute bottom-24 right-6 w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedTopic ? (
                    <button
                      onClick={() => {
                        setSelectedTopic(null);
                        setHelpContent(null);
                      }}
                      className="p-1 hover:bg-white/20 rounded-full"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                  <h3 className="font-semibold">
                    {selectedTopic 
                      ? HELP_TOPICS.find(t => t.id === selectedTopic)?.title 
                      : 'Help Center'
                    }
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedTopic(null);
                    setHelpContent(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {!selectedTopic ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    How can we help you today?
                  </p>
                  
                  {HELP_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => fetchHelpContent(topic.id)}
                      className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors flex items-start gap-3"
                    >
                      <span className="text-xl">{topic.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{topic.title}</h4>
                        <p className="text-sm text-gray-500">{topic.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                    </button>
                  ))}
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                    {helpContent}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Need more help? Check our full documentation.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
