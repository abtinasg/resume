/**
 * PRO Resume Scoring System - Main Entry Point
 *
 * This module provides the main `calculatePROScore` function that:
 * 1. Analyzes resume text comprehensively
 * 2. Calculates scores across 4 main components
 * 3. Generates detailed ATS report
 * 4. Provides improvement roadmap
 * 5. Returns complete ScoringResult
 *
 * Usage:
 * ```typescript
 * const result = await calculatePROScore(resumeText, "Product Manager");
 * console.log(result.overallScore); // 73
 * console.log(result.grade); // "B"
 * ```
 */

import {
  ScoringResult,
  ATSDetailedReport,
  ATSPassPrediction,
  KeywordGapAnalysis,
  ImprovementRoadmap,
  ImprovementAction,
  KeywordDensityScore,
} from './types';
import {
  calculateContentQualityScore,
  calculateATSScore,
  calculateFormatScore,
  calculateImpactScore,
  calculateOverallScore,
  calculateGrade,
} from './algorithms';
import {
  analyzeResumeText,
  validateResumeText,
  countWords,
  detectBulletPoints,
  estimatePageCount,
} from './analyzers';
import { getKeywordsForRole } from './keywords';

// ==================== ATS Pass Prediction ====================

/**
 * Calculate ATS pass probability based on ATS compatibility score
 */
function calculateATSPassProbability(atsScore: number): ATSPassPrediction {
  let probability: number;
  let confidence: 'low' | 'medium' | 'high';
  let reasoning: string;

  if (atsScore >= 85) {
    probability = 95;
    confidence = 'high';
    reasoning = 'Excellent ATS compatibility. Strong keyword presence and clean formatting.';
  } else if (atsScore >= 70) {
    probability = 80;
    confidence = 'high';
    reasoning = 'Good ATS compatibility. Minor improvements could increase pass rate.';
  } else if (atsScore >= 60) {
    probability = 65;
    confidence = 'medium';
    reasoning = 'Fair ATS compatibility. Missing some keywords and formatting needs work.';
  } else if (atsScore >= 50) {
    probability = 40;
    confidence = 'medium';
    reasoning = 'Needs work. Missing critical keywords or has formatting issues.';
  } else {
    probability = 15;
    confidence = 'low';
    reasoning = 'Poor ATS compatibility. Major keyword gaps and formatting issues detected.';
  }

  return {
    probability,
    confidence,
    reasoning,
  };
}

// ==================== Keyword Gap Analysis ====================

/**
 * Perform detailed keyword gap analysis
 */
function performKeywordGapAnalysis(
  resumeText: string,
  jobRole: string,
  keywordDensity: KeywordDensityScore
): KeywordGapAnalysis {
  const roleKeywords = getKeywordsForRole(jobRole);

  // Helper function to find matches
  const findMatches = (keywords: string[]) => {
    const found: string[] = [];
    const missing: string[] = [];

    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      const keywordPattern = new RegExp(`\\b${normalizedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'i');

      if (keywordPattern.test(resumeText)) {
        found.push(keyword);
      } else {
        missing.push(keyword);
      }
    }

    return { found, missing };
  };

  const mustHaveAnalysis = findMatches(roleKeywords.mustHave);
  const importantAnalysis = findMatches(roleKeywords.important);
  const niceToHaveAnalysis = findMatches(roleKeywords.niceToHave);

  return {
    role: jobRole,
    mustHave: {
      found: mustHaveAnalysis.found.length,
      total: roleKeywords.mustHave.length,
      missing: mustHaveAnalysis.missing.slice(0, 10),
      foundKeywords: mustHaveAnalysis.found.slice(0, 15),
    },
    important: {
      found: importantAnalysis.found.length,
      total: roleKeywords.important.length,
      missing: importantAnalysis.missing.slice(0, 10),
      foundKeywords: importantAnalysis.found.slice(0, 15),
    },
    niceToHave: {
      found: niceToHaveAnalysis.found.length,
      total: roleKeywords.niceToHave.length,
      missing: niceToHaveAnalysis.missing.slice(0, 10),
      foundKeywords: niceToHaveAnalysis.found.slice(0, 15),
    },
    keywordFrequency: keywordDensity.keywordFrequency,
  };
}

// ==================== Improvement Roadmap ====================

/**
 * Generate improvement roadmap with actionable steps
 */
function generateImprovementRoadmap(
  result: {
    overallScore: number;
    componentScores: any;
    keywordGapAnalysis: KeywordGapAnalysis;
  }
): ImprovementRoadmap {
  const actions: ImprovementAction[] = [];

  // Extract component breakdowns
  const contentQuality = result.componentScores.contentQuality;
  const atsCompatibility = result.componentScores.atsCompatibility;
  const formatStructure = result.componentScores.formatStructure;
  const impactMetrics = result.componentScores.impactMetrics;

  // 1. Keyword improvements
  const missingCriticalCount = result.keywordGapAnalysis.mustHave.missing.length;
  if (missingCriticalCount > 0) {
    const topMissing = result.keywordGapAnalysis.mustHave.missing.slice(0, 3);
    actions.push({
      action: `Add critical keywords: ${topMissing.join(', ')}`,
      pointsGain: Math.min(missingCriticalCount * 2, 10),
      time: '30min',
      priority: 'high',
      category: 'ATS Compatibility',
    });
  }

  // 2. Quantification improvements
  const quantification = contentQuality.breakdown.achievementQuantification;
  if (quantification.percentage < 60) {
    const needed = Math.ceil(quantification.totalBullets * 0.6 - quantification.quantifiedBullets);
    actions.push({
      action: `Add metrics to ${needed} more bullet points`,
      pointsGain: Math.min(needed * 1.5, 8),
      time: '20min',
      priority: 'high',
      category: 'Content Quality',
    });
  }

  // 3. Action verb improvements
  const actionVerbs = contentQuality.breakdown.actionVerbStrength;
  if (actionVerbs.weakVerbsFound.length > 0) {
    actions.push({
      action: `Replace weak verbs (${actionVerbs.weakVerbsFound.slice(0, 2).join(', ')}) with strong action verbs`,
      pointsGain: 4,
      time: '15min',
      priority: 'medium',
      category: 'Content Quality',
    });
  }

  // 4. Format issues
  const formatIssues = atsCompatibility.breakdown.formatCompatibility.issues;
  if (formatIssues.length > 0) {
    const topIssue = formatIssues[0];
    actions.push({
      action: `Fix: ${topIssue.issue}`,
      pointsGain: Math.ceil(topIssue.penalty / 2),
      time: '10min',
      priority: 'medium',
      category: 'ATS Compatibility',
    });
  }

  // 5. Length optimization
  const lengthOpt = formatStructure.breakdown.lengthOptimization;
  if (lengthOpt.verdict !== 'Optimal') {
    actions.push({
      action: lengthOpt.verdict === 'Too Long'
        ? `Reduce to ${lengthOpt.recommendedPages} pages`
        : `Expand to ${lengthOpt.recommendedPages} pages with more details`,
      pointsGain: 3,
      time: '25min',
      priority: 'low',
      category: 'Format & Structure',
    });
  }

  // 6. Professional summary
  const hasSummary = /summary|profile|about/i.test(result.componentScores.toString());
  if (!hasSummary) {
    actions.push({
      action: 'Add professional summary at the top',
      pointsGain: 4,
      time: '15min',
      priority: 'medium',
      category: 'Content Quality',
    });
  }

  // Sort actions by priority and points gain
  actions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
    if (priorityDiff !== 0) return priorityDiff;
    return b.pointsGain - a.pointsGain;
  });

  // Split into roadmaps
  let cumulativePoints = result.overallScore;
  const toReach80: ImprovementAction[] = [];
  const toReach90: ImprovementAction[] = [];

  for (const action of actions) {
    if (cumulativePoints < 80) {
      toReach80.push(action);
    } else if (cumulativePoints < 90) {
      toReach90.push(action);
    }
    cumulativePoints += action.pointsGain;
  }

  // Quick wins: high impact, low time
  const quickWins = actions.filter(a =>
    a.pointsGain >= 4 && parseInt(a.time) <= 20
  ).slice(0, 3);

  return {
    toReach80,
    toReach90: [...toReach80, ...toReach90],
    quickWins,
  };
}

// ==================== Main Function ====================

/**
 * Calculate comprehensive PRO score for a resume
 *
 * @param resumeText - Full text content of the resume
 * @param jobRole - Target job role (default: "General")
 * @returns Complete scoring result with breakdown and recommendations
 *
 * @example
 * ```typescript
 * const result = await calculatePROScore(resumeText, "Product Manager");
 * console.log(`Score: ${result.overallScore} (${result.grade})`);
 * console.log(`ATS Pass Rate: ${result.atsPassProbability}%`);
 * ```
 */
export async function calculatePROScore(
  resumeText: string,
  jobRole: string = 'General'
): Promise<ScoringResult> {
  const startTime = Date.now();

  // Validate input
  const validation = validateResumeText(resumeText);
  if (!validation.isValid) {
    throw new Error(`Invalid resume text: ${validation.errors.join(', ')}`);
  }

  // Analyze resume text
  const textAnalysis = analyzeResumeText(resumeText);

  // Calculate component scores
  const contentQuality = calculateContentQualityScore(resumeText, jobRole);
  const atsCompatibility = calculateATSScore(resumeText, jobRole);
  const formatStructure = calculateFormatScore(resumeText);
  const impactMetrics = calculateImpactScore(resumeText);

  // Calculate overall score
  const componentScores = {
    contentQuality,
    atsCompatibility,
    formatStructure,
    impactMetrics,
  };

  const overallScore = calculateOverallScore(componentScores);
  const grade = calculateGrade(overallScore);

  // Generate ATS detailed report
  const atsPassPrediction = calculateATSPassProbability(atsCompatibility.score);

  const keywordGapAnalysis = performKeywordGapAnalysis(
    resumeText,
    jobRole,
    atsCompatibility.breakdown.keywordDensity
  );

  const atsDetailedReport: ATSDetailedReport = {
    passPrediction: atsPassPrediction,
    keywordGapAnalysis,
    formatIssues: atsCompatibility.breakdown.formatCompatibility.issues,
  };

  // Generate improvement roadmap
  const improvementRoadmap = generateImprovementRoadmap({
    overallScore,
    componentScores,
    keywordGapAnalysis,
  });

  // Calculate processing time
  const processingTime = Date.now() - startTime;

  // Build final result
  const result: ScoringResult = {
    overallScore,
    grade,
    atsPassProbability: atsPassPrediction.probability,
    componentScores,
    atsDetailedReport,
    improvementRoadmap,
    metadata: {
      jobRole,
      processingTime,
      timestamp: new Date().toISOString(),
      resumeStats: {
        totalWords: textAnalysis.totalWords,
        totalBullets: textAnalysis.totalBullets,
        pageCount: textAnalysis.pageCount,
      },
    },
  };

  return result;
}

// Export all types and utilities
export * from './types';
export * from './keywords';
export * from './analyzers';
export * from './algorithms';
