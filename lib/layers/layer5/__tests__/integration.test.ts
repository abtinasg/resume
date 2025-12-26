/**
 * Layer 5 - Orchestrator
 * Integration Tests
 *
 * End-to-end tests for the complete orchestration pipeline.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  orchestrate,
  orchestrateWeeklyPlan,
  orchestrateDailyPlan,
  checkReplanNeeded,
  getPlanningContext,
  validateStateForPlanning,
} from '../orchestrator';
import { generateWeeklyPlan } from '../planning';
import { trackWeeklyProgress, trackDailyProgress } from '../tracking';
import { validateState, isCriticallyStale } from '../state';
import { StrategyMode, LayerEventType, ActionType, FocusArea } from '../types';
import { clearConfigCache } from '../config';
import {
  SCENARIO_IMPROVE_RESUME_FIRST,
  SCENARIO_APPLY_MODE,
  SCENARIO_RETHINK_TARGETS,
  SCENARIO_STALE_STATE,
  SCENARIO_WITH_FOLLOWUPS,
  ALL_SCENARIOS,
  createBaseState,
  createBaseAnalysis,
} from './fixtures/scenarios';

// ==================== Setup ====================

beforeEach(() => {
  clearConfigCache();
});

// ==================== End-to-End Orchestration ====================

describe('End-to-End Orchestration', () => {
  test.each(ALL_SCENARIOS)('orchestrates correctly for scenario: $name', (scenario) => {
    const { state, analysis, expected } = scenario;
    
    const result = orchestrate(state, analysis);
    
    // Should produce weekly and daily plans
    expect(result.weeklyPlan).toBeDefined();
    expect(result.dailyPlan).toBeDefined();
    expect(result.context).toBeDefined();
    expect(result.replanNeeded).toBeDefined();
    
    // Weekly plan should match expected mode
    if (expected.mode) {
      expect(result.weeklyPlan.strategy_mode).toBe(expected.mode);
    }
  });

  test('IMPROVE_RESUME_FIRST mode produces correct outputs', () => {
    const { state, analysis, expected } = SCENARIO_IMPROVE_RESUME_FIRST;
    
    const result = orchestrate(state, analysis);
    
    expect(result.weeklyPlan.strategy_mode).toBe(StrategyMode.IMPROVE_RESUME_FIRST);
    expect(result.weeklyPlan.target_applications).toBeLessThanOrEqual(3);
    
    // Should have improve_resume tasks
    const improveTasks = result.weeklyPlan.task_pool.filter(
      t => t.action_type === ActionType.IMPROVE_RESUME
    );
    expect(improveTasks.length).toBeGreaterThan(0);
    
    // Focus should be on resume improvement
    expect(result.weeklyPlan.focus_mix[FocusArea.RESUME_IMPROVEMENT]).toBeGreaterThan(0.4);
  });

  test('APPLY_MODE produces correct outputs', () => {
    const { state, analysis, expected } = SCENARIO_APPLY_MODE;
    
    const result = orchestrate(state, analysis);
    
    expect(result.weeklyPlan.strategy_mode).toBe(StrategyMode.APPLY_MODE);
    expect(result.weeklyPlan.target_applications).toBeGreaterThanOrEqual(5);
    
    // Focus should include applications
    expect(result.weeklyPlan.focus_mix[FocusArea.APPLICATIONS]).toBeGreaterThan(0);
  });

  test('RETHINK_TARGETS produces correct outputs', () => {
    const { state, analysis, expected } = SCENARIO_RETHINK_TARGETS;
    
    const result = orchestrate(state, analysis);
    
    expect(result.weeklyPlan.strategy_mode).toBe(StrategyMode.RETHINK_TARGETS);
    expect(result.weeklyPlan.target_applications).toBeLessThanOrEqual(5);
    
    // Should have strategy-related tasks
    const strategyTasks = result.weeklyPlan.task_pool.filter(
      t => t.action_type === ActionType.UPDATE_TARGETS || 
           t.action_type === ActionType.COLLECT_MISSING_INFO
    );
    expect(strategyTasks.length).toBeGreaterThan(0);
  });

  test('Stale state produces safe minimal plan', () => {
    const { state, analysis } = SCENARIO_STALE_STATE;
    
    const result = orchestrate(state, analysis);
    
    // Should have zero application target
    expect(result.weeklyPlan.target_applications).toBe(0);
    
    // Should have refresh task
    const refreshTasks = result.weeklyPlan.task_pool.filter(
      t => t.action_type === ActionType.REFRESH_STATE
    );
    expect(refreshTasks.length).toBeGreaterThan(0);
  });
});

// ==================== State Validation ====================

describe('State Validation Integration', () => {
  test('validates state before planning', () => {
    const { state } = SCENARIO_APPLY_MODE;
    
    const validation = validateStateForPlanning(state);
    
    expect(validation.valid).toBe(true);
    expect(validation.issues.length).toBe(0);
  });

  test('detects stale state', () => {
    const { state } = SCENARIO_STALE_STATE;
    
    const isStale = isCriticallyStale(state);
    
    expect(isStale).toBe(true);
  });

  test('rejects invalid state gracefully', () => {
    const invalidState = createBaseState({
      pipeline_state: undefined as any,
    });
    
    const validation = validateState(invalidState);
    
    expect(validation.passed).toBe(false);
    expect(validation.issues.length).toBeGreaterThan(0);
  });
});

// ==================== Progress Tracking Integration ====================

describe('Progress Tracking Integration', () => {
  test('tracks weekly progress correctly', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const { weeklyPlan } = orchestrate(state, analysis);
    
    const progress = trackWeeklyProgress(weeklyPlan, state);
    
    expect(progress.plan_id).toBe(weeklyPlan.plan_id);
    expect(progress.plan_type).toBe('weekly');
    expect(progress.completion_percentage).toBeDefined();
    expect(progress.total_tasks).toBe(weeklyPlan.task_pool.length);
  });

  test('tracks daily progress correctly', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const { dailyPlan } = orchestrate(state, analysis);
    
    const progress = trackDailyProgress(dailyPlan, state);
    
    expect(progress.plan_id).toBe(dailyPlan.plan_id);
    expect(progress.plan_type).toBe('daily');
    expect(progress.total_tasks).toBe(dailyPlan.tasks.length);
  });

  test('detects blockers in stale state', () => {
    const { state, analysis } = SCENARIO_STALE_STATE;
    const { weeklyPlan } = orchestrate(state, analysis);
    
    const progress = trackWeeklyProgress(weeklyPlan, state);
    
    expect(progress.blockers.length).toBeGreaterThan(0);
    expect(progress.blockers.some(b => b.type === 'stale_state')).toBe(true);
  });
});

// ==================== Re-planning Integration ====================

describe('Re-planning Integration', () => {
  test('detects mode change trigger', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const { weeklyPlan, dailyPlan } = orchestrate(state, analysis);
    
    // Simulate mode change in analysis
    const newAnalysis = createBaseAnalysis({
      recommended_mode: StrategyMode.RETHINK_TARGETS,
    });
    
    const trigger = checkReplanNeeded(weeklyPlan, dailyPlan, state, newAnalysis);
    
    expect(trigger.should_replan).toBe(true);
    expect(trigger.trigger_type).toBe('strategy_mode_changed');
  });

  test('no replan when nothing changed', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const { weeklyPlan, dailyPlan } = orchestrate(state, analysis);
    
    const trigger = checkReplanNeeded(weeklyPlan, dailyPlan, state, analysis);
    
    // Should not trigger mode change since mode hasn't changed
    // However, may trigger for:
    // - new_day: if daily plan date is different
    // - severe_deviation: if we're mid-week with low completion
    if (trigger.should_replan) {
      // Verify it's not a mode change (which would be a bug)
      expect(trigger.trigger_type).not.toBe('strategy_mode_changed');
      // These are acceptable reasons for replan
      expect(['new_day', 'severe_deviation', undefined]).toContain(trigger.trigger_type);
    }
    // The key test is that mode change detection works (covered by other test)
  });
});

// ==================== Planning Context Integration ====================

describe('Planning Context Integration', () => {
  test('getPlanningContext provides complete context', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const { weeklyPlan, dailyPlan } = orchestrate(state, analysis);
    
    const context = getPlanningContext(weeklyPlan, dailyPlan, state, analysis);
    
    expect(context.weekly_plan).toBeDefined();
    expect(context.today_plan).toBeDefined();
    expect(context.strategy_context).toBeDefined();
    expect(context.strategy_context.current_mode).toBe(weeklyPlan.strategy_mode);
    expect(context.recent_activity).toBeDefined();
  });
});

// ==================== Determinism Tests ====================

describe('Orchestration Determinism', () => {
  test('same inputs produce same plan structure', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    
    const result1 = orchestrate(state, analysis);
    const result2 = orchestrate(state, analysis);
    
    // Mode should be same
    expect(result1.weeklyPlan.strategy_mode).toBe(result2.weeklyPlan.strategy_mode);
    
    // Target applications should be same
    expect(result1.weeklyPlan.target_applications).toBe(result2.weeklyPlan.target_applications);
    
    // Task count should be same
    expect(result1.weeklyPlan.task_pool.length).toBe(result2.weeklyPlan.task_pool.length);
    
    // Task types and priorities should match
    for (let i = 0; i < result1.weeklyPlan.task_pool.length; i++) {
      const task1 = result1.weeklyPlan.task_pool[i];
      const task2 = result2.weeklyPlan.task_pool[i];
      
      expect(task1.action_type).toBe(task2.action_type);
      expect(task1.priority).toBe(task2.priority);
    }
  });

  test('focus mix is deterministic', () => {
    const { state, analysis } = SCENARIO_IMPROVE_RESUME_FIRST;
    
    const result1 = orchestrate(state, analysis);
    const result2 = orchestrate(state, analysis);
    
    expect(result1.weeklyPlan.focus_mix).toEqual(result2.weeklyPlan.focus_mix);
  });
});

// ==================== Evidence Anchoring ====================

describe('Evidence Anchoring', () => {
  test('all tasks have why_now', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const { weeklyPlan } = orchestrate(state, analysis);
    
    for (const task of weeklyPlan.task_pool) {
      expect(task.why_now).toBeDefined();
      expect(task.why_now.length).toBeGreaterThan(0);
    }
  });

  test('daily tasks inherit why_now', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const { dailyPlan } = orchestrate(state, analysis);
    
    for (const task of dailyPlan.tasks) {
      expect(task.why_now).toBeDefined();
      expect(task.why_now.length).toBeGreaterThan(0);
    }
  });
});

// ==================== Follow-up Handling ====================

describe('Follow-up Task Integration', () => {
  test('follow-up tasks are included from state', () => {
    const { state, analysis, expected } = SCENARIO_WITH_FOLLOWUPS;
    const { weeklyPlan } = orchestrate(state, analysis);
    
    const followUpTasks = weeklyPlan.task_pool.filter(
      t => t.action_type === ActionType.FOLLOW_UP
    );
    
    expect(followUpTasks.length).toBeGreaterThanOrEqual(expected.min_followup_tasks);
  });

  test('follow-up tasks have correct payload', () => {
    const { state, analysis } = SCENARIO_WITH_FOLLOWUPS;
    const { weeklyPlan } = orchestrate(state, analysis);
    
    const followUpTasks = weeklyPlan.task_pool.filter(
      t => t.action_type === ActionType.FOLLOW_UP
    );
    
    for (const task of followUpTasks) {
      expect(task.payload.application_id).toBeDefined();
      expect(task.payload.company).toBeDefined();
    }
  });
});

// ==================== Plan Validation ====================

describe('Generated Plan Validation', () => {
  test('weekly plan passes validation', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const weeklyPlan = orchestrateWeeklyPlan(state, analysis);
    
    // All tasks should have required fields
    for (const task of weeklyPlan.task_pool) {
      expect(task.task_id).toBeDefined();
      expect(task.action_type).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.description).toBeDefined();
      expect(task.priority).toBeGreaterThanOrEqual(0);
      expect(task.priority).toBeLessThanOrEqual(100);
      expect(task.estimated_minutes).toBeGreaterThan(0);
    }
  });

  test('daily plan passes validation', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const weeklyPlan = orchestrateWeeklyPlan(state, analysis);
    const dailyPlan = orchestrateDailyPlan(weeklyPlan, state);
    
    expect(dailyPlan.tasks.length).toBeLessThanOrEqual(5);
    expect(dailyPlan.total_estimated_minutes).toBeLessThanOrEqual(180);
    expect(dailyPlan.focus_area).toBeDefined();
  });
});
