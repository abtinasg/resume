/**
 * Layer 5 - Orchestrator (The Decision-Making Brain)
 * Type Definitions v1.2
 *
 * This module defines all TypeScript types and interfaces for the orchestrator layer.
 * It coordinates all other layers into actionable plans and executes actions.
 *
 * Based on: Layer_5_Orchestrator_v1.0.md (PART I - Core Specification)
 *
 * KEY INNOVATIONS:
 * - Stateless Decision Engine (all state from Layer 4)
 * - Evidence-Anchored (every task has `why_now` and `evidence_refs`)
 * - Deterministic (same inputs → same outputs)
 */

import { z } from 'zod';
import {
  StrategyMode,
  LayerEventType,
  ActionType,
  FocusArea,
  SeniorityLevel,
  LayerApplicationStatus,
} from '../shared/types';

// ==================== Re-exports for Convenience ====================

export {
  StrategyMode,
  LayerEventType,
  ActionType,
  FocusArea,
  SeniorityLevel,
  LayerApplicationStatus,
};

// ==================== Execution Semantics ====================

/**
 * How a task should be executed
 * - auto: System executes automatically
 * - user_confirmed: System proposes, user approves
 * - user_only: User must perform manually
 */
export type ExecutionType = 'auto' | 'user_confirmed' | 'user_only';

/**
 * Task status in the plan
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Staleness severity levels
 */
export type StalenessSeverity = 'none' | 'warning' | 'critical';

/**
 * Confidence level for analysis results
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

// ==================== Input Interfaces (from other layers) ====================

/**
 * Pipeline state from Layer 4
 */
export interface PipelineState {
  total_applications: number;
  applications_last_7_days: number;
  applications_last_30_days: number;
  interview_requests: number;
  interview_rate: number;
  offers: number;
  rejections: number;
}

/**
 * User preferences from Layer 4
 */
export interface UserPreferences {
  work_arrangement?: string[];
  locations?: string[];
  salary_minimum?: number;
  excluded_industries?: string[];
}

/**
 * User profile from Layer 4
 */
export interface UserProfile {
  target_roles: string[];
  target_seniority?: SeniorityLevel;
  years_experience?: number;
  weeklyAppTarget?: number;
  preferences?: UserPreferences;
}

/**
 * Resume state from Layer 4
 */
export interface ResumeState {
  master_resume_id?: string;
  resume_score?: number;
  last_resume_update?: string;
  improvement_areas?: string[];
}

/**
 * Freshness state from Layer 4
 */
export interface FreshnessState {
  last_resume_update?: string;
  last_application?: string;
  last_user_interaction?: string;
  is_stale: boolean;
  staleness_reason?: string;
  staleness_severity: StalenessSeverity;
}

/**
 * Follow-up application info from Layer 4
 */
export interface FollowUpApplication {
  application_id: string;
  job_title: string;
  company: string;
  applied_at: string;
  days_since_application: number;
  follow_up_count: number;
  last_follow_up?: string;
  suggested_action: 'FOLLOW_UP' | 'DO_NOT_FOLLOW_UP';
  reason: string;
}

/**
 * Follow-ups state from Layer 4
 */
export interface FollowUpsState {
  applications_needing_followup: FollowUpApplication[];
}

/**
 * Strategy history entry from Layer 4
 */
export interface StrategyHistoryEntry {
  from: StrategyMode;
  to: StrategyMode;
  changed_at: string;
  reason: string;
}

/**
 * Primary input from Layer 4 (Memory & State Engine)
 * Contains all state needed for planning
 */
export interface Layer4StateForLayer5 {
  pipeline_state: PipelineState;
  user_profile: UserProfile;
  current_strategy_mode?: StrategyMode | null;
  strategy_history?: StrategyHistoryEntry[];
  resume: ResumeState;
  freshness: FreshnessState;
  followups: FollowUpsState;
  state_version: number;
  computed_at: string;
}

/**
 * Action entities for targeting
 */
export interface ActionEntities {
  bullet_index?: number;
  section?: string;
  application_id?: string;
  job_id?: string;
}

/**
 * Action constraints for execution
 */
export interface ActionConstraints {
  max_items?: number;
  min_score_gain?: number;
}

/**
 * Blueprint action type from Layer 2
 */
export type BlueprintActionType =
  | 'improve_resume'
  | 'apply_to_job'
  | 'follow_up'
  | 'update_targets'
  | 'collect_missing_info';

/**
 * Action blueprint from Layer 2
 */
export interface ActionBlueprint {
  type: BlueprintActionType;
  objective: string;
  entities?: ActionEntities;
  constraints?: ActionConstraints;
  why: string;
  confidence: ConfidenceLevel;
  priority: number;
}

/**
 * Skills gap analysis from Layer 2
 */
export interface SkillsGap {
  matched: string[];
  critical_missing: string[];
  match_percentage: number;
}

/**
 * Tools gap analysis from Layer 2
 */
export interface ToolsGap {
  matched: string[];
  critical_missing: string[];
  match_percentage: number;
}

/**
 * Experience gap analysis from Layer 2
 */
export interface ExperienceGap {
  missing_types: string[];
  coverage_score: number;
}

/**
 * Seniority gap analysis from Layer 2
 */
export interface SeniorityGap {
  user_level: SeniorityLevel;
  role_expected: SeniorityLevel;
  alignment: 'underqualified' | 'aligned' | 'overqualified';
}

/**
 * Gap analysis from Layer 2
 */
export interface GapAnalysis {
  skills: SkillsGap;
  tools: ToolsGap;
  experience: ExperienceGap;
  seniority: SeniorityGap;
}

/**
 * Mode reasoning from Layer 2
 */
export interface ModeReasoning {
  primary_reason: string;
  supporting_factors: string[];
  confidence: ConfidenceLevel;
}

/**
 * Primary input from Layer 2 (Strategy Engine)
 */
export interface Layer2AnalysisForLayer5 {
  overall_fit_score: number;
  confidence_level: ConfidenceLevel;
  gaps: GapAnalysis;
  recommended_mode: StrategyMode;
  mode_reasoning: ModeReasoning;
  priority_actions: string[];
  action_blueprints: ActionBlueprint[];
  key_insights: string[];
}

// ==================== Core Task Interface ====================

/**
 * Task payload - flexible data for different action types
 */
export interface TaskPayload {
  /** For improve_resume */
  bullet?: string;
  bullet_index?: number;
  section?: string;
  weak_bullets?: Array<{ bullet: string; issues: string[] }>;
  rewrite_type?: 'bullet' | 'summary' | 'section';
  estimated_score_gain?: number;
  issues?: string[];
  /** For apply_to_job */
  job_id?: string;
  job_title?: string;
  company?: string;
  match_score?: number;
  platform?: string;
  /** For follow_up */
  application_id?: string;
  days_since_application?: number;
  follow_up_count?: number;
  /** For refresh_state */
  refresh_reason?: string;
  /** General */
  incomplete_data?: boolean;
  [key: string]: unknown;
}

/**
 * Task - the core unit of work in plans
 * Every task is evidence-anchored with why_now and evidence_refs
 */
export interface Task {
  /** Unique task ID */
  task_id: string;
  /** Type of action */
  action_type: ActionType;
  /** Short title */
  title: string;
  /** User-friendly description */
  description: string;
  /** How to execute: auto, user_confirmed, user_only */
  execution: ExecutionType;
  /** Action-specific data */
  payload: TaskPayload;
  /** Priority score (0-100, bounded) */
  priority: number;
  /** Estimated time in minutes */
  estimated_minutes: number;
  /** Optional due date (ISO 8601) */
  due_at?: string;
  /** Task IDs that must complete first */
  dependencies?: string[];
  /** WHY this task is recommended NOW (evidence-anchored) */
  why_now: string;
  /** Pointers to evidence (state paths, config keys, etc.) */
  evidence_refs?: string[];
  /** Current task status */
  status?: TaskStatus;
  /** When created */
  created_at?: string;
}

// ==================== Plan Interfaces ====================

/**
 * Focus mix - distribution of effort across focus areas
 * Values should sum to ~1.0
 */
export type FocusMix = Record<FocusArea, number>;

/**
 * Daily plan hints - suggested task IDs per day
 */
export type DailyPlanHints = Record<string, string[]>;

/**
 * Weekly Plan - the main planning output
 * Generated Monday or on mode change
 */
export interface WeeklyPlan {
  /** Unique plan ID */
  plan_id: string;
  /** ISO date (Monday) */
  week_start: string;
  /** ISO date (Sunday) */
  week_end: string;
  /** Current strategy mode */
  strategy_mode: StrategyMode;
  /** Target applications for the week */
  target_applications: number;
  /** Focus distribution (should sum to ~1.0) */
  focus_mix: FocusMix;
  /** Task pool (10-25 tasks for the week) */
  task_pool: Task[];
  /** Optional daily hints */
  daily_plan_hints?: DailyPlanHints;
  /** Traceability: Layer 4 state version used */
  input_state_version: number;
  /** Traceability: Layer 2 analysis version */
  strategy_analysis_version: string;
  /** When generated (ISO 8601) */
  generated_at: string;
  /** Optional: hash of inputs for verification */
  input_hash?: string;
}

/**
 * Daily Plan - slice of weekly plan for today
 * Generated each morning
 */
export interface DailyPlan {
  /** Unique plan ID */
  plan_id: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Primary focus area for today */
  focus_area: FocusArea;
  /** Tasks for today (3-5 tasks) */
  tasks: Task[];
  /** Total estimated time */
  total_estimated_minutes: number;
  /** Traceability: weekly plan this came from */
  generated_from_weekly_plan_id?: string;
  /** Traceability: state version used */
  input_state_version: number;
  /** When generated (ISO 8601) */
  generated_at: string;
}

// ==================== Priority Scoring ====================

/**
 * Priority score breakdown for transparency
 */
export interface PriorityScoreBreakdown {
  /** Impact score (0-100) */
  impact: number;
  /** Urgency score (0-100) */
  urgency: number;
  /** Alignment score (0-100) */
  alignment: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** Time cost score (0-100, higher = more costly) */
  time_cost: number;
  /** Total penalties applied */
  penalties: number;
}

/**
 * Complete priority score with breakdown
 */
export interface PriorityScore {
  /** Final score (0-100) */
  score: number;
  /** Score breakdown for transparency */
  breakdown: PriorityScoreBreakdown;
  /** Explains how score was calculated */
  calculation_notes?: string[];
}

// ==================== Action Execution ====================

/**
 * Action execution result
 */
export interface ActionExecutionResult {
  /** Whether action succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Evidence from execution */
  evidence_map?: Record<string, unknown>;
  /** For improve_resume: estimated gain */
  estimated_score_gain?: number;
  /** For improve_resume: actual gain (after Layer 1 re-score) */
  actual_score_gain?: number;
  /** For improve_resume: old score */
  old_score?: number;
  /** For improve_resume: new score */
  new_score?: number;
  /** For apply_to_job: created application ID */
  application_id?: string;
  /** Fallback if action fails */
  fallback?: string;
  /** Suggestion for user */
  suggestion?: string;
  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Action execution tracking
 */
export interface ActionExecution {
  /** Task being executed */
  task_id: string;
  /** Action type */
  action_type: ActionType;
  /** When started */
  started_at: string;
  /** When completed */
  completed_at?: string;
  /** Execution result */
  result?: ActionExecutionResult;
  /** Number of retries */
  retry_count: number;
}

// ==================== Progress Tracking ====================

/**
 * Blocker information
 */
export interface Blocker {
  /** What's blocking */
  type: 'dependency' | 'stale_state' | 'missing_data' | 'failed_task';
  /** Description */
  description: string;
  /** Affected task IDs */
  affected_tasks: string[];
  /** Suggested resolution */
  resolution?: string;
}

/**
 * Progress snapshot for a plan
 */
export interface ProgressSnapshot {
  /** Plan being tracked */
  plan_id: string;
  /** Plan type */
  plan_type: 'weekly' | 'daily';
  /** Completion percentage (0-100) */
  completion_percentage: number;
  /** Tasks completed */
  completed_tasks: number;
  /** Total tasks */
  total_tasks: number;
  /** Tasks in progress */
  in_progress_tasks: number;
  /** Tasks failed */
  failed_tasks: number;
  /** Tasks skipped */
  skipped_tasks: number;
  /** Current blockers */
  blockers: Blocker[];
  /** Actual time spent (minutes) */
  time_spent_minutes: number;
  /** Estimated time remaining (minutes) */
  time_remaining_minutes: number;
  /** Applications submitted vs target */
  applications_progress?: {
    submitted: number;
    target: number;
  };
  /** When snapshot was taken */
  snapshot_at: string;
}

// ==================== Re-planning Triggers ====================

/**
 * Trigger types for re-planning
 */
export type ReplanTriggerType =
  | 'strategy_mode_changed'
  | 'major_milestone'
  | 'severe_deviation'
  | 'user_requested'
  | 'new_day'
  | 'major_task_completed'
  | 'task_failed'
  | 'plan_expired';

/**
 * Re-plan trigger information
 */
export interface ReplanTrigger {
  /** Whether re-plan is needed */
  should_replan: boolean;
  /** Type of trigger */
  trigger_type?: ReplanTriggerType;
  /** Reasoning */
  reason: string;
  /** Plan type to regenerate */
  plan_type?: 'weekly' | 'daily' | 'both';
  /** Urgency */
  urgency: 'low' | 'medium' | 'high';
}

// ==================== State Validation ====================

/**
 * Validation issue
 */
export interface ValidationIssue {
  /** Issue code */
  code: string;
  /** Severity */
  severity: 'warning' | 'critical';
  /** Human-readable message */
  message: string;
  /** Affected field path */
  field?: string;
}

/**
 * State validation result
 */
export interface StateValidationResult {
  /** Whether validation passed */
  passed: boolean;
  /** Issues found */
  issues: ValidationIssue[];
  /** Is state fresh enough */
  is_fresh: boolean;
  /** Staleness severity */
  staleness_severity: StalenessSeverity;
  /** Recommended action */
  recommended_action?: string;
}

// ==================== Configuration Types ====================

/**
 * Weekly planning configuration
 */
export interface WeeklyPlanningConfig {
  default_app_target: number;
  min_app_target: number;
  max_app_target: number;
  task_pool_max: number;
  focus_areas: string[];
}

/**
 * Daily planning configuration
 */
export interface DailyPlanningConfig {
  max_tasks_per_day: number;
  time_budget_minutes: number;
  require_one_high_priority: boolean;
}

/**
 * Impact factors for priority scoring
 */
export interface ImpactFactors {
  resume_improvement: number;
  application_submit: number;
  interview_prep: number;
  followup: number;
  strategy_review: number;
}

/**
 * Urgency thresholds
 */
export interface UrgencyThresholds {
  overdue_days: number;
  due_soon_days: number;
  weekly_deadline: number;
}

/**
 * Priority scoring configuration
 */
export interface PriorityScoringConfig {
  impact_weight: number;
  urgency_weight: number;
  alignment_weight: number;
  confidence_weight?: number;
  time_cost_weight?: number;
  impact_factors: ImpactFactors;
  urgency_thresholds: UrgencyThresholds;
}

/**
 * Action execution configuration
 */
export interface ActionExecutionConfig {
  max_retries: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
}

/**
 * State freshness configuration
 */
export interface StateFreshnessConfig {
  max_stale_days: number;
  require_resume_for_apply: boolean;
  min_resume_score_for_apply: number;
}

/**
 * Complete orchestrator configuration
 */
export interface OrchestratorConfig {
  version: string;
  weekly_planning: WeeklyPlanningConfig;
  daily_planning: DailyPlanningConfig;
  priority_scoring: PriorityScoringConfig;
  action_execution: ActionExecutionConfig;
  state_freshness: StateFreshnessConfig;
}

/**
 * Task template for generating tasks
 */
export interface TaskTemplate {
  title: string;
  description: string;
  estimated_minutes: number;
  execution: ExecutionType;
  category: string;
}

/**
 * Task templates configuration
 */
export interface TaskTemplatesConfig {
  [key: string]: TaskTemplate;
}

// ==================== Planning Context ====================

/**
 * Context for generating plans - passed to Coach (Layer 8)
 */
export interface PlanningContext {
  weekly_plan: WeeklyPlan;
  today_plan: DailyPlan;
  strategy_context: {
    current_mode: StrategyMode;
    mode_reasoning: string;
    weekly_target: number;
    target_rationale: string;
  };
  recent_activity: {
    completed_tasks_this_week: number;
    progress_percentage: number;
    deviations?: Array<{
      type: 'mode_override' | 'target_missed' | 'task_rejected';
      details: string;
    }>;
  };
}

// ==================== Zod Validation Schemas ====================

/**
 * Task status schema
 */
export const TaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
  'skipped',
]);

/**
 * Execution type schema
 */
export const ExecutionTypeSchema = z.enum(['auto', 'user_confirmed', 'user_only']);

/**
 * Staleness severity schema
 */
export const StalenessSeveritySchema = z.enum(['none', 'warning', 'critical']);

/**
 * Confidence level schema
 */
export const ConfidenceLevelSchema = z.enum(['low', 'medium', 'high']);

/**
 * Action type schema
 */
export const ActionTypeSchema = z.nativeEnum(ActionType);

/**
 * Focus area schema
 */
export const FocusAreaSchema = z.nativeEnum(FocusArea);

/**
 * Strategy mode schema
 */
export const StrategyModeSchema = z.nativeEnum(StrategyMode);

/**
 * Task payload schema
 */
export const TaskPayloadSchema = z.record(z.unknown());

/**
 * Task schema
 */
export const TaskSchema = z.object({
  task_id: z.string().min(1),
  action_type: ActionTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  execution: ExecutionTypeSchema,
  payload: TaskPayloadSchema,
  priority: z.number().min(0).max(100),
  estimated_minutes: z.number().min(1).max(480),
  due_at: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  why_now: z.string().min(1),
  evidence_refs: z.array(z.string()).optional(),
  status: TaskStatusSchema.optional(),
  created_at: z.string().optional(),
});

/**
 * Focus mix schema (values should sum to ~1.0)
 */
export const FocusMixSchema = z.record(FocusAreaSchema, z.number().min(0).max(1));

/**
 * Weekly plan schema
 */
export const WeeklyPlanSchema = z.object({
  plan_id: z.string().min(1),
  week_start: z.string(),
  week_end: z.string(),
  strategy_mode: StrategyModeSchema,
  target_applications: z.number().min(0).max(50),
  focus_mix: FocusMixSchema,
  task_pool: z.array(TaskSchema).min(1).max(50),
  daily_plan_hints: z.record(z.string(), z.array(z.string())).optional(),
  input_state_version: z.number().min(0),
  strategy_analysis_version: z.string(),
  generated_at: z.string(),
  input_hash: z.string().optional(),
});

/**
 * Daily plan schema
 */
export const DailyPlanSchema = z.object({
  plan_id: z.string().min(1),
  date: z.string(),
  focus_area: FocusAreaSchema,
  tasks: z.array(TaskSchema).max(5),
  total_estimated_minutes: z.number().min(0),
  generated_from_weekly_plan_id: z.string().optional(),
  input_state_version: z.number().min(0),
  generated_at: z.string(),
});

/**
 * Pipeline state schema (from Layer 4)
 */
export const PipelineStateSchema = z.object({
  total_applications: z.number().min(0),
  applications_last_7_days: z.number().min(0),
  applications_last_30_days: z.number().min(0),
  interview_requests: z.number().min(0),
  interview_rate: z.number().min(0).max(1),
  offers: z.number().min(0),
  rejections: z.number().min(0),
});

/**
 * User profile schema (from Layer 4)
 */
export const UserProfileSchema = z.object({
  target_roles: z.array(z.string()),
  target_seniority: z.nativeEnum(SeniorityLevel).optional(),
  years_experience: z.number().min(0).max(50).optional(),
  weeklyAppTarget: z.number().min(0).max(50).optional(),
  preferences: z
    .object({
      work_arrangement: z.array(z.string()).optional(),
      locations: z.array(z.string()).optional(),
      salary_minimum: z.number().optional(),
      excluded_industries: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Resume state schema (from Layer 4)
 */
export const ResumeStateSchema = z.object({
  master_resume_id: z.string().optional(),
  resume_score: z.number().min(0).max(100).optional(),
  last_resume_update: z.string().optional(),
  improvement_areas: z.array(z.string()).optional(),
});

/**
 * Freshness state schema (from Layer 4)
 */
export const FreshnessStateSchema = z.object({
  last_resume_update: z.string().optional(),
  last_application: z.string().optional(),
  last_user_interaction: z.string().optional(),
  is_stale: z.boolean(),
  staleness_reason: z.string().optional(),
  staleness_severity: StalenessSeveritySchema,
});

/**
 * Follow-up application schema
 */
export const FollowUpApplicationSchema = z.object({
  application_id: z.string(),
  job_title: z.string(),
  company: z.string(),
  applied_at: z.string(),
  days_since_application: z.number().min(0),
  follow_up_count: z.number().min(0),
  last_follow_up: z.string().optional(),
  suggested_action: z.enum(['FOLLOW_UP', 'DO_NOT_FOLLOW_UP']),
  reason: z.string(),
});

/**
 * Layer 4 state for Layer 5 schema
 */
export const Layer4StateForLayer5Schema = z.object({
  pipeline_state: PipelineStateSchema,
  user_profile: UserProfileSchema,
  current_strategy_mode: StrategyModeSchema.nullable().optional(),
  strategy_history: z
    .array(
      z.object({
        from: StrategyModeSchema,
        to: StrategyModeSchema,
        changed_at: z.string(),
        reason: z.string(),
      })
    )
    .optional(),
  resume: ResumeStateSchema,
  freshness: FreshnessStateSchema,
  followups: z.object({
    applications_needing_followup: z.array(FollowUpApplicationSchema),
  }),
  state_version: z.number().min(0),
  computed_at: z.string(),
});

/**
 * Action blueprint schema (from Layer 2)
 */
export const ActionBlueprintSchema = z.object({
  type: z.enum([
    'improve_resume',
    'apply_to_job',
    'follow_up',
    'update_targets',
    'collect_missing_info',
  ]),
  objective: z.string(),
  entities: z
    .object({
      bullet_index: z.number().optional(),
      section: z.string().optional(),
      application_id: z.string().optional(),
      job_id: z.string().optional(),
    })
    .optional(),
  constraints: z
    .object({
      max_items: z.number().optional(),
      min_score_gain: z.number().optional(),
    })
    .optional(),
  why: z.string(),
  confidence: ConfidenceLevelSchema,
  priority: z.number().min(1).max(10),
});

/**
 * Layer 2 analysis for Layer 5 schema
 */
export const Layer2AnalysisForLayer5Schema = z.object({
  overall_fit_score: z.number().min(0).max(100),
  confidence_level: ConfidenceLevelSchema,
  gaps: z.object({
    skills: z.object({
      matched: z.array(z.string()),
      critical_missing: z.array(z.string()),
      match_percentage: z.number().min(0).max(100),
    }),
    tools: z.object({
      matched: z.array(z.string()),
      critical_missing: z.array(z.string()),
      match_percentage: z.number().min(0).max(100),
    }),
    experience: z.object({
      missing_types: z.array(z.string()),
      coverage_score: z.number().min(0).max(100),
    }),
    seniority: z.object({
      user_level: z.nativeEnum(SeniorityLevel),
      role_expected: z.nativeEnum(SeniorityLevel),
      alignment: z.enum(['underqualified', 'aligned', 'overqualified']),
    }),
  }),
  recommended_mode: StrategyModeSchema,
  mode_reasoning: z.object({
    primary_reason: z.string(),
    supporting_factors: z.array(z.string()),
    confidence: ConfidenceLevelSchema,
  }),
  priority_actions: z.array(z.string()),
  action_blueprints: z.array(ActionBlueprintSchema),
  key_insights: z.array(z.string()),
});

/**
 * Progress snapshot schema
 */
export const ProgressSnapshotSchema = z.object({
  plan_id: z.string(),
  plan_type: z.enum(['weekly', 'daily']),
  completion_percentage: z.number().min(0).max(100),
  completed_tasks: z.number().min(0),
  total_tasks: z.number().min(0),
  in_progress_tasks: z.number().min(0),
  failed_tasks: z.number().min(0),
  skipped_tasks: z.number().min(0),
  blockers: z.array(
    z.object({
      type: z.enum(['dependency', 'stale_state', 'missing_data', 'failed_task']),
      description: z.string(),
      affected_tasks: z.array(z.string()),
      resolution: z.string().optional(),
    })
  ),
  time_spent_minutes: z.number().min(0),
  time_remaining_minutes: z.number().min(0),
  applications_progress: z
    .object({
      submitted: z.number().min(0),
      target: z.number().min(0),
    })
    .optional(),
  snapshot_at: z.string(),
});

/**
 * Replan trigger schema
 */
export const ReplanTriggerSchema = z.object({
  should_replan: z.boolean(),
  trigger_type: z
    .enum([
      'strategy_mode_changed',
      'major_milestone',
      'severe_deviation',
      'user_requested',
      'new_day',
      'major_task_completed',
      'task_failed',
      'plan_expired',
    ])
    .optional(),
  reason: z.string(),
  plan_type: z.enum(['weekly', 'daily', 'both']).optional(),
  urgency: z.enum(['low', 'medium', 'high']),
});

// ==================== Type Guards ====================

/**
 * Check if a task status is valid
 */
export function isValidTaskStatus(status: string): status is TaskStatus {
  return ['pending', 'in_progress', 'completed', 'failed', 'skipped'].includes(status);
}

/**
 * Check if an execution type is valid
 */
export function isValidExecutionType(type: string): type is ExecutionType {
  return ['auto', 'user_confirmed', 'user_only'].includes(type);
}

/**
 * Check if a staleness severity is valid
 */
export function isValidStalenessSeverity(severity: string): severity is StalenessSeverity {
  return ['none', 'warning', 'critical'].includes(severity);
}

/**
 * Check if a confidence level is valid
 */
export function isValidConfidenceLevel(level: string): level is ConfidenceLevel {
  return ['low', 'medium', 'high'].includes(level);
}

/**
 * Check if task has required evidence anchoring
 */
export function isEvidenceAnchored(task: Task): boolean {
  return Boolean(task.why_now && task.why_now.length > 0);
}
