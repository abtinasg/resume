/**
 * Layer 8 - AI Coach Interface
 * Action Explanation Templates
 *
 * Template functions for explaining recommended actions and tasks.
 */

import type { ActionExplanationContext, Tone } from '../types';
import { ActionType } from '../../shared/types';
import { bold, joinParagraphs, formatBulletList, section, keyValue } from '../formatters';
import { getEmoji } from '../config';

// ==================== Action Type Explanations ====================

/**
 * Explain a bullet improvement action
 */
export function explainBulletImprovement(context: ActionExplanationContext): string {
  const emoji = getEmoji('target');
  
  const intro = `${emoji} ${bold('Action: Improve Resume Bullet')}`;
  
  let explanation = 'This bullet could be stronger. Let me explain why and how to improve it.';
  
  // Add specific issues if available in payload
  const payload = context.payload || {};
  if (payload.issues && Array.isArray(payload.issues)) {
    explanation = joinParagraphs(
      explanation,
      section('Issues Found', formatBulletList(payload.issues as string[]))
    );
  }
  
  // Add the why_now reasoning
  if (context.whyNow) {
    explanation = joinParagraphs(explanation, `${bold('Why now')}: ${context.whyNow}`);
  }
  
  // Add expected outcome if available
  if (context.expectedOutcome) {
    explanation = joinParagraphs(explanation, `${bold('Expected Result')}: ${context.expectedOutcome}`);
  }
  
  // Add estimated score gain if available
  if (payload.estimated_score_gain) {
    explanation = joinParagraphs(
      explanation,
      `This improvement could boost your resume score by approximately ${bold(`+${payload.estimated_score_gain}`)} points.`
    );
  }
  
  return joinParagraphs(intro, explanation);
}

/**
 * Explain a job application action
 */
export function explainJobApplication(context: ActionExplanationContext): string {
  const emoji = getEmoji('rocket');
  
  const intro = `${emoji} ${bold('Action: Apply to Job')}`;
  
  const payload = context.payload || {};
  const jobTitle = payload.job_title || context.title || 'this role';
  const company = payload.company || 'the company';
  
  let explanation = `I recommend applying to ${bold(String(jobTitle))} at ${bold(String(company))}.`;
  
  // Add match score if available
  if (payload.match_score) {
    explanation += ` This is a ${bold(`${payload.match_score}%`)} match for your profile.`;
  }
  
  // Add why_now reasoning
  if (context.whyNow) {
    explanation = joinParagraphs(explanation, `${bold('Why this job')}: ${context.whyNow}`);
  }
  
  // Add time estimate
  if (context.estimatedMinutes) {
    explanation = joinParagraphs(
      explanation,
      `${bold('Estimated time')}: ${context.estimatedMinutes} minutes`
    );
  }
  
  return joinParagraphs(intro, explanation);
}

/**
 * Explain a follow-up action
 */
export function explainFollowUp(context: ActionExplanationContext): string {
  const emoji = getEmoji('clock');
  
  const intro = `${emoji} ${bold('Action: Follow Up on Application')}`;
  
  const payload = context.payload || {};
  const company = payload.company || 'the company';
  const daysSince = payload.days_since_application || '7+';
  
  let explanation = `It's been ${bold(String(daysSince))} days since you applied to ${bold(String(company))}. A polite follow-up can help keep your application visible.`;
  
  // Add follow-up count context
  if (payload.follow_up_count !== undefined) {
    if (payload.follow_up_count === 0) {
      explanation += ' This would be your first follow-up.';
    } else {
      explanation += ` This would be follow-up #${Number(payload.follow_up_count) + 1}.`;
    }
  }
  
  // Add why_now reasoning
  if (context.whyNow) {
    explanation = joinParagraphs(explanation, `${bold('Why now')}: ${context.whyNow}`);
  }
  
  // Add best practices
  const tips: string[] = [
    'Keep it brief and professional',
    'Reference your application date',
    'Express continued interest',
    "Don't be pushy or demanding",
  ];
  
  return joinParagraphs(
    intro,
    explanation,
    section('Follow-up Tips', formatBulletList(tips))
  );
}

/**
 * Explain a skill gap action
 */
export function explainSkillGap(context: ActionExplanationContext): string {
  const emoji = getEmoji('lightbulb');
  
  const intro = `${emoji} ${bold('Action: Address Skill Gap')}`;
  
  const payload = context.payload || {};
  
  let explanation = context.whyNow || 'Addressing this skill gap will make your profile stronger for your target roles.';
  
  // Add specific skills if available
  if (payload.missing_skills && Array.isArray(payload.missing_skills)) {
    explanation = joinParagraphs(
      explanation,
      section('Skills to Develop', formatBulletList(payload.missing_skills as string[]))
    );
  }
  
  // Add expected outcome
  if (context.expectedOutcome) {
    explanation = joinParagraphs(explanation, `${bold('Expected Result')}: ${context.expectedOutcome}`);
  }
  
  return joinParagraphs(intro, explanation);
}

// ==================== Main Action Explanation ====================

/**
 * Generate an action explanation based on action type
 */
export function explainAction(context: ActionExplanationContext): string {
  const actionType = context.actionType.toLowerCase();
  
  switch (actionType) {
    case 'improve_resume':
    case ActionType.IMPROVE_RESUME.toLowerCase():
      return explainBulletImprovement(context);
    
    case 'apply_to_job':
    case ActionType.APPLY_TO_JOB.toLowerCase():
      return explainJobApplication(context);
    
    case 'follow_up':
    case ActionType.FOLLOW_UP.toLowerCase():
      return explainFollowUp(context);
    
    case 'update_targets':
    case ActionType.UPDATE_TARGETS.toLowerCase():
      return explainUpdateTargets(context);
    
    case 'collect_missing_info':
    case ActionType.COLLECT_MISSING_INFO.toLowerCase():
      return explainCollectInfo(context);
    
    case 'refresh_state':
    case ActionType.REFRESH_STATE.toLowerCase():
      return explainRefreshState(context);
    
    default:
      return explainGenericAction(context);
  }
}

/**
 * Explain an update targets action
 */
function explainUpdateTargets(context: ActionExplanationContext): string {
  const emoji = getEmoji('target');
  
  const intro = `${emoji} ${bold('Action: Update Your Targets')}`;
  
  let explanation = 'Based on your recent results, I suggest reviewing and updating your target roles or preferences.';
  
  if (context.whyNow) {
    explanation = joinParagraphs(explanation, `${bold('Why now')}: ${context.whyNow}`);
  }
  
  return joinParagraphs(intro, explanation);
}

/**
 * Explain a collect missing info action
 */
function explainCollectInfo(context: ActionExplanationContext): string {
  const emoji = getEmoji('info');
  
  const intro = `${emoji} ${bold('Action: Provide Missing Information')}`;
  
  let explanation = 'I need some additional information to give you better recommendations.';
  
  if (context.whyNow) {
    explanation = joinParagraphs(explanation, `${bold('What I need')}: ${context.whyNow}`);
  }
  
  return joinParagraphs(intro, explanation);
}

/**
 * Explain a refresh state action
 */
function explainRefreshState(context: ActionExplanationContext): string {
  const emoji = getEmoji('clock');
  
  const intro = `${emoji} ${bold('Action: Update Your Information')}`;
  
  let explanation = 'Your information may be out of date. Let\'s refresh to ensure my recommendations are accurate.';
  
  const payload = context.payload || {};
  if (payload.refresh_reason) {
    explanation = joinParagraphs(explanation, `${bold('Reason')}: ${payload.refresh_reason}`);
  }
  
  return joinParagraphs(intro, explanation);
}

/**
 * Generic action explanation
 */
function explainGenericAction(context: ActionExplanationContext): string {
  const emoji = getEmoji('target');
  
  const intro = `${emoji} ${bold(`Action: ${context.title}`)}`;
  
  let explanation = context.whyNow || 'This action will help you progress in your job search.';
  
  if (context.expectedOutcome) {
    explanation = joinParagraphs(explanation, `${bold('Expected Result')}: ${context.expectedOutcome}`);
  }
  
  if (context.estimatedMinutes) {
    explanation = joinParagraphs(
      explanation,
      `${bold('Estimated time')}: ${context.estimatedMinutes} minutes`
    );
  }
  
  return joinParagraphs(intro, explanation);
}

// ==================== Task List Explanations ====================

/**
 * Explain a list of tasks
 */
export function explainTaskList(
  tasks: ActionExplanationContext[],
  totalMinutes?: number
): string {
  const emoji = getEmoji('target');
  
  const intro = `${emoji} ${bold(`Today's Plan: ${tasks.length} Tasks`)}`;
  
  const taskItems = tasks.map((task, index) => ({
    text: `${bold(`Priority ${index + 1}`)}: ${task.title}`,
    detail: task.whyNow,
  }));
  
  let explanation = joinParagraphs(
    intro,
    formatBulletList(taskItems)
  );
  
  if (totalMinutes) {
    explanation = joinParagraphs(
      explanation,
      `${bold('Total estimated time')}: ${totalMinutes} minutes`
    );
  }
  
  return explanation;
}

// ==================== Priority Explanations ====================

/**
 * Explain why an action is high priority
 */
export function explainPriority(
  context: ActionExplanationContext,
  priority: number
): string {
  let priorityLabel: string;
  let reason: string;
  
  if (priority >= 80) {
    priorityLabel = 'High Priority';
    reason = 'This action has significant impact on your job search progress.';
  } else if (priority >= 50) {
    priorityLabel = 'Medium Priority';
    reason = 'This action will help maintain your momentum.';
  } else {
    priorityLabel = 'Lower Priority';
    reason = 'This action is helpful but not urgent.';
  }
  
  return `${bold(priorityLabel)} (${priority}/100): ${reason}`;
}
