'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatBot } from './ChatBot';

interface ChatBotPanelProps {
  resumeContext?: {
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
      category?: string;
      priority?: string;
    }>;
  };
  autoOpen?: boolean;
}

/**
 * ChatBotPanel - Floating AI Coach Button & Modal
 * Provides a persistent floating button in the bottom-right corner
 * that opens the AI Resume Coach chatbot
 */
export default function ChatBotPanel({ resumeContext, autoOpen = false }: ChatBotPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Default context for when resume hasn't been analyzed yet
  const defaultContext = {
    overall_score: 0,
    sections: {
      structure: 0,
      content: 0,
      tailoring: 0,
    },
    summary: 'No resume analyzed yet. Upload a resume to get personalized coaching.',
    actionables: [],
  };

  const context = resumeContext || defaultContext;

  return (
    <>
      {/* Floating Chat Button - Fixed Bottom Right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open AI Resume Coach"
        >
          {/* Button with gradient and glow effect */}
          <div className="relative">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />

            {/* Button */}
            <div className="relative flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-300 group-hover:scale-105">
              <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
              <span className="font-semibold text-sm whitespace-nowrap">Ask AI Coach</span>

              {/* Pulse indicator */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
              </span>
            </div>
          </div>
        </button>
      )}

      {/* ChatBot Modal */}
      <ChatBot
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        resumeContext={context}
        autoOpenDelay={autoOpen ? 3000 : 0}
      />
    </>
  );
}
