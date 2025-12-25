/**
 * Layer 5 - Orchestrator (The Decision-Making Brain)
 * Public API Exports
 *
 * This module exports the primary orchestration functions and types
 * for use by other layers and external consumers.
 *
 * Layer 5 is THE BRAIN that:
 * - Coordinates all other layers into coherent, actionable plans
 * - Generates weekly and daily plans based on strategy + state
 * - Prioritizes actions based on impact, urgency, alignment
 * - Executes actions by calling Layer 1/3/4 as needed
 * - Tracks progress and triggers re-planning when needed
 *
 * KEY INNOVATIONS:
 * - Stateless Decision Engine (all state from Layer 4)
 * - Evidence-Anchored Planning (every task has `why_now` and `evidence_refs`)
 * - Deterministic (same inputs → same outputs)
 */

// ==================== Main Orchestration Functions ====================

export {
  orchestrate,
  orchestrateWeeklyPlan,
  orchestrateDailyPlan,
  orchestrateAction,
  orchestrateActions,
  trackWeeklyPlanProgress,
  trackDailyPlanProgress,
  checkReplanNeeded,
  getPlanningContext,
  getTaskById,
  updateTaskStatus,
  markTaskCompleted,
  markTaskSkipped,
  validateStateForPlanning,
  validateGeneratedWeeklyPlan,
  validateGeneratedDailyPlan,
} from './orchestrator';

// ==================== Types ====================

// Core types
export type {
  WeeklyPlan,
  DailyPlan,
  Task,
  TaskPayload,
  FocusMix,
  DailyPlanHints,
} from './types';

// Execution types
export type {
  ActionExecution,
  ActionExecutionResult,
  ExecutionType,
  TaskStatus,
} from './types';

// Tracking types
export type {
  ProgressSnapshot,
  Blocker,
  ReplanTrigger,
  ReplanTriggerType,
} from './types';

// Scoring types
export type {
  PriorityScore,
  PriorityScoreBreakdown,
} from './types';

// Input types (from other layers)
export type {
  Layer4StateForLayer5,
  Layer2AnalysisForLayer5,
  ActionBlueprint,
  FollowUpApplication,
  PipelineState,
  UserProfile,
  ResumeState,
  FreshnessState,
  FollowUpsState,
} from './types';

// Validation types
export type {
  StateValidationResult,
  ValidationIssue,
} from './types';

// Config types
export type {
  OrchestratorConfig,
  TaskTemplatesConfig,
  WeeklyPlanningConfig,
  DailyPlanningConfig,
  PriorityScoringConfig,
} from './types';

// Context types
export type {
  PlanningContext,
} from './types';

// Enums
export {
  StrategyMode,
  LayerEventType,
  ActionType,
  FocusArea,
  SeniorityLevel,
} from './types';

// Type guards
export {
  isValidTaskStatus,
  isValidExecutionType,
  isValidStalenessSeverity,
  isValidConfidenceLevel,
  isEvidenceAnchored,
} from './types';

// Zod schemas (for runtime validation)
export {
  TaskSchema,
  WeeklyPlanSchema,
  DailyPlanSchema,
  Layer4StateForLayer5Schema,
  Layer2AnalysisForLayer5Schema,
  ProgressSnapshotSchema,
  ReplanTriggerSchema,
} from './types';

// ==================== Planning Functions ====================

export {
  // Task generator
  generateTaskId,
  generatePlanId,
  createTaskFromBlueprint,
  createFollowUpTask,
  createRefreshTask,
  createStrategyReviewTask,
  estimateTaskTime,
  determineFocusArea,
  
  // Priority scorer
  scorePriority,
  prioritizeTasks,
  calculateImpact,
  calculateUrgency,
  calculateAlignment,
  getPriorityLevel,
  isHighPriority,
  
  // Weekly planner
  generateWeeklyPlan,
  calculateWeeklyTarget,
  calculateFocusMix,
  validateWeeklyPlan,
  getCurrentMonday,
  getNextMonday,
  
  // Daily planner
  generateDailyPlan,
  fitTasksToTimeBudget,
  validateDailyPlan,
  getTodayDate,
  getDailyPlanSummary,
  formatDailyPlan,
} from './planning';

// ==================== Execution Functions ====================

export {
  executeAction,
  executeActions,
  getExecutionSummary,
  executeImproveResume,
  executeApplyToJob,
  executeFollowUp,
  isResumeReadyForApplications,
  getApplicationStatusSummary,
  getFollowUpSummary,
} from './execution';

// ==================== Tracking Functions ====================

export {
  trackWeeklyProgress,
  trackDailyProgress,
  isPlanOnTrack,
  getProgressSummary,
  formatBlockers,
  verifyTaskCompletion,
  isWeeklyPlanComplete,
  isDailyPlanComplete,
  areWeeklyTargetsMet,
  getCompletionSummary,
  shouldReplan,
  shouldReplanWeekly,
  shouldReplanDaily,
  hasModeChanged,
  isPlanExpired,
} from './tracking';

// ==================== State Functions ====================

export {
  validateState,
  isStateValidForPlanning,
  getValidationSummary,
  assessStaleness,
  isCriticallyStale,
  hasStaleWarning,
  generateStalePlan,
  getRecoveryGuidance,
  getStalenessDisplay,
} from './state';

// ==================== Configuration ====================

export {
  loadOrchestratorConfig,
  loadTaskTemplates,
  getWeeklyPlanningConfig,
  getDailyPlanningConfig,
  getPriorityScoringConfig,
  getActionExecutionConfig,
  getStateFreshnessConfig,
  getTaskTemplate,
  clearConfigCache,
  overrideConfig,
  MODE_BASE_TARGETS,
  MODE_FOCUS_PRESETS,
  ALIGNMENT_MATRIX,
} from './config';

// ==================== Error Handling ====================

export {
  OrchestratorError,
  OrchestratorErrorCode,
  isOrchestratorError,
  isRecoverableError,
  getUserFriendlyError,
  wrapError,
  logError,
  createInvalidInputError,
  createMissingStateError,
  createStateUnavailableError,
  createStaleStateError,
  createPlanGenerationError,
  createEmptyPlanError,
  createExecutionFailedError,
  createMaxRetriesError,
  createLayerError,
  createInternalError,
} from './errors';
