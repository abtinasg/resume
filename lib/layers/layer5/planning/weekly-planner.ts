/**
 * Layer 5 - Orchestrator
 * Weekly Planner
 *
 * Generates weekly plans by coordinating Layer 2 (Strategy) and Layer 4 (State).
 *
 * KEY REQUIREMENTS:
 * - STATELESS: All state from Layer 4
 * - DETERMINISTIC: Same inputs → Same outputs
 * - EVIDENCE-ANCHORED: Every task has why_now and evidence_refs
 *
 * Weekly Plan = f(Layer4 State, Layer2 Analysis, Config)
 */

import { StrategyMode, FocusArea } from '../types';
import type {
  WeeklyPlan,
  Task,
  FocusMix,
  DailyPlanHints,
  Layer4StateForLayer5,
  Layer2AnalysisForLayer5,
  OrchestratorConfig,
} from '../types';
import {
  generatePlanId,
  generateTaskId,
  createTaskFromBlueprint,
  createFollowUpTask,
  createRefreshTask,
  generateMinimalTasksFromActions,
} from './task-generator';
import { prioritizeTasks } from './priority-scorer';
import {
  loadOrchestratorConfig,
  MODE_BASE_TARGETS,
  MODE_FOCUS_PRESETS,
} from '../config';
import { ActionType } from '../types';

// ==================== Week Calculation ====================

/**
 * Get the Monday of the current or next week
 */
export function getNextMonday(from: Date = new Date()): string {
  const date = new Date(from);
  const day = date.getDay();
  // If Sunday (0), go back 6 days; otherwise go to next Monday
  const diff = day === 0 ? 1 : (8 - day) % 7 || 7;
  
  // If today is Monday and before noon, use today
  if (day === 1 && date.getHours() < 12) {
    return date.toISOString().split('T')[0];
  }
  
  // Otherwise, next Monday
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

/**
 * Get the Sunday of the week starting on the given Monday
 */
export function getNextSunday(mondayStr: string): string {
  const monday = new Date(mondayStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday.toISOString().split('T')[0];
}

/**
 * Get the current week's Monday
 */
export function getCurrentMonday(from: Date = new Date()): string {
  const date = new Date(from);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

// ==================== Weekly Target Calculation ====================

/**
 * Calculate weekly application target based on mode and state
 * DETERMINISTIC: Same inputs → Same outputs
 */
export function calculateWeeklyTarget(
  state: Layer4StateForLayer5,
  analysis: Layer2AnalysisForLayer5,
  config: OrchestratorConfig
): number {
  const { weekly_planning, state_freshness } = config;
  
  // Rule 1: If state is critically stale, freeze target
  if (
    state.freshness.is_stale &&
    state.freshness.staleness_severity === 'critical'
  ) {
    return state.user_profile.weeklyAppTarget ?? 0;
  }
  
  // Rule 2: User override (if valid)
  const userOverride = state.user_profile.weeklyAppTarget;
  if (userOverride !== undefined) {
    // Validate constraints
    if (userOverride >= 0 && userOverride <= weekly_planning.max_app_target) {
      // In APPLY_MODE, target must be >= 1
      if (
        analysis.recommended_mode === StrategyMode.APPLY_MODE &&
        userOverride < 1
      ) {
        // Invalid for mode, fall through to calculated
      } else {
        return userOverride;
      }
    }
  }
  
  // Rule 3: Calculate from mode
  const mode = analysis.recommended_mode;
  const [minTarget, maxTarget] = MODE_BASE_TARGETS[mode] ?? [5, 8];
  
  // For IMPROVE_RESUME_FIRST, minimal applications
  if (mode === StrategyMode.IMPROVE_RESUME_FIRST) {
    return minTarget;
  }
  
  // For RETHINK_TARGETS, reduced applications
  if (mode === StrategyMode.RETHINK_TARGETS) {
    return minTarget;
  }
  
  // For APPLY_MODE, check resume readiness
  const resumeScore = state.resume?.resume_score ?? 0;
  if (resumeScore < state_freshness.min_resume_score_for_apply) {
    return minTarget;
  }
  
  // Default to middle of range
  return Math.floor((minTarget + maxTarget) / 2);
}

// ==================== Focus Mix Calculation ====================

/**
 * Calculate focus mix based on mode and task distribution
 */
export function calculateFocusMix(
  taskPool: Task[],
  mode: StrategyMode
): FocusMix {
  // Start with mode preset
  const preset = MODE_FOCUS_PRESETS[mode] ?? MODE_FOCUS_PRESETS.APPLY_MODE;
  
  // Count tasks by focus area
  const counts: Record<FocusArea, number> = {
    [FocusArea.APPLICATIONS]: 0,
    [FocusArea.RESUME_IMPROVEMENT]: 0,
    [FocusArea.FOLLOW_UPS]: 0,
    [FocusArea.STRATEGY]: 0,
  };
  
  for (const task of taskPool) {
    switch (task.action_type) {
      case ActionType.IMPROVE_RESUME:
        counts[FocusArea.RESUME_IMPROVEMENT]++;
        break;
      case ActionType.APPLY_TO_JOB:
        counts[FocusArea.APPLICATIONS]++;
        break;
      case ActionType.FOLLOW_UP:
        counts[FocusArea.FOLLOW_UPS]++;
        break;
      default:
        counts[FocusArea.STRATEGY]++;
    }
  }
  
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
  
  if (total === 0) {
    // No tasks, use preset
    return {
      [FocusArea.APPLICATIONS]: preset.applications,
      [FocusArea.RESUME_IMPROVEMENT]: preset.resume_improvement,
      [FocusArea.FOLLOW_UPS]: preset.follow_ups,
      [FocusArea.STRATEGY]: preset.strategy,
    };
  }
  
  // Blend actual distribution with preset (70% actual, 30% preset)
  const blendWeight = 0.7;
  
  return {
    [FocusArea.APPLICATIONS]:
      blendWeight * (counts[FocusArea.APPLICATIONS] / total) +
      (1 - blendWeight) * preset.applications,
    [FocusArea.RESUME_IMPROVEMENT]:
      blendWeight * (counts[FocusArea.RESUME_IMPROVEMENT] / total) +
      (1 - blendWeight) * preset.resume_improvement,
    [FocusArea.FOLLOW_UPS]:
      blendWeight * (counts[FocusArea.FOLLOW_UPS] / total) +
      (1 - blendWeight) * preset.follow_ups,
    [FocusArea.STRATEGY]:
      blendWeight * (counts[FocusArea.STRATEGY] / total) +
      (1 - blendWeight) * preset.strategy,
  };
}

// ==================== Daily Hints Generation ====================

/**
 * Distribute tasks across the week as hints
 * DETERMINISTIC: Same inputs → Same outputs
 */
export function distributeTasksAcrossWeek(
  taskPool: Task[],
  weekStart: string,
  config: OrchestratorConfig
): DailyPlanHints {
  const hints: DailyPlanHints = {};
  const { max_tasks_per_day } = config.daily_planning;
  
  // Generate dates for the week (Mon-Sun)
  const dates: string[] = [];
  const startDate = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Sort tasks by priority (already prioritized)
  const sortedTasks = [...taskPool];
  
  // Distribute round-robin, prioritizing early week for high-priority
  let dayIndex = 0;
  for (const task of sortedTasks) {
    const date = dates[dayIndex];
    if (!hints[date]) {
      hints[date] = [];
    }
    
    hints[date].push(task.task_id);
    
    // Move to next day if current day is full
    if (hints[date].length >= max_tasks_per_day) {
      dayIndex = (dayIndex + 1) % 7;
    }
  }
  
  return hints;
}

// ==================== Minimal Safe Plan ====================

/**
 * Generate a minimal safe plan for critical stale state
 */
export function generateMinimalSafePlan(
  state: Layer4StateForLayer5,
  reason: string
): WeeklyPlan {
  const tasks: Task[] = [];
  const weekStart = getCurrentMonday();
  const weekEnd = getNextSunday(weekStart);
  
  // Priority 1: Refresh state task
  tasks.push(createRefreshTask(reason, 100));
  
  // Priority 2: Safe follow-up tasks (limited to 3)
  for (const followup of state.followups.applications_needing_followup.slice(0, 3)) {
    if (followup.suggested_action === 'FOLLOW_UP') {
      tasks.push(createFollowUpTask(followup, 70));
    }
  }
  
  return {
    plan_id: generatePlanId('weekly'),
    week_start: weekStart,
    week_end: weekEnd,
    strategy_mode: state.current_strategy_mode ?? StrategyMode.IMPROVE_RESUME_FIRST,
    target_applications: 0, // No applications until state is refreshed
    focus_mix: {
      [FocusArea.APPLICATIONS]: 0,
      [FocusArea.RESUME_IMPROVEMENT]: 0,
      [FocusArea.FOLLOW_UPS]: 0.3,
      [FocusArea.STRATEGY]: 0.7,
    },
    task_pool: tasks,
    input_state_version: state.state_version,
    strategy_analysis_version: '2.1',
    generated_at: new Date().toISOString(),
  };
}

// ==================== Plan Validation ====================

/**
 * Validate a weekly plan
 */
export function validateWeeklyPlan(
  plan: WeeklyPlan,
  state: Layer4StateForLayer5
): { passed: boolean; issues: Array<{ code: string; severity: string; message: string }> } {
  const issues: Array<{ code: string; severity: string; message: string }> = [];
  
  // Rule 1: Must have at least 1 task
  if (plan.task_pool.length === 0) {
    issues.push({
      code: 'EMPTY_PLAN',
      severity: 'critical',
      message: 'Weekly plan has no tasks',
    });
  }
  
  // Rule 2: Target applications must be reasonable
  if (plan.target_applications < 0 || plan.target_applications > 50) {
    issues.push({
      code: 'INVALID_TARGET',
      severity: 'critical',
      message: `Target ${plan.target_applications} out of range (0-50)`,
    });
  }
  
  // Rule 3: Tasks must have valid action types
  const validActionTypes = Object.values(ActionType);
  for (const task of plan.task_pool) {
    if (!validActionTypes.includes(task.action_type)) {
      issues.push({
        code: 'INVALID_ACTION_TYPE',
        severity: 'critical',
        message: `Task ${task.task_id} has invalid action type`,
      });
    }
  }
  
  // Rule 4: Focus mix must sum to ~1.0
  const focusSum = Object.values(plan.focus_mix).reduce((sum, v) => sum + v, 0);
  if (focusSum < 0.9 || focusSum > 1.1) {
    issues.push({
      code: 'INVALID_FOCUS_MIX',
      severity: 'warning',
      message: `Focus mix sums to ${focusSum.toFixed(2)}, expected ~1.0`,
    });
  }
  
  // Rule 5: Priority scores must be bounded
  for (const task of plan.task_pool) {
    if (task.priority < 0 || task.priority > 100) {
      issues.push({
        code: 'PRIORITY_OUT_OF_BOUNDS',
        severity: 'warning',
        message: `Task ${task.task_id} priority ${task.priority} not in [0,100]`,
      });
    }
  }
  
  // Rule 6: All tasks must have why_now (evidence-anchored)
  for (const task of plan.task_pool) {
    if (!task.why_now || task.why_now.length === 0) {
      issues.push({
        code: 'MISSING_WHY_NOW',
        severity: 'warning',
        message: `Task ${task.task_id} missing why_now (evidence anchoring)`,
      });
    }
  }
  
  const passed = !issues.some(i => i.severity === 'critical');
  return { passed, issues };
}

// ==================== Main Weekly Plan Generation ====================

/**
 * Generate a weekly plan
 * STATELESS: All state from parameters
 * DETERMINISTIC: Same inputs → Same outputs
 */
export function generateWeeklyPlan(
  state: Layer4StateForLayer5,
  analysis: Layer2AnalysisForLayer5,
  config?: OrchestratorConfig
): WeeklyPlan {
  const orchestratorConfig = config ?? loadOrchestratorConfig();
  const weekStart = getCurrentMonday();
  const weekEnd = getNextSunday(weekStart);
  
  // Step 1: Handle critical stale state
  if (
    state.freshness.is_stale &&
    state.freshness.staleness_severity === 'critical'
  ) {
    return generateMinimalSafePlan(
      state,
      state.freshness.staleness_reason ?? 'critical_staleness'
    );
  }
  
  // Step 2: Calculate weekly target
  const targetApplications = calculateWeeklyTarget(state, analysis, orchestratorConfig);
  
  // Step 3: Build task pool from blueprints
  let tasks: Task[] = [];
  
  // From Layer 2 action blueprints (always present in v2.1+)
  for (const blueprint of analysis.action_blueprints) {
    const task = createTaskFromBlueprint(blueprint, state);
    tasks.push(task);
  }
  
  // Fallback if no blueprints
  if (tasks.length === 0) {
    console.warn('[Layer5] No action_blueprints from Layer 2, using fallback');
    tasks = generateMinimalTasksFromActions(analysis.priority_actions, state);
  }
  
  // Step 4: Add follow-up tasks from Layer 4
  for (const followup of state.followups.applications_needing_followup) {
    if (followup.suggested_action === 'FOLLOW_UP') {
      tasks.push(createFollowUpTask(followup));
    }
  }
  
  // Step 5: Add refresh task if stale (warning level)
  if (state.freshness.is_stale && state.freshness.staleness_severity === 'warning') {
    tasks.push(
      createRefreshTask(
        state.freshness.staleness_reason ?? 'state_needs_refresh',
        90
      )
    );
  }
  
  // Step 6: Prioritize tasks
  const prioritizedTasks = prioritizeTasks(
    tasks,
    state,
    analysis.recommended_mode,
    orchestratorConfig.priority_scoring
  );
  
  // Step 7: Select top tasks (max from config)
  const taskPool = prioritizedTasks.slice(0, orchestratorConfig.weekly_planning.task_pool_max);
  
  // Step 8: Calculate focus mix
  const focusMix = calculateFocusMix(taskPool, analysis.recommended_mode);
  
  // Step 9: Generate daily hints
  const dailyPlanHints = distributeTasksAcrossWeek(
    taskPool,
    weekStart,
    orchestratorConfig
  );
  
  // Step 10: Create plan
  const plan: WeeklyPlan = {
    plan_id: generatePlanId('weekly'),
    week_start: weekStart,
    week_end: weekEnd,
    strategy_mode: analysis.recommended_mode,
    target_applications: targetApplications,
    focus_mix: focusMix,
    task_pool: taskPool,
    daily_plan_hints: dailyPlanHints,
    input_state_version: state.state_version,
    strategy_analysis_version: '2.1',
    generated_at: new Date().toISOString(),
  };
  
  // Step 11: Validate and log warnings
  const validation = validateWeeklyPlan(plan, state);
  if (!validation.passed) {
    console.warn('[Layer5] Weekly plan validation failed:', validation.issues);
  }
  
  return plan;
}
