/**
 * Layer 8 - AI Coach Interface
 * Encouragement Templates
 *
 * Template functions for encouragement and motivation messages.
 */

import type { CoachContext, ToneContext, Tone } from '../types';
import { bold, joinParagraphs, formatBulletList } from '../formatters';
import { getEmoji } from '../config';

// ==================== Post-Event Encouragement ====================

/**
 * Encourage after a rejection
 */
export function encourageAfterRejection(context: CoachContext): string {
  const company = context.company ? ` from ${context.company}` : '';
  
  const intro = `I know rejections${company} are tough. It's completely normal to feel disappointed.`;
  
  const perspective = [
    'Rejections are a normal part of job searching — even the best candidates face them',
    'Each application is practice and helps refine your approach',
    'The right opportunity is still out there',
  ];
  
  const nextSteps = `Let's keep moving forward. Would you like me to find some new opportunities that match your profile?`;
  
  return joinParagraphs(
    intro,
    formatBulletList(perspective),
    nextSteps
  );
}

/**
 * Encourage after no response
 */
export function encourageNoResponse(context: CoachContext): string {
  const intro = `Not hearing back can be frustrating, but it's unfortunately common in today's job market.`;
  
  const facts = [
    'Many companies receive hundreds of applications per role',
    'Silence doesn\'t always mean rejection — companies often have long hiring processes',
    'Following up after 1-2 weeks can sometimes help surface your application',
  ];
  
  const suggestion = 'The best strategy is to keep applying while waiting. Let\'s find some more opportunities.';
  
  return joinParagraphs(
    intro,
    formatBulletList(facts),
    suggestion
  );
}

/**
 * Encourage after multiple rejections
 */
export function encourageAfterMultipleRejections(context: CoachContext): string {
  const emoji = getEmoji('muscle');
  
  const intro = `${emoji} I hear you — multiple rejections in a row can really test your confidence.`;
  
  const validation = 'Your feelings are valid. Job searching is genuinely hard, and persistence is required.';
  
  const dataPoint = context.pipelineState?.total_applications
    ? `You've put in real effort with ${context.pipelineState.total_applications} applications.`
    : 'You\'ve been putting in real effort.';
  
  const actionPlan = [
    'Let\'s review your targeting to make sure we\'re aiming at the right roles',
    'We can analyze which applications got the best responses',
    'Consider if there are patterns in the rejections we can learn from',
  ];
  
  return joinParagraphs(
    intro,
    validation,
    dataPoint,
    bold('What we can do:'),
    formatBulletList(actionPlan)
  );
}

// ==================== Motivation to Act ====================

/**
 * Motivate to apply
 */
export function motivateToApply(context: CoachContext): string {
  const emoji = getEmoji('rocket');
  
  const intro = `${emoji} ${bold('Time to Apply!')}`;
  
  let message = 'Applications are the path to opportunities. Each one you send is a chance at your next role.';
  
  // Add context about weekly target if available
  if (context.weeklyTarget && context.applicationsThisWeek !== undefined) {
    const remaining = context.weeklyTarget - context.applicationsThisWeek;
    if (remaining > 0) {
      message += ` You're ${remaining} applications away from your weekly goal.`;
    }
  }
  
  const tips = [
    'Start with your highest-match jobs',
    'Set a timer for 25 minutes of focused application work',
    'Quality matters — tailor each application to the role',
  ];
  
  return joinParagraphs(
    intro,
    message,
    bold('Quick Tips:'),
    formatBulletList(tips)
  );
}

/**
 * Motivate to improve resume
 */
export function motivateToImproveResume(context: CoachContext): string {
  const emoji = getEmoji('target');
  
  const intro = `${emoji} ${bold('Let\'s Strengthen Your Resume')}`;
  
  let message = 'A strong resume is the foundation of your job search. Small improvements can make a big difference.';
  
  if (context.resumeScore !== undefined && context.resumeScore < 75) {
    message += ` Your current score of ${context.resumeScore}/100 has room to grow.`;
  }
  
  const benefits = [
    'Higher response rates from employers',
    'Better first impressions with hiring managers',
    'More confidence when applying',
  ];
  
  return joinParagraphs(
    intro,
    message,
    bold('Benefits of a Stronger Resume:'),
    formatBulletList(benefits)
  );
}

/**
 * Motivate to follow up
 */
export function motivateToFollowUp(context: CoachContext): string {
  const emoji = getEmoji('clock');
  
  const intro = `${emoji} ${bold('Time for a Follow-up')}`;
  
  const message = 'A well-timed follow-up shows initiative and keeps your application top of mind. It can make the difference between being overlooked and getting an interview.';
  
  const guidelines = [
    'Wait 1-2 weeks after applying before following up',
    'Keep it brief and professional',
    'Express continued interest without being pushy',
    'Reference your original application',
  ];
  
  return joinParagraphs(
    intro,
    message,
    bold('Follow-up Guidelines:'),
    formatBulletList(guidelines)
  );
}

// ==================== Celebrate Progress ====================

/**
 * Celebrate progress
 */
export function celebrateProgress(context: CoachContext): string {
  const emoji = getEmoji('celebration');
  
  const intro = `${emoji} ${bold('You\'re Making Progress!')}`;
  
  const achievements: string[] = [];
  
  if (context.pipelineState?.total_applications) {
    achievements.push(`${context.pipelineState.total_applications} applications submitted`);
  }
  
  if (context.pipelineState?.interview_requests && context.pipelineState.interview_requests > 0) {
    achievements.push(`${context.pipelineState.interview_requests} interview${context.pipelineState.interview_requests > 1 ? 's' : ''} scheduled`);
  }
  
  if (context.resumeScore !== undefined) {
    achievements.push(`Resume score: ${context.resumeScore}/100`);
  }
  
  let message = 'Every step forward counts. Here\'s what you\'ve accomplished:';
  
  return joinParagraphs(
    intro,
    achievements.length > 0 ? message : 'Keep up the great work!',
    achievements.length > 0 ? formatBulletList(achievements) : '',
    'Keep the momentum going! 🚀'
  );
}

// ==================== Situational Encouragement ====================

/**
 * Encourage when feeling stuck
 */
export function encourageWhenStuck(context: CoachContext): string {
  const intro = 'I understand feeling stuck. It happens to everyone during a job search.';
  
  const unstickStrategies = [
    'Take a short break to recharge — burnout doesn\'t help anyone',
    'Focus on just one small task to build momentum',
    'Review and celebrate what you\'ve already accomplished',
    'Consider if your strategy needs adjustment',
  ];
  
  const closing = 'What feels most manageable right now? Let\'s start there.';
  
  return joinParagraphs(
    intro,
    bold('Ways to Get Unstuck:'),
    formatBulletList(unstickStrategies),
    closing
  );
}

/**
 * Encourage when anxious about results
 */
export function encourageWhenAnxious(context: CoachContext): string {
  const intro = 'Waiting for responses can be nerve-wracking. That anxiety is completely understandable.';
  
  const perspective = [
    'Response times vary widely — some companies take weeks',
    'No news is often not bad news',
    'Focus on what you can control: sending more applications',
    'Each application increases your chances',
  ];
  
  let dataPoint = '';
  if (context.pipelineState?.total_applications && context.pipelineState.total_applications > 0) {
    dataPoint = `You have ${context.pipelineState.total_applications} applications in the pipeline. That's ${context.pipelineState.total_applications} chances for the right opportunity to come through.`;
  }
  
  return joinParagraphs(
    intro,
    bold('Some Perspective:'),
    formatBulletList(perspective),
    dataPoint
  );
}

/**
 * Encourage to keep going
 */
export function encourageKeepGoing(context: CoachContext): string {
  const emoji = getEmoji('muscle');
  
  const messages = [
    `${emoji} You're doing great. Keep pushing forward!`,
    `${emoji} Every application brings you closer to the right opportunity.`,
    `${emoji} Consistency is key. You're building momentum.`,
    `${emoji} Your persistence will pay off. Keep going!`,
    `${emoji} The right role is out there. Let's find it together.`,
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  return randomMessage;
}

// ==================== Milestone Encouragement ====================

/**
 * Encouragement for reaching an application milestone
 */
export function encourageApplicationMilestone(count: number): string {
  const emoji = getEmoji('celebration');
  
  const milestones: Record<number, string> = {
    5: `${emoji} Your first 5 applications are done! You're building momentum.`,
    10: `${emoji} 10 applications sent! You're officially in the game.`,
    25: `${emoji} 25 applications! Your persistence is admirable.`,
    50: `${emoji} 50 applications! That's serious commitment.`,
    100: `${emoji} 100 applications! You're a job search warrior.`,
  };
  
  return milestones[count] || `${emoji} ${count} applications sent! Keep going!`;
}

/**
 * Encouragement for consistency
 */
export function encourageConsistency(daysActive: number): string {
  const emoji = getEmoji('star');
  
  if (daysActive >= 30) {
    return `${emoji} A month of consistent effort! That dedication will lead to results.`;
  }
  if (daysActive >= 14) {
    return `${emoji} Two weeks of focus! You're building strong habits.`;
  }
  if (daysActive >= 7) {
    return `${emoji} A full week of progress! Keep this momentum going.`;
  }
  
  return `${emoji} Great start! Consistency is the key to success.`;
}
