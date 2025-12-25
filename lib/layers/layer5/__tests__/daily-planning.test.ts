/**
 * Layer 5 - Orchestrator
 * Daily Planning Tests
 *
 * Tests for daily plan generation from weekly plans.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  generateDailyPlan,
  fitTasksToTimeBudget,
  validateDailyPlan,
  getTodayDate,
  getDayName,
  getDailyPlanSummary,
} from '../planning/daily-planner';
import { generateWeeklyPlan } from '../planning/weekly-planner';
import { StrategyMode, FocusArea, ActionType } from '../types';
import type { Task, WeeklyPlan } from '../types';
import { clearConfigCache, loadOrchestratorConfig } from '../config';
import {
  SCENARIO_APPLY_MODE,
  SCENARIO_DAILY_PLANNING,
  SCENARIO_STALE_STATE,
  createBaseState,
  createBaseAnalysis,
  createMockTask,
} from './fixtures/scenarios';

// ==================== Setup ====================

beforeEach(() => {
  clearConfigCache();
});

// ==================== Date Utilities ====================

describe('Daily Date Utilities', () => {
  test('getTodayDate returns ISO date string', () => {
    const today = getTodayDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('getDayName returns correct day name', () => {
    expect(getDayName('2024-01-08')).toBe('Monday');
    expect(getDayName('2024-01-09')).toBe('Tuesday');
    expect(getDayName('2024-01-14')).toBe('Sunday');
  });
});

// ==================== Time Budget Fitting ====================

describe('Time Budget Fitting', () => {
  test('fitTasksToTimeBudget respects budget', () => {
    const tasks: Task[] = [
      createMockTask({ estimated_minutes: 30, priority: 90 }),
      createMockTask({ estimated_minutes: 30, priority: 80 }),
      createMockTask({ estimated_minutes: 30, priority: 70 }),
      createMockTask({ estimated_minutes: 30, priority: 60 }),
      createMockTask({ estimated_minutes: 30, priority: 50 }),
    ];
    
    const fitted = fitTasksToTimeBudget(tasks, 100);
    
    const totalTime = fitted.reduce((sum, t) => sum + t.estimated_minutes, 0);
    expect(totalTime).toBeLessThanOrEqual(100);
  });

  test('fitTasksToTimeBudget includes at least one task', () => {
    const tasks: Task[] = [
      createMockTask({ estimated_minutes: 200, priority: 90 }), // Larger than budget
    ];
    
    const fitted = fitTasksToTimeBudget(tasks, 100);
    
    expect(fitted.length).toBe(1);
  });

  test('fitTasksToTimeBudget prioritizes high priority tasks', () => {
    const tasks: Task[] = [
      createMockTask({ task_id: 'low', estimated_minutes: 30, priority: 30 }),
      createMockTask({ task_id: 'high', estimated_minutes: 30, priority: 90 }),
      createMockTask({ task_id: 'medium', estimated_minutes: 30, priority: 60 }),
    ];
    
    // Sort by priority first (as the function expects sorted input)
    tasks.sort((a, b) => b.priority - a.priority);
    
    const fitted = fitTasksToTimeBudget(tasks, 60);
    
    expect(fitted.length).toBe(2);
    expect(fitted[0].task_id).toBe('high');
  });
});

// ==================== Daily Plan Generation ====================

describe('Daily Plan Generation', () => {
  test('generates daily plan from weekly plan', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    
    const dailyPlan = generateDailyPlan(weeklyPlan, state, undefined, config);
    
    expect(dailyPlan.plan_id).toBeDefined();
    expect(dailyPlan.date).toBeDefined();
    expect(dailyPlan.tasks).toBeDefined();
    expect(dailyPlan.focus_area).toBeDefined();
  });

  test('daily plan respects max tasks limit', () => {
    const { state, analysis } = SCENARIO_DAILY_PLANNING;
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    
    const dailyPlan = generateDailyPlan(weeklyPlan, state, undefined, config);
    
    expect(dailyPlan.tasks.length).toBeLessThanOrEqual(5);
  });

  test('daily plan respects time budget', () => {
    const { state, analysis } = SCENARIO_DAILY_PLANNING;
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    
    const dailyPlan = generateDailyPlan(weeklyPlan, state, undefined, config);
    
    expect(dailyPlan.total_estimated_minutes).toBeLessThanOrEqual(config.daily_planning.time_budget_minutes);
  });

  test('daily plan tracks source weekly plan', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    
    const dailyPlan = generateDailyPlan(weeklyPlan, state, undefined, config);
    
    expect(dailyPlan.generated_from_weekly_plan_id).toBe(weeklyPlan.plan_id);
  });
});

// ==================== Priority Distribution ====================

describe('Priority Distribution', () => {
  test('daily plan includes high priority task when configured', () => {
    const state = createBaseState();
    const analysis = createBaseAnalysis({
      action_blueprints: [
        {
          type: 'improve_resume',
          objective: 'High priority task',
          why: 'Critical improvement',
          confidence: 'high',
          priority: 10, // High priority
        },
        {
          type: 'apply_to_job',
          objective: 'Medium priority task',
          why: 'Good match',
          confidence: 'medium',
          priority: 5,
        },
        {
          type: 'follow_up',
          objective: 'Low priority task',
          why: 'May follow up',
          confidence: 'low',
          priority: 3,
        },
      ],
    });
    
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    const dailyPlan = generateDailyPlan(weeklyPlan, state, undefined, config);
    
    // Should have at least one high-priority task
    const hasHighPriority = dailyPlan.tasks.some(t => t.priority >= 70);
    expect(hasHighPriority).toBe(true);
  });
});

// ==================== Plan Validation ====================

describe('Daily Plan Validation', () => {
  test('valid daily plan passes validation', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    const dailyPlan = generateDailyPlan(weeklyPlan, state, undefined, config);
    
    const result = validateDailyPlan(dailyPlan, state);
    
    expect(result.passed).toBe(true);
  });

  test('plan with too many tasks gets warning', () => {
    const state = createBaseState();
    const plan = {
      plan_id: 'test',
      date: getTodayDate(),
      focus_area: FocusArea.APPLICATIONS,
      tasks: Array(7).fill(null).map(() => createMockTask()),
      total_estimated_minutes: 140,
      input_state_version: 1,
      generated_at: new Date().toISOString(),
    };
    
    const result = validateDailyPlan(plan, state);
    
    expect(result.issues.some(i => i.code === 'TOO_MANY_TASKS')).toBe(true);
  });
});

// ==================== Daily Plan Summary ====================

describe('Daily Plan Summary', () => {
  test('getDailyPlanSummary provides correct counts', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    const dailyPlan = generateDailyPlan(weeklyPlan, state, undefined, config);
    
    const summary = getDailyPlanSummary(dailyPlan);
    
    expect(summary.taskCount).toBe(dailyPlan.tasks.length);
    expect(summary.totalMinutes).toBe(dailyPlan.total_estimated_minutes);
    expect(summary.focusArea).toBe(dailyPlan.focus_area);
    expect(summary.priorities).toBeDefined();
    expect(summary.priorities.high + summary.priorities.medium + summary.priorities.low).toBe(
      dailyPlan.tasks.length
    );
  });
});

// ==================== Focus Area Determination ====================

describe('Focus Area Determination', () => {
  test('focus area reflects majority task type', () => {
    const state = createBaseState();
    const analysis = createBaseAnalysis({
      action_blueprints: [
        { type: 'apply_to_job', objective: 'Apply 1', why: 'Match', confidence: 'high', priority: 9 },
        { type: 'apply_to_job', objective: 'Apply 2', why: 'Match', confidence: 'high', priority: 8 },
        { type: 'apply_to_job', objective: 'Apply 3', why: 'Match', confidence: 'medium', priority: 7 },
        { type: 'improve_resume', objective: 'Improve', why: 'Better', confidence: 'medium', priority: 6 },
      ],
    });
    
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    const dailyPlan = generateDailyPlan(weeklyPlan, state, undefined, config);
    
    // Should focus on applications since that's the majority
    expect(dailyPlan.focus_area).toBe(FocusArea.APPLICATIONS);
  });
});

// ==================== Stale State Handling ====================

describe('Stale State in Daily Planning', () => {
  test('stale state gets minimal daily plan', () => {
    const { state, analysis } = SCENARIO_STALE_STATE;
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    const dailyPlan = generateDailyPlan(weeklyPlan, state, undefined, config);
    
    // Should have minimal tasks
    expect(dailyPlan.tasks.length).toBeLessThanOrEqual(3);
    
    // Should focus on strategy/refresh
    const hasRefresh = dailyPlan.tasks.some(
      t => t.action_type === ActionType.REFRESH_STATE
    );
    expect(hasRefresh).toBe(true);
  });
});

// ==================== Determinism ====================

describe('Daily Plan Determinism', () => {
  test('same inputs produce same daily plan structure', () => {
    const { state, analysis } = SCENARIO_APPLY_MODE;
    const weeklyPlan = generateWeeklyPlan(state, analysis);
    const config = loadOrchestratorConfig();
    const date = '2024-01-08';
    
    const plan1 = generateDailyPlan(weeklyPlan, state, date, config);
    const plan2 = generateDailyPlan(weeklyPlan, state, date, config);
    
    expect(plan1.focus_area).toBe(plan2.focus_area);
    expect(plan1.tasks.length).toBe(plan2.tasks.length);
    expect(plan1.total_estimated_minutes).toBe(plan2.total_estimated_minutes);
  });
});
