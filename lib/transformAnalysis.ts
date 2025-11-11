import type { AnalysisResult, ApiAnalysisResponse } from './types/analysis';

/**
 * Transform Unified Hybrid API Response to UI AnalysisResult format
 * The new API returns a single unified result, so transformation is much simpler
 */
export function transformApiToAnalysisResult(
  apiResponse: ApiAnalysisResponse
): AnalysisResult {
  console.log('[Transform] 🔄 Transforming unified hybrid response to UI format');

  // Extract unified data from API
  const score = apiResponse.score ?? 0;
  const summary = apiResponse.summary ?? 'Analysis completed. Review your results below.';
  const strengths = apiResponse.strengths ?? [];
  const weaknesses = apiResponse.weaknesses ?? [];
  const improvementSuggestions = apiResponse.improvement_suggestions ?? [];
  const rewrites = apiResponse.rewrites ?? [];
  const aiStatus = apiResponse.ai_status ?? 'fallback';

  // Transform strengths array to structured format
  const transformedStrengths: AnalysisResult['strengths'] = strengths.map((strength, index) => ({
    title: `Strength ${index + 1}`,
    description: strength,
    category: 'Hybrid Analysis',
  }));

  // Ensure at least one strength
  if (transformedStrengths.length === 0) {
    transformedStrengths.push({
      title: 'Resume Analyzed',
      description: 'Your resume has been analyzed. Review the suggestions below for improvements.',
      category: 'General',
    });
  }

  // Transform rewrites to suggestions format
  const transformedSuggestions: AnalysisResult['suggestions'] = rewrites.map((rewrite) => ({
    title: rewrite.title,
    priority: rewrite.priority || 'MEDIUM',
    before: rewrite.before,
    after: rewrite.after,
  }));

  // If no rewrites, transform improvement_suggestions to basic suggestions
  if (transformedSuggestions.length === 0 && improvementSuggestions.length > 0) {
    improvementSuggestions.forEach((suggestion, index) => {
      transformedSuggestions.push({
        title: `Improvement ${index + 1}`,
        priority: index < 2 ? 'HIGH' : index < 5 ? 'MEDIUM' : 'LOW',
        before: 'Current approach needs improvement',
        after: suggestion,
      });
    });
  }

  // Ensure at least one suggestion
  if (transformedSuggestions.length === 0) {
    transformedSuggestions.push({
      title: 'General Recommendation',
      priority: 'MEDIUM',
      before: 'Your resume is good overall',
      after: 'Continue to refine and tailor it for specific job applications',
    });
  }

  // Build AI verdict structure for compatibility with existing UI
  const aiVerdict = {
    ai_final_score: score,
    summary,
    strengths,
    weaknesses,
    improvement_suggestions: improvementSuggestions,
    before_after_rewrites: rewrites,
    confidence_level: aiStatus === 'success' ? 'high' : 'medium',
  };

  console.log('[Transform] ✓ Transformation completed:', {
    score,
    strengthsCount: transformedStrengths.length,
    suggestionsCount: transformedSuggestions.length,
    rewritesCount: rewrites.length,
    aiStatus,
  });

  // Return transformed result
  return {
    summary: {
      overall: score,
      text: summary,
    },
    strengths: transformedStrengths.slice(0, 6),
    suggestions: transformedSuggestions.slice(0, 8),
    ai_verdict: aiVerdict,
  };
}

/**
 * Validate AnalysisResult structure
 * Returns true if the data is valid, false otherwise
 */
export function validateAnalysisResult(data: unknown): data is AnalysisResult {
  if (!data || typeof data !== 'object') {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Validation] Data is not an object:', data);
    }
    return false;
  }

  const result = data as Partial<AnalysisResult>;

  // Check summary
  if (!result.summary || typeof result.summary !== 'object') {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Validation] Missing or invalid summary');
    }
    return false;
  }

  if (
    typeof result.summary.overall !== 'number' ||
    typeof result.summary.text !== 'string'
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Validation] Invalid summary structure');
    }
    return false;
  }

  // Check strengths
  if (!Array.isArray(result.strengths)) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Validation] Strengths is not an array');
    }
    return false;
  }

  // Check suggestions
  if (!Array.isArray(result.suggestions)) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Validation] Suggestions is not an array');
    }
    return false;
  }

  return true;
}
