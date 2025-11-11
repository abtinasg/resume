'use client';

import { useState } from 'react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface ResumeCoachChatProps {
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

export default function ResumeCoachChat({ analysis }: ResumeCoachChatProps) {
  const [open, setOpen] = useState(false);
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
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg px-4 py-2 font-medium transition-all duration-200 hover:shadow-xl"
        >
          💬 Resume Coach AI
        </button>
      )}
      {open && (
        <div className="bg-white shadow-2xl rounded-2xl w-80 h-[480px] flex flex-col border border-gray-200">
          <div className="flex justify-between items-center bg-blue-600 text-white px-3 py-2 rounded-t-2xl">
            <p className="font-semibold text-sm">Resume Coach AI</p>
            <button
              onClick={() => setOpen(false)}
              className="hover:bg-blue-700 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
            >
              ✖
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                <p className="mb-2">👋 Hi! I'm your Resume Coach.</p>
                <p className="text-xs">Ask me anything about your resume!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.sender === 'user'
                    ? 'bg-blue-100 ml-auto text-right'
                    : 'bg-gray-100 text-left'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && <p className="text-gray-400 text-center">Thinking...</p>}
          </div>

          <div className="border-t p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border rounded-md px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Ask about your resume..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white rounded-md px-3 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
