'use client';

import { X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  explanation: string | null;
  loading?: boolean;
  error?: string | null;
  tone?: 'professional' | 'empathetic' | 'encouraging' | 'direct';
}

export function ExplanationModal({ 
  isOpen, 
  onClose, 
  title = 'AI Coach Explanation',
  explanation, 
  loading = false,
  error = null,
  tone = 'professional'
}: ExplanationModalProps) {
  if (!isOpen) return null;

  const getToneStyle = () => {
    switch (tone) {
      case 'empathetic':
        return 'bg-purple-50 border-purple-200';
      case 'encouraging':
        return 'bg-green-50 border-green-200';
      case 'direct':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className={`relative rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border ${getToneStyle()}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[65vh] bg-white">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500">Generating explanation...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
              <p className="font-medium">Unable to generate explanation</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {explanation && !loading && (
            <div className="prose prose-sm sm:prose max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-xl font-bold text-gray-800 mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-4">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-md font-medium text-gray-700 mb-2 mt-3">{children}</h3>,
                  p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-700">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-300 pl-4 py-1 my-3 bg-blue-50 rounded-r text-gray-700">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {explanation}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Powered by your AI Career Coach
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
