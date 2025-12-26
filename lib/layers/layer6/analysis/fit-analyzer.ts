/**
 * Layer 6 - Job Discovery & Matching Module
 * Fit Analyzer
 *
 * Integration wrapper for Layer 1 fit analysis.
 */

import type { FitScore, ParsedJobRequirements } from '../../layer1/types';
import type { ParsedJob, RankedJob, UserPreferences } from '../types';

// ==================== Mock Fit Analysis ====================

/**
 * Mock fit analysis result for when Layer 1 is unavailable or for testing
 */
export function createMockFitAnalysis(
  parsedJob: ParsedJob,
  skillsMatchCount: number,
  toolsMatchCount: number
): FitScore {
  // Calculate a mock fit score based on what we know
  const skillsScore = Math.min(100, skillsMatchCount * 15);
  const toolsScore = Math.min(100, toolsMatchCount * 20);
  const baseScore = (skillsScore + toolsScore) / 2;
  
  // Adjust based on parse quality
  const qualityMultiplier = 
    parsedJob.metadata.parse_quality === 'high' ? 1.0 :
    parsedJob.metadata.parse_quality === 'medium' ? 0.9 : 0.8;
  
  const fit_score = Math.round(baseScore * qualityMultiplier);
  
  // Create mock fit analysis
  return {
    // Base evaluation fields
    resume_score: 0,
    overall_score: 0,
    level: 'Growing',
    content_quality_score: 0,
    ats_compatibility_score: 0,
    format_quality_score: 0,
    impact_score: 0,
    dimensions: {
      skill_capital: { score: skillsScore },
      execution_impact: { score: 0 },
      learning_adaptivity: { score: 0 },
      signal_quality: { score: 0 },
    },
    weaknesses: [],
    extracted: {
      skills: [],
      tools: [],
      titles: [],
      companies: [],
    },
    identified_gaps: {
      missing_skills: skillsMatchCount < 3,
      missing_metrics: false,
      weak_action_verbs: false,
      generic_descriptions: false,
      poor_formatting: false,
      no_education: false,
      spelling_errors: false,
    },
    feedback: {
      strengths: ['Skills analysis pending'],
      critical_gaps: skillsMatchCount < 3 ? ['Limited skill match'] : [],
      quick_wins: [],
      recommendations: [],
    },
    flags: {
      no_skills_listed: false,
      possible_spam: false,
      no_experience: false,
      generic_descriptions: false,
      no_metrics: false,
      stagnant: false,
      parsing_failed: false,
      too_short: false,
    },
    summary: 'Mock fit analysis - Layer 1 integration pending',
    meta: {
      processing_time_ms: 0,
      timestamp: new Date().toISOString(),
      version: '2.1',
      parse_quality: 'medium',
    },
    
    // Fit-specific fields
    fit_score,
    fit_dimensions: {
      technical_match: skillsScore,
      seniority_match: 70,
      experience_match: 70,
      signal_quality: 0,
    },
    gaps: {
      skills: {
        matched: [],
        critical_missing: parsedJob.requirements.required_skills
          .slice(skillsMatchCount)
          .map(s => s.value),
        nice_to_have_missing: parsedJob.requirements.preferred_skills
          .map(s => s.value),
        transferable: [],
        match_percentage: skillsScore,
      },
      tools: {
        matched: [],
        critical_missing: parsedJob.requirements.required_tools
          .slice(toolsMatchCount)
          .map(t => t.value),
        nice_to_have_missing: parsedJob.requirements.preferred_tools
          .map(t => t.value),
        match_percentage: toolsScore,
      },
      experience: {
        matched_types: [],
        missing_types: [],
        coverage_score: 70,
      },
      seniority: {
        user_level: 'mid',
        role_expected: parsedJob.requirements.seniority_expected,
        alignment: 'aligned',
      },
      industry: {
        keywords_matched: [],
        keywords_missing: parsedJob.requirements.domain_keywords,
        match_percentage: 50,
      },
    },
    fit_flags: {
      underqualified: false,
      overqualified: false,
      career_switch: false,
      low_signal: true, // Since this is mock
      stretch_role: false,
    },
    recommendation: fit_score >= 70 ? 'APPLY' : fit_score >= 50 ? 'OPTIMIZE_FIRST' : 'NOT_READY',
    recommendation_reasoning: `Based on mock analysis with ${skillsMatchCount} skill matches`,
    tailoring_hints: [
      'Complete fit analysis by integrating with Layer 1',
    ],
    priority_improvements: [],
    fit_meta: {
      job_parsed_successfully: true,
      confidence: 'low',
    },
  };
}

// ==================== Layer 1 Integration ====================

/**
 * Get fit analysis from Layer 1
 * 
 * This is a placeholder for actual Layer 1 integration.
 * In production, this would call Layer1.evaluate_fit()
 */
export async function getFitAnalysis(
  resumeText: string,
  parsedJob: ParsedJob
): Promise<FitScore | null> {
  try {
    // TODO: Integrate with actual Layer 1
    // const fitResult = await Layer1.evaluate_fit({
    //   resume: { content: resumeText, filename: 'resume.txt', mimeType: 'text/plain' },
    //   job_description: { 
    //     raw_text: parsedJob.raw_text,
    //     parsed_requirements: convertToLayer1Requirements(parsedJob.requirements),
    //   },
    // });
    // return fitResult;
    
    // For now, return mock analysis
    // Simulate some skill matching based on job complexity
    const skillsMatchCount = Math.floor(
      parsedJob.requirements.required_skills.length * 0.6
    );
    const toolsMatchCount = Math.floor(
      parsedJob.requirements.required_tools.length * 0.5
    );
    
    return createMockFitAnalysis(parsedJob, skillsMatchCount, toolsMatchCount);
  } catch (error) {
    console.error('[Layer6] Fit analysis failed:', error);
    return null;
  }
}

/**
 * Convert Layer 6 requirements to Layer 1 format
 */
export function convertToLayer1Requirements(
  requirements: ParsedJob['requirements']
): ParsedJobRequirements {
  return {
    required_skills: requirements.required_skills.map(s => s.value),
    preferred_skills: requirements.preferred_skills.map(s => s.value),
    required_tools: requirements.required_tools.map(t => t.value),
    preferred_tools: requirements.preferred_tools.map(t => t.value),
    seniority_expected: requirements.seniority_expected,
    domain_keywords: requirements.domain_keywords,
    years_experience_min: requirements.years_experience_min,
    years_experience_max: requirements.years_experience_max,
  };
}

/**
 * Analyze fit for multiple jobs in parallel
 */
export async function analyzeFitBatch(
  resumeText: string,
  jobs: ParsedJob[]
): Promise<Map<string, FitScore | null>> {
  const results = new Map<string, FitScore | null>();
  
  // Process in parallel
  const promises = jobs.map(async (job) => {
    const fitAnalysis = await getFitAnalysis(resumeText, job);
    results.set(job.job_id, fitAnalysis);
  });
  
  await Promise.all(promises);
  
  return results;
}

/**
 * Calculate fit score from gaps (for when we have gap data but not full analysis)
 */
export function calculateFitScoreFromGaps(
  skillsMatchPercent: number,
  toolsMatchPercent: number,
  seniorityAlignment: 'aligned' | 'underqualified' | 'overqualified',
  experienceCoverage: number
): number {
  // Technical match (50% weight)
  const technicalMatch = (skillsMatchPercent + toolsMatchPercent) / 2;
  
  // Seniority match (25% weight)
  const seniorityMatch = 
    seniorityAlignment === 'aligned' ? 100 :
    seniorityAlignment === 'overqualified' ? 80 : 60;
  
  // Experience match (25% weight)
  const experienceMatch = experienceCoverage;
  
  const fitScore = 
    technicalMatch * 0.5 +
    seniorityMatch * 0.25 +
    experienceMatch * 0.25;
  
  return Math.round(fitScore);
}
