/**
 * Layer 2 - Strategy Engine
 * Gap Analysis Module Index
 *
 * Aggregates all gap analysis functions and provides a unified API.
 */

import type {
  GapAnalysis,
  Layer1Evaluation,
  Layer4State,
  JobContext,
} from '../types';

// Export individual gap analyzers
export {
  analyzeSkillsGap,
  analyzeSkillsGapFromLayers,
  filterToSkills,
  getSkillsGapSummary,
  isGoodSkillsFit,
} from './skills';

export {
  analyzeToolsGap,
  analyzeToolsGapFromLayers,
  filterToTools,
  getToolsGapSummary,
  isGoodToolsFit,
} from './tools';

export {
  analyzeExperienceGap,
  analyzeExperienceGapFromLayers,
  detectExperienceTypes,
  extractRequiredTypesFromJD,
  getExperienceGapSummary,
  isGoodExperienceFit,
  getExperienceTypeDisplayName,
} from './experience';

export {
  analyzeSeniorityGap,
  analyzeSeniorityGapFromLayers,
  getSeniorityGapSummary,
  isSeniorityAcceptable,
} from './seniority';

export {
  analyzeIndustryGap,
  analyzeIndustryGapFromLayers,
  detectPrimaryIndustry,
  getIndustryGapSummary,
  isGoodIndustryFit,
  isCareerSwitch,
} from './industry';

// Import for aggregation
import { analyzeSkillsGapFromLayers } from './skills';
import { analyzeToolsGapFromLayers } from './tools';
import { analyzeExperienceGapFromLayers } from './experience';
import { analyzeSeniorityGapFromLayers } from './seniority';
import { analyzeIndustryGapFromLayers } from './industry';

// ==================== Aggregated Analysis ====================

/**
 * Perform complete gap analysis across all dimensions
 *
 * @param evaluation - Layer 1 evaluation results
 * @param layer4State - Layer 4 state
 * @param jobContext - Optional job context
 * @returns Complete gap analysis
 */
export function analyzeAllGaps(
  evaluation: Layer1Evaluation,
  layer4State: Layer4State,
  jobContext?: JobContext
): GapAnalysis {
  const jobRequirements = jobContext?.job_requirements;

  // Analyze each gap dimension
  const skillsGap = analyzeSkillsGapFromLayers(evaluation, jobRequirements);
  const toolsGap = analyzeToolsGapFromLayers(evaluation, jobRequirements);
  const experienceGap = analyzeExperienceGapFromLayers(evaluation, jobContext);
  const seniorityGap = analyzeSeniorityGapFromLayers(evaluation, layer4State, jobRequirements);
  const industryGap = analyzeIndustryGapFromLayers(evaluation, layer4State, jobContext);

  return {
    skills: skillsGap,
    tools: toolsGap,
    experience: experienceGap,
    seniority: seniorityGap,
    industry: industryGap,
  };
}

/**
 * Get a summary of all gaps for display
 *
 * @param gaps - Complete gap analysis
 * @returns Summary object with gap descriptions
 */
export function getGapsSummary(gaps: GapAnalysis): {
  skills: string;
  tools: string;
  experience: string;
  seniority: string;
  industry: string;
} {
  const { getSkillsGapSummary } = require('./skills');
  const { getToolsGapSummary } = require('./tools');
  const { getExperienceGapSummary } = require('./experience');
  const { getSeniorityGapSummary } = require('./seniority');
  const { getIndustryGapSummary } = require('./industry');

  return {
    skills: getSkillsGapSummary(gaps.skills),
    tools: getToolsGapSummary(gaps.tools),
    experience: getExperienceGapSummary(gaps.experience),
    seniority: getSeniorityGapSummary(gaps.seniority),
    industry: getIndustryGapSummary(gaps.industry),
  };
}

/**
 * Get the most critical gaps that need attention
 *
 * @param gaps - Complete gap analysis
 * @returns Array of critical gap descriptions
 */
export function getCriticalGaps(gaps: GapAnalysis): string[] {
  const critical: string[] = [];

  // Skills gaps
  if (gaps.skills.critical_missing.length > 0) {
    critical.push(`Missing critical skills: ${gaps.skills.critical_missing.slice(0, 3).join(', ')}`);
  }

  // Tools gaps
  if (gaps.tools.critical_missing.length > 0) {
    critical.push(`Missing critical tools: ${gaps.tools.critical_missing.slice(0, 3).join(', ')}`);
  }

  // Seniority mismatch
  if (gaps.seniority.alignment === 'underqualified') {
    critical.push(`Seniority gap: ${gaps.seniority.user_level} targeting ${gaps.seniority.role_expected}`);
  }

  // Low experience coverage
  if (gaps.experience.coverage_score < 50 && gaps.experience.missing_types.length > 2) {
    critical.push(`Missing experience types: ${gaps.experience.missing_types.slice(0, 2).join(', ')}`);
  }

  // Industry mismatch
  if (gaps.industry.match_percentage < 30) {
    critical.push('Significant industry gap - may be a career switch');
  }

  return critical;
}

/**
 * Calculate overall gap severity score
 *
 * @param gaps - Complete gap analysis
 * @returns Severity score (0-100, lower is better)
 */
export function calculateGapSeverity(gaps: GapAnalysis): number {
  let severity = 0;

  // Skills contribute 30%
  severity += (100 - gaps.skills.match_percentage) * 0.30;

  // Tools contribute 20%
  severity += (100 - gaps.tools.match_percentage) * 0.20;

  // Experience contributes 20%
  severity += (100 - gaps.experience.coverage_score) * 0.20;

  // Seniority contributes 15%
  if (gaps.seniority.alignment === 'underqualified') {
    severity += 15;
  } else if (gaps.seniority.alignment === 'overqualified') {
    severity += 5;
  }

  // Industry contributes 15%
  severity += (100 - gaps.industry.match_percentage) * 0.15;

  return Math.round(Math.min(severity, 100));
}
