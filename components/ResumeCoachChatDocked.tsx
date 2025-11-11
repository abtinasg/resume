'use client';

import { useState } from 'react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface ResumeCoachChatDockedProps {
  analysis: {
    summary?: {
      overall?: number;
      text?: string;
    };
    strengths?: Array<{
      title: string;
      description: string;
      category: string;
    }>;
    suggestions?: Array<{
      title: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      before: string;
      after: string;
    }>;
    ai_verdict?: {
      ai_final_score?: number;
      summary?: string;
      strengths?: string[];
      weaknesses?: string[];
      improvement_suggestions?: string[];
    } | null;
  } | null;
}

export default function ResumeCoachChatDocked({ analysis }: ResumeCoachChatDockedProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Don't render if no analysis data
  if (!analysis) return null;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, analysis }),
      });

      const data = await res.json();

      if (data.answer) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Sorry, I could not connect.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg h-[90vh] flex flex-col border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-t-xl">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 className="font-semibold text-sm">Resume Coach AI</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-blue-100">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-gray-800">Hi! I&apos;m your Resume Coach</h4>
              <p className="text-sm text-gray-600 max-w-xs">
                Ask me anything about your resume analysis, or get personalized advice to improve your resume!
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-4">
              {[
                'How can I improve my score?',
                'What are my biggest weaknesses?',
                'Help me rewrite my summary',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="text-left px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border border-gray-200 rounded-2xl rounded-bl-none p-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            placeholder="Ask about your resume..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
