/**
 * Layer 5 - Orchestrator
 * Staleness Handler
 *
 * Handles stale state by generating safe, minimal plans.
 * Prioritizes state refresh over risky actions.
 */

import { StrategyMode, FocusArea, ActionType } from '../types';
import type {
  WeeklyPlan,
  DailyPlan,
  Task,
  Layer4StateForLayer5,
  StalenessSeverity,
} from '../types';
import { generatePlanId, createRefreshTask, createFollowUpTask } from '../planning/task-generator';
import { getCurrentMonday, getNextSunday } from '../planning/weekly-planner';
import { getTodayDate, determineFocusArea } from '../planning';

// ==================== Staleness Assessment ====================

/**
 * Assess the severity of stale state
 */
export function assessStaleness(state: Layer4StateForLayer5): {
  severity: StalenessSeverity;
  reason: string;
  daysSinceActivity: number;
} {
  // Check explicit staleness
  if (state.freshness?.is_stale) {
    return {
      severity: state.freshness.staleness_severity || 'warning',
      reason: state.freshness.staleness_reason || 'State marked as stale',
      daysSinceActivity: 0, // Unknown
    };
  }
  
  // Check computed_at timestamp
  if (state.computed_at) {
    const computedAt = new Date(state.computed_at);
    const now = new Date();
    const daysSince = Math.floor(
      (now.getTime() - computedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSince > 14) {
      return {
        severity: 'critical',
        reason: `State is ${daysSince} days old`,
        daysSinceActivity: daysSince,
      };
    }
    
    if (daysSince > 7) {
      return {
        severity: 'warning',
        reason: `State is ${daysSince} days old`,
        daysSinceActivity: daysSince,
      };
    }
    
    return {
      severity: 'none',
      reason: 'State is fresh',
      daysSinceActivity: daysSince,
    };
  }
  
  return {
    severity: 'none',
    reason: 'Unable to determine staleness',
    daysSinceActivity: 0,
  };
}

/**
 * Check if state is critically stale
 */
export function isCriticallyStale(state: Layer4StateForLayer5): boolean {
  const assessment = assessStaleness(state);
  return assessment.severity === 'critical';
}

/**
 * Check if state has warning-level staleness
 */
export function hasStaleWarning(state: Layer4StateForLayer5): boolean {
  const assessment = assessStaleness(state);
  return assessment.severity === 'warning';
}

// ==================== Safe Plan Generation ====================

/**
 * Generate a minimal safe weekly plan for stale state
 * This prioritizes state refresh and includes only safe tasks
 */
export function generateStalePlan(
  state: Layer4StateForLayer5,
  reason?: string
): WeeklyPlan {
  const staleness = assessStaleness(state);
  const staleReason = reason || staleness.reason;
  const weekStart = getCurrentMonday();
  const weekEnd = getNextSunday(weekStart);
  
  const tasks: Task[] = [];
  
  // Priority 1: Refresh state task (highest priority)
  tasks.push(createRefreshTask(staleReason, 100));
  
  // Priority 2: Safe follow-up tasks (limited)
  // Follow-ups are safe because they don't create new commitments
  const followUps = state.followups?.applications_needing_followup ?? [];
  const safeFollowUps = followUps
    .filter(f => f.suggested_action === 'FOLLOW_UP')
    .slice(0, 3); // Limit to 3
  
  for (const followUp of safeFollowUps) {
    tasks.push(createFollowUpTask(followUp, 70));
  }
  
  // Determine strategy mode - use existing or fallback
  const strategyMode = state.current_strategy_mode ?? StrategyMode.IMPROVE_RESUME_FIRST;
  
  return {
    plan_id: generatePlanId('weekly'),
    week_start: weekStart,
    week_end: weekEnd,
    strategy_mode: strategyMode,
    target_applications: 0, // No applications when state is stale
    focus_mix: {
      [FocusArea.APPLICATIONS]: 0,
      [FocusArea.RESUME_IMPROVEMENT]: 0,
      [FocusArea.FOLLOW_UPS]: safeFollowUps.length > 0 ? 0.3 : 0,
      [FocusArea.STRATEGY]: safeFollowUps.length > 0 ? 0.7 : 1.0,
    },
    task_pool: tasks,
    input_state_version: state.state_version,
    strategy_analysis_version: '2.1',
    generated_at: new Date().toISOString(),
  };
}

/**
 * Generate a minimal safe daily plan for stale state
 */
export function generateStaleDailyPlan(
  state: Layer4StateForLayer5,
  weeklyPlan?: WeeklyPlan,
  date?: string
): DailyPlan {
  const today = date ?? getTodayDate();
  
  // If we have a stale weekly plan, use its tasks
  const tasks: Task[] = weeklyPlan?.task_pool.slice(0, 2) ?? [];
  
  // Ensure refresh task is first
  const hasRefreshTask = tasks.some(t => t.action_type === ActionType.REFRESH_STATE);
  if (!hasRefreshTask) {
    const staleness = assessStaleness(state);
    tasks.unshift(createRefreshTask(staleness.reason, 100));
  }
  
  // Limit to 2 tasks for stale state
  const limitedTasks = tasks.slice(0, 2);
  
  return {
    plan_id: generatePlanId('daily'),
    date: today,
    focus_area: FocusArea.STRATEGY,
    tasks: limitedTasks,
    total_estimated_minutes: limitedTasks.reduce((sum, t) => sum + t.estimated_minutes, 0),
    generated_from_weekly_plan_id: weeklyPlan?.plan_id,
    input_state_version: state.state_version,
    generated_at: new Date().toISOString(),
  };
}

// ==================== Staleness Recovery ====================

/**
 * Get recovery guidance for stale state
 */
export function getRecoveryGuidance(state: Layer4StateForLayer5): {
  title: string;
  steps: string[];
  estimatedTime: number;
} {
  const steps: string[] = [];
  let estimatedTime = 0;
  
  // Check what's stale
  if (!state.resume?.last_resume_update) {
    steps.push('Upload or update your resume');
    estimatedTime += 10;
  }
  
  if (!state.resume?.resume_score) {
    steps.push('Get your resume scored');
    estimatedTime += 5;
  }
  
  if (!state.user_profile?.target_roles?.length) {
    steps.push('Set your target roles');
    estimatedTime += 5;
  }
  
  const assessment = assessStaleness(state);
  if (assessment.daysSinceActivity > 7) {
    steps.push('Review and update your recent applications');
    estimatedTime += 10;
  }
  
  if (steps.length === 0) {
    steps.push('Review your profile information');
    estimatedTime += 5;
  }
  
  return {
    title: 'Update your information to get personalized recommendations',
    steps,
    estimatedTime,
  };
}

/**
 * Check if state has recovered from staleness
 */
export function hasRecoveredFromStaleness(
  oldState: Layer4StateForLayer5,
  newState: Layer4StateForLayer5
): boolean {
  const oldAssessment = assessStaleness(oldState);
  const newAssessment = assessStaleness(newState);
  
  // Check if severity improved
  const severityOrder = { none: 0, warning: 1, critical: 2 };
  const oldSeverity = severityOrder[oldAssessment.severity] ?? 0;
  const newSeverity = severityOrder[newAssessment.severity] ?? 0;
  
  return newSeverity < oldSeverity;
}

/**
 * Get staleness summary for display
 */
export function getStalenessDisplay(state: Layer4StateForLayer5): {
  icon: string;
  status: string;
  message: string;
  actionRequired: boolean;
} {
  const assessment = assessStaleness(state);
  
  if (assessment.severity === 'critical') {
    return {
      icon: '🔴',
      status: 'Critically Outdated',
      message: 'Your information is significantly out of date. Please update before continuing.',
      actionRequired: true,
    };
  }
  
  if (assessment.severity === 'warning') {
    return {
      icon: '🟡',
      status: 'Needs Refresh',
      message: 'Some information may be outdated. Consider updating for better recommendations.',
      actionRequired: false,
    };
  }
  
  return {
    icon: '🟢',
    status: 'Up to Date',
    message: 'Your information is current.',
    actionRequired: false,
  };
}
