/**
 * Layer 8 - AI Coach Interface
 * Greeting Templates
 *
 * Template functions for greeting and acknowledgment messages.
 */

import type { CoachContext, Tone } from '../types';
import { StrategyMode } from '../../shared/types';
import { getEmoji } from '../config';
import { bold, joinParagraphs } from '../formatters';

// ==================== Greeting Templates ====================

/**
 * Generate a welcome greeting
 */
export function generateWelcome(context: CoachContext): string {
  const name = context.userName ? `, ${context.userName}` : '';
  const emoji = getEmoji('rocket');
  
  return `${emoji} Welcome${name}! I'm your AI career coach. I'm here to help you navigate your job search with data-driven insights and personalized guidance.`;
}

/**
 * Generate a returning user greeting
 */
export function generateReturningGreeting(context: CoachContext): string {
  const name = context.userName ? `, ${context.userName}` : '';
  const emoji = getEmoji('star');
  
  let greeting = `${emoji} Welcome back${name}!`;
  
  // Add context about current state if available
  if (context.strategyMode) {
    const modeDescription = getStrategyModeDescription(context.strategyMode);
    greeting += ` You're currently in ${bold(modeDescription)} mode.`;
  }
  
  if (context.resumeScore !== undefined) {
    greeting += ` Your resume score is ${bold(String(context.resumeScore))}/100.`;
  }
  
  return greeting;
}

/**
 * Generate a daily check-in greeting
 */
export function generateDailyCheckIn(context: CoachContext): string {
  const name = context.userName ? ` ${context.userName}` : '';
  const emoji = getEmoji('star');
  
  let greeting = `${emoji} Good morning${name}! Let's make today count.`;
  
  if (context.dailyPlan?.tasks && context.dailyPlan.tasks.length > 0) {
    greeting += ` I've prepared ${context.dailyPlan.tasks.length} tasks for you today.`;
  }
  
  if (context.applicationsThisWeek !== undefined && context.weeklyTarget) {
    const remaining = context.weeklyTarget - context.applicationsThisWeek;
    if (remaining > 0) {
      greeting += ` You have ${remaining} more applications to hit your weekly target.`;
    } else {
      greeting += ` You've already hit your weekly application target! 🎉`;
    }
  }
  
  return greeting;
}

/**
 * Generate an acknowledgment message
 */
export function generateAcknowledgment(
  action: string,
  context: CoachContext
): string {
  const emoji = getEmoji('success');
  
  const acknowledgments: Record<string, string> = {
    application_submitted: `${emoji} Great job! Your application has been submitted.`,
    resume_updated: `${emoji} Your resume has been updated successfully.`,
    task_completed: `${emoji} Task completed! Keep up the great work.`,
    preference_updated: `${emoji} Got it. I've updated your preferences.`,
    plan_confirmed: `${emoji} Perfect. Your plan has been confirmed.`,
  };
  
  return acknowledgments[action] || `${emoji} Done!`;
}

// ==================== Helper Functions ====================

/**
 * Get human-readable description of strategy mode
 */
function getStrategyModeDescription(mode: StrategyMode): string {
  switch (mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      return 'Resume Improvement';
    case StrategyMode.APPLY_MODE:
      return 'Application';
    case StrategyMode.RETHINK_TARGETS:
      return 'Strategy Review';
    default:
      return mode;
  }
}

// ==================== Contextual Greetings ====================

/**
 * Generate a greeting based on time of day
 */
export function generateTimeBasedGreeting(context: CoachContext): string {
  const hour = new Date().getHours();
  const name = context.userName ? `, ${context.userName}` : '';
  
  let timeGreeting: string;
  if (hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour < 17) {
    timeGreeting = 'Good afternoon';
  } else {
    timeGreeting = 'Good evening';
  }
  
  return `${timeGreeting}${name}!`;
}

/**
 * Generate a motivational greeting
 */
export function generateMotivationalGreeting(context: CoachContext): string {
  const emoji = getEmoji('muscle');
  const motivations = [
    "Let's make progress today!",
    "Every application brings you closer to your goal.",
    "You're one step closer to your next opportunity.",
    "Let's find your next great role together.",
    "Ready to move forward on your job search?",
  ];
  
  const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
  return `${emoji} ${randomMotivation}`;
}

// ==================== Farewell Messages ====================

/**
 * Generate a session end message
 */
export function generateFarewell(context: CoachContext): string {
  const name = context.userName ? `, ${context.userName}` : '';
  const emoji = getEmoji('star');
  
  let farewell = `${emoji} Great session${name}!`;
  
  if (context.dailyPlan?.tasks) {
    const completedTasks = context.dailyPlan.tasks.filter(
      t => t.status === 'completed'
    ).length;
    if (completedTasks > 0) {
      farewell += ` You completed ${completedTasks} task${completedTasks !== 1 ? 's' : ''}.`;
    }
  }
  
  farewell += ' Keep up the momentum!';
  
  return farewell;
}

// ==================== Status Updates ====================

/**
 * Generate a brief status update greeting
 */
export function generateStatusGreeting(context: CoachContext): string {
  const parts: string[] = [];
  
  if (context.resumeScore !== undefined) {
    parts.push(`Resume score: ${context.resumeScore}/100`);
  }
  
  if (context.pipelineState) {
    const state = context.pipelineState;
    if (state.total_applications !== undefined) {
      parts.push(`Applications: ${state.total_applications}`);
    }
    if (state.interview_requests !== undefined && state.interview_requests > 0) {
      parts.push(`Interviews: ${state.interview_requests}`);
    }
  }
  
  if (parts.length === 0) {
    return generateWelcome(context);
  }
  
  return joinParagraphs(
    generateTimeBasedGreeting(context),
    `Here's your current status: ${parts.join(' | ')}`
  );
}
