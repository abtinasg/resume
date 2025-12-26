/**
 * Layer 5 - Orchestrator
 * Tracking Module Exports
 */

// Progress Tracker
export {
  trackWeeklyProgress,
  trackDailyProgress,
  isPlanOnTrack,
  getProgressSummary,
  formatBlockers,
} from './progress-tracker';

// Completion Checker
export {
  verifyTaskCompletion,
  checkPlanCompletion,
  getUnverifiedCompletions,
  isWeeklyPlanComplete,
  isDailyPlanComplete,
  areWeeklyTargetsMet,
  getRemainingTasks,
  getCompletionRate,
  getCompletionSummary,
} from './completion-checker';

// Re-plan Trigger
export {
  shouldReplan,
  shouldReplanWeekly,
  shouldReplanDaily,
  isWeeklyReplanEvent,
  isDailyReplanEvent,
  hasModeChanged,
  hasSevereDeviation,
  isPlanExpired,
  canReplanWeekly,
} from './replan-trigger';
