/**
 * Layer 1 - Evaluation Engine
 * Generic Evaluation Orchestration Module
 *
 * Orchestrates all four dimension scorers and produces
 * the generic evaluation result (no job context).
 */

import type {
  ParsedResume,
  EvaluationResult,
  DimensionScores,
  ExtractedEntities,
  IdentifiedGaps,
  EvaluationFeedback,
  EvaluationFlags,
  WeakBullet,
  QuickWin,
  WeaknessCode,
  ResumeLevel,
} from '../types';
import { calculateSkillCapitalScore } from './skill-capital';
import { calculateExecutionImpactScore } from './execution-impact';
import { calculateLearningAdaptivityScore } from './learning-adaptivity';
import { calculateSignalQualityScore } from './signal-quality';
import { extractEntities } from '../modules/entity-extraction';
import { detectGenericGaps } from '../modules/gap-detection';
import {
  DIMENSION_WEIGHTS,
  SCORE_CONSTRAINTS,
  SIGNAL_QUALITY_MODIFIERS,
  getLevel,
} from '../config/weights';

// ==================== Main Evaluation Function ====================

/**
 * Perform generic evaluation of a parsed resume
 * Returns comprehensive evaluation result without job-specific context
 */
export function evaluateGeneric(
  parsed: ParsedResume,
  rawText: string
): {
  result: EvaluationResult;
  extracted: ExtractedEntities;
  weakBullets: WeakBullet[];
} {
  const startTime = Date.now();

  // Step 1: Extract entities
  const extracted = extractEntities(parsed);

  // Step 2: Calculate dimension scores
  const skillCapital = calculateSkillCapitalScore(parsed, extracted);
  const { score: executionImpact, weakBullets } = calculateExecutionImpactScore(parsed);
  const learningAdaptivity = calculateLearningAdaptivityScore(parsed, extracted);
  const signalQuality = calculateSignalQualityScore(parsed, rawText);

  // Step 3: Compile dimensions
  const dimensions: DimensionScores = {
    skill_capital: skillCapital,
    execution_impact: executionImpact,
    learning_adaptivity: learningAdaptivity,
    signal_quality: signalQuality,
  };

  // Step 4: Calculate global score
  const globalScore = calculateGlobalScore(dimensions);

  // Step 5: Apply constraints
  const constrainedScore = applyConstraints(
    globalScore,
    dimensions,
    parsed,
    extracted
  );

  // Step 6: Detect gaps
  const identifiedGaps = detectGenericGaps(parsed, extracted);

  // Step 7: Collect weaknesses
  const weaknesses = collectWeaknesses(dimensions, identifiedGaps);

  // Step 8: Generate flags
  const flags = generateFlags(parsed, extracted, identifiedGaps, weaknesses);

  // Step 9: Generate feedback
  const feedback = generateFeedback(
    dimensions,
    identifiedGaps,
    weaknesses,
    weakBullets
  );

  // Step 10: Generate summary
  const summary = generateSummary(constrainedScore.score, dimensions, weaknesses);

  // Calculate component scores for Layer 2/4 compatibility
  const componentScores = calculateComponentScores(dimensions);

  // Build final result
  const result: EvaluationResult = {
    // Overall scores
    resume_score: constrainedScore.score,
    overall_score: constrainedScore.score,
    level: getLevel(constrainedScore.score),

    // Component scores (for Layer 2/4 integration)
    content_quality_score: componentScores.content_quality,
    ats_compatibility_score: componentScores.ats_compatibility,
    format_quality_score: componentScores.format_quality,
    impact_score: componentScores.impact,

    // Dimensions
    dimensions,

    // Weaknesses
    weaknesses,
    extracted,
    identified_gaps: identifiedGaps,

    // Weak bullets for Layer 3
    weak_bullets: weakBullets.length > 0 ? weakBullets.slice(0, 5) : undefined,

    // Feedback
    feedback,

    // Flags
    flags,

    // Summary
    summary,

    // Metadata
    meta: {
      processing_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      version: '2.1',
      parse_quality: parsed.metadata.parse_quality,
    },
  };

  return { result, extracted, weakBullets };
}

// ==================== Global Score Calculation ====================

/**
 * Calculate global score from dimension scores
 * Formula: Global = Σ(dimension_score × weight) × signal_modifier
 */
function calculateGlobalScore(dimensions: DimensionScores): number {
  // Calculate weighted sum
  const weightedSum =
    dimensions.skill_capital.score * DIMENSION_WEIGHTS.skill_capital +
    dimensions.execution_impact.score * DIMENSION_WEIGHTS.execution_impact +
    dimensions.learning_adaptivity.score * DIMENSION_WEIGHTS.learning_adaptivity +
    dimensions.signal_quality.score * DIMENSION_WEIGHTS.signal_quality;

  // Apply signal quality modifier
  const signalScore = dimensions.signal_quality.score;
  let modifier: number = SIGNAL_QUALITY_MODIFIERS.neutral.factor;

  if (signalScore < SIGNAL_QUALITY_MODIFIERS.poor.threshold) {
    modifier = SIGNAL_QUALITY_MODIFIERS.poor.factor;
  } else if (signalScore > SIGNAL_QUALITY_MODIFIERS.excellent.threshold) {
    modifier = SIGNAL_QUALITY_MODIFIERS.excellent.factor;
  }

  return Math.round(weightedSum * modifier);
}

// ==================== Constraint Application ====================

interface ConstraintResult {
  score: number;
  constraintsApplied: string[];
}

/**
 * Apply hard caps based on critical gaps
 */
function applyConstraints(
  score: number,
  dimensions: DimensionScores,
  parsed: ParsedResume,
  extracted: ExtractedEntities
): ConstraintResult {
  let finalScore = score;
  const constraintsApplied: string[] = [];

  // Constraint: Low skill capital
  if (dimensions.skill_capital.score < SCORE_CONSTRAINTS.low_skill_capital.threshold) {
    if (finalScore > SCORE_CONSTRAINTS.low_skill_capital.max_score) {
      finalScore = SCORE_CONSTRAINTS.low_skill_capital.max_score;
      constraintsApplied.push('low_skill_capital');
    }
  }

  // Constraint: Low execution impact
  if (dimensions.execution_impact.score < SCORE_CONSTRAINTS.low_execution_impact.threshold) {
    if (finalScore > SCORE_CONSTRAINTS.low_execution_impact.max_score) {
      finalScore = SCORE_CONSTRAINTS.low_execution_impact.max_score;
      constraintsApplied.push('low_execution_impact');
    }
  }

  // Constraint: Stagnant learning (only applies above threshold)
  if (dimensions.learning_adaptivity.score < SCORE_CONSTRAINTS.stagnant_learning.threshold) {
    if (score > SCORE_CONSTRAINTS.stagnant_learning.applies_above) {
      finalScore = Math.min(finalScore, SCORE_CONSTRAINTS.stagnant_learning.max_score);
      constraintsApplied.push('stagnant_learning');
    }
  }

  // Constraint: Parsing failed
  if (parsed.metadata.parse_quality === 'low') {
    if (finalScore > SCORE_CONSTRAINTS.parsing_failed.max_score) {
      finalScore = SCORE_CONSTRAINTS.parsing_failed.max_score;
      constraintsApplied.push('parsing_failed');
    }
  }

  // Constraint: Possible spam (very few skills, no structure)
  if (
    extracted.skills.length < 3 &&
    parsed.experiences.length === 0 &&
    parsed.education.length === 0
  ) {
    finalScore = Math.min(finalScore, SCORE_CONSTRAINTS.possible_spam.max_score);
    constraintsApplied.push('possible_spam');
  }

  return { score: finalScore, constraintsApplied };
}

// ==================== Weakness Collection ====================

/**
 * Collect weakness codes from all dimension issues
 */
function collectWeaknesses(
  dimensions: DimensionScores,
  gaps: IdentifiedGaps
): WeaknessCode[] {
  const weaknesses: WeaknessCode[] = [];

  // From dimension issues
  const allIssues = [
    ...(dimensions.skill_capital.issues || []),
    ...(dimensions.execution_impact.issues || []),
    ...(dimensions.learning_adaptivity.issues || []),
    ...(dimensions.signal_quality.issues || []),
  ];

  // Map issues to weakness codes
  const issueToWeakness: Record<string, WeaknessCode> = {
    'no_metrics': 'no_metrics',
    'missing_metrics': 'no_metrics',
    'weak_verbs': 'weak_verbs',
    'weak_action_verbs': 'weak_verbs',
    'generic_descriptions': 'generic_descriptions',
    'poor_formatting': 'poor_formatting',
    'few_skills_listed': 'few_skills_listed',
    'missing_skills': 'few_skills_listed',
    'no_learning_signals': 'no_learning_signals',
    'no_experience': 'no_experience',
    'resume_too_short': 'too_short',
  };

  for (const issue of allIssues) {
    const weakness = issueToWeakness[issue];
    if (weakness && !weaknesses.includes(weakness)) {
      weaknesses.push(weakness);
    }
  }

  // From identified gaps
  if (gaps.missing_skills) weaknesses.push('few_skills_listed');
  if (gaps.missing_metrics) weaknesses.push('no_metrics');
  if (gaps.weak_action_verbs) weaknesses.push('weak_verbs');
  if (gaps.generic_descriptions) weaknesses.push('generic_descriptions');
  if (gaps.poor_formatting) weaknesses.push('poor_formatting');

  return Array.from(new Set(weaknesses));
}

// ==================== Flag Generation ====================

/**
 * Generate evaluation flags
 */
function generateFlags(
  parsed: ParsedResume,
  extracted: ExtractedEntities,
  gaps: IdentifiedGaps,
  weaknesses: WeaknessCode[]
): EvaluationFlags {
  return {
    no_skills_listed: extracted.skills.length < 3,
    possible_spam:
      extracted.skills.length < 3 &&
      parsed.experiences.length === 0 &&
      parsed.education.length === 0,
    no_experience: parsed.experiences.length === 0,
    generic_descriptions: gaps.generic_descriptions,
    no_metrics: gaps.missing_metrics,
    stagnant: weaknesses.includes('no_learning_signals'),
    parsing_failed: parsed.metadata.parse_quality === 'low',
    too_short: parsed.metadata.word_count < 100,
  };
}

// ==================== Feedback Generation ====================

/**
 * Generate actionable feedback
 */
function generateFeedback(
  dimensions: DimensionScores,
  gaps: IdentifiedGaps,
  weaknesses: WeaknessCode[],
  weakBullets: WeakBullet[]
): EvaluationFeedback {
  const strengths = identifyStrengths(dimensions);
  const criticalGaps = identifyCriticalGaps(weaknesses, gaps);
  const quickWins = identifyQuickWins(dimensions, weaknesses, weakBullets);
  const recommendations = generateRecommendations(dimensions, weaknesses);

  return {
    strengths,
    critical_gaps: criticalGaps,
    quick_wins: quickWins,
    recommendations,
  };
}

/**
 * Identify resume strengths
 */
function identifyStrengths(dimensions: DimensionScores): string[] {
  const strengths: string[] = [];

  if (dimensions.skill_capital.score >= 75) {
    strengths.push('Strong technical skill set with good diversity');
  }

  if (dimensions.execution_impact.score >= 75) {
    strengths.push('Excellent quantified achievements demonstrating impact');
  }

  if (dimensions.learning_adaptivity.score >= 75) {
    strengths.push('Clear career progression and commitment to learning');
  }

  if (dimensions.signal_quality.score >= 75) {
    strengths.push('Well-structured and professionally formatted resume');
  }

  // If no strong areas, find the best one
  if (strengths.length === 0) {
    const scores = [
      { name: 'Skill portfolio', score: dimensions.skill_capital.score },
      { name: 'Impact demonstration', score: dimensions.execution_impact.score },
      { name: 'Learning trajectory', score: dimensions.learning_adaptivity.score },
      { name: 'Presentation quality', score: dimensions.signal_quality.score },
    ];
    const best = scores.reduce((a, b) => (a.score > b.score ? a : b));
    strengths.push(`${best.name} is your strongest area`);
  }

  return strengths.slice(0, 4);
}

/**
 * Identify critical gaps to address
 */
function identifyCriticalGaps(
  weaknesses: WeaknessCode[],
  gaps: IdentifiedGaps
): string[] {
  const criticalGaps: string[] = [];

  const weaknessMessages: Record<WeaknessCode, string> = {
    no_metrics: 'Add quantified metrics to demonstrate impact (numbers, percentages, dollar amounts)',
    weak_verbs: 'Replace weak verbs (helped, worked on) with strong action verbs (led, achieved, optimized)',
    generic_descriptions: 'Make descriptions specific with concrete outcomes instead of generic duties',
    poor_formatting: 'Improve resume formatting for better readability and ATS compatibility',
    spelling_errors: 'Fix spelling and grammar errors',
    few_skills_listed: 'Add more technical skills to showcase your expertise',
    no_learning_signals: 'Add certifications or courses to show continuous learning',
    no_experience: 'Add work experience or relevant projects',
    parsing_failed: 'Consider a simpler resume format for better parsing',
    too_short: 'Expand your resume with more detail about your experience',
    possible_spam: 'Add more substantive content to your resume',
  };

  for (const weakness of weaknesses.slice(0, 3)) {
    criticalGaps.push(weaknessMessages[weakness]);
  }

  return criticalGaps;
}

/**
 * Identify quick wins
 */
function identifyQuickWins(
  dimensions: DimensionScores,
  weaknesses: WeaknessCode[],
  weakBullets: WeakBullet[]
): QuickWin[] {
  const quickWins: QuickWin[] = [];

  // Add metrics to weak bullets
  const bulletsWithoutMetrics = weakBullets.filter(
    b => b.issues.includes('no_metric')
  );
  if (bulletsWithoutMetrics.length > 0) {
    quickWins.push({
      action: `Add metrics to ${Math.min(3, bulletsWithoutMetrics.length)} bullet points`,
      estimated_impact: '+5-10 points',
      effort: '15-30 minutes',
      priority: 1,
    });
  }

  // Fix weak verbs
  const bulletsWithWeakVerbs = weakBullets.filter(
    b => b.issues.includes('weak_verb')
  );
  if (bulletsWithWeakVerbs.length > 0) {
    quickWins.push({
      action: `Replace weak verbs in ${Math.min(3, bulletsWithWeakVerbs.length)} bullets with strong action verbs`,
      estimated_impact: '+3-8 points',
      effort: '10-15 minutes',
      priority: 2,
    });
  }

  // Add skills section if missing
  if (weaknesses.includes('few_skills_listed')) {
    quickWins.push({
      action: 'Add a dedicated Skills section with 10-15 relevant skills',
      estimated_impact: '+5-8 points',
      effort: '5-10 minutes',
      priority: 3,
    });
  }

  // Add certifications if missing
  if (dimensions.learning_adaptivity.score < 60) {
    quickWins.push({
      action: 'Add any relevant certifications or online courses',
      estimated_impact: '+3-5 points',
      effort: '5 minutes',
      priority: 4,
    });
  }

  return quickWins.slice(0, 4);
}

/**
 * Generate general recommendations
 */
function generateRecommendations(
  dimensions: DimensionScores,
  weaknesses: WeaknessCode[]
): string[] {
  const recommendations: string[] = [];

  // Based on dimension scores
  if (dimensions.skill_capital.score < 60) {
    recommendations.push('Expand your skills section with both technical and soft skills');
    recommendations.push('Include technologies from your project work');
  }

  if (dimensions.execution_impact.score < 60) {
    recommendations.push('Start each bullet with a strong action verb');
    recommendations.push('Include at least one metric per bullet point when possible');
    recommendations.push('Focus on outcomes and results, not just duties');
  }

  if (dimensions.learning_adaptivity.score < 60) {
    recommendations.push('Consider obtaining industry certifications');
    recommendations.push('Highlight any promotions or increased responsibilities');
  }

  if (dimensions.signal_quality.score < 60) {
    recommendations.push('Use a clean, ATS-friendly format');
    recommendations.push('Keep bullets concise (8-25 words)');
    recommendations.push('Ensure consistent formatting throughout');
  }

  return recommendations.slice(0, 8);
}

// ==================== Summary Generation ====================

/**
 * Generate 1-2 sentence summary
 */
function generateSummary(
  score: number,
  dimensions: DimensionScores,
  weaknesses: WeaknessCode[]
): string {
  const level = getLevel(score);

  // Find strongest and weakest dimensions
  const dimensionScores = [
    { name: 'skills', score: dimensions.skill_capital.score },
    { name: 'impact demonstration', score: dimensions.execution_impact.score },
    { name: 'learning trajectory', score: dimensions.learning_adaptivity.score },
    { name: 'presentation', score: dimensions.signal_quality.score },
  ];

  const strongest = dimensionScores.reduce((a, b) => (a.score > b.score ? a : b));
  const weakest = dimensionScores.reduce((a, b) => (a.score < b.score ? a : b));

  let summary = `Your resume scores ${score}/100, placing it at the ${level} level. `;

  if (score >= 75) {
    summary += `Your ${strongest.name} stands out. `;
  } else if (score >= 55) {
    summary += `Good foundation in ${strongest.name}, but ${weakest.name} needs improvement. `;
  } else {
    summary += `Focus on improving ${weakest.name} for the biggest impact. `;
  }

  if (weaknesses.length > 0) {
    const primaryWeakness = weaknesses[0];
    const weaknessText: Record<WeaknessCode, string> = {
      no_metrics: 'adding quantified metrics',
      weak_verbs: 'using stronger action verbs',
      generic_descriptions: 'making descriptions more specific',
      poor_formatting: 'improving formatting',
      spelling_errors: 'fixing spelling errors',
      few_skills_listed: 'adding more skills',
      no_learning_signals: 'showing continuous learning',
      no_experience: 'adding work experience',
      parsing_failed: 'using a simpler format',
      too_short: 'expanding with more detail',
      possible_spam: 'adding substantive content',
    };
    summary += `Priority: ${weaknessText[primaryWeakness]}.`;
  }

  return summary;
}

// ==================== Component Score Calculation ====================

/**
 * Calculate component scores for Layer 2/4 compatibility
 */
function calculateComponentScores(dimensions: DimensionScores): {
  content_quality: number;
  ats_compatibility: number;
  format_quality: number;
  impact: number;
} {
  return {
    content_quality: Math.round(
      (dimensions.skill_capital.score + dimensions.execution_impact.score) / 2
    ),
    ats_compatibility: dimensions.signal_quality.score,
    format_quality: dimensions.signal_quality.score,
    impact: dimensions.execution_impact.score,
  };
}

// ==================== Export ====================

export { evaluateGeneric as default };
