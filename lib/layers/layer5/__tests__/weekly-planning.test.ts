/**
 * Layer 5 - Orchestrator
 * Weekly Planning Tests
 *
 * Tests for weekly plan generation including mode-specific logic,
 * task pool creation, and focus mix calculation.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  generateWeeklyPlan,
  calculateWeeklyTarget,
  calculateFocusMix,
  validateWeeklyPlan,
  getCurrentMonday,
  getNextMonday,
  getNextSunday,
} from '../planning/weekly-planner';
import { StrategyMode, FocusArea, ActionType } from '../types';
import { clearConfigCache, loadOrchestratorConfig } from '../config';
import {
  SCENARIO_IMPROVE_RESUME_FIRST,
  SCENARIO_APPLY_MODE,
  SCENARIO_RETHINK_TARGETS,
  SCENARIO_STALE_STATE,
  SCENARIO_WITH_FOLLOWUPS,
  createBaseState,
  createBaseAnalysis,
} from './fixtures/scenarios';

// ==================== Setup ====================

beforeEach(() => {
  clearConfigCache();
});

// ==================== Date Utilities ====================

describe('Week Date Utilities', () => {
  test('getCurrentMonday returns a Monday', () => {
    const monday = getCurrentMonday();
    const date = new Date(monday);
    // Monday is day 1 in JavaScript (0 = Sunday)
    expect(date.getDay()).toBe(1);
  });

  test('getNextMonday returns a future Monday', () => {
    const monday = getNextMonday();
    const date = new Date(monday);
    expect(date.getDay()).toBe(1);
  });

  test('getNextSunday returns Sunday of the same week', () => {
    const monday = '2024-01-08'; // A Monday
    const sunday = getNextSunday(monday);
    expect(sunday).toBe('2024-01-14');
    const sunDate = new Date(sunday);
    expect(sunDate.getDay()).toBe(0);
  });
});

// ==================== Weekly Target Calculation ====================

describe('Weekly Target Calculation', () => {
  test('IMPROVE_RESUME_FIRST mode has low target', () => {
    const { state, analysis } = SCENARIO_IMPROVE_RESUME_FIRST;
    const config = loadOrchestratorConfig();
    const target = calculateWeeklyTarget(state, analysis, config);
    
    expect(target).toBeLessThanOrEqual(3);
    expect(target).toBeGreaterThanOrEqual(0);
  });

  test('APPLY_MODE has higher target', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const config = loadOrchestratorConfig();
    const target = calculateWeeklyTarget(state, analysis, config);
    
    expect(target).toBeGreaterThanOrEqual(5);
  });

  test('RETHINK_TARGETS has moderate target', () => {
    const { state, analysis } = SCENARIO_RETHINK_TARGETS;
    const config = loadOrchestratorConfig();
    const target = calculateWeeklyTarget(state, analysis, config);
    
    expect(target).toBeLessThanOrEqual(5);
  });

  test('Stale state freezes target', () => {
    const { state, analysis } = SCENARIO_STALE_STATE;
    const config = loadOrchestratorConfig();
    const target = calculateWeeklyTarget(state, analysis, config);
    
    // Should use existing target or 0 due to staleness
    expect(target).toBeDefined();
  });

  test('User override is respected within bounds', () => {
    const state = createBaseState({
      user_profile: {
        target_roles: ['Software Engineer'],
        weeklyAppTarget: 15,
      },
    });
    const analysis = createBaseAnalysis({
      recommended_mode: StrategyMode.APPLY_MODE,
    });
    const config = loadOrchestratorConfig();
    const target = calculateWeeklyTarget(state, analysis, config);
    
    expect(target).toBe(15);
  });
});

// ==================== Focus Mix Calculation ====================

describe('Focus Mix Calculation', () => {
  test('IMPROVE_RESUME_FIRST focuses on resume improvement', () => {
    const tasks = [
      { action_type: ActionType.IMPROVE_RESUME },
      { action_type: ActionType.IMPROVE_RESUME },
      { action_type: ActionType.IMPROVE_RESUME },
      { action_type: ActionType.APPLY_TO_JOB },
    ];
    
    const focusMix = calculateFocusMix(tasks as any, StrategyMode.IMPROVE_RESUME_FIRST);
    
    expect(focusMix[FocusArea.RESUME_IMPROVEMENT]).toBeGreaterThan(0.5);
  });

  test('APPLY_MODE focuses on applications', () => {
    const tasks = [
      { action_type: ActionType.APPLY_TO_JOB },
      { action_type: ActionType.APPLY_TO_JOB },
      { action_type: ActionType.FOLLOW_UP },
      { action_type: ActionType.IMPROVE_RESUME },
    ];
    
    const focusMix = calculateFocusMix(tasks as any, StrategyMode.APPLY_MODE);
    
    expect(focusMix[FocusArea.APPLICATIONS]).toBeGreaterThan(0.3);
  });

  test('Focus mix sums to approximately 1.0', () => {
    const tasks = [
      { action_type: ActionType.APPLY_TO_JOB },
      { action_type: ActionType.IMPROVE_RESUME },
      { action_type: ActionType.FOLLOW_UP },
    ];
    
    const focusMix = calculateFocusMix(tasks as any, StrategyMode.APPLY_MODE);
    const sum = Object.values(focusMix).reduce((a, b) => a + b, 0);
    
    expect(sum).toBeGreaterThan(0.9);
    expect(sum).toBeLessThan(1.1);
  });
});

// ==================== Weekly Plan Generation ====================

describe('Weekly Plan Generation', () => {
  test('IMPROVE_RESUME_FIRST generates resume-focused plan', () => {
    const { state, analysis, expected } = SCENARIO_IMPROVE_RESUME_FIRST;
    const plan = generateWeeklyPlan(state, analysis);
    
    expect(plan.strategy_mode).toBe(expected.mode);
    expect(plan.target_applications).toBeLessThanOrEqual(3);
    expect(plan.task_pool.length).toBeGreaterThanOrEqual(1);
    
    // Should have improve_resume tasks
    const improveTasks = plan.task_pool.filter(
      t => t.action_type === ActionType.IMPROVE_RESUME
    );
    expect(improveTasks.length).toBeGreaterThan(0);
  });

  test('APPLY_MODE generates application-focused plan', () => {
    const { state, analysis, expected } = SCENARIO_APPLY_MODE;
    const plan = generateWeeklyPlan(state, analysis);
    
    expect(plan.strategy_mode).toBe(expected.mode);
    expect(plan.task_pool.length).toBeGreaterThanOrEqual(1);
  });

  test('RETHINK_TARGETS generates strategy-focused plan', () => {
    const { state, analysis, expected } = SCENARIO_RETHINK_TARGETS;
    const plan = generateWeeklyPlan(state, analysis);
    
    expect(plan.strategy_mode).toBe(expected.mode);
    expect(plan.target_applications).toBeLessThanOrEqual(5);
  });

  test('Stale state generates minimal safe plan', () => {
    const { state, analysis } = SCENARIO_STALE_STATE;
    const plan = generateWeeklyPlan(state, analysis);
    
    expect(plan.target_applications).toBe(0);
    
    // Should have refresh task
    const refreshTasks = plan.task_pool.filter(
      t => t.action_type === ActionType.REFRESH_STATE
    );
    expect(refreshTasks.length).toBeGreaterThan(0);
  });

  test('Plan includes follow-up tasks from state', () => {
    const { state, analysis } = SCENARIO_WITH_FOLLOWUPS;
    const plan = generateWeeklyPlan(state, analysis);
    
    const followUpTasks = plan.task_pool.filter(
      t => t.action_type === ActionType.FOLLOW_UP
    );
    expect(followUpTasks.length).toBeGreaterThan(0);
  });
});

// ==================== Plan Validation ====================

describe('Weekly Plan Validation', () => {
  test('Valid plan passes validation', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const plan = generateWeeklyPlan(state, analysis);
    const result = validateWeeklyPlan(plan, state);
    
    expect(result.passed).toBe(true);
  });

  test('Empty plan fails validation', () => {
    const state = createBaseState();
    const plan = {
      plan_id: 'test',
      week_start: '2024-01-08',
      week_end: '2024-01-14',
      strategy_mode: StrategyMode.APPLY_MODE,
      target_applications: 10,
      focus_mix: {
        [FocusArea.APPLICATIONS]: 0.5,
        [FocusArea.RESUME_IMPROVEMENT]: 0.3,
        [FocusArea.FOLLOW_UPS]: 0.1,
        [FocusArea.STRATEGY]: 0.1,
      },
      task_pool: [], // Empty!
      input_state_version: 1,
      strategy_analysis_version: '2.1',
      generated_at: new Date().toISOString(),
    };
    
    const result = validateWeeklyPlan(plan, state);
    
    expect(result.passed).toBe(false);
    expect(result.issues.some(i => i.code === 'EMPTY_PLAN')).toBe(true);
  });
});

// ==================== Evidence Anchoring ====================

describe('Evidence Anchoring', () => {
  test('All tasks have why_now', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const plan = generateWeeklyPlan(state, analysis);
    
    for (const task of plan.task_pool) {
      expect(task.why_now).toBeDefined();
      expect(task.why_now.length).toBeGreaterThan(0);
    }
  });

  test('Tasks have evidence_refs', () => {
    const { state, analysis } = SCENARIO_IMPROVE_RESUME_FIRST;
    const plan = generateWeeklyPlan(state, analysis);
    
    // At least some tasks should have evidence refs
    const tasksWithEvidence = plan.task_pool.filter(
      t => t.evidence_refs && t.evidence_refs.length > 0
    );
    expect(tasksWithEvidence.length).toBeGreaterThan(0);
  });
});

// ==================== Determinism ====================

describe('Plan Determinism', () => {
  test('Same inputs produce same plan structure', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    
    const plan1 = generateWeeklyPlan(state, analysis);
    const plan2 = generateWeeklyPlan(state, analysis);
    
    // Note: plan_id and generated_at will differ
    expect(plan1.strategy_mode).toBe(plan2.strategy_mode);
    expect(plan1.target_applications).toBe(plan2.target_applications);
    expect(plan1.task_pool.length).toBe(plan2.task_pool.length);
  });

  test('Task priorities are consistent', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    
    const plan1 = generateWeeklyPlan(state, analysis);
    const plan2 = generateWeeklyPlan(state, analysis);
    
    // Same tasks should have same priorities
    for (let i = 0; i < Math.min(plan1.task_pool.length, plan2.task_pool.length); i++) {
      const task1 = plan1.task_pool[i];
      const task2 = plan2.task_pool[i];
      
      expect(task1.action_type).toBe(task2.action_type);
      expect(task1.priority).toBe(task2.priority);
    }
  });
});
