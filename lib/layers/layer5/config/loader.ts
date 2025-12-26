/**
 * Layer 5 - Orchestrator
 * Configuration Loader
 *
 * Handles loading and caching of orchestrator configuration.
 * Provides type-safe access to configuration values.
 */

import type {
  OrchestratorConfig,
  TaskTemplatesConfig,
  WeeklyPlanningConfig,
  DailyPlanningConfig,
  PriorityScoringConfig,
  ActionExecutionConfig,
  StateFreshnessConfig,
} from '../types';

import orchestratorConfigData from './orchestrator_config.json';
import taskTemplatesData from './task_templates.json';

// ==================== Configuration Cache ====================

let cachedOrchestratorConfig: OrchestratorConfig | null = null;
let cachedTaskTemplates: TaskTemplatesConfig | null = null;

// ==================== Configuration Loaders ====================

/**
 * Load orchestrator configuration
 */
export function loadOrchestratorConfig(): OrchestratorConfig {
  if (cachedOrchestratorConfig) {
    return cachedOrchestratorConfig;
  }

  cachedOrchestratorConfig = orchestratorConfigData as unknown as OrchestratorConfig;
  return cachedOrchestratorConfig;
}

/**
 * Load task templates
 */
export function loadTaskTemplates(): TaskTemplatesConfig {
  if (cachedTaskTemplates) {
    return cachedTaskTemplates;
  }

  cachedTaskTemplates = taskTemplatesData as TaskTemplatesConfig;
  return cachedTaskTemplates;
}

// ==================== Configuration Getters ====================

/**
 * Get weekly planning configuration
 */
export function getWeeklyPlanningConfig(): WeeklyPlanningConfig {
  const config = loadOrchestratorConfig();
  return config.weekly_planning;
}

/**
 * Get daily planning configuration
 */
export function getDailyPlanningConfig(): DailyPlanningConfig {
  const config = loadOrchestratorConfig();
  return config.daily_planning;
}

/**
 * Get priority scoring configuration
 */
export function getPriorityScoringConfig(): PriorityScoringConfig {
  const config = loadOrchestratorConfig();
  return config.priority_scoring;
}

/**
 * Get action execution configuration
 */
export function getActionExecutionConfig(): ActionExecutionConfig {
  const config = loadOrchestratorConfig();
  return config.action_execution;
}

/**
 * Get state freshness configuration
 */
export function getStateFreshnessConfig(): StateFreshnessConfig {
  const config = loadOrchestratorConfig();
  return config.state_freshness;
}

/**
 * Get a specific task template
 */
export function getTaskTemplate(templateKey: string): TaskTemplatesConfig[string] | undefined {
  const templates = loadTaskTemplates();
  return templates[templateKey];
}

// ==================== Configuration Defaults ====================

/**
 * Default weekly planning config (fallback)
 */
export const DEFAULT_WEEKLY_PLANNING_CONFIG: WeeklyPlanningConfig = {
  default_app_target: 10,
  min_app_target: 3,
  max_app_target: 30,
  task_pool_max: 50,
  focus_areas: ['resume', 'applications', 'followups', 'strategy'],
};

/**
 * Default daily planning config (fallback)
 */
export const DEFAULT_DAILY_PLANNING_CONFIG: DailyPlanningConfig = {
  max_tasks_per_day: 5,
  time_budget_minutes: 120,
  require_one_high_priority: true,
};

/**
 * Default priority scoring config (fallback)
 */
export const DEFAULT_PRIORITY_SCORING_CONFIG: PriorityScoringConfig = {
  impact_weight: 0.40,
  urgency_weight: 0.35,
  alignment_weight: 0.25,
  impact_factors: {
    resume_improvement: 0.8,
    application_submit: 0.9,
    interview_prep: 1.0,
    followup: 0.6,
    strategy_review: 0.7,
  },
  urgency_thresholds: {
    overdue_days: 3,
    due_soon_days: 7,
    weekly_deadline: 7,
  },
};

/**
 * Default action execution config (fallback)
 */
export const DEFAULT_ACTION_EXECUTION_CONFIG: ActionExecutionConfig = {
  max_retries: 2,
  retry_delay_seconds: 5,
  timeout_seconds: 30,
};

/**
 * Default state freshness config (fallback)
 */
export const DEFAULT_STATE_FRESHNESS_CONFIG: StateFreshnessConfig = {
  max_stale_days: 7,
  require_resume_for_apply: true,
  min_resume_score_for_apply: 60,
};

// ==================== Mode-Specific Targets ====================

/**
 * Base application targets per strategy mode
 */
export const MODE_BASE_TARGETS: Record<string, [number, number]> = {
  IMPROVE_RESUME_FIRST: [2, 3],
  APPLY_MODE: [8, 12],
  RETHINK_TARGETS: [3, 5],
};

/**
 * Focus mix presets per strategy mode
 * Values represent: [resume_improvement, applications, follow_ups, strategy]
 */
export const MODE_FOCUS_PRESETS: Record<string, Record<string, number>> = {
  IMPROVE_RESUME_FIRST: {
    resume_improvement: 0.7,
    applications: 0.1,
    follow_ups: 0.1,
    strategy: 0.1,
  },
  APPLY_MODE: {
    resume_improvement: 0.2,
    applications: 0.5,
    follow_ups: 0.2,
    strategy: 0.1,
  },
  RETHINK_TARGETS: {
    resume_improvement: 0.3,
    applications: 0.2,
    follow_ups: 0.1,
    strategy: 0.4,
  },
};

// ==================== Time Estimation ====================

/**
 * Base time estimates per action type (minutes)
 */
export const BASE_TIME_ESTIMATES: Record<string, number> = {
  improve_resume: 20,
  apply_to_job: 30,
  follow_up: 10,
  update_targets: 15,
  collect_missing_info: 10,
  refresh_state: 15,
};

// ==================== Priority Constants ====================

/**
 * Alignment scores by action type per mode
 * Higher = better alignment with current mode
 */
export const ALIGNMENT_MATRIX: Record<string, Record<string, number>> = {
  IMPROVE_RESUME_FIRST: {
    improve_resume: 100,
    apply_to_job: 30,
    follow_up: 70,
    update_targets: 40,
    collect_missing_info: 60,
    refresh_state: 80,
  },
  APPLY_MODE: {
    improve_resume: 50,
    apply_to_job: 100,
    follow_up: 80,
    update_targets: 30,
    collect_missing_info: 40,
    refresh_state: 60,
  },
  RETHINK_TARGETS: {
    improve_resume: 40,
    apply_to_job: 60,
    follow_up: 50,
    update_targets: 100,
    collect_missing_info: 80,
    refresh_state: 70,
  },
};

// ==================== Issue Severity ====================

/**
 * Issue severity scores for priority calculation
 */
export const ISSUE_SEVERITY: Record<string, number> = {
  no_metrics: 15,
  weak_verbs: 12,
  generic_descriptions: 10,
  vague_experience: 10,
  poor_formatting: 8,
  spelling_errors: 6,
  too_short: 5,
};

// ==================== Cache Management ====================

/**
 * Clear configuration cache
 * Useful for testing or hot-reloading
 */
export function clearConfigCache(): void {
  cachedOrchestratorConfig = null;
  cachedTaskTemplates = null;
}

/**
 * Override configuration for testing
 */
export function overrideConfig(
  config: Partial<OrchestratorConfig>
): void {
  const current = loadOrchestratorConfig();
  cachedOrchestratorConfig = { ...current, ...config };
}
