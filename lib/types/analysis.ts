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
    overall_score?: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    improvement_suggestions?: string[];
    before_after_rewrites?: {
      title: string;
      before: string;
      after: string;
      reasoning?: string;
      priority?: string;
    }[];
    confidence_level?: string;
  } | null;
  // Additional fields for 3D scoring
  hybrid_score?: number;
  ai_status?: 'success' | 'fallback' | 'disabled' | 'error';
  local_scoring?: {
    overall_score: number;
    structure: number;
    content: number;
    tailoring: number;
  };
}

/**
 * API Response Type (from /api/analyze) - 3D Scoring Hybrid Mode
 * This matches the actual structure returned by the 3D scoring backend
 */
export interface ApiAnalysisResponse {
  success: true;
  hybrid_mode: boolean;
  overall_score: number;
  sections: {
    structure: number;
    content: number;
    tailoring: number;
  };
  summary: string;
  actionables: {
    title: string;
    points: number;
    fix: string;
    category?: 'structure' | 'content' | 'tailoring';
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  ai_status: 'success' | 'fallback' | 'disabled';
  metadata: {
    processingTime: number;
    timestamp: string;
    model?: string;
  };
  estimatedImprovementTime?: number;
  targetScore?: number;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse = ApiAnalysisResponse | ApiErrorResponse;
