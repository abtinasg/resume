/**
 * Layer 5 - Orchestrator
 * Re-plan Trigger
 *
 * Determines when to regenerate weekly or daily plans.
 * Conservative approach - don't re-plan too often.
 */

import { StrategyMode, LayerEventType } from '../types';
import type {
  ReplanTrigger,
  ReplanTriggerType,
  WeeklyPlan,
  DailyPlan,
  Layer4StateForLayer5,
  ProgressSnapshot,
} from '../types';
import { trackWeeklyProgress, trackDailyProgress } from './progress-tracker';

// ==================== Constants ====================

/**
 * Minimum days before allowing another weekly re-plan
 */
const MIN_DAYS_BETWEEN_REPLANS = 2;

/**
 * Severe deviation threshold (completion vs expected)
 */
const SEVERE_DEVIATION_THRESHOLD = 0.25;

/**
 * Over-performance threshold (completion vs expected)
 */
const OVER_PERFORMANCE_THRESHOLD = 1.2;

// ==================== Date Utilities ====================

/**
 * Get day of week (1=Monday, ..., 7=Sunday)
 */
function getDayOfWeekISO(date: Date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/**
 * Check if it's mid-week (Wednesday or Thursday)
 */
function isMidWeek(date: Date = new Date()): boolean {
  const day = getDayOfWeekISO(date);
  return day === 3 || day === 4;
}

/**
 * Get days since a date
 */
function daysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

// ==================== Event-Based Triggers ====================

/**
 * Major events that trigger weekly re-plan
 */
const WEEKLY_PLAN_TRIGGER_EVENTS: Set<LayerEventType> = new Set([
  LayerEventType.STRATEGY_MODE_CHANGED,
  LayerEventType.FIRST_INTERVIEW,
  LayerEventType.FIRST_OFFER,
]);

/**
 * Events that trigger daily re-plan
 */
const DAILY_PLAN_TRIGGER_EVENTS: Set<LayerEventType> = new Set([
  LayerEventType.TASK_COMPLETED,
  LayerEventType.TASK_FAILED,
]);

/**
 * Check if an event should trigger weekly re-plan
 */
export function isWeeklyReplanEvent(eventType: LayerEventType): boolean {
  return WEEKLY_PLAN_TRIGGER_EVENTS.has(eventType);
}

/**
 * Check if an event should trigger daily re-plan
 */
export function isDailyReplanEvent(eventType: LayerEventType): boolean {
  return DAILY_PLAN_TRIGGER_EVENTS.has(eventType);
}

// ==================== Mode Change Detection ====================

/**
 * Check if strategy mode has changed
 */
export function hasModeChanged(
  plan: WeeklyPlan,
  analysis: { recommended_mode: StrategyMode }
): boolean {
  return plan.strategy_mode !== analysis.recommended_mode;
}

// ==================== Deviation Detection ====================

/**
 * Calculate expected progress based on day of week
 */
function calculateExpectedProgress(dayOfWeek: number): number {
  // Monday = 1, Sunday = 7
  // Expected progress: Mon ~14%, Tue ~28%, ..., Sun ~100%
  return (dayOfWeek / 7) * 100;
}

/**
 * Check if there's severe deviation from expected progress
 */
export function hasSevereDeviation(
  progress: ProgressSnapshot,
  date: Date = new Date()
): { deviation: boolean; type: 'under' | 'over' | 'none'; details: string } {
  const dayOfWeek = getDayOfWeekISO(date);
  const expectedProgress = calculateExpectedProgress(dayOfWeek);
  const actualProgress = progress.completion_percentage;
  
  // Check for severe under-performance
  if (actualProgress < expectedProgress * SEVERE_DEVIATION_THRESHOLD) {
    return {
      deviation: true,
      type: 'under',
      details: `Progress (${actualProgress}%) is severely behind expected (${expectedProgress.toFixed(0)}%)`,
    };
  }
  
  // Check for severe over-performance (not a problem, but may want to add tasks)
  if (actualProgress > expectedProgress * OVER_PERFORMANCE_THRESHOLD) {
    return {
      deviation: true,
      type: 'over',
      details: `Progress (${actualProgress}%) exceeds expected (${expectedProgress.toFixed(0)}%)`,
    };
  }
  
  return { deviation: false, type: 'none', details: 'Progress on track' };
}

// ==================== Plan Age Checks ====================

/**
 * Check if plan is expired (too old)
 */
export function isPlanExpired(plan: WeeklyPlan | DailyPlan): boolean {
  const generatedAt = new Date(plan.generated_at);
  const now = new Date();
  
  if ('task_pool' in plan) {
    // Weekly plan: expires after week ends
    const weekEnd = new Date(plan.week_end);
    return now > weekEnd;
  } else {
    // Daily plan: expires after the day
    const planDate = new Date(plan.date);
    planDate.setDate(planDate.getDate() + 1);
    return now > planDate;
  }
}

/**
 * Check if enough time has passed since last re-plan
 */
export function canReplanWeekly(lastReplanDate?: string): boolean {
  if (!lastReplanDate) return true;
  return daysSince(lastReplanDate) >= MIN_DAYS_BETWEEN_REPLANS;
}

// ==================== Main Re-plan Logic ====================

/**
 * Determine if weekly plan should be regenerated
 */
export function shouldReplanWeekly(
  plan: WeeklyPlan,
  state: Layer4StateForLayer5,
  analysis?: { recommended_mode: StrategyMode },
  recentEvents?: LayerEventType[],
  lastReplanDate?: string
): ReplanTrigger {
  // Check if plan is expired
  if (isPlanExpired(plan)) {
    return {
      should_replan: true,
      trigger_type: 'plan_expired',
      reason: 'Weekly plan has expired',
      plan_type: 'weekly',
      urgency: 'high',
    };
  }
  
  // Check for event-based triggers
  if (recentEvents) {
    for (const event of recentEvents) {
      if (isWeeklyReplanEvent(event)) {
        return {
          should_replan: true,
          trigger_type: event === LayerEventType.STRATEGY_MODE_CHANGED 
            ? 'strategy_mode_changed' 
            : 'major_milestone',
          reason: `Triggered by event: ${event}`,
          plan_type: 'weekly',
          urgency: event === LayerEventType.FIRST_OFFER ? 'high' : 'medium',
        };
      }
    }
  }
  
  // Check for mode change
  if (analysis && hasModeChanged(plan, analysis)) {
    return {
      should_replan: true,
      trigger_type: 'strategy_mode_changed',
      reason: `Mode changed from ${plan.strategy_mode} to ${analysis.recommended_mode}`,
      plan_type: 'weekly',
      urgency: 'medium',
    };
  }
  
  // Check for severe deviation (only mid-week)
  if (isMidWeek()) {
    const progress = trackWeeklyProgress(plan, state);
    const deviation = hasSevereDeviation(progress);
    
    if (deviation.deviation && canReplanWeekly(lastReplanDate)) {
      return {
        should_replan: true,
        trigger_type: 'severe_deviation',
        reason: deviation.details,
        plan_type: 'weekly',
        urgency: deviation.type === 'under' ? 'medium' : 'low',
      };
    }
  }
  
  return {
    should_replan: false,
    reason: 'No re-plan needed',
    urgency: 'low',
  };
}

/**
 * Determine if daily plan should be regenerated
 */
export function shouldReplanDaily(
  dailyPlan: DailyPlan,
  state: Layer4StateForLayer5,
  recentEvents?: LayerEventType[]
): ReplanTrigger {
  // Check if plan is expired (different day)
  if (isPlanExpired(dailyPlan)) {
    return {
      should_replan: true,
      trigger_type: 'new_day',
      reason: 'It\'s a new day - need fresh daily plan',
      plan_type: 'daily',
      urgency: 'high',
    };
  }
  
  // Check for task events
  if (recentEvents) {
    const hasTaskCompleted = recentEvents.includes(LayerEventType.TASK_COMPLETED);
    const hasTaskFailed = recentEvents.includes(LayerEventType.TASK_FAILED);
    
    if (hasTaskFailed) {
      return {
        should_replan: true,
        trigger_type: 'task_failed',
        reason: 'A task failed - may need to adjust daily plan',
        plan_type: 'daily',
        urgency: 'medium',
      };
    }
    
    // Check if a high-priority task was completed early
    if (hasTaskCompleted) {
      const progress = trackDailyProgress(dailyPlan, state);
      if (progress.completion_percentage >= 80) {
        return {
          should_replan: true,
          trigger_type: 'major_task_completed',
          reason: 'Daily plan mostly complete - can add more tasks',
          plan_type: 'daily',
          urgency: 'low',
        };
      }
    }
  }
  
  return {
    should_replan: false,
    reason: 'No re-plan needed',
    urgency: 'low',
  };
}

/**
 * Combined check for both weekly and daily re-plan
 */
export function shouldReplan(
  weeklyPlan: WeeklyPlan,
  dailyPlan: DailyPlan,
  state: Layer4StateForLayer5,
  analysis?: { recommended_mode: StrategyMode },
  recentEvents?: LayerEventType[],
  lastWeeklyReplanDate?: string
): ReplanTrigger {
  // Check weekly first (higher priority)
  const weeklyTrigger = shouldReplanWeekly(
    weeklyPlan,
    state,
    analysis,
    recentEvents,
    lastWeeklyReplanDate
  );
  
  if (weeklyTrigger.should_replan) {
    return {
      ...weeklyTrigger,
      plan_type: 'both', // Weekly replan means daily also needs refresh
    };
  }
  
  // Check daily
  const dailyTrigger = shouldReplanDaily(dailyPlan, state, recentEvents);
  
  return dailyTrigger;
}
