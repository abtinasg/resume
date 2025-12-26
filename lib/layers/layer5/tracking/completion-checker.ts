/**
 * Layer 5 - Orchestrator
 * Completion Checker
 *
 * Verifies task completion by checking state changes.
 * Ensures tasks are actually completed, not just marked as such.
 */

import { ActionType, StrategyMode } from '../types';
import type {
  Task,
  WeeklyPlan,
  DailyPlan,
  Layer4StateForLayer5,
} from '../types';

// ==================== Task Completion Verification ====================

/**
 * Verify a task's completion by checking state
 */
export function verifyTaskCompletion(
  task: Task,
  state: Layer4StateForLayer5,
  previousState?: Layer4StateForLayer5
): { verified: boolean; reason: string } {
  // If no previous state, we can't verify - trust the status
  if (!previousState) {
    return { verified: true, reason: 'No previous state to compare' };
  }
  
  switch (task.action_type) {
    case ActionType.IMPROVE_RESUME: {
      // Check if resume score improved
      const oldScore = previousState.resume.resume_score ?? 0;
      const newScore = state.resume.resume_score ?? 0;
      
      if (newScore > oldScore) {
        return { verified: true, reason: `Resume score improved from ${oldScore} to ${newScore}` };
      }
      
      // Check if resume was updated
      const oldUpdate = previousState.resume.last_resume_update;
      const newUpdate = state.resume.last_resume_update;
      
      if (newUpdate && newUpdate !== oldUpdate) {
        return { verified: true, reason: 'Resume was updated' };
      }
      
      return { verified: false, reason: 'No detectable resume changes' };
    }
    
    case ActionType.APPLY_TO_JOB: {
      // Check if application count increased
      const oldApps = previousState.pipeline_state.total_applications;
      const newApps = state.pipeline_state.total_applications;
      
      if (newApps > oldApps) {
        return { verified: true, reason: `Applications increased from ${oldApps} to ${newApps}` };
      }
      
      return { verified: false, reason: 'No new applications detected' };
    }
    
    case ActionType.FOLLOW_UP: {
      // Check if follow-up was recorded
      const applicationId = task.payload.application_id;
      if (!applicationId) {
        return { verified: false, reason: 'No application ID to verify' };
      }
      
      const oldFollowUp = previousState.followups.applications_needing_followup.find(
        f => f.application_id === applicationId
      );
      const newFollowUp = state.followups.applications_needing_followup.find(
        f => f.application_id === applicationId
      );
      
      if (!newFollowUp && oldFollowUp) {
        return { verified: true, reason: 'Application no longer needs follow-up' };
      }
      
      if (newFollowUp && oldFollowUp && newFollowUp.follow_up_count > oldFollowUp.follow_up_count) {
        return { verified: true, reason: 'Follow-up count increased' };
      }
      
      return { verified: false, reason: 'No follow-up detected' };
    }
    
    case ActionType.UPDATE_TARGETS: {
      // Check if user profile changed
      const oldRoles = previousState.user_profile.target_roles;
      const newRoles = state.user_profile.target_roles;
      
      if (JSON.stringify(oldRoles) !== JSON.stringify(newRoles)) {
        return { verified: true, reason: 'Target roles were updated' };
      }
      
      // User-only task - trust completion
      return { verified: true, reason: 'User-only task (trusted)' };
    }
    
    case ActionType.COLLECT_MISSING_INFO: {
      // Check if profile became more complete
      // User-only task - trust completion
      return { verified: true, reason: 'User-only task (trusted)' };
    }
    
    case ActionType.REFRESH_STATE: {
      // Check if state is no longer stale
      if (!state.freshness.is_stale && previousState.freshness.is_stale) {
        return { verified: true, reason: 'State is no longer stale' };
      }
      
      // Check if severity decreased
      const severityOrder = { none: 0, warning: 1, critical: 2 };
      const oldSeverity = severityOrder[previousState.freshness.staleness_severity] ?? 0;
      const newSeverity = severityOrder[state.freshness.staleness_severity] ?? 0;
      
      if (newSeverity < oldSeverity) {
        return { verified: true, reason: 'Staleness severity decreased' };
      }
      
      return { verified: false, reason: 'State still appears stale' };
    }
    
    default:
      return { verified: true, reason: 'Unknown task type (trusted)' };
  }
}

// ==================== Batch Completion Checking ====================

/**
 * Check completion for all tasks in a plan
 */
export function checkPlanCompletion(
  tasks: Task[],
  state: Layer4StateForLayer5,
  previousState?: Layer4StateForLayer5
): Map<string, { verified: boolean; reason: string }> {
  const results = new Map<string, { verified: boolean; reason: string }>();
  
  for (const task of tasks) {
    if (task.status === 'completed') {
      const verification = verifyTaskCompletion(task, state, previousState);
      results.set(task.task_id, verification);
    }
  }
  
  return results;
}

/**
 * Get unverified completions
 */
export function getUnverifiedCompletions(
  verificationResults: Map<string, { verified: boolean; reason: string }>
): string[] {
  const unverified: string[] = [];
  
  verificationResults.forEach((result, taskId) => {
    if (!result.verified) {
      unverified.push(taskId);
    }
  });
  
  return unverified;
}

// ==================== Weekly Completion ====================

/**
 * Check if weekly plan is complete
 */
export function isWeeklyPlanComplete(plan: WeeklyPlan): boolean {
  return plan.task_pool.every(
    task => 
      task.status === 'completed' || 
      task.status === 'failed' || 
      task.status === 'skipped'
  );
}

/**
 * Check if weekly targets are met
 */
export function areWeeklyTargetsMet(
  plan: WeeklyPlan,
  state: Layer4StateForLayer5
): { met: boolean; details: { target: number; actual: number } } {
  const target = plan.target_applications;
  const actual = state.pipeline_state.applications_last_7_days;
  
  return {
    met: actual >= target,
    details: { target, actual },
  };
}

// ==================== Daily Completion ====================

/**
 * Check if daily plan is complete
 */
export function isDailyPlanComplete(plan: DailyPlan): boolean {
  return plan.tasks.every(
    task => 
      task.status === 'completed' || 
      task.status === 'failed' || 
      task.status === 'skipped'
  );
}

/**
 * Get remaining tasks for today
 */
export function getRemainingTasks(plan: DailyPlan): Task[] {
  return plan.tasks.filter(
    task => task.status === 'pending' || task.status === 'in_progress'
  );
}

/**
 * Get completion rate for plan
 */
export function getCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 100;
  
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

// ==================== Completion Summary ====================

/**
 * Get completion summary for reporting
 */
export function getCompletionSummary(
  plan: WeeklyPlan | DailyPlan,
  state: Layer4StateForLayer5
): {
  planType: 'weekly' | 'daily';
  isComplete: boolean;
  completionRate: number;
  tasksCompleted: number;
  totalTasks: number;
  tasksFailed: number;
  tasksSkipped: number;
  targetsMet?: boolean;
} {
  const isWeekly = 'task_pool' in plan;
  const tasks = isWeekly ? plan.task_pool : plan.tasks;
  
  const statusCounts = {
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    skipped: tasks.filter(t => t.status === 'skipped').length,
  };
  
  const result: ReturnType<typeof getCompletionSummary> = {
    planType: isWeekly ? 'weekly' : 'daily',
    isComplete: isWeekly 
      ? isWeeklyPlanComplete(plan as WeeklyPlan) 
      : isDailyPlanComplete(plan as DailyPlan),
    completionRate: getCompletionRate(tasks),
    tasksCompleted: statusCounts.completed,
    totalTasks: tasks.length,
    tasksFailed: statusCounts.failed,
    tasksSkipped: statusCounts.skipped,
  };
  
  if (isWeekly) {
    result.targetsMet = areWeeklyTargetsMet(plan as WeeklyPlan, state).met;
  }
  
  return result;
}
