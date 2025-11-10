'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnalysisResult } from '@/lib/types/analysis';
import { validateAnalysisResult } from '@/lib/transformAnalysis';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import ResultsTabs from './ResultsTabs';

interface ResultsContainerProps {
  data: AnalysisResult | null;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  onReset?: () => void;
  onUploadClick?: () => void;
}

/**
 * ResultsContainer Component
 * Orchestrates all UI states for the Results section
 * Automatically switches between: Loading, Empty, Error, and Success states
 */
const ResultsContainer: React.FC<ResultsContainerProps> = ({
  data,
  isLoading = false,
  error,
  onRetry,
  onReset,
  onUploadClick,
}) => {
  // Determine current state
  const isEmpty = !data && !isLoading && !error;
  const isError = !!error;
  const hasData = !!data && validateAnalysisResult(data);

  // Log state for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.debug('[ResultsContainer] State:', {
      isEmpty,
      isLoading,
      isError,
      hasData,
      dataValid: hasData,
    });

    if (data && !validateAnalysisResult(data)) {
      console.warn('[ResultsContainer] Invalid data structure detected:', data);
    }
  }

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {/* 1. LOADING STATE */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <LoadingSkeleton />
          </motion.div>
        )}

        {/* 2. ERROR STATE */}
        {!isLoading && isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <ErrorState
              error={error}
              onRetry={onRetry}
              onReset={onReset}
              showDiagnostics={process.env.NODE_ENV === 'development'}
            />
          </motion.div>
        )}

        {/* 3. EMPTY STATE */}
        {!isLoading && !isError && isEmpty && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <EmptyState onUploadClick={onUploadClick} />
          </motion.div>
        )}

        {/* 4. SUCCESS STATE */}
        {!isLoading && !isError && hasData && data && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <ResultsTabs analysis={data} onReset={onReset} />
          </motion.div>
        )}

        {/* FALLBACK: Invalid data state */}
        {!isLoading && !isError && !isEmpty && !hasData && (
          <motion.div
            key="invalid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <ErrorState
              error="Invalid analysis data received. Please try uploading your resume again."
              onReset={onReset}
              showDiagnostics={process.env.NODE_ENV === 'development'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultsContainer;
