/**
 * Layer 5 - Orchestrator (The Decision-Making Brain)
 * Main Orchestration Facade
 *
 * This is THE BRAIN that coordinates all other layers into actionable plans.
 *
 * KEY CHARACTERISTICS:
 * - STATELESS: All state from Layer 4 (no cached decisions)
 * - DETERMINISTIC: Same inputs → Same outputs
 * - EVIDENCE-ANCHORED: Every task has `why_now` and `evidence_refs`
 *
 * Integration Flow:
 * 1. Reads state from Layer 4
 * 2. Uses analysis from Layer 2
 * 3. Calls Layer 3 for rewriting
 * 4. Calls Layer 1 for re-scoring
 * 5. Generates weekly/daily plans
 * 6. Executes actions
 */

import type {
  WeeklyPlan,
  DailyPlan,
  Task,
  ProgressSnapshot,
  ReplanTrigger,
  Layer4StateForLayer5,
  Layer2AnalysisForLayer5,
  ActionExecution,
  PlanningContext,
} from './types';
import { StrategyMode, LayerEventType } from './types';
import { loadOrchestratorConfig } from './config';
import {
  generateWeeklyPlan,
  generateDailyPlan,
  validateWeeklyPlan,
  validateDailyPlan,
  getCurrentMonday,
} from './planning';
import { executeAction, executeActions, getExecutionSummary } from './execution';
import {
  trackWeeklyProgress,
  trackDailyProgress,
  shouldReplan,
  shouldReplanWeekly,
  shouldReplanDaily,
} from './tracking';
import { validateState, isStateValidForPlanning } from './state';
import { isCriticallyStale, generateStalePlan, generateStaleDailyPlan } from './state';
import {
  OrchestratorError,
  OrchestratorErrorCode,
  createMissingStateError,
  createPlanGenerationError,
  logError,
} from './errors';

// ==================== Plan Generation ====================

/**
 * Generate a weekly plan for a user
 *
 * STATELESS: All state from parameters
 * DETERMINISTIC: Same inputs → Same outputs
 *
 * @param state - User state from Layer 4
 * @param analysis - Strategy analysis from Layer 2
 * @returns Weekly plan with evidence-anchored tasks
 */
export function orchestrateWeeklyPlan(
  state: Layer4StateForLayer5,
  analysis: Layer2AnalysisForLayer5
): WeeklyPlan {
  // Validate state
  const validation = validateState(state);
  if (!validation.passed) {
    // For critical issues, generate a minimal safe plan
    if (isCriticallyStale(state)) {
      return generateStalePlan(state, 'Critical state issues');
    }
  }

  // Generate the plan
  const config = loadOrchestratorConfig();
  return generateWeeklyPlan(state, analysis, config);
}

/**
 * Generate a daily plan for a user
 *
 * @param weeklyPlan - The active weekly plan
 * @param state - User state from Layer 4
 * @param date - Optional date (defaults to today)
 * @returns Daily plan with 3-5 tasks
 */
export function orchestrateDailyPlan(
  weeklyPlan: WeeklyPlan,
  state: Layer4StateForLayer5,
  date?: string
): DailyPlan {
  // Check for stale state
  if (isCriticallyStale(state)) {
    return generateStaleDailyPlan(state, weeklyPlan, date);
  }

  const config = loadOrchestratorConfig();
  return generateDailyPlan(weeklyPlan, state, date, config);
}

// ==================== Action Execution ====================

/**
 * Execute a single task
 *
 * @param task - Task to execute
 * @param state - User state from Layer 4
 * @returns Execution result with evidence
 */
export async function orchestrateAction(
  task: Task,
  state: Layer4StateForLayer5
): Promise<ActionExecution> {
  return executeAction(task, state);
}

/**
 * Execute multiple tasks
 *
 * @param tasks - Tasks to execute
 * @param state - User state from Layer 4
 * @returns Array of execution results
 */
export async function orchestrateActions(
  tasks: Task[],
  state: Layer4StateForLayer5
): Promise<ActionExecution[]> {
  return executeActions(tasks, state);
}

// ==================== Progress Tracking ====================

/**
 * Track progress on a weekly plan
 *
 * @param plan - Weekly plan to track
 * @param state - Current user state
 * @returns Progress snapshot with completion percentage and blockers
 */
export function trackWeeklyPlanProgress(
  plan: WeeklyPlan,
  state: Layer4StateForLayer5
): ProgressSnapshot {
  return trackWeeklyProgress(plan, state);
}

/**
 * Track progress on a daily plan
 *
 * @param plan - Daily plan to track
 * @param state - Current user state
 * @returns Progress snapshot
 */
export function trackDailyPlanProgress(
  plan: DailyPlan,
  state: Layer4StateForLayer5
): ProgressSnapshot {
  return trackDailyProgress(plan, state);
}

// ==================== Re-planning ====================

/**
 * Check if re-planning is needed
 *
 * @param weeklyPlan - Current weekly plan
 * @param dailyPlan - Current daily plan
 * @param state - Current user state
 * @param analysis - Optional new analysis (for mode change detection)
 * @param recentEvents - Optional recent events
 * @returns Re-plan trigger information
 */
export function checkReplanNeeded(
  weeklyPlan: WeeklyPlan,
  dailyPlan: DailyPlan,
  state: Layer4StateForLayer5,
  analysis?: Layer2AnalysisForLayer5,
  recentEvents?: LayerEventType[]
): ReplanTrigger {
  return shouldReplan(
    weeklyPlan,
    dailyPlan,
    state,
    analysis ? { recommended_mode: analysis.recommended_mode } : undefined,
    recentEvents
  );
}

// ==================== Planning Context ====================

/**
 * Get complete planning context for the Coach (Layer 8)
 *
 * This provides all the information the Coach needs to explain
 * the plan to the user.
 *
 * @param weeklyPlan - Current weekly plan
 * @param dailyPlan - Current daily plan
 * @param state - Current user state
 * @param analysis - Strategy analysis
 * @returns Planning context with strategy and activity info
 */
export function getPlanningContext(
  weeklyPlan: WeeklyPlan,
  dailyPlan: DailyPlan,
  state: Layer4StateForLayer5,
  analysis: Layer2AnalysisForLayer5
): PlanningContext {
  const weeklyProgress = trackWeeklyProgress(weeklyPlan, state);

  return {
    weekly_plan: weeklyPlan,
    today_plan: dailyPlan,
    strategy_context: {
      current_mode: weeklyPlan.strategy_mode,
      mode_reasoning: analysis.mode_reasoning.primary_reason,
      weekly_target: weeklyPlan.target_applications,
      target_rationale: `Based on ${weeklyPlan.strategy_mode} mode and your current state`,
    },
    recent_activity: {
      completed_tasks_this_week: weeklyProgress.completed_tasks,
      progress_percentage: weeklyProgress.completion_percentage,
      deviations: [],
    },
  };
}

// ==================== Task Management ====================

/**
 * Get a task by ID from a plan
 */
export function getTaskById(
  plan: WeeklyPlan | DailyPlan,
  taskId: string
): Task | undefined {
  const tasks = 'task_pool' in plan ? plan.task_pool : plan.tasks;
  return tasks.find(t => t.task_id === taskId);
}

/**
 * Update a task's status
 */
export function updateTaskStatus(
  plan: WeeklyPlan | DailyPlan,
  taskId: string,
  status: Task['status']
): WeeklyPlan | DailyPlan {
  if ('task_pool' in plan) {
    return {
      ...plan,
      task_pool: plan.task_pool.map(t =>
        t.task_id === taskId ? { ...t, status } : t
      ),
    };
  }
  
  return {
    ...plan,
    tasks: plan.tasks.map(t =>
      t.task_id === taskId ? { ...t, status } : t
    ),
  };
}

/**
 * Mark a task as completed
 */
export function markTaskCompleted(
  plan: WeeklyPlan | DailyPlan,
  taskId: string
): WeeklyPlan | DailyPlan {
  return updateTaskStatus(plan, taskId, 'completed');
}

/**
 * Mark a task as skipped
 */
export function markTaskSkipped(
  plan: WeeklyPlan | DailyPlan,
  taskId: string
): WeeklyPlan | DailyPlan {
  return updateTaskStatus(plan, taskId, 'skipped');
}

// ==================== Validation ====================

/**
 * Validate that state is ready for planning
 */
export function validateStateForPlanning(
  state: Layer4StateForLayer5
): { valid: boolean; issues: string[] } {
  const result = validateState(state);
  return {
    valid: result.passed,
    issues: result.issues.map(i => i.message),
  };
}

/**
 * Validate a generated weekly plan
 */
export function validateGeneratedWeeklyPlan(
  plan: WeeklyPlan,
  state: Layer4StateForLayer5
): { valid: boolean; issues: string[] } {
  const result = validateWeeklyPlan(plan, state);
  return {
    valid: result.passed,
    issues: result.issues.map(i => i.message),
  };
}

/**
 * Validate a generated daily plan
 */
export function validateGeneratedDailyPlan(
  plan: DailyPlan,
  state: Layer4StateForLayer5
): { valid: boolean; issues: string[] } {
  const result = validateDailyPlan(plan, state);
  return {
    valid: result.passed,
    issues: result.issues.map(i => i.message),
  };
}

// ==================== High-Level Orchestration ====================

/**
 * Full orchestration cycle
 *
 * This is the main entry point that orchestrates the complete
 * planning and execution cycle.
 *
 * @param state - User state from Layer 4
 * @param analysis - Strategy analysis from Layer 2
 * @param existingWeeklyPlan - Optional existing weekly plan
 * @param existingDailyPlan - Optional existing daily plan
 * @returns Complete planning result
 */
export function orchestrate(
  state: Layer4StateForLayer5,
  analysis: Layer2AnalysisForLayer5,
  existingWeeklyPlan?: WeeklyPlan,
  existingDailyPlan?: DailyPlan
): {
  weeklyPlan: WeeklyPlan;
  dailyPlan: DailyPlan;
  context: PlanningContext;
  replanNeeded: ReplanTrigger;
} {
  // Determine if we need new plans
  let weeklyPlan = existingWeeklyPlan;
  let dailyPlan = existingDailyPlan;

  // Generate weekly plan if needed
  if (!weeklyPlan) {
    weeklyPlan = orchestrateWeeklyPlan(state, analysis);
  } else {
    // Check if re-plan is needed
    const replanTrigger = shouldReplanWeekly(weeklyPlan, state, { recommended_mode: analysis.recommended_mode });
    if (replanTrigger.should_replan) {
      weeklyPlan = orchestrateWeeklyPlan(state, analysis);
    }
  }

  // Generate daily plan if needed
  if (!dailyPlan) {
    dailyPlan = orchestrateDailyPlan(weeklyPlan, state);
  } else {
    // Check if daily re-plan is needed
    const replanTrigger = shouldReplanDaily(dailyPlan, state);
    if (replanTrigger.should_replan) {
      dailyPlan = orchestrateDailyPlan(weeklyPlan, state);
    }
  }

  // Get context for Coach
  const context = getPlanningContext(weeklyPlan, dailyPlan, state, analysis);

  // Check for future re-plan needs
  const replanNeeded = checkReplanNeeded(weeklyPlan, dailyPlan, state, analysis);

  return {
    weeklyPlan,
    dailyPlan,
    context,
    replanNeeded,
  };
}

// ==================== Export Types ====================

// Re-export all types for convenience
export type {
  WeeklyPlan,
  DailyPlan,
  Task,
  ProgressSnapshot,
  ReplanTrigger,
  Layer4StateForLayer5,
  Layer2AnalysisForLayer5,
  ActionExecution,
  PlanningContext,
};

export { StrategyMode, LayerEventType };
