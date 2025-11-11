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
 * API Response Type (from /api/analyze)
 * This matches the ResumeAnalysisPro structure returned by the backend
 */
export interface ApiAnalysisResponse {
  success: true;
  data: {
    overview: {
      summary: string;
      overall_score: number;
      seniority_level: string;
      fit_for_roles: string[];
    };
    sections: {
      experience: {
        score: number;
        strengths: string[];
        issues: string[];
      };
      skills: {
        score: number;
        missing_technologies: string[];
      };
      education: {
        score: number;
        suggestions: string[];
      };
      formatting: {
        score: number;
        issues: string[];
      };
    };
    ats_analysis: {
      keyword_density: {
        total_keywords: number;
        top_keywords: string[];
      };
      ats_pass_rate: number;
    };
    improvement_actions: string[];
  };
  processingTime: number;
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
