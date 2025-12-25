/**
 * Layer 5 - Orchestrator
 * Task Generator
 *
 * Creates tasks from action blueprints and state data.
 * Applies task templates for consistent, user-friendly output.
 *
 * KEY REQUIREMENT: Every task MUST have `why_now` and `evidence_refs`
 * for evidence-anchored decision making.
 */

import { ActionType, FocusArea } from '../types';
import type {
  Task,
  TaskPayload,
  ExecutionType,
  ActionBlueprint,
  Layer4StateForLayer5,
  FollowUpApplication,
} from '../types';
import { getTaskTemplate, BASE_TIME_ESTIMATES } from '../config';

// ==================== ID Generation ====================

/**
 * Generate a unique task ID
 * Format: task_{timestamp}_{random}
 */
export function generateTaskId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `task_${timestamp}_${random}`;
}

/**
 * Generate a unique plan ID
 * Format: plan_{type}_{timestamp}_{random}
 */
export function generatePlanId(type: 'weekly' | 'daily'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `plan_${type}_${timestamp}_${random}`;
}

// ==================== Template Application ====================

/**
 * Apply template variables to a string
 */
function applyTemplateVariables(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }
  // Remove any remaining template variables
  result = result.replace(/\{[^}]+\}/g, '');
  return result.trim();
}

/**
 * Get a preview of bullet text (truncated)
 */
function getBulletPreview(bullet: string, maxLength: number = 40): string {
  if (bullet.length <= maxLength) {
    return bullet;
  }
  return bullet.substring(0, maxLength - 3) + '...';
}

// ==================== Blueprint to Task Conversion ====================

/**
 * Map blueprint action type to our ActionType enum
 */
function mapBlueprintTypeToActionType(blueprintType: string): ActionType {
  const mapping: Record<string, ActionType> = {
    improve_resume: ActionType.IMPROVE_RESUME,
    apply_to_job: ActionType.APPLY_TO_JOB,
    follow_up: ActionType.FOLLOW_UP,
    update_targets: ActionType.UPDATE_TARGETS,
    collect_missing_info: ActionType.COLLECT_MISSING_INFO,
  };
  return mapping[blueprintType] || ActionType.IMPROVE_RESUME;
}

/**
 * Determine execution type based on action type
 */
function getExecutionType(actionType: ActionType): ExecutionType {
  switch (actionType) {
    case ActionType.IMPROVE_RESUME:
      return 'auto';
    case ActionType.APPLY_TO_JOB:
      return 'user_confirmed';
    case ActionType.FOLLOW_UP:
      return 'user_only';
    case ActionType.UPDATE_TARGETS:
      return 'user_only';
    case ActionType.COLLECT_MISSING_INFO:
      return 'user_only';
    case ActionType.REFRESH_STATE:
      return 'user_only';
    default:
      return 'user_only';
  }
}

/**
 * Get template key for action type
 */
function getTemplateKey(actionType: ActionType, payload: TaskPayload): string {
  if (actionType === ActionType.IMPROVE_RESUME) {
    if (payload.rewrite_type === 'summary') {
      return 'improve_summary';
    }
    if (payload.rewrite_type === 'section') {
      return 'improve_section';
    }
    return 'improve_bullet';
  }
  
  const mapping: Record<ActionType, string> = {
    [ActionType.IMPROVE_RESUME]: 'improve_bullet',
    [ActionType.APPLY_TO_JOB]: 'apply_to_job',
    [ActionType.FOLLOW_UP]: 'followup_application',
    [ActionType.UPDATE_TARGETS]: 'update_targets',
    [ActionType.COLLECT_MISSING_INFO]: 'collect_missing_info',
    [ActionType.REFRESH_STATE]: 'refresh_state',
  };
  
  return mapping[actionType] || 'improve_bullet';
}

/**
 * Estimate task time in minutes
 */
export function estimateTaskTime(actionType: ActionType, payload: TaskPayload): number {
  const base = BASE_TIME_ESTIMATES[actionType] || 20;
  
  // Adjust based on payload
  if (actionType === ActionType.IMPROVE_RESUME) {
    const itemCount = payload.weak_bullets?.length || 1;
    return Math.min(base * itemCount, 120);
  }
  
  return Math.min(Math.max(base, 5), 120);
}

/**
 * Convert an ActionBlueprint from Layer 2 to a Task
 */
export function createTaskFromBlueprint(
  blueprint: ActionBlueprint,
  state: Layer4StateForLayer5,
  basePriority?: number
): Task {
  const actionType = mapBlueprintTypeToActionType(blueprint.type);
  
  // Build payload from blueprint entities and constraints
  const payload: TaskPayload = {
    ...blueprint.entities,
    ...blueprint.constraints,
  };
  
  // Get template for title/description
  const templateKey = getTemplateKey(actionType, payload);
  const template = getTaskTemplate(templateKey);
  
  // Build template variables
  const variables: Record<string, string | number | undefined> = {
    bullet_preview: payload.bullet ? getBulletPreview(payload.bullet) : undefined,
    section: payload.section,
    job_title: payload.job_title,
    company: payload.company,
    platform: payload.platform || 'company website',
    missing_field: 'required information',
  };
  
  // Apply templates
  const title = template
    ? applyTemplateVariables(template.title, variables)
    : blueprint.objective;
  const description = template
    ? applyTemplateVariables(template.description, variables)
    : blueprint.why;
  
  // Calculate execution type
  const execution = template?.execution as ExecutionType || getExecutionType(actionType);
  
  // Estimate time
  const estimatedMinutes = template?.estimated_minutes || estimateTaskTime(actionType, payload);
  
  // Build evidence references
  const evidenceRefs: string[] = [];
  if (blueprint.entities?.bullet_index !== undefined) {
    evidenceRefs.push(`resume.bullet[${blueprint.entities.bullet_index}]`);
  }
  if (blueprint.entities?.section) {
    evidenceRefs.push(`resume.section.${blueprint.entities.section}`);
  }
  if (state.resume?.resume_score !== undefined) {
    evidenceRefs.push(`state.resume.score=${state.resume.resume_score}`);
  }
  if (state.current_strategy_mode) {
    evidenceRefs.push(`state.strategy_mode=${state.current_strategy_mode}`);
  }
  
  return {
    task_id: generateTaskId(),
    action_type: actionType,
    title,
    description,
    execution,
    payload,
    priority: basePriority ?? blueprint.priority * 10, // Scale 1-10 to 10-100
    estimated_minutes: estimatedMinutes,
    why_now: blueprint.why,
    evidence_refs: evidenceRefs,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

// ==================== Follow-up Task Creation ====================

/**
 * Create a follow-up task from follow-up application info
 */
export function createFollowUpTask(
  followUp: FollowUpApplication,
  basePriority: number = 70
): Task {
  const template = getTaskTemplate('followup_application');
  
  const variables: Record<string, string | number | undefined> = {
    company: followUp.company,
    job_title: followUp.job_title,
  };
  
  const title = template
    ? applyTemplateVariables(template.title, variables)
    : `Follow up on ${followUp.company} application`;
    
  const description = template
    ? applyTemplateVariables(template.description, variables)
    : `Check status and send follow-up for your ${followUp.job_title} application at ${followUp.company}.`;
  
  const payload: TaskPayload = {
    application_id: followUp.application_id,
    company: followUp.company,
    job_title: followUp.job_title,
    days_since_application: followUp.days_since_application,
    follow_up_count: followUp.follow_up_count,
  };
  
  // Build why_now based on timing
  let whyNow: string;
  if (followUp.days_since_application >= 7 && followUp.days_since_application <= 10) {
    whyNow = `Optimal follow-up window: ${followUp.days_since_application} days since application.`;
  } else if (followUp.days_since_application > 10) {
    whyNow = `Application aging: ${followUp.days_since_application} days without response. Follow-up recommended.`;
  } else {
    whyNow = `Application submitted ${followUp.days_since_application} days ago. Consider following up.`;
  }
  
  return {
    task_id: generateTaskId(),
    action_type: ActionType.FOLLOW_UP,
    title,
    description,
    execution: 'user_only',
    payload,
    priority: basePriority,
    estimated_minutes: template?.estimated_minutes || 10,
    why_now: whyNow,
    evidence_refs: [
      `application.${followUp.application_id}`,
      `application.days_since=${followUp.days_since_application}`,
      `application.follow_up_count=${followUp.follow_up_count}`,
    ],
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

// ==================== Refresh Task Creation ====================

/**
 * Create a state refresh task
 */
export function createRefreshTask(
  reason: string,
  priority: number = 90
): Task {
  const template = getTaskTemplate('refresh_state');
  
  const title = template?.title || 'Update Your Information';
  const description = `Your data is outdated: ${reason}. Please update your resume and application status.`;
  
  return {
    task_id: generateTaskId(),
    action_type: ActionType.REFRESH_STATE,
    title,
    description,
    execution: 'user_only',
    payload: {
      refresh_reason: reason,
    },
    priority,
    estimated_minutes: template?.estimated_minutes || 15,
    why_now: 'Your information needs updating before we can make good recommendations.',
    evidence_refs: [`state.freshness.staleness_reason=${reason}`],
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

// ==================== Strategy Task Creation ====================

/**
 * Create a strategy review task
 */
export function createStrategyReviewTask(
  reason: string,
  priority: number = 75
): Task {
  const template = getTaskTemplate('review_strategy');
  
  return {
    task_id: generateTaskId(),
    action_type: ActionType.UPDATE_TARGETS,
    title: template?.title || 'Review your job search strategy',
    description: template?.description || reason,
    execution: 'user_only',
    payload: {},
    priority,
    estimated_minutes: template?.estimated_minutes || 20,
    why_now: reason,
    evidence_refs: [],
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

// ==================== Minimal Tasks Generation ====================

/**
 * Generate minimal tasks from priority actions (fallback when no blueprints)
 */
export function generateMinimalTasksFromActions(
  priorityActions: string[],
  state: Layer4StateForLayer5
): Task[] {
  const tasks: Task[] = [];
  
  for (const action of priorityActions.slice(0, 5)) {
    // Try to infer task type from action text
    let actionType = ActionType.UPDATE_TARGETS;
    let execution: ExecutionType = 'user_only';
    
    if (action.toLowerCase().includes('resume') || action.toLowerCase().includes('bullet')) {
      actionType = ActionType.IMPROVE_RESUME;
      execution = 'user_confirmed';
    } else if (action.toLowerCase().includes('apply')) {
      actionType = ActionType.APPLY_TO_JOB;
      execution = 'user_confirmed';
    } else if (action.toLowerCase().includes('follow')) {
      actionType = ActionType.FOLLOW_UP;
      execution = 'user_only';
    }
    
    tasks.push({
      task_id: generateTaskId(),
      action_type: actionType,
      title: action.substring(0, 100),
      description: action,
      execution,
      payload: {},
      priority: 50,
      estimated_minutes: 15,
      why_now: `Recommended by strategy analysis: ${action}`,
      evidence_refs: [
        `analysis.priority_actions`,
        state.current_strategy_mode 
          ? `state.strategy_mode=${state.current_strategy_mode}`
          : 'state.strategy_mode=default',
      ],
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }
  
  return tasks;
}

// ==================== Focus Area Determination ====================

/**
 * Determine focus area from action type
 */
export function getFocusAreaForActionType(actionType: ActionType): FocusArea {
  switch (actionType) {
    case ActionType.IMPROVE_RESUME:
      return FocusArea.RESUME_IMPROVEMENT;
    case ActionType.APPLY_TO_JOB:
      return FocusArea.APPLICATIONS;
    case ActionType.FOLLOW_UP:
      return FocusArea.FOLLOW_UPS;
    case ActionType.UPDATE_TARGETS:
    case ActionType.COLLECT_MISSING_INFO:
    case ActionType.REFRESH_STATE:
      return FocusArea.STRATEGY;
    default:
      return FocusArea.STRATEGY;
  }
}

/**
 * Determine dominant focus area from tasks
 */
export function determineFocusArea(tasks: Task[]): FocusArea {
  if (tasks.length === 0) {
    return FocusArea.STRATEGY;
  }
  
  const counts: Record<FocusArea, number> = {
    [FocusArea.APPLICATIONS]: 0,
    [FocusArea.RESUME_IMPROVEMENT]: 0,
    [FocusArea.FOLLOW_UPS]: 0,
    [FocusArea.STRATEGY]: 0,
  };
  
  for (const task of tasks) {
    const area = getFocusAreaForActionType(task.action_type);
    counts[area]++;
  }
  
  // Find area with highest count
  let maxArea = FocusArea.STRATEGY;
  let maxCount = 0;
  
  for (const [area, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxArea = area as FocusArea;
    }
  }
  
  return maxArea;
}
