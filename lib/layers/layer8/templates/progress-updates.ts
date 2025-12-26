/**
 * Layer 8 - AI Coach Interface
 * Progress Update Templates
 *
 * Template functions for progress updates and milestone celebrations.
 */

import type { ProgressContext, CoachContext, Tone } from '../types';
import { bold, joinParagraphs, formatBulletList, section, progressIndicator, percentage } from '../formatters';
import { getEmoji } from '../config';
import { getProgressEmoji } from '../tone';

// ==================== Weekly Progress ====================

/**
 * Generate a weekly progress summary
 */
export function weeklyProgressSummary(context: ProgressContext): string {
  const emoji = getProgressEmoji(context.completionPercentage || 0);
  
  const intro = `${emoji} ${bold('Weekly Progress Summary')}`;
  
  const stats: string[] = [];
  
  // Add completion percentage
  if (context.completionPercentage !== undefined) {
    stats.push(`Overall completion: ${percentage(context.completionPercentage)}`);
  }
  
  // Add task stats
  if (context.tasksCompleted !== undefined && context.totalTasks !== undefined) {
    stats.push(progressIndicator(context.tasksCompleted, context.totalTasks, 'Tasks completed'));
  }
  
  // Add application stats
  if (context.applicationsSubmitted !== undefined && context.applicationsTarget !== undefined) {
    stats.push(progressIndicator(context.applicationsSubmitted, context.applicationsTarget, 'Applications submitted'));
  }
  
  // Add score improvement
  if (context.scoreImprovement !== undefined && context.scoreImprovement > 0) {
    stats.push(`Resume score improved by ${bold(`+${context.scoreImprovement}`)} points`);
  }
  
  let summary = joinParagraphs(intro, formatBulletList(stats));
  
  // Add contextual message based on progress
  const progressMessage = getProgressMessage(context.completionPercentage || 0);
  if (progressMessage) {
    summary = joinParagraphs(summary, progressMessage);
  }
  
  return summary;
}

/**
 * Get contextual message based on progress percentage
 */
function getProgressMessage(progressPct: number): string {
  if (progressPct >= 100) {
    return `🎉 ${bold('Excellent!')} You've hit all your targets this week. Great work!`;
  }
  if (progressPct >= 75) {
    return `💪 ${bold('Strong progress!')} You're almost at your weekly goals.`;
  }
  if (progressPct >= 50) {
    return `👍 ${bold('Good momentum!')} You're halfway through your weekly targets.`;
  }
  if (progressPct >= 25) {
    return `🎯 ${bold('Getting started!')} Keep building momentum this week.`;
  }
  return `🚀 ${bold('Time to get going!')} Let's make progress on your goals this week.`;
}

// ==================== Daily Progress ====================

/**
 * Generate a daily progress update
 */
export function dailyProgressUpdate(context: ProgressContext): string {
  const emoji = getProgressEmoji(context.completionPercentage || 0);
  
  const intro = `${emoji} ${bold('Today\'s Progress')}`;
  
  const stats: string[] = [];
  
  if (context.tasksCompleted !== undefined && context.totalTasks !== undefined) {
    stats.push(progressIndicator(context.tasksCompleted, context.totalTasks, 'Tasks done'));
  }
  
  if (context.applicationsSubmitted !== undefined) {
    stats.push(`Applications submitted: ${context.applicationsSubmitted}`);
  }
  
  let summary = joinParagraphs(intro, formatBulletList(stats));
  
  // Add encouragement based on progress
  if (context.completionPercentage !== undefined) {
    if (context.completionPercentage >= 100) {
      summary = joinParagraphs(summary, '✅ You\'ve completed everything on today\'s plan!');
    } else if (context.completionPercentage >= 50) {
      summary = joinParagraphs(summary, '👍 Great progress! Keep going.');
    }
  }
  
  return summary;
}

// ==================== Milestone Celebrations ====================

/**
 * Celebrate a milestone achievement
 */
export function milestoneAchieved(context: CoachContext): string {
  const milestoneType = context.event || 'milestone';
  
  switch (milestoneType) {
    case 'first_application':
      return celebrateFirstApplication(context);
    case 'first_interview':
      return celebrateFirstInterview(context);
    case 'first_offer':
      return celebrateFirstOffer(context);
    case 'weekly_target_met':
      return celebrateWeeklyTarget(context);
    case 'score_improved':
      return celebrateScoreImprovement(context);
    default:
      return celebrateGenericMilestone(context);
  }
}

/**
 * Celebrate first application submission
 */
function celebrateFirstApplication(context: CoachContext): string {
  const emoji = getEmoji('celebration');
  
  const intro = `${emoji} ${bold('First Application Submitted!')}`;
  
  const message = 'This is a big step! Getting your first application out there is often the hardest part. The momentum will build from here.';
  
  const tips: string[] = [
    'Keep the momentum going with your next applications',
    'Track your applications to learn what works',
    'Most responses take 1-2 weeks, so patience is key',
  ];
  
  return joinParagraphs(
    intro,
    message,
    section('What\'s Next', formatBulletList(tips))
  );
}

/**
 * Celebrate first interview
 */
export function celebrateFirstInterview(context: CoachContext): string {
  const emoji = getEmoji('celebration');
  
  const jobTitle = context.jobTitle || 'the position';
  const company = context.company || 'the company';
  
  const intro = `${emoji} ${bold('You Got an Interview!')}`;
  
  const message = `Congratulations! You've landed an interview for ${bold(jobTitle)} at ${bold(company)}. This is a major milestone in your job search.`;
  
  const nextSteps: string[] = [
    'Research the company and role thoroughly',
    'Prepare answers for common interview questions',
    'Practice your responses out loud',
    'Prepare thoughtful questions to ask the interviewer',
  ];
  
  return joinParagraphs(
    intro,
    message,
    section('How to Prepare', formatBulletList(nextSteps))
  );
}

/**
 * Celebrate first offer
 */
function celebrateFirstOffer(context: CoachContext): string {
  const emoji = getEmoji('celebration');
  
  const jobTitle = context.jobTitle || 'the position';
  const company = context.company || 'the company';
  
  const intro = `${emoji}${emoji} ${bold('You Got an Offer!')}`;
  
  const message = `Incredible news! You've received an offer for ${bold(jobTitle)} at ${bold(company)}. All your hard work has paid off!`;
  
  const considerations: string[] = [
    'Review the full compensation package (salary, benefits, equity)',
    'Consider the role\'s growth potential',
    'Think about work-life balance and culture fit',
    'Don\'t be afraid to negotiate if appropriate',
  ];
  
  return joinParagraphs(
    intro,
    message,
    section('Before You Decide', formatBulletList(considerations))
  );
}

/**
 * Celebrate hitting weekly target
 */
function celebrateWeeklyTarget(context: CoachContext): string {
  const emoji = getEmoji('success');
  
  const intro = `${emoji} ${bold('Weekly Target Met!')}`;
  
  const message = 'You\'ve hit your application target for the week. Consistency like this is what leads to results.';
  
  return joinParagraphs(intro, message, 'Keep this momentum going into next week! 🚀');
}

/**
 * Celebrate resume score improvement
 */
export function celebrateScoreImprovement(context: CoachContext): string {
  const emoji = getEmoji('chart');
  
  const intro = `${emoji} ${bold('Resume Score Improved!')}`;
  
  let message: string;
  if (context.oldScore !== undefined && context.newScore !== undefined) {
    const improvement = context.newScore - context.oldScore;
    message = `Your resume score went from ${context.oldScore} to ${bold(String(context.newScore))} (+${improvement} points)!`;
  } else if (context.scoreChange !== undefined) {
    message = `Your resume score improved by ${bold(`+${context.scoreChange}`)} points!`;
  } else {
    message = 'Your resume score has improved!';
  }
  
  const impact = 'A higher resume score typically leads to better response rates from employers.';
  
  return joinParagraphs(intro, message, impact);
}

/**
 * Generic milestone celebration
 */
function celebrateGenericMilestone(context: CoachContext): string {
  const emoji = getEmoji('star');
  
  const intro = `${emoji} ${bold('Milestone Achieved!')}`;
  const message = 'Great progress on your job search journey. Every step forward counts!';
  
  return joinParagraphs(intro, message);
}

// ==================== Progress Tracking Messages ====================

/**
 * Generate a "behind schedule" message
 */
export function behindScheduleMessage(context: ProgressContext): string {
  const emoji = getEmoji('clock');
  
  const intro = `${emoji} ${bold('Progress Check')}`;
  
  let message = 'You\'re a bit behind on your weekly goals.';
  
  if (context.applicationsSubmitted !== undefined && context.applicationsTarget !== undefined) {
    const remaining = context.applicationsTarget - context.applicationsSubmitted;
    message += ` You have ${remaining} more applications to hit your target.`;
  }
  
  const encouragement = 'That\'s okay — let\'s focus on making progress today. Even one application moves you forward.';
  
  return joinParagraphs(intro, message, encouragement);
}

/**
 * Generate an "on track" message
 */
export function onTrackMessage(context: ProgressContext): string {
  const emoji = getEmoji('thumbsup');
  
  const intro = `${emoji} ${bold('On Track!')}`;
  
  const message = 'You\'re progressing well toward your weekly goals. Keep up the consistent effort!';
  
  return joinParagraphs(intro, message);
}

/**
 * Generate an "ahead of schedule" message
 */
export function aheadOfScheduleMessage(context: ProgressContext): string {
  const emoji = getEmoji('rocket');
  
  const intro = `${emoji} ${bold('Ahead of Schedule!')}`;
  
  let message = 'Excellent work! You\'re ahead of your planned pace.';
  
  if (context.applicationsSubmitted !== undefined && context.applicationsTarget !== undefined) {
    if (context.applicationsSubmitted > context.applicationsTarget) {
      message += ` You've already exceeded your weekly application target!`;
    }
  }
  
  return joinParagraphs(intro, message);
}
