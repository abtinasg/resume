/**
 * Example: How to use the AI Resume Coach Chat
 *
 * There are TWO implementations available:
 *
 * 1. ResumeCoachChat - Simple, lightweight floating chat bubble
 * 2. ChatBotPanel - Full-featured modal with auto-open and conversation history
 *
 * Choose based on your needs!
 */

'use client';

import ResumeCoachChat from '@/components/ResumeCoachChat';
import ChatBotPanel from '@/components/ChatBotPanel';
import type { AnalysisResult } from '@/lib/types/analysis';

// =====================================
// OPTION 1: Simple Floating Chat
// =====================================
// Use this for a minimal, clean implementation
function ExampleWithSimpleChat({ analysis }: { analysis: AnalysisResult | null }) {
  return (
    <div className="relative">
      {/* Your results page content */}
      <div className="max-w-4xl mx-auto p-6">
        <h1>Resume Analysis Results</h1>
        {/* ... your analysis UI ... */}
      </div>

      {/* Simple chat - only shows when analysis exists */}
      <ResumeCoachChat analysis={analysis} />
    </div>
  );
}

// =====================================
// OPTION 2: Full-Featured Chat Modal
// =====================================
// Use this for richer features (auto-open, conversation history, etc.)
function ExampleWithFullChat({ analysis }: { analysis: AnalysisResult | null }) {
  // Transform analysis to resumeContext format
  const resumeContext = analysis
    ? {
        overall_score: analysis.summary?.overall ?? 0,
        sections: {
          structure: analysis.local_scoring?.structure ?? 0,
          content: analysis.local_scoring?.content ?? 0,
          tailoring: analysis.local_scoring?.tailoring ?? 0,
        },
        summary: analysis.summary?.text ?? '',
        actionables: analysis.suggestions?.map((s) => ({
          title: s.title,
          points: 0,
          fix: s.after,
          category: '',
          priority: s.priority,
        })) ?? [],
      }
    : undefined;

  return (
    <div className="relative">
      {/* Your results page content */}
      <div className="max-w-4xl mx-auto p-6">
        <h1>Resume Analysis Results</h1>
        {/* ... your analysis UI ... */}
      </div>

      {/* Full-featured chat with auto-open after analysis */}
      <ChatBotPanel
        resumeContext={resumeContext}
        autoOpen={!!analysis} // Auto-opens when analysis completes
      />
    </div>
  );
}

// =====================================
// API Usage Examples
// =====================================

// Example 1: Using /api/chat-coach (simple endpoint)
async function sendSimpleChatMessage(message: string, analysis: AnalysisResult) {
  const response = await fetch('/api/chat-coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      analysis: analysis,
    }),
  });

  const data = await response.json();
  return data.answer; // AI response
}

// Example 2: Using /api/chat/resume-coach (full-featured endpoint with conversation history)
async function sendFullChatMessage(
  message: string,
  resumeContext: any,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const response = await fetch('/api/chat/resume-coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      resumeContext: resumeContext,
      conversationHistory: conversationHistory,
    }),
  });

  const data = await response.json();
  return data.reply; // AI response
}

// =====================================
// Quick Questions to Try
// =====================================
const SUGGESTED_QUESTIONS = [
  "Why did I get this score?",
  "How can I improve my leadership section?",
  "What keywords am I missing?",
  "Can you rewrite my summary?",
  "What would make this resume hit 90+ score?",
  "How can I make my achievements more impactful?",
  "Should I add more technical skills?",
  "Is my resume ATS-friendly?",
];

export { ExampleWithSimpleChat, ExampleWithFullChat, SUGGESTED_QUESTIONS };
