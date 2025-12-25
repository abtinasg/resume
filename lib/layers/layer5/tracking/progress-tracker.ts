/**
 * Layer 5 - Orchestrator
 * Progress Tracker
 *
 * Tracks plan progress and identifies blockers.
 * Provides real-time progress calculation for plans.
 */

import { ActionType, FocusArea } from '../types';
import type {
  Task,
  WeeklyPlan,
  DailyPlan,
  ProgressSnapshot,
  Blocker,
  Layer4StateForLayer5,
} from '../types';

// ==================== Progress Calculation ====================

/**
 * Calculate completion percentage from task statuses
 */
function calculateCompletionPercentage(tasks: Task[]): number {
  if (tasks.length === 0) return 100; // Empty plan is "complete"
  
  const completed = tasks.filter(t => t.status === 'completed').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  const skipped = tasks.filter(t => t.status === 'skipped').length;
  
  // Count completed, failed (as addressed), and skipped as "done"
  const done = completed + failed + skipped;
  return Math.round((done / tasks.length) * 100);
}

/**
 * Count tasks by status
 */
function countTasksByStatus(tasks: Task[]): {
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
  skipped: number;
} {
  return {
    pending: tasks.filter(t => t.status === 'pending' || !t.status).length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    skipped: tasks.filter(t => t.status === 'skipped').length,
  };
}

/**
 * Calculate time metrics
 */
function calculateTimeMetrics(tasks: Task[]): {
  spent: number;
  remaining: number;
} {
  let spent = 0;
  let remaining = 0;
  
  for (const task of tasks) {
    if (task.status === 'completed' || task.status === 'failed' || task.status === 'skipped') {
      // Assume task took estimated time (could track actual in future)
      spent += task.estimated_minutes;
    } else {
      remaining += task.estimated_minutes;
    }
  }
  
  return { spent, remaining };
}

// ==================== Blocker Detection ====================

/**
 * Detect blockers in tasks
 */
function detectBlockers(
  tasks: Task[],
  state: Layer4StateForLayer5
): Blocker[] {
  const blockers: Blocker[] = [];
  const taskMap = new Map(tasks.map(t => [t.task_id, t]));
  
  // Check for stale state blocker
  if (state.freshness.is_stale && state.freshness.staleness_severity === 'critical') {
    blockers.push({
      type: 'stale_state',
      description: `State is critically stale: ${state.freshness.staleness_reason}`,
      affected_tasks: tasks.map(t => t.task_id),
      resolution: 'Update your resume and application status',
    });
  }
  
  // Check for dependency blockers
  for (const task of tasks) {
    if (task.status === 'pending' && task.dependencies) {
      for (const depId of task.dependencies) {
        const depTask = taskMap.get(depId);
        if (depTask && depTask.status !== 'completed') {
          blockers.push({
            type: 'dependency',
            description: `Task "${task.title}" is waiting for "${depTask.title}"`,
            affected_tasks: [task.task_id],
            resolution: `Complete task: ${depTask.title}`,
          });
        }
      }
    }
  }
  
  // Check for failed task blockers
  const failedTasks = tasks.filter(t => t.status === 'failed');
  if (failedTasks.length > 0) {
    for (const failed of failedTasks) {
      // Check if any pending tasks depend on this
      const dependent = tasks.filter(t => 
        t.status === 'pending' && 
        t.dependencies?.includes(failed.task_id)
      );
      
      if (dependent.length > 0) {
        blockers.push({
          type: 'failed_task',
          description: `Failed task "${failed.title}" is blocking other tasks`,
          affected_tasks: dependent.map(t => t.task_id),
          resolution: 'Retry the failed task or skip dependent tasks',
        });
      }
    }
  }
  
  // Check for missing data blockers
  for (const task of tasks) {
    if (task.payload.incomplete_data && task.status === 'pending') {
      blockers.push({
        type: 'missing_data',
        description: `Task "${task.title}" has incomplete data`,
        affected_tasks: [task.task_id],
        resolution: 'Complete your profile with missing information',
      });
    }
  }
  
  return blockers;
}

// ==================== Application Progress ====================

/**
 * Calculate application progress for a weekly plan
 */
function calculateApplicationProgress(
  tasks: Task[],
  targetApplications: number,
  state: Layer4StateForLayer5
): { submitted: number; target: number } {
  // Count submitted applications from state
  const submitted = state.pipeline_state.applications_last_7_days;
  
  return {
    submitted,
    target: targetApplications,
  };
}

// ==================== Main Progress Tracking ====================

/**
 * Track progress for a weekly plan
 */
export function trackWeeklyProgress(
  plan: WeeklyPlan,
  state: Layer4StateForLayer5
): ProgressSnapshot {
  const statusCounts = countTasksByStatus(plan.task_pool);
  const timeMetrics = calculateTimeMetrics(plan.task_pool);
  const blockers = detectBlockers(plan.task_pool, state);
  const appProgress = calculateApplicationProgress(
    plan.task_pool,
    plan.target_applications,
    state
  );
  
  return {
    plan_id: plan.plan_id,
    plan_type: 'weekly',
    completion_percentage: calculateCompletionPercentage(plan.task_pool),
    completed_tasks: statusCounts.completed,
    total_tasks: plan.task_pool.length,
    in_progress_tasks: statusCounts.in_progress,
    failed_tasks: statusCounts.failed,
    skipped_tasks: statusCounts.skipped,
    blockers,
    time_spent_minutes: timeMetrics.spent,
    time_remaining_minutes: timeMetrics.remaining,
    applications_progress: appProgress,
    snapshot_at: new Date().toISOString(),
  };
}

/**
 * Track progress for a daily plan
 */
export function trackDailyProgress(
  plan: DailyPlan,
  state: Layer4StateForLayer5
): ProgressSnapshot {
  const statusCounts = countTasksByStatus(plan.tasks);
  const timeMetrics = calculateTimeMetrics(plan.tasks);
  const blockers = detectBlockers(plan.tasks, state);
  
  return {
    plan_id: plan.plan_id,
    plan_type: 'daily',
    completion_percentage: calculateCompletionPercentage(plan.tasks),
    completed_tasks: statusCounts.completed,
    total_tasks: plan.tasks.length,
    in_progress_tasks: statusCounts.in_progress,
    failed_tasks: statusCounts.failed,
    skipped_tasks: statusCounts.skipped,
    blockers,
    time_spent_minutes: timeMetrics.spent,
    time_remaining_minutes: timeMetrics.remaining,
    snapshot_at: new Date().toISOString(),
  };
}

// ==================== Progress Helpers ====================

/**
 * Check if plan is on track
 */
export function isPlanOnTrack(
  progress: ProgressSnapshot,
  dayOfWeek: number = new Date().getDay()
): { onTrack: boolean; reason: string } {
  // Calculate expected progress based on day of week (Mon=1 to Sun=0)
  const daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek; // Sun = 7
  const expectedProgress = (daysElapsed / 7) * 100;
  
  const actualProgress = progress.completion_percentage;
  
  if (actualProgress >= expectedProgress - 10) {
    return { onTrack: true, reason: 'Progress is on track' };
  }
  
  if (actualProgress >= expectedProgress - 25) {
    return { 
      onTrack: false, 
      reason: 'Slightly behind schedule. Consider prioritizing remaining tasks.' 
    };
  }
  
  return { 
    onTrack: false, 
    reason: 'Significantly behind schedule. May need to re-plan or adjust targets.' 
  };
}

/**
 * Get progress summary for display
 */
export function getProgressSummary(progress: ProgressSnapshot): {
  statusLine: string;
  details: string[];
  hasBlockers: boolean;
} {
  const details: string[] = [];
  
  details.push(`${progress.completed_tasks}/${progress.total_tasks} tasks completed (${progress.completion_percentage}%)`);
  
  if (progress.in_progress_tasks > 0) {
    details.push(`${progress.in_progress_tasks} task(s) in progress`);
  }
  
  if (progress.failed_tasks > 0) {
    details.push(`${progress.failed_tasks} task(s) failed`);
  }
  
  if (progress.applications_progress) {
    const { submitted, target } = progress.applications_progress;
    const appPercent = target > 0 ? Math.round((submitted / target) * 100) : 100;
    details.push(`Applications: ${submitted}/${target} (${appPercent}%)`);
  }
  
  const statusLine = progress.completion_percentage >= 80 
    ? '🎉 Great progress!' 
    : progress.completion_percentage >= 50 
      ? '📈 Making progress' 
      : '⚡ Keep going!';
  
  return {
    statusLine,
    details,
    hasBlockers: progress.blockers.length > 0,
  };
}

/**
 * Format blockers for display
 */
export function formatBlockers(blockers: Blocker[]): string[] {
  return blockers.map(b => {
    const icon = b.type === 'stale_state' ? '⚠️' :
                 b.type === 'dependency' ? '🔗' :
                 b.type === 'failed_task' ? '❌' : '❓';
    return `${icon} ${b.description}${b.resolution ? ` → ${b.resolution}` : ''}`;
  });
}
