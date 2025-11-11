/**
 * Analysis Result Types for Results UI
 * These types represent the simplified structure used by the Results components
 */

export interface AnalysisResult {
  summary: {
    overall: number; // Score 0-100
    text: string; // Summary text
  };
  strengths: Array<{
    title: string;
    description: string;
    category: string;
  }>;
  suggestions: Array<{
    title: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    before: string;
    after: string;
  }>;
  ai_verdict?: {
    ai_final_score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    improvement_suggestions?: string[];
    before_after_rewrites?: {
      title: string;
      before: string;
      after: string;
      priority?: string;
    }[];
    confidence_level?: string;
  } | null;
}

/**
 * API Response Type (from /api/analyze) - Unified Hybrid Mode
 * This matches the new unified structure returned by the hybrid backend
 */
export interface ApiAnalysisResponse {
  success: true;
  hybrid_mode: true;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  rewrites: {
    title: string;
    before: string;
    after: string;
    reasoning: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  ai_status: 'success' | 'fallback';
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse = ApiAnalysisResponse | ApiErrorResponse;
