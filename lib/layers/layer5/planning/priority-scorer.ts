/**
 * Layer 5 - Orchestrator
 * Priority Scorer
 *
 * Calculates task priorities based on:
 * - Impact: How much does this task move the needle?
 * - Urgency: How time-sensitive is this task?
 * - Alignment: How well does this fit the current strategy mode?
 * - Confidence: How confident are we in this recommendation?
 * - Time Cost: How much effort does this require?
 *
 * Formula:
 * Priority = clamp(0, 100,
 *   w_I * Impact + w_U * Urgency + w_A * Alignment + w_C * Confidence - w_T * TimeCost - Penalties
 * )
 *
 * REQUIREMENT: Deterministic - same inputs MUST produce same outputs
 */

import { ActionType, StrategyMode } from '../types';
import type {
  Task,
  PriorityScore,
  PriorityScoreBreakdown,
  Layer4StateForLayer5,
  PriorityScoringConfig,
} from '../types';
import {
  getPriorityScoringConfig,
  ALIGNMENT_MATRIX,
  ISSUE_SEVERITY,
} from '../config';

// ==================== Utility Functions ====================

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ==================== Impact Calculation ====================

/**
 * Calculate impact score for a task (0-100)
 * Impact = How much does this task move the needle?
 */
export function calculateImpact(
  task: Task,
  state: Layer4StateForLayer5,
  mode: StrategyMode,
  config: PriorityScoringConfig
): number {
  const { impact_factors } = config;
  let impact = 50; // Default baseline
  
  switch (task.action_type) {
    case ActionType.IMPROVE_RESUME: {
      // From estimated score gain
      const scoreGain = task.payload.estimated_score_gain ?? 5;
      
      // From issue severity
      const issues = task.payload.issues ?? [];
      const severityScore = issues.reduce((sum, issue) => {
        return sum + (ISSUE_SEVERITY[issue] ?? 10);
      }, 0);
      
      // Weighted combination
      impact = (scoreGain * 5) + severityScore;
      
      // Mode modifier: In IMPROVE_RESUME_FIRST, impact is higher
      if (mode === StrategyMode.IMPROVE_RESUME_FIRST) {
        impact *= 1.5;
      }
      
      // Apply impact factor
      impact *= impact_factors.resume_improvement;
      break;
    }
    
    case ActionType.APPLY_TO_JOB: {
      // From job match score
      const matchScore = task.payload.match_score ?? 50;
      
      // From pipeline scarcity (fewer applications = higher impact)
      const applicationsThisWeek = state.pipeline_state.applications_last_7_days;
      const weeklyTarget = state.user_profile.weeklyAppTarget ?? 10;
      const scarcity = 100 * (1 - applicationsThisWeek / Math.max(weeklyTarget, 1));
      
      // Weighted combination
      impact = (matchScore * 0.7) + (Math.max(0, scarcity) * 0.3);
      
      // Mode modifier: In APPLY_MODE, impact is higher
      if (mode === StrategyMode.APPLY_MODE) {
        impact *= 1.3;
      }
      
      // Apply impact factor
      impact *= impact_factors.application_submit;
      break;
    }
    
    case ActionType.FOLLOW_UP: {
      // From days since application (7-10 days = optimal)
      const daysSince = task.payload.days_since_application ?? 0;
      
      if (daysSince >= 7 && daysSince <= 10) {
        impact = 80; // Optimal window
      } else if (daysSince >= 5 && daysSince < 7) {
        impact = 50; // Slightly early
      } else if (daysSince > 10 && daysSince <= 14) {
        impact = 60; // Getting late
      } else {
        impact = 20; // Too early or too late
      }
      
      // Apply impact factor
      impact *= impact_factors.followup;
      break;
    }
    
    case ActionType.UPDATE_TARGETS:
    case ActionType.COLLECT_MISSING_INFO: {
      // Higher impact when in RETHINK mode
      impact = mode === StrategyMode.RETHINK_TARGETS ? 70 : 40;
      impact *= impact_factors.strategy_review;
      break;
    }
    
    case ActionType.REFRESH_STATE: {
      // High impact when state is stale
      impact = state.freshness.is_stale ? 85 : 30;
      break;
    }
    
    default:
      impact = 50;
  }
  
  return clamp(impact, 0, 100);
}

// ==================== Urgency Calculation ====================

/**
 * Calculate urgency score for a task (0-100)
 * Urgency = How time-sensitive is this task?
 */
export function calculateUrgency(
  task: Task,
  config: PriorityScoringConfig
): number {
  const { urgency_thresholds } = config;
  
  // If no due date, default to low urgency
  if (!task.due_at) {
    return 30;
  }
  
  const dueAt = new Date(task.due_at);
  const now = new Date();
  const hoursUntilDue = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Already overdue
  if (hoursUntilDue < 0) {
    return 100;
  }
  
  // Due within overdue threshold (e.g., 3 days)
  if (hoursUntilDue < urgency_thresholds.overdue_days * 24) {
    return 90;
  }
  
  // Due today
  if (hoursUntilDue < 24) {
    return 100;
  }
  
  // Due tomorrow
  if (hoursUntilDue < 48) {
    return 80;
  }
  
  // Due this week
  if (hoursUntilDue < urgency_thresholds.weekly_deadline * 24) {
    return 50;
  }
  
  // Due later
  return 20;
}

/**
 * Calculate urgency based on follow-up timing
 */
export function calculateFollowUpUrgency(daysSinceApplication: number): number {
  if (daysSinceApplication >= 7 && daysSinceApplication <= 10) {
    return 80; // Optimal window - urgent
  }
  if (daysSinceApplication > 10 && daysSinceApplication <= 14) {
    return 90; // Slightly late - very urgent
  }
  if (daysSinceApplication > 14) {
    return 70; // Late - still urgent but diminishing returns
  }
  if (daysSinceApplication >= 5 && daysSinceApplication < 7) {
    return 40; // Early - not urgent yet
  }
  return 20; // Too early
}

// ==================== Alignment Calculation ====================

/**
 * Calculate alignment score for a task (0-100)
 * Alignment = How well does this task fit the current strategy mode?
 */
export function calculateAlignment(
  task: Task,
  mode: StrategyMode
): number {
  const modeAlignments = ALIGNMENT_MATRIX[mode];
  
  if (!modeAlignments) {
    return 50; // Default if mode not found
  }
  
  return modeAlignments[task.action_type] ?? 50;
}

// ==================== Confidence Calculation ====================

/**
 * Calculate confidence score for a task (0-100)
 * Confidence = How confident are we in this recommendation?
 */
export function calculateConfidence(
  task: Task,
  state: Layer4StateForLayer5
): number {
  let confidence = 70; // Base confidence
  
  // Reduce if state is stale
  if (state.freshness.is_stale) {
    if (state.freshness.staleness_severity === 'critical') {
      confidence -= 40;
    } else if (state.freshness.staleness_severity === 'warning') {
      confidence -= 20;
    }
  }
  
  // Reduce if task has incomplete data
  if (task.payload.incomplete_data) {
    confidence -= 30;
  }
  
  // Increase if task has strong evidence
  const evidenceCount = task.evidence_refs?.length ?? 0;
  if (evidenceCount > 2) {
    confidence += 20;
  } else if (evidenceCount > 0) {
    confidence += 10;
  }
  
  return clamp(confidence, 0, 100);
}

// ==================== Time Cost Calculation ====================

/**
 * Calculate time cost score for a task (0-100)
 * Higher = more costly (will reduce priority)
 */
export function calculateTimeCost(task: Task): number {
  // Normalize estimated_minutes to 0-100
  // Assume max reasonable task time = 120 minutes
  const maxMinutes = 120;
  const cost = (task.estimated_minutes / maxMinutes) * 100;
  return clamp(cost, 0, 100);
}

// ==================== Penalties Calculation ====================

/**
 * Calculate penalties for a task
 * Returns total penalty points to subtract from priority
 */
export function calculatePenalties(
  task: Task,
  state: Layer4StateForLayer5,
  mode: StrategyMode,
  pendingTasks?: Task[]
): number {
  let penalty = 0;
  
  // Conflict penalty: Task doesn't align well with mode
  const alignment = calculateAlignment(task, mode);
  if (alignment < 40) {
    penalty += 20;
  }
  
  // Staleness penalty: Critical stale state
  if (state.freshness.is_stale && state.freshness.staleness_severity === 'critical') {
    penalty += 30;
  }
  
  // Dependency penalty: Dependencies not met
  if (task.dependencies && task.dependencies.length > 0 && pendingTasks) {
    for (const depId of task.dependencies) {
      const depTask = pendingTasks.find(t => t.task_id === depId);
      if (depTask && depTask.status !== 'completed') {
        penalty += 15;
      }
    }
  }
  
  return penalty;
}

// ==================== Main Priority Scoring ====================

/**
 * Calculate priority score for a task
 * DETERMINISTIC: Same inputs → Same outputs
 */
export function scorePriority(
  task: Task,
  state: Layer4StateForLayer5,
  mode: StrategyMode,
  config?: PriorityScoringConfig,
  pendingTasks?: Task[]
): PriorityScore {
  const scoringConfig = config ?? getPriorityScoringConfig();
  const notes: string[] = [];
  
  // Calculate sub-scores
  const impact = calculateImpact(task, state, mode, scoringConfig);
  notes.push(`Impact: ${impact.toFixed(1)} (${task.action_type})`);
  
  let urgency = calculateUrgency(task, scoringConfig);
  // Override urgency for follow-ups based on days since application
  if (task.action_type === ActionType.FOLLOW_UP && task.payload.days_since_application) {
    urgency = calculateFollowUpUrgency(task.payload.days_since_application);
  }
  notes.push(`Urgency: ${urgency.toFixed(1)}`);
  
  const alignment = calculateAlignment(task, mode);
  notes.push(`Alignment: ${alignment.toFixed(1)} (mode: ${mode})`);
  
  const confidence = calculateConfidence(task, state);
  notes.push(`Confidence: ${confidence.toFixed(1)}`);
  
  const timeCost = calculateTimeCost(task);
  notes.push(`Time cost: ${timeCost.toFixed(1)} (${task.estimated_minutes} min)`);
  
  const penalties = calculatePenalties(task, state, mode, pendingTasks);
  if (penalties > 0) {
    notes.push(`Penalties: -${penalties}`);
  }
  
  // Get weights (using defaults for confidence and time_cost if not in config)
  const {
    impact_weight,
    urgency_weight,
    alignment_weight,
    confidence_weight = 0.10,
    time_cost_weight = 0.10,
  } = scoringConfig;
  
  // Calculate weighted score
  const weightedScore =
    impact_weight * impact +
    urgency_weight * urgency +
    alignment_weight * alignment +
    confidence_weight * confidence -
    time_cost_weight * timeCost -
    penalties;
  
  const finalScore = clamp(Math.round(weightedScore), 0, 100);
  
  const breakdown: PriorityScoreBreakdown = {
    impact,
    urgency,
    alignment,
    confidence,
    time_cost: timeCost,
    penalties,
  };
  
  return {
    score: finalScore,
    breakdown,
    calculation_notes: notes,
  };
}

// ==================== Task Prioritization ====================

/**
 * Prioritize a list of tasks
 * DETERMINISTIC: Same inputs → Same outputs (stable sort with tiebreaker)
 */
export function prioritizeTasks(
  tasks: Task[],
  state: Layer4StateForLayer5,
  mode: StrategyMode,
  config?: PriorityScoringConfig
): Task[] {
  // Score all tasks
  const scoredTasks = tasks.map(task => {
    const priorityScore = scorePriority(task, state, mode, config, tasks);
    return {
      ...task,
      priority: priorityScore.score,
      _priorityBreakdown: priorityScore.breakdown,
    };
  });
  
  // Sort by priority (descending) with deterministic tiebreaker
  scoredTasks.sort((a, b) => {
    // Primary: Priority score
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    
    // Tiebreaker 1: Due date (closer first)
    if (a.due_at && b.due_at) {
      const dateCompare = new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      if (dateCompare !== 0) return dateCompare;
    } else if (a.due_at) {
      return -1; // a has due date, b doesn't
    } else if (b.due_at) {
      return 1; // b has due date, a doesn't
    }
    
    // Tiebreaker 2: Impact (higher first) - use breakdown if available
    const impactA = (a as Task & { _priorityBreakdown?: PriorityScoreBreakdown })._priorityBreakdown?.impact ?? 50;
    const impactB = (b as Task & { _priorityBreakdown?: PriorityScoreBreakdown })._priorityBreakdown?.impact ?? 50;
    if (impactA !== impactB) {
      return impactB - impactA;
    }
    
    // Tiebreaker 3: Time cost (lower first)
    if (a.estimated_minutes !== b.estimated_minutes) {
      return a.estimated_minutes - b.estimated_minutes;
    }
    
    // Tiebreaker 4: Task ID (stable sort)
    return a.task_id.localeCompare(b.task_id);
  });
  
  // Remove internal breakdown field before returning
  return scoredTasks.map(({ _priorityBreakdown, ...task }) => task as Task);
}

// ==================== Priority Level Helpers ====================

/**
 * Get priority level from score
 */
export function getPriorityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Check if task is high priority
 */
export function isHighPriority(task: Task): boolean {
  return task.priority >= 70;
}

/**
 * Check if task is medium priority
 */
export function isMediumPriority(task: Task): boolean {
  return task.priority >= 40 && task.priority < 70;
}

/**
 * Check if task is low priority
 */
export function isLowPriority(task: Task): boolean {
  return task.priority < 40;
}
