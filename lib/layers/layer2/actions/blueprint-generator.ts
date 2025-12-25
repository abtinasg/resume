/**
 * Layer 2 - Strategy Engine
 * Action Blueprint Generator
 *
 * Generates machine-actionable blueprints for Layer 5 (Orchestrator).
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 8.5
 */

import type {
  ActionBlueprint,
  BlueprintActionType,
  ConfidenceLevel,
  GapAnalysis,
  Layer1Evaluation,
  Layer4State,
  ModeReasoning,
} from '../types';
import { StrategyMode } from '../types';
import { getLimitsConfig, getStrategyThresholds } from '../config';

// ==================== Types ====================

interface BlueprintGeneratorInput {
  /** Recommended strategy mode */
  recommendedMode: StrategyMode;
  /** Mode reasoning */
  modeReasoning: ModeReasoning;
  /** Gap analysis results */
  gaps: GapAnalysis;
  /** Layer 1 evaluation */
  evaluation: Layer1Evaluation;
  /** Layer 4 state */
  layer4State: Layer4State;
}

// ==================== Main Generator Function ====================

/**
 * Generate action blueprints based on analysis
 *
 * @param input - Blueprint generator input
 * @returns Array of action blueprints (3-7 items)
 */
export function generateActionBlueprints(input: BlueprintGeneratorInput): ActionBlueprint[] {
  const {
    recommendedMode,
    modeReasoning,
    gaps,
    evaluation,
    layer4State,
  } = input;

  const blueprints: ActionBlueprint[] = [];
  const thresholds = getStrategyThresholds();
  const limits = getLimitsConfig();

  // Generate blueprints based on mode
  switch (recommendedMode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      blueprints.push(...generateImproveBlueprints(gaps, evaluation, thresholds));
      break;

    case StrategyMode.APPLY_MODE:
      blueprints.push(...generateApplyBlueprints(gaps, evaluation, layer4State));
      break;

    case StrategyMode.RETHINK_TARGETS:
      blueprints.push(...generateRethinkBlueprints(gaps, evaluation, layer4State));
      break;
  }

  // Add follow-up blueprints if applicable
  blueprints.push(...generateFollowUpBlueprints(layer4State));

  // Add gap-based improvement blueprints if not already covered
  blueprints.push(...generateGapBlueprints(gaps, recommendedMode));

  // Ensure minimum number of blueprints
  while (blueprints.length < limits.min_action_blueprints) {
    blueprints.push(generateDefaultBlueprint(recommendedMode, layer4State, blueprints.length));
  }

  // Sort by priority and limit
  blueprints.sort((a, b) => b.priority - a.priority);

  // Return limited set
  return blueprints.slice(0, limits.max_action_blueprints);
}

/**
 * Generate a default blueprint when no specific action is needed
 */
function generateDefaultBlueprint(
  mode: StrategyMode,
  layer4State: Layer4State,
  existingCount: number
): ActionBlueprint {
  const priority = 5 - existingCount; // Lower priority for defaults

  switch (mode) {
    case StrategyMode.APPLY_MODE:
      return {
        type: 'apply_to_job',
        objective: 'Continue applying to well-matched positions',
        why: 'Maintaining application momentum improves chances of success',
        confidence: 'medium',
        priority,
      };
    case StrategyMode.IMPROVE_RESUME_FIRST:
      return {
        type: 'improve_resume',
        objective: 'Review and refine your resume content',
        entities: { section: 'experience' },
        why: 'Continuous improvement helps you stand out',
        confidence: 'medium',
        priority,
      };
    case StrategyMode.RETHINK_TARGETS:
      return {
        type: 'update_targets',
        objective: 'Research roles that match your experience',
        why: 'Finding the right fit improves success rate',
        confidence: 'medium',
        priority,
      };
    default:
      return {
        type: 'collect_missing_info',
        objective: 'Complete your profile for better recommendations',
        why: 'More information enables better guidance',
        confidence: 'low',
        priority,
      };
  }
}

// ==================== Mode-Specific Generators ====================

/**
 * Generate blueprints for IMPROVE_RESUME_FIRST mode
 */
function generateImproveBlueprints(
  gaps: GapAnalysis,
  evaluation: Layer1Evaluation,
  thresholds: { resume_score_min: number }
): ActionBlueprint[] {
  const blueprints: ActionBlueprint[] = [];
  const resumeScore = evaluation.resume_score;

  // Critical: Address missing skills
  if (gaps.skills.critical_missing.length > 0) {
    blueprints.push({
      type: 'improve_resume',
      objective: `Add missing critical skills: ${gaps.skills.critical_missing.slice(0, 3).join(', ')}`,
      entities: { section: 'skills' },
      constraints: { max_items: 3 },
      why: `Resume score ${resumeScore} is below threshold ${thresholds.resume_score_min}. Missing ${gaps.skills.critical_missing.length} critical skills.`,
      confidence: 'high',
      priority: 10,
    });
  }

  // High: Strengthen weak bullets
  if (
    evaluation.weaknesses.includes('weak_verbs') ||
    evaluation.weaknesses.includes('no_metrics')
  ) {
    blueprints.push({
      type: 'improve_resume',
      objective: 'Strengthen experience bullets with metrics and action verbs',
      entities: { section: 'experience' },
      constraints: { max_items: 5, min_score_gain: 3 },
      why: 'Multiple bullets lack quantified metrics and strong action verbs',
      confidence: 'high',
      priority: 9,
    });
  }

  // Medium: Address missing tools
  if (gaps.tools.critical_missing.length > 0) {
    blueprints.push({
      type: 'improve_resume',
      objective: `Add missing tools: ${gaps.tools.critical_missing.slice(0, 3).join(', ')}`,
      entities: { section: 'skills' },
      constraints: { max_items: 3 },
      why: `Missing ${gaps.tools.critical_missing.length} critical tools for target roles`,
      confidence: 'high',
      priority: 8,
    });
  }

  // Address vague experience
  if (evaluation.weaknesses.includes('generic_descriptions')) {
    blueprints.push({
      type: 'improve_resume',
      objective: 'Make experience descriptions more specific and impactful',
      entities: { section: 'experience' },
      constraints: { max_items: 3 },
      why: 'Experience descriptions are too generic',
      confidence: 'medium',
      priority: 7,
    });
  }

  return blueprints;
}

/**
 * Generate blueprints for APPLY_MODE
 */
function generateApplyBlueprints(
  gaps: GapAnalysis,
  evaluation: Layer1Evaluation,
  layer4State: Layer4State
): ActionBlueprint[] {
  const blueprints: ActionBlueprint[] = [];
  const { pipeline_state, user_profile } = layer4State;

  // Calculate applications needed
  const weeklyTarget = user_profile.weekly_target ?? 8;
  const appsThisWeek = pipeline_state.applications_last_7_days;
  const appsNeeded = Math.max(0, weeklyTarget - appsThisWeek);

  if (appsNeeded > 0) {
    blueprints.push({
      type: 'apply_to_job',
      objective: `Apply to ${appsNeeded} more jobs this week`,
      constraints: { max_items: appsNeeded },
      why: `Currently at ${appsThisWeek}/${weeklyTarget} applications this week`,
      confidence: 'high',
      priority: 8,
    });
  } else {
    // On track, suggest quality applications
    blueprints.push({
      type: 'apply_to_job',
      objective: 'Continue applying to well-matched positions',
      constraints: { max_items: 3 },
      why: 'Weekly application target met. Focus on quality applications.',
      confidence: 'high',
      priority: 7,
    });
  }

  // If good fit but could improve
  if (gaps.skills.match_percentage < 80 && gaps.skills.critical_missing.length <= 2) {
    blueprints.push({
      type: 'improve_resume',
      objective: 'Tailor resume for target roles',
      entities: { section: 'skills' },
      why: 'Minor skill gaps could be addressed for better fit',
      confidence: 'medium',
      priority: 6,
    });
  }

  return blueprints;
}

/**
 * Generate blueprints for RETHINK_TARGETS mode
 */
function generateRethinkBlueprints(
  gaps: GapAnalysis,
  evaluation: Layer1Evaluation,
  layer4State: Layer4State
): ActionBlueprint[] {
  const blueprints: ActionBlueprint[] = [];
  const { pipeline_state } = layer4State;

  // Primary: Update targets
  blueprints.push({
    type: 'update_targets',
    objective: 'Rethink target roles based on low interview rate',
    why: `Interview rate ${(pipeline_state.interview_rate * 100).toFixed(1)}% is below threshold after ${pipeline_state.total_applications} applications`,
    confidence: 'high',
    priority: 10,
  });

  // Check for seniority mismatch
  if (gaps.seniority.alignment === 'underqualified') {
    blueprints.push({
      type: 'update_targets',
      objective: `Consider targeting ${gaps.seniority.user_level} level roles instead of ${gaps.seniority.role_expected}`,
      why: `Seniority gap: ${gaps.seniority.gap_years ?? 'several'} years of experience difference`,
      confidence: 'high',
      priority: 9,
    });
  }

  // Check for industry mismatch
  if (gaps.industry.match_percentage < 30) {
    blueprints.push({
      type: 'update_targets',
      objective: 'Consider roles in industries where you have experience',
      why: `Low industry alignment (${gaps.industry.match_percentage}%). May need industry-specific experience.`,
      confidence: 'medium',
      priority: 8,
    });
  }

  // Collect missing info if needed
  if (gaps.skills.confidence === 'low' || gaps.seniority.confidence === 'low') {
    blueprints.push({
      type: 'collect_missing_info',
      objective: 'Complete profile information for better recommendations',
      why: 'Some analysis has low confidence due to missing information',
      confidence: 'high',
      priority: 7,
    });
  }

  return blueprints;
}

/**
 * Generate follow-up blueprints
 */
function generateFollowUpBlueprints(layer4State: Layer4State): ActionBlueprint[] {
  const blueprints: ActionBlueprint[] = [];
  const { pipeline_state } = layer4State;

  // Check if there are applications to follow up on
  // (In real implementation, this would check specific application ages)
  if (
    pipeline_state.total_applications > 0 &&
    pipeline_state.interview_requests < pipeline_state.total_applications * 0.5
  ) {
    // Some applications might need follow-up
    blueprints.push({
      type: 'follow_up',
      objective: 'Follow up on pending applications',
      why: 'Some applications may benefit from a follow-up message',
      confidence: 'medium',
      priority: 6,
    });
  }

  return blueprints;
}

/**
 * Generate gap-based blueprints
 */
function generateGapBlueprints(
  gaps: GapAnalysis,
  mode: StrategyMode
): ActionBlueprint[] {
  const blueprints: ActionBlueprint[] = [];

  // Only add if not already in IMPROVE mode (to avoid duplicates)
  if (mode !== StrategyMode.IMPROVE_RESUME_FIRST) {
    // Experience gaps
    if (gaps.experience.missing_types.length > 2) {
      blueprints.push({
        type: 'improve_resume',
        objective: `Highlight ${gaps.experience.missing_types[0].replace(/_/g, ' ')} experience`,
        entities: { section: 'experience' },
        why: `Missing experience signals: ${gaps.experience.missing_types.slice(0, 2).join(', ')}`,
        confidence: 'medium',
        priority: 5,
      });
    }
  }

  return blueprints;
}

// ==================== Priority Actions Generator ====================

/**
 * Generate human-readable priority actions
 *
 * @param blueprints - Action blueprints
 * @param mode - Strategy mode
 * @returns Array of action strings (3-5 items)
 */
export function generatePriorityActions(
  blueprints: ActionBlueprint[],
  mode: StrategyMode
): string[] {
  const limits = getLimitsConfig();
  const actions: string[] = [];

  // Add mode-specific header action
  switch (mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      actions.push('Focus on improving your resume before applying');
      break;
    case StrategyMode.APPLY_MODE:
      actions.push('Resume is ready - focus on applications');
      break;
    case StrategyMode.RETHINK_TARGETS:
      actions.push('Review and adjust your target roles');
      break;
  }

  // Add actions from blueprints
  for (const blueprint of blueprints.slice(0, 4)) {
    actions.push(blueprint.objective);
  }

  // Ensure we have at least min items
  while (actions.length < limits.min_priority_actions) {
    actions.push('Keep your profile updated for better recommendations');
  }

  return actions.slice(0, limits.max_priority_actions);
}

// ==================== Key Insights Generator ====================

/**
 * Generate key insights from analysis
 *
 * @param gaps - Gap analysis
 * @param evaluation - Layer 1 evaluation
 * @param mode - Strategy mode
 * @returns Array of insight strings (3-7 items)
 */
export function generateKeyInsights(
  gaps: GapAnalysis,
  evaluation: Layer1Evaluation,
  mode: StrategyMode
): string[] {
  const limits = getLimitsConfig();
  const insights: string[] = [];

  // Resume quality insight
  if (evaluation.resume_score >= 80) {
    insights.push(`Strong resume quality (${evaluation.resume_score}/100)`);
  } else if (evaluation.resume_score >= 60) {
    insights.push(`Good resume quality (${evaluation.resume_score}/100) with room for improvement`);
  } else {
    insights.push(`Resume needs improvement (${evaluation.resume_score}/100)`);
  }

  // Skills insight
  if (gaps.skills.match_percentage >= 80) {
    insights.push(`Strong skills match (${gaps.skills.match_percentage}%)`);
  } else if (gaps.skills.critical_missing.length > 0) {
    insights.push(`Missing ${gaps.skills.critical_missing.length} critical skills`);
  }

  // Seniority insight
  if (gaps.seniority.alignment === 'aligned') {
    insights.push('Seniority level matches target roles');
  } else if (gaps.seniority.alignment === 'underqualified') {
    insights.push(`May be underqualified for ${gaps.seniority.role_expected} roles`);
  } else {
    insights.push(`May be overqualified for ${gaps.seniority.role_expected} roles`);
  }

  // Industry insight
  if (gaps.industry.match_percentage < 50) {
    insights.push('Limited industry-specific experience detected');
  }

  // Experience insight
  if (gaps.experience.coverage_score >= 70) {
    insights.push('Good demonstration of key experience types');
  } else if (gaps.experience.missing_types.length > 2) {
    insights.push('Consider highlighting more experience types');
  }

  // Mode-specific insight
  switch (mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      insights.push('Improving resume will increase interview chances');
      break;
    case StrategyMode.APPLY_MODE:
      insights.push('Good position to start applying to jobs');
      break;
    case StrategyMode.RETHINK_TARGETS:
      insights.push('Current approach may need adjustment');
      break;
  }

  // Ensure we have at least min items
  while (insights.length < limits.min_key_insights) {
    insights.push('Keep your profile updated for personalized insights');
  }

  return insights.slice(0, limits.max_key_insights);
}
