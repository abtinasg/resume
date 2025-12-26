/**
 * Layer 8 - AI Coach Interface
 * Action Explainer
 *
 * Generates explanations for recommended actions and tasks.
 */

import type {
  ActionExplanationContext,
  CoachContext,
  Tone,
} from '../types';
import type { Task, ActionBlueprint } from '../../layer5/types';
import { ActionType } from '../../shared/types';
import {
  explainAction,
  explainTaskList,
  explainPriority,
} from '../templates';
import { joinParagraphs, bold, formatBulletList } from '../formatters';
import { adaptTone } from '../tone';

// ==================== Main Explainer Functions ====================

/**
 * Explain a single task
 */
export function explainTask(task: Task, tone?: Tone): string {
  const context: ActionExplanationContext = {
    actionType: task.action_type,
    title: task.title,
    whyNow: task.why_now,
    estimatedMinutes: task.estimated_minutes,
    priority: task.priority,
    payload: task.payload,
  };

  let explanation = explainAction(context);

  // Add evidence if available
  if (task.evidence_refs && task.evidence_refs.length > 0) {
    explanation = joinParagraphs(
      explanation,
      formatEvidenceRefs(task.evidence_refs)
    );
  }

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Explain a blueprint from Layer 2
 */
export function explainBlueprint(blueprint: ActionBlueprint, tone?: Tone): string {
  const context: ActionExplanationContext = {
    actionType: blueprint.type,
    title: blueprint.objective,
    whyNow: blueprint.why,
    priority: blueprint.priority * 10, // Convert 1-10 to 10-100
    payload: {
      ...blueprint.entities,
      ...blueprint.constraints,
    },
  };

  let explanation = explainAction(context);

  // Add confidence level
  explanation = joinParagraphs(
    explanation,
    `**Confidence**: ${capitalizeFirst(blueprint.confidence)}`
  );

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Explain a list of tasks (daily plan)
 */
export function explainDailyPlan(tasks: Task[], tone?: Tone): string {
  if (tasks.length === 0) {
    return 'No tasks scheduled for today.';
  }

  const contexts: ActionExplanationContext[] = tasks.map(task => ({
    actionType: task.action_type,
    title: task.title,
    whyNow: task.why_now,
    estimatedMinutes: task.estimated_minutes,
    priority: task.priority,
  }));

  const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

  let explanation = explainTaskList(contexts, totalMinutes);

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Explain why an action has a specific priority
 */
export function explainActionPriority(
  task: Task,
  tone?: Tone
): string {
  const context: ActionExplanationContext = {
    actionType: task.action_type,
    title: task.title,
    whyNow: task.why_now,
    priority: task.priority,
  };

  let explanation = explainPriority(context, task.priority);

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

// ==================== Action Type Explanations ====================

/**
 * Generate explanation for resume improvement action
 */
export function explainResumeImprovement(
  context: {
    bullet?: string;
    issues?: string[];
    estimatedScoreGain?: number;
    section?: string;
  },
  tone?: Tone
): string {
  let explanation = `${bold('Action: Improve Resume')}`;

  if (context.section) {
    explanation = `${bold(`Action: Improve ${context.section} Section`)}`;
  }

  if (context.bullet) {
    explanation += `\n\n**Current bullet:**\n> "${context.bullet}"`;
  }

  if (context.issues && context.issues.length > 0) {
    explanation += `\n\n**Issues to fix:**\n${formatBulletList(context.issues)}`;
  }

  if (context.estimatedScoreGain) {
    explanation += `\n\n**Potential impact:** +${context.estimatedScoreGain} points`;
  }

  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Generate explanation for job application action
 */
export function explainApplicationAction(
  context: {
    jobTitle: string;
    company: string;
    fitScore?: number;
    matchReasons?: string[];
    platform?: string;
  },
  tone?: Tone
): string {
  let explanation = `${bold(`Action: Apply to ${context.jobTitle} at ${context.company}`)}`;

  if (context.fitScore) {
    explanation += `\n\n**Fit score:** ${context.fitScore}/100`;
  }

  if (context.matchReasons && context.matchReasons.length > 0) {
    explanation += `\n\n**Why it's a good match:**\n${formatBulletList(context.matchReasons)}`;
  }

  if (context.platform) {
    explanation += `\n\n**Apply via:** ${context.platform}`;
  }

  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Generate explanation for follow-up action
 */
export function explainFollowUpAction(
  context: {
    company: string;
    jobTitle?: string;
    daysSince: number;
    followUpCount: number;
  },
  tone?: Tone
): string {
  let explanation = `${bold(`Action: Follow up with ${context.company}`)}`;

  if (context.jobTitle) {
    explanation += ` for the ${context.jobTitle} role`;
  }

  explanation += `\n\nIt's been **${context.daysSince} days** since you applied.`;

  if (context.followUpCount === 0) {
    explanation += ' A first follow-up at this point is appropriate.';
  } else if (context.followUpCount === 1) {
    explanation += ' This would be your second follow-up. Keep it brief.';
  } else {
    explanation += ` You've followed up ${context.followUpCount} times. Consider moving on if no response.`;
  }

  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

// ==================== Helper Functions ====================

/**
 * Format evidence references
 */
function formatEvidenceRefs(refs: string[]): string {
  if (refs.length === 0) return '';

  return `**Based on:** ${refs.slice(0, 3).join(', ')}`;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==================== Action Grouping ====================

/**
 * Group and explain actions by type
 */
export function groupAndExplainActions(
  tasks: Task[],
  tone?: Tone
): Record<string, string> {
  const grouped: Record<string, Task[]> = {};

  // Group tasks by action type
  for (const task of tasks) {
    const type = task.action_type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(task);
  }

  // Generate explanations for each group
  const explanations: Record<string, string> = {};

  for (const [type, groupTasks] of Object.entries(grouped)) {
    const contexts: ActionExplanationContext[] = groupTasks.map(t => ({
      actionType: t.action_type,
      title: t.title,
      whyNow: t.why_now,
      estimatedMinutes: t.estimated_minutes,
      priority: t.priority,
    }));

    let explanation = `${bold(formatActionTypeName(type))}: ${groupTasks.length} task${groupTasks.length !== 1 ? 's' : ''}`;
    
    const taskLines = groupTasks.map(t => `- ${t.title}`).join('\n');
    explanation += `\n${taskLines}`;

    if (tone) {
      explanation = adaptTone(explanation, tone);
    }

    explanations[type] = explanation;
  }

  return explanations;
}

/**
 * Format action type to human-readable name
 */
function formatActionTypeName(type: string): string {
  const names: Record<string, string> = {
    [ActionType.IMPROVE_RESUME]: 'Resume Improvements',
    [ActionType.APPLY_TO_JOB]: 'Job Applications',
    [ActionType.FOLLOW_UP]: 'Follow-ups',
    [ActionType.UPDATE_TARGETS]: 'Target Updates',
    [ActionType.COLLECT_MISSING_INFO]: 'Information Needed',
    [ActionType.REFRESH_STATE]: 'State Updates',
  };

  return names[type] || type;
}

// ==================== Completion Messages ====================

/**
 * Generate completion message for an action
 */
export function generateCompletionMessage(
  task: Task,
  result: { success: boolean; details?: string },
  tone?: Tone
): string {
  let message: string;

  if (result.success) {
    message = `✅ **Completed:** ${task.title}`;
    if (result.details) {
      message += `\n${result.details}`;
    }
  } else {
    message = `❌ **Could not complete:** ${task.title}`;
    if (result.details) {
      message += `\n${result.details}`;
    }
  }

  if (tone) {
    message = adaptTone(message, tone);
  }

  return message;
}
