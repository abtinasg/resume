'use client';

import { useState, useCallback } from 'react';
import type { AnalysisResult } from '@/lib/types/analysis';

export interface UseAnalysisReturn {
  data: AnalysisResult | null;
  isLoading: boolean;
  isError: boolean;
  error?: string;
  isEmpty: boolean;
  setData: (data: AnalysisResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  refetch: () => void;
  reset: () => void;
}

/**
 * Custom hook for managing analysis state
 * Provides a clean interface for handling loading, error, empty, and success states
 */
export function useAnalysis(
  initialData: AnalysisResult | null = null
): UseAnalysisReturn {
  const [data, setDataState] = useState<AnalysisResult | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setErrorState] = useState<string | undefined>(undefined);

  const setData = useCallback((newData: AnalysisResult | null) => {
    setDataState(newData);
    setErrorState(undefined);
    setIsLoading(false);

    if (process.env.NODE_ENV === 'development') {
      console.debug('[useAnalysis] Data updated:', newData);
    }
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setErrorState(undefined);
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug('[useAnalysis] Loading state:', loading);
    }
  }, []);

  const setError = useCallback((errorMsg: string | undefined) => {
    setErrorState(errorMsg);
    setIsLoading(false);

    if (process.env.NODE_ENV === 'development' && errorMsg) {
      console.debug('[useAnalysis] Error:', errorMsg);
    }
  }, []);

  const reset = useCallback(() => {
    setDataState(null);
    setErrorState(undefined);
    setIsLoading(false);

    if (process.env.NODE_ENV === 'development') {
      console.debug('[useAnalysis] State reset');
    }
  }, []);

  const refetch = useCallback(() => {
    // This is a placeholder for refetch logic
    // In the actual implementation, this would trigger a new API call
    if (process.env.NODE_ENV === 'development') {
      console.debug('[useAnalysis] Refetch requested');
    }
  }, []);

  const isEmpty = !data && !isLoading && !error;
  const isError = !!error;

  return {
    data,
    isLoading,
    isError,
    error,
    isEmpty,
    setData,
    setLoading,
    setError,
    refetch,
    reset,
  };
}
