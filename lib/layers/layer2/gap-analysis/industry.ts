/**
 * Layer 2 - Strategy Engine
 * Industry Gap Analysis
 *
 * Analyzes the gap between user's industry experience and target industry.
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 4.5
 */

import type {
  IndustryGap,
  ConfidenceLevel,
  Layer1Evaluation,
  Layer4State,
  JobContext,
} from '../types';
import { getIndustryKeywords } from '../config';
import {
  canonicalize,
  canonicalizeAll,
  getIndustryForKeyword,
  getKeywordsForIndustry,
  getAllIndustries,
} from '../normalization';

// ==================== Types ====================

interface IndustryGapInput {
  /** Industries detected from resume */
  resumeIndustries?: string[];
  /** Skills that might indicate industry */
  resumeSkills?: string[];
  /** Domain keywords from job requirements */
  domainKeywords?: string[];
  /** Job description text */
  jobDescription?: string;
}

// ==================== Main Analysis Function ====================

/**
 * Analyze industry gap between resume and target
 *
 * @param input - Industry gap input data
 * @returns Industry gap analysis result
 */
export function analyzeIndustryGap(input: IndustryGapInput): IndustryGap {
  const {
    resumeIndustries = [],
    resumeSkills = [],
    domainKeywords = [],
    jobDescription,
  } = input;

  // Extract industry signals from resume
  const userIndustryKeywords = extractUserIndustryKeywords(
    resumeIndustries,
    resumeSkills
  );

  // Determine required industry keywords
  let targetKeywords: string[];
  if (domainKeywords.length > 0) {
    targetKeywords = canonicalizeAll(domainKeywords);
  } else if (jobDescription) {
    targetKeywords = extractIndustryKeywordsFromJD(jobDescription);
  } else {
    // No target specified
    return createNoTargetResult(userIndustryKeywords);
  }

  // Calculate matches
  const matchedKeywords = userIndustryKeywords.filter(k => 
    targetKeywords.includes(k)
  );
  const missingKeywords = targetKeywords.filter(k =>
    !userIndustryKeywords.includes(k)
  );

  // Calculate match percentage
  const matchPercentage = targetKeywords.length > 0
    ? Math.round((matchedKeywords.length / targetKeywords.length) * 100)
    : 100;

  // Determine confidence
  const confidence = determineConfidence(
    domainKeywords.length,
    !!jobDescription,
    userIndustryKeywords.length
  );

  return {
    keywords_matched: matchedKeywords,
    keywords_missing: missingKeywords,
    match_percentage: matchPercentage,
    confidence,
  };
}

/**
 * Analyze industry gap using Layer data
 *
 * @param evaluation - Layer 1 evaluation results
 * @param layer4State - Layer 4 state
 * @param jobContext - Optional job context
 * @returns Industry gap analysis result
 */
export function analyzeIndustryGapFromLayers(
  evaluation: Layer1Evaluation,
  layer4State: Layer4State,
  jobContext?: JobContext
): IndustryGap {
  // Get resume industries and skills
  const resumeIndustries = evaluation.extracted.industries ?? [];
  const resumeSkills = evaluation.extracted.skills;

  // Get target keywords from job requirements
  const domainKeywords = jobContext?.job_requirements?.domain_keywords ?? [];
  const jobDescription = jobContext?.job_description;

  return analyzeIndustryGap({
    resumeIndustries,
    resumeSkills,
    domainKeywords,
    jobDescription,
  });
}

// ==================== Helper Functions ====================

/**
 * Extract industry keywords from resume data
 */
function extractUserIndustryKeywords(
  industries: string[],
  skills: string[]
): string[] {
  const keywords = new Set<string>();
  const industryKeywordsMap = getIndustryKeywords();

  // Add explicitly listed industries
  for (const industry of industries) {
    const canonical = canonicalize(industry);
    keywords.add(canonical);

    // Also add keywords for that industry
    const industryKeywords = getKeywordsForIndustry(canonical);
    for (const kw of industryKeywords) {
      keywords.add(canonicalize(kw));
    }
  }

  // Check skills for industry keywords
  for (const skill of skills) {
    const canonical = canonicalize(skill);
    
    // Check if skill is an industry keyword
    for (const [industry, industryKws] of Object.entries(industryKeywordsMap)) {
      for (const kw of industryKws) {
        if (canonicalize(kw) === canonical) {
          keywords.add(canonical);
        }
      }
    }
  }

  return Array.from(keywords);
}

/**
 * Extract industry keywords from job description
 */
function extractIndustryKeywordsFromJD(jobDescription: string): string[] {
  const keywords = new Set<string>();
  const jdLower = jobDescription.toLowerCase();
  const industryKeywordsMap = getIndustryKeywords();

  // Check for each industry keyword
  for (const [industry, industryKws] of Object.entries(industryKeywordsMap)) {
    for (const kw of industryKws) {
      if (jdLower.includes(kw.toLowerCase())) {
        keywords.add(canonicalize(kw));
      }
    }
  }

  return Array.from(keywords);
}

/**
 * Create result when no target is specified
 */
function createNoTargetResult(userKeywords: string[]): IndustryGap {
  return {
    keywords_matched: userKeywords,
    keywords_missing: [],
    match_percentage: 100,
    confidence: 'low',
  };
}

/**
 * Determine confidence level
 */
function determineConfidence(
  domainKeywordsCount: number,
  hasJD: boolean,
  userKeywordsCount: number
): ConfidenceLevel {
  // High confidence: explicit domain keywords and user data
  if (domainKeywordsCount > 0 && userKeywordsCount > 0) {
    return 'high';
  }

  // Medium confidence: JD parsing or partial data
  if (hasJD || domainKeywordsCount > 0 || userKeywordsCount > 0) {
    return 'medium';
  }

  // Low confidence: no data
  return 'low';
}

/**
 * Detect primary industry from resume
 *
 * @param industries - Industries from resume
 * @param skills - Skills from resume
 * @returns Primary industry or undefined
 */
export function detectPrimaryIndustry(
  industries: string[],
  skills: string[]
): string | undefined {
  // Count industry keyword matches
  const industryCounts = new Map<string, number>();
  const industryKeywordsMap = getIndustryKeywords();

  // Check skills for industry keywords
  for (const skill of skills) {
    const canonical = canonicalize(skill);
    
    for (const [industry, industryKws] of Object.entries(industryKeywordsMap)) {
      for (const kw of industryKws) {
        if (canonicalize(kw) === canonical) {
          industryCounts.set(industry, (industryCounts.get(industry) ?? 0) + 1);
        }
      }
    }
  }

  // Check explicit industries
  for (const industry of industries) {
    const canonical = canonicalize(industry);
    if (getAllIndustries().includes(canonical)) {
      industryCounts.set(canonical, (industryCounts.get(canonical) ?? 0) + 10);
    }
  }

  // Find industry with highest count
  let maxIndustry: string | undefined;
  let maxCount = 0;

  for (const [industry, count] of industryCounts) {
    if (count > maxCount) {
      maxCount = count;
      maxIndustry = industry;
    }
  }

  return maxIndustry;
}

/**
 * Get industry gap summary for display
 *
 * @param gap - Industry gap analysis result
 * @returns Human-readable summary
 */
export function getIndustryGapSummary(gap: IndustryGap): string {
  const parts: string[] = [];

  if (gap.keywords_matched.length > 0) {
    parts.push(`${gap.keywords_matched.length} industry keywords matched`);
  }

  if (gap.keywords_missing.length > 0) {
    parts.push(`${gap.keywords_missing.length} industry keywords missing`);
  }

  parts.push(`${gap.match_percentage}% industry alignment`);

  return parts.join('. ');
}

/**
 * Check if industry gap indicates a good fit
 *
 * @param gap - Industry gap analysis result
 * @param threshold - Match percentage threshold (default 50%)
 * @returns True if industry match meets threshold
 */
export function isGoodIndustryFit(gap: IndustryGap, threshold: number = 50): boolean {
  return gap.match_percentage >= threshold;
}

/**
 * Check if this appears to be a career switch
 *
 * @param gap - Industry gap analysis result
 * @param threshold - Match threshold below which it's a career switch
 * @returns True if appears to be career switch
 */
export function isCareerSwitch(gap: IndustryGap, threshold: number = 30): boolean {
  return gap.match_percentage < threshold && gap.keywords_missing.length > 3;
}
