import type { AnalysisResult, ApiAnalysisResponse } from './types/analysis';

/**
 * Transform 3D Scoring API Response to UI AnalysisResult format
 * Maps actionables to before/after rewrites for display
 */
export function transformApiToAnalysisResult(
  apiResponse: ApiAnalysisResponse
): AnalysisResult {
  console.log('[Transform] 🔄 Transforming 3D scoring response to UI format');

  // Extract data from 3D scoring API
  const overall_score = apiResponse.overall_score ?? 0;
  const summary = apiResponse.summary ?? 'Analysis completed. Review your results below.';
  const actionables = apiResponse.actionables ?? [];
  const aiStatus = apiResponse.ai_status ?? 'fallback';
  const sections = apiResponse.sections || { structure: 0, content: 0, tailoring: 0 };

  // Generate strengths from high scores
  const transformedStrengths: AnalysisResult['strengths'] = [];

  if (sections.structure >= 32) { // 80% of 40
    transformedStrengths.push({
      title: 'Strong Structure',
      description: 'Your resume has excellent structure with all essential sections present and well-organized.',
      category: 'Structure',
    });
  }

  if (sections.content >= 48) { // 80% of 60
    transformedStrengths.push({
      title: 'Quality Content',
      description: 'Your content demonstrates strong clarity, quantification, and action verbs.',
      category: 'Content',
    });
  }

  if (sections.tailoring >= 32) { // 80% of 40
    transformedStrengths.push({
      title: 'Well Tailored',
      description: 'Your resume is well-tailored with relevant keywords and skills for your target role.',
      category: 'Tailoring',
    });
  }

  // Ensure at least one strength
  if (transformedStrengths.length === 0) {
    transformedStrengths.push({
      title: 'Resume Analyzed',
      description: 'Your resume has been analyzed. Review the suggestions below for improvements.',
      category: 'General',
    });
  }

  // Transform actionables to before/after suggestions
  const transformedSuggestions: AnalysisResult['suggestions'] = actionables.map((actionable) => {
    // Determine priority based on points impact
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (actionable.priority) {
      priority = actionable.priority;
    } else if (Math.abs(actionable.points) >= 10) {
      priority = 'HIGH';
    } else if (Math.abs(actionable.points) >= 5) {
      priority = 'MEDIUM';
    } else {
      priority = 'LOW';
    }

    // Create before/after from actionable
    return {
      title: actionable.title,
      priority,
      before: `Current issue: ${actionable.title.replace(/^Add |^Fix |^Update |^Improve /i, '')}`,
      after: actionable.fix,
    };
  });

  // Ensure at least one suggestion
  if (transformedSuggestions.length === 0) {
    transformedSuggestions.push({
      title: 'General Recommendation',
      priority: 'MEDIUM',
      before: 'Your resume is good overall',
      after: 'Continue to refine and tailor it for specific job applications',
    });
  }

  // Build AI verdict structure with before_after_rewrites
  const before_after_rewrites = actionables.map((actionable) => ({
    title: actionable.title,
    before: `${actionable.title.replace(/^Add |^Fix |^Update |^Improve /i, 'Issue: ')}`,
    after: actionable.fix,
    reasoning: `This change can improve your score by ${Math.abs(actionable.points)} points.`,
    priority: actionable.priority || (Math.abs(actionable.points) >= 10 ? 'HIGH' : Math.abs(actionable.points) >= 5 ? 'MEDIUM' : 'LOW'),
  }));

  const aiVerdict = {
    ai_final_score: overall_score,
    overall_score: overall_score,
    summary,
    strengths: transformedStrengths.map(s => s.description),
    weaknesses: actionables
      .filter(a => a.category && ['HIGH', 'MEDIUM'].includes(a.priority || ''))
      .map(a => a.title)
      .slice(0, 5),
    improvement_suggestions: actionables.map(a => a.fix).slice(0, 5),
    before_after_rewrites,
    confidence_level: aiStatus === 'success' ? 'high' : aiStatus === 'fallback' ? 'medium' : 'low',
  };

  console.log('[Transform] ✓ Transformation completed:', {
    overall_score,
    strengthsCount: transformedStrengths.length,
    suggestionsCount: transformedSuggestions.length,
    actionablesCount: actionables.length,
    aiStatus,
  });

  // Return transformed result with all necessary fields
  return {
    summary: {
      overall: overall_score,
      text: summary,
    },
    strengths: transformedStrengths.slice(0, 6),
    suggestions: transformedSuggestions.slice(0, 8),
    ai_verdict: aiVerdict,
    hybrid_score: overall_score,
    ai_status: aiStatus,
    local_scoring: {
      overall_score: overall_score,
      structure: sections.structure,
      content: sections.content,
      tailoring: sections.tailoring,
    },
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
