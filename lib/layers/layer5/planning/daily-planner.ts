/**
 * Layer 5 - Orchestrator
 * Daily Planner
 *
 * Generates daily plans by slicing weekly plans.
 *
 * KEY REQUIREMENTS:
 * - STATELESS: All state from parameters
 * - DETERMINISTIC: Same inputs → Same outputs
 * - Time-boxed: Respects user's daily time budget
 * - Priority-balanced: Ensures mix of priorities
 *
 * Daily Plan = f(Weekly Plan, Today's Context, Config)
 */

import { FocusArea } from '../types';
import type {
  DailyPlan,
  Task,
  WeeklyPlan,
  Layer4StateForLayer5,
  OrchestratorConfig,
} from '../types';
import { generatePlanId, determineFocusArea } from './task-generator';
import { prioritizeTasks, isHighPriority } from './priority-scorer';
import { loadOrchestratorConfig, getDailyPlanningConfig } from '../config';

// ==================== Date Utilities ====================

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayDate(from: Date = new Date()): string {
  return from.toISOString().split('T')[0];
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string, from: Date = new Date()): boolean {
  return dateStr === getTodayDate(from);
}

/**
 * Get day of week (0 = Sunday, 1 = Monday, etc.)
 */
export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

/**
 * Get day name from date
 */
export function getDayName(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[getDayOfWeek(dateStr)];
}

// ==================== Task Selection ====================

/**
 * Find a task by ID in a list
 */
function findTask(tasks: Task[], taskId: string): Task | undefined {
  return tasks.find(t => t.task_id === taskId);
}

/**
 * Filter out completed tasks
 */
function filterCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => t.status !== 'completed');
}

/**
 * Fit tasks to a time budget using greedy knapsack
 * Prioritizes by priority score, then fits within budget
 */
export function fitTasksToTimeBudget(
  tasks: Task[],
  budgetMinutes: number
): Task[] {
  // Tasks should already be sorted by priority
  const selected: Task[] = [];
  let totalTime = 0;
  
  for (const task of tasks) {
    if (totalTime + task.estimated_minutes <= budgetMinutes) {
      selected.push(task);
      totalTime += task.estimated_minutes;
    } else if (selected.length === 0) {
      // Always include at least one task if the list is empty
      selected.push(task);
      break;
    }
  }
  
  return selected;
}

/**
 * Ensure at least one high-priority task is included
 */
function ensureHighPriorityTask(
  selectedTasks: Task[],
  candidateTasks: Task[]
): Task[] {
  // Check if we already have a high-priority task
  const hasHighPriority = selectedTasks.some(t => isHighPriority(t));
  
  if (hasHighPriority) {
    return selectedTasks;
  }
  
  // Find a high-priority task from candidates
  const highPriorityTask = candidateTasks.find(t => 
    isHighPriority(t) && !selectedTasks.some(s => s.task_id === t.task_id)
  );
  
  if (highPriorityTask) {
    // Replace the lowest priority task with the high-priority one
    const result = [...selectedTasks];
    if (result.length > 0) {
      // Sort to find lowest priority
      result.sort((a, b) => a.priority - b.priority);
      result[0] = highPriorityTask;
      // Re-sort by priority descending
      result.sort((a, b) => b.priority - a.priority);
    } else {
      result.push(highPriorityTask);
    }
    return result;
  }
  
  return selectedTasks;
}

// ==================== Daily Plan Validation ====================

/**
 * Validate a daily plan
 */
export function validateDailyPlan(
  plan: DailyPlan,
  state: Layer4StateForLayer5
): { passed: boolean; issues: Array<{ code: string; severity: string; message: string }> } {
  const issues: Array<{ code: string; severity: string; message: string }> = [];
  
  // Rule 1: Warn if empty (but allow it)
  if (plan.tasks.length === 0) {
    issues.push({
      code: 'EMPTY_DAY',
      severity: 'warning',
      message: 'Daily plan has no tasks',
    });
  }
  
  // Rule 2: Must not exceed max tasks
  if (plan.tasks.length > 5) {
    issues.push({
      code: 'TOO_MANY_TASKS',
      severity: 'warning',
      message: `Daily plan has ${plan.tasks.length} tasks, max is 5`,
    });
  }
  
  // Rule 3: Estimated time must be reasonable (< 8 hours)
  if (plan.total_estimated_minutes > 480) {
    issues.push({
      code: 'EXCESSIVE_TIME',
      severity: 'warning',
      message: `Plan requires ${plan.total_estimated_minutes} min, unrealistic for one day`,
    });
  }
  
  // Rule 4: Tasks with dependencies must have deps in plan or completed
  const taskIds = new Set(plan.tasks.map(t => t.task_id));
  for (const task of plan.tasks) {
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          // Check if it's completed (status === 'completed')
          // For now, just warn - we'd need full task state to verify
          issues.push({
            code: 'MISSING_DEPENDENCY',
            severity: 'warning',
            message: `Task ${task.task_id} depends on ${depId} not in plan`,
          });
        }
      }
    }
  }
  
  const passed = !issues.some(i => i.severity === 'critical');
  return { passed, issues };
}

// ==================== Main Daily Plan Generation ====================

/**
 * Generate a daily plan from a weekly plan
 * STATELESS: All state from parameters
 * DETERMINISTIC: Same inputs → Same outputs
 */
export function generateDailyPlan(
  weeklyPlan: WeeklyPlan,
  state: Layer4StateForLayer5,
  date?: string,
  config?: OrchestratorConfig
): DailyPlan {
  const orchestratorConfig = config ?? loadOrchestratorConfig();
  const dailyConfig = getDailyPlanningConfig();
  const today = date ?? getTodayDate();
  
  // Step 1: Get candidate tasks from weekly plan
  let candidateTasks = [...weeklyPlan.task_pool];
  
  // Step 2: Filter out completed tasks
  candidateTasks = filterCompletedTasks(candidateTasks);
  
  // Step 3: Get daily hints for today
  const suggestedTaskIds = weeklyPlan.daily_plan_hints?.[today] ?? [];
  
  // Step 4: Select tasks for today (max 5)
  const todayTasks: Task[] = [];
  
  // Priority 1: Tasks from hints
  for (const taskId of suggestedTaskIds) {
    const task = findTask(candidateTasks, taskId);
    if (task && todayTasks.length < dailyConfig.max_tasks_per_day) {
      todayTasks.push(task);
    }
  }
  
  // Priority 2: High-priority tasks not in hints
  const remaining = candidateTasks.filter(
    t => !suggestedTaskIds.includes(t.task_id)
  );
  const sortedRemaining = prioritizeTasks(
    remaining,
    state,
    weeklyPlan.strategy_mode,
    orchestratorConfig.priority_scoring
  );
  
  for (const task of sortedRemaining) {
    if (todayTasks.length >= dailyConfig.max_tasks_per_day) {
      break;
    }
    if (!todayTasks.some(t => t.task_id === task.task_id)) {
      todayTasks.push(task);
    }
  }
  
  // Step 5: Re-prioritize for today (apply time decay, urgency)
  const reprioritizedTasks = prioritizeTasks(
    todayTasks,
    state,
    weeklyPlan.strategy_mode,
    orchestratorConfig.priority_scoring
  );
  
  // Step 6: Respect time budget
  let finalTasks = fitTasksToTimeBudget(
    reprioritizedTasks,
    dailyConfig.time_budget_minutes
  );
  
  // Step 7: Ensure at least one high-priority task if configured
  if (dailyConfig.require_one_high_priority) {
    finalTasks = ensureHighPriorityTask(finalTasks, candidateTasks);
  }
  
  // Step 8: Determine focus area
  const focusArea = determineFocusArea(finalTasks);
  
  // Step 9: Calculate total estimated time
  const totalEstimatedMinutes = finalTasks.reduce(
    (sum, t) => sum + t.estimated_minutes,
    0
  );
  
  // Step 10: Create plan
  const plan: DailyPlan = {
    plan_id: generatePlanId('daily'),
    date: today,
    focus_area: focusArea,
    tasks: finalTasks,
    total_estimated_minutes: totalEstimatedMinutes,
    generated_from_weekly_plan_id: weeklyPlan.plan_id,
    input_state_version: state.state_version,
    generated_at: new Date().toISOString(),
  };
  
  // Step 11: Validate and log warnings
  const validation = validateDailyPlan(plan, state);
  if (!validation.passed) {
    console.warn('[Layer5] Daily plan validation failed:', validation.issues);
  }
  
  return plan;
}

// ==================== Plan Summary ====================

/**
 * Get a summary of the daily plan
 */
export function getDailyPlanSummary(plan: DailyPlan): {
  date: string;
  dayName: string;
  taskCount: number;
  totalMinutes: number;
  focusArea: FocusArea;
  priorities: { high: number; medium: number; low: number };
} {
  const priorities = {
    high: plan.tasks.filter(t => t.priority >= 70).length,
    medium: plan.tasks.filter(t => t.priority >= 40 && t.priority < 70).length,
    low: plan.tasks.filter(t => t.priority < 40).length,
  };
  
  return {
    date: plan.date,
    dayName: getDayName(plan.date),
    taskCount: plan.tasks.length,
    totalMinutes: plan.total_estimated_minutes,
    focusArea: plan.focus_area,
    priorities,
  };
}

/**
 * Format daily plan for display
 */
export function formatDailyPlan(plan: DailyPlan): string {
  const summary = getDailyPlanSummary(plan);
  const lines: string[] = [];
  
  lines.push(`📅 ${summary.dayName}'s Plan (${summary.date})`);
  lines.push(`⏱️ Estimated time: ${summary.totalMinutes} minutes`);
  lines.push(`🎯 Focus: ${summary.focusArea}`);
  lines.push('');
  lines.push('Tasks:');
  
  for (let i = 0; i < plan.tasks.length; i++) {
    const task = plan.tasks[i];
    const priorityIcon = task.priority >= 70 ? '🔴' : task.priority >= 40 ? '🟡' : '🟢';
    lines.push(`${i + 1}. ${priorityIcon} ${task.title} (${task.estimated_minutes} min)`);
  }
  
  return lines.join('\n');
}
