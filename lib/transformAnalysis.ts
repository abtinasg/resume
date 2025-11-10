import type { AnalysisResult, ApiAnalysisResponse } from './types/analysis';

/**
 * Transform API response (ResumeAnalysisPro) to UI AnalysisResult format
 * This ensures safe data handling with defaults for missing values
 */
export function transformApiToAnalysisResult(
  apiResponse: ApiAnalysisResponse['data']
): AnalysisResult {
  // Safely extract data with fallbacks
  const overview = apiResponse?.overview ?? {
    summary: 'No summary available',
    overall_score: 0,
    seniority_level: 'Unknown',
    fit_for_roles: [],
  };

  const sections = apiResponse?.sections ?? {
    experience: { score: 0, strengths: [], issues: [] },
    skills: { score: 0, missing_technologies: [] },
    education: { score: 0, suggestions: [] },
    formatting: { score: 0, issues: [] },
  };

  const atsAnalysis = apiResponse?.ats_analysis ?? {
    keyword_density: { total_keywords: 0, top_keywords: [] },
    ats_pass_rate: 0,
  };

  const improvementActions = apiResponse?.improvement_actions ?? [];

  // Transform strengths from sections
  const strengths: AnalysisResult['strengths'] = [];

  // Add experience strengths
  sections.experience?.strengths?.forEach((strength, index) => {
    strengths.push({
      title: `Experience Strength ${index + 1}`,
      description: strength ?? 'No description available',
      category: 'Experience',
    });
  });

  // Add skills insights as strengths
  if (sections.skills?.score && sections.skills.score >= 70) {
    strengths.push({
      title: 'Strong Skills Section',
      description: `Your skills section scored ${sections.skills.score}/100, demonstrating good technical breadth.`,
      category: 'Skills',
    });
  }

  // Add ATS strengths
  if (atsAnalysis.ats_pass_rate >= 70) {
    strengths.push({
      title: 'ATS-Optimized',
      description: `Your resume has a ${atsAnalysis.ats_pass_rate}% ATS pass rate with ${atsAnalysis.keyword_density?.total_keywords ?? 0} relevant keywords.`,
      category: 'ATS',
    });
  }

  // Ensure at least one strength
  if (strengths.length === 0) {
    strengths.push({
      title: 'Resume Submitted',
      description: 'Your resume has been analyzed. Review the suggestions below for improvements.',
      category: 'General',
    });
  }

  // Transform suggestions from improvement actions and issues
  const suggestions: AnalysisResult['suggestions'] = [];

  // Add experience issues as HIGH priority suggestions
  sections.experience?.issues?.forEach((issue, index) => {
    if (index < 3) {
      // Limit to top 3
      suggestions.push({
        title: `Experience Improvement ${index + 1}`,
        priority: 'HIGH',
        before: issue ?? 'Current approach needs refinement',
        after: 'Focus on quantifiable achievements and impact metrics',
      });
    }
  });

  // Add skills gaps as MEDIUM priority
  sections.skills?.missing_technologies?.forEach((tech, index) => {
    if (index < 3) {
      // Limit to top 3
      suggestions.push({
        title: `Add Missing Technology: ${tech}`,
        priority: 'MEDIUM',
        before: `${tech} is not mentioned in your skills section`,
        after: `Include ${tech} if you have experience with it, as it's relevant to your target roles`,
      });
    }
  });

  // Add formatting issues as LOW priority
  sections.formatting?.issues?.forEach((issue, index) => {
    if (index < 2) {
      // Limit to top 2
      suggestions.push({
        title: `Formatting Improvement ${index + 1}`,
        priority: 'LOW',
        before: issue ?? 'Formatting could be improved',
        after: 'Ensure consistent formatting, clear section headers, and proper spacing',
      });
    }
  });

  // Add education suggestions as MEDIUM priority
  sections.education?.suggestions?.forEach((suggestion, index) => {
    if (index < 2) {
      // Limit to top 2
      suggestions.push({
        title: `Education Enhancement ${index + 1}`,
        priority: 'MEDIUM',
        before: suggestion ?? 'Education section could be enhanced',
        after: 'Highlight relevant coursework, honors, or certifications',
      });
    }
  });

  // Add improvement actions as varied priority
  improvementActions?.forEach((action, index) => {
    if (suggestions.length < 8) {
      // Cap total suggestions
      const priority: 'HIGH' | 'MEDIUM' | 'LOW' =
        index < 2 ? 'HIGH' : index < 5 ? 'MEDIUM' : 'LOW';

      suggestions.push({
        title: `Action Item ${suggestions.length + 1}`,
        priority,
        before: action ?? 'Improvement needed',
        after: 'Implement the suggested changes to strengthen your resume',
      });
    }
  });

  // Ensure at least one suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      title: 'General Recommendation',
      priority: 'MEDIUM',
      before: 'Your resume is good overall',
      after: 'Continue to refine and tailor it for specific job applications',
    });
  }

  // Return transformed result
  return {
    summary: {
      overall: overview.overall_score ?? 0,
      text: overview.summary ?? 'Analysis completed. Review your results below.',
    },
    strengths: strengths.slice(0, 6), // Limit to 6 strengths
    suggestions: suggestions.slice(0, 8), // Limit to 8 suggestions
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
