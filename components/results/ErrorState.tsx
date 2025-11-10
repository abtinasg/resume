'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';

interface ErrorStateProps {
  error?: string;
  onRetry?: () => void;
  onReset?: () => void;
  showDiagnostics?: boolean;
}

/**
 * ErrorState Component
 * Displays when analysis fails with clean error messaging and retry options
 * Features red border glow and subtle motion effects
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  error = 'An unexpected error occurred while analyzing your resume',
  onRetry,
  onReset,
  showDiagnostics = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      // Scroll to upload section as fallback
      const uploadSection = document.getElementById('upload-section');
      uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="relative">
        {/* Red glow effect */}
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -inset-1 bg-red-300 blur-xl rounded-2xl"
        />

        {/* Main error card */}
        <div className="relative bg-red-50 border-2 border-red-300 rounded-2xl shadow-lg p-8 md:p-12 space-y-6">
          {/* Error icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Pulsing background */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-red-400 rounded-full blur-xl"
              />

              {/* Icon container */}
              <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center border-2 border-red-300">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Error message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-3"
          >
            <h3 className="text-2xl font-bold text-red-900">
              Analysis Failed
            </h3>
            <Alert message={error} mode="error" className="text-left" />
          </motion.div>

          {/* Diagnostic information (optional) */}
          {showDiagnostics && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-red-700 hover:text-red-900 font-medium flex items-center gap-2 mx-auto transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showDetails ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </button>

              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white rounded-lg border border-red-200 p-4 text-left"
                >
                  <pre className="text-xs text-gray-700 font-mono overflow-auto">
                    {error}
                  </pre>
                  <div className="mt-3 pt-3 border-t border-red-100 text-xs text-gray-600">
                    <p>
                      <strong>Timestamp:</strong> {new Date().toLocaleString()}
                    </p>
                    <p>
                      <strong>Browser:</strong> {navigator.userAgent}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 pt-4"
          >
            {onRetry && (
              <Button
                onClick={handleRetry}
                className="flex-1 group relative overflow-hidden bg-red-500 hover:bg-red-600"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500"
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
                  Retry Analysis
                </span>
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={handleReset}
              className="flex-1"
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload New Resume
              </span>
            </Button>
          </motion.div>

          {/* Help text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-4 border-t border-red-200"
          >
            <p className="text-sm text-red-700">
              Still having trouble?{' '}
              <a
                href="#contact-section"
                className="font-semibold hover:underline"
              >
                Contact Support
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorState;
