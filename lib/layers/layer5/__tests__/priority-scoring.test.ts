/**
 * Layer 5 - Orchestrator
 * Priority Scoring Tests
 *
 * Tests for task priority calculation including impact, urgency,
 * alignment, and weighted scoring.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  scorePriority,
  prioritizeTasks,
  calculateImpact,
  calculateUrgency,
  calculateAlignment,
  calculateConfidence,
  calculateTimeCost,
  getPriorityLevel,
  isHighPriority,
} from '../planning/priority-scorer';
import { StrategyMode, ActionType } from '../types';
import type { Task, Layer4StateForLayer5 } from '../types';
import { clearConfigCache, getPriorityScoringConfig } from '../config';
import { createBaseState, createMockTask } from './fixtures/scenarios';

// ==================== Setup ====================

beforeEach(() => {
  clearConfigCache();
});

// ==================== Impact Calculation ====================

describe('Impact Calculation', () => {
  test('IMPROVE_RESUME has higher impact in IMPROVE_RESUME_FIRST mode', () => {
    const state = createBaseState({ current_strategy_mode: StrategyMode.IMPROVE_RESUME_FIRST });
    const task = createMockTask({
      action_type: ActionType.IMPROVE_RESUME,
      payload: { estimated_score_gain: 5 },
    });
    const config = getPriorityScoringConfig();
    
    const impactImprove = calculateImpact(task, state, StrategyMode.IMPROVE_RESUME_FIRST, config);
    const impactApply = calculateImpact(task, state, StrategyMode.APPLY_MODE, config);
    
    expect(impactImprove).toBeGreaterThan(impactApply);
  });

  test('APPLY_TO_JOB has higher impact when pipeline is scarce', () => {
    const lowAppState = createBaseState({
      pipeline_state: {
        total_applications: 2,
        applications_last_7_days: 0,
        applications_last_30_days: 2,
        interview_requests: 0,
        interview_rate: 0,
        offers: 0,
        rejections: 0,
      },
      user_profile: { target_roles: ['Engineer'], weeklyAppTarget: 10 },
    });
    
    const highAppState = createBaseState({
      pipeline_state: {
        total_applications: 20,
        applications_last_7_days: 10,
        applications_last_30_days: 20,
        interview_requests: 2,
        interview_rate: 0.1,
        offers: 0,
        rejections: 5,
      },
      user_profile: { target_roles: ['Engineer'], weeklyAppTarget: 10 },
    });
    
    const task = createMockTask({
      action_type: ActionType.APPLY_TO_JOB,
      payload: { match_score: 80 },
    });
    const config = getPriorityScoringConfig();
    
    const impactLow = calculateImpact(task, lowAppState, StrategyMode.APPLY_MODE, config);
    const impactHigh = calculateImpact(task, highAppState, StrategyMode.APPLY_MODE, config);
    
    expect(impactLow).toBeGreaterThan(impactHigh);
  });

  test('FOLLOW_UP has optimal impact at 7-10 days', () => {
    const state = createBaseState();
    const config = getPriorityScoringConfig();
    
    const taskOptimal = createMockTask({
      action_type: ActionType.FOLLOW_UP,
      payload: { days_since_application: 8 },
    });
    const taskEarly = createMockTask({
      action_type: ActionType.FOLLOW_UP,
      payload: { days_since_application: 3 },
    });
    const taskLate = createMockTask({
      action_type: ActionType.FOLLOW_UP,
      payload: { days_since_application: 20 },
    });
    
    const impactOptimal = calculateImpact(taskOptimal, state, StrategyMode.APPLY_MODE, config);
    const impactEarly = calculateImpact(taskEarly, state, StrategyMode.APPLY_MODE, config);
    const impactLate = calculateImpact(taskLate, state, StrategyMode.APPLY_MODE, config);
    
    expect(impactOptimal).toBeGreaterThan(impactEarly);
    expect(impactOptimal).toBeGreaterThan(impactLate);
  });
});

// ==================== Urgency Calculation ====================

describe('Urgency Calculation', () => {
  test('task due today has high urgency', () => {
    const today = new Date();
    today.setHours(23, 59, 59);
    
    const task = createMockTask({
      due_at: today.toISOString(),
    });
    const config = getPriorityScoringConfig();
    
    const urgency = calculateUrgency(task, config);
    
    expect(urgency).toBeGreaterThanOrEqual(80);
  });

  test('overdue task has maximum urgency', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const task = createMockTask({
      due_at: yesterday.toISOString(),
    });
    const config = getPriorityScoringConfig();
    
    const urgency = calculateUrgency(task, config);
    
    expect(urgency).toBe(100);
  });

  test('task without due date has low urgency', () => {
    const task = createMockTask({
      due_at: undefined,
    });
    const config = getPriorityScoringConfig();
    
    const urgency = calculateUrgency(task, config);
    
    expect(urgency).toBeLessThanOrEqual(30);
  });
});

// ==================== Alignment Calculation ====================

describe('Alignment Calculation', () => {
  test('IMPROVE_RESUME aligns best with IMPROVE_RESUME_FIRST mode', () => {
    const task = createMockTask({ action_type: ActionType.IMPROVE_RESUME });
    
    const alignImprove = calculateAlignment(task, StrategyMode.IMPROVE_RESUME_FIRST);
    const alignApply = calculateAlignment(task, StrategyMode.APPLY_MODE);
    const alignRethink = calculateAlignment(task, StrategyMode.RETHINK_TARGETS);
    
    expect(alignImprove).toBeGreaterThan(alignApply);
    expect(alignImprove).toBeGreaterThan(alignRethink);
  });

  test('APPLY_TO_JOB aligns best with APPLY_MODE', () => {
    const task = createMockTask({ action_type: ActionType.APPLY_TO_JOB });
    
    const alignApply = calculateAlignment(task, StrategyMode.APPLY_MODE);
    const alignImprove = calculateAlignment(task, StrategyMode.IMPROVE_RESUME_FIRST);
    
    expect(alignApply).toBeGreaterThan(alignImprove);
  });

  test('UPDATE_TARGETS aligns best with RETHINK_TARGETS mode', () => {
    const task = createMockTask({ action_type: ActionType.UPDATE_TARGETS });
    
    const alignRethink = calculateAlignment(task, StrategyMode.RETHINK_TARGETS);
    const alignApply = calculateAlignment(task, StrategyMode.APPLY_MODE);
    
    expect(alignRethink).toBeGreaterThan(alignApply);
  });
});

// ==================== Confidence Calculation ====================

describe('Confidence Calculation', () => {
  test('fresh state has higher confidence', () => {
    const freshState = createBaseState({
      freshness: { is_stale: false, staleness_severity: 'none' },
    });
    const staleState = createBaseState({
      freshness: { is_stale: true, staleness_severity: 'warning', staleness_reason: 'old' },
    });
    
    const task = createMockTask();
    
    const confFresh = calculateConfidence(task, freshState);
    const confStale = calculateConfidence(task, staleState);
    
    expect(confFresh).toBeGreaterThan(confStale);
  });

  test('task with more evidence has higher confidence', () => {
    const state = createBaseState();
    
    const taskWithEvidence = createMockTask({
      evidence_refs: ['state.resume.score=75', 'config.threshold=70', 'analysis.gap.skills'],
    });
    const taskNoEvidence = createMockTask({
      evidence_refs: [],
    });
    
    const confWith = calculateConfidence(taskWithEvidence, state);
    const confWithout = calculateConfidence(taskNoEvidence, state);
    
    expect(confWith).toBeGreaterThan(confWithout);
  });
});

// ==================== Time Cost Calculation ====================

describe('Time Cost Calculation', () => {
  test('longer tasks have higher time cost', () => {
    const shortTask = createMockTask({ estimated_minutes: 10 });
    const longTask = createMockTask({ estimated_minutes: 60 });
    
    const costShort = calculateTimeCost(shortTask);
    const costLong = calculateTimeCost(longTask);
    
    expect(costLong).toBeGreaterThan(costShort);
  });

  test('time cost is bounded 0-100', () => {
    const veryLongTask = createMockTask({ estimated_minutes: 500 });
    const shortTask = createMockTask({ estimated_minutes: 1 });
    
    const costLong = calculateTimeCost(veryLongTask);
    const costShort = calculateTimeCost(shortTask);
    
    expect(costLong).toBeLessThanOrEqual(100);
    expect(costShort).toBeGreaterThanOrEqual(0);
  });
});

// ==================== Overall Scoring ====================

describe('Priority Scoring', () => {
  test('scorePriority returns bounded score', () => {
    const state = createBaseState();
    const task = createMockTask();
    
    const result = scorePriority(task, state, StrategyMode.APPLY_MODE);
    
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test('scorePriority includes breakdown', () => {
    const state = createBaseState();
    const task = createMockTask();
    
    const result = scorePriority(task, state, StrategyMode.APPLY_MODE);
    
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.impact).toBeDefined();
    expect(result.breakdown.urgency).toBeDefined();
    expect(result.breakdown.alignment).toBeDefined();
    expect(result.breakdown.confidence).toBeDefined();
  });

  test('high impact + high urgency + high alignment = high score', () => {
    const state = createBaseState({
      freshness: { is_stale: false, staleness_severity: 'none' },
    });
    
    const today = new Date();
    const highPriorityTask = createMockTask({
      action_type: ActionType.APPLY_TO_JOB,
      payload: { match_score: 95 },
      due_at: today.toISOString(),
      estimated_minutes: 15,
      evidence_refs: ['strong', 'evidence'],
    });
    
    const lowPriorityTask = createMockTask({
      action_type: ActionType.UPDATE_TARGETS,
      payload: {},
      due_at: undefined,
      estimated_minutes: 60,
      evidence_refs: [],
    });
    
    const highScore = scorePriority(highPriorityTask, state, StrategyMode.APPLY_MODE);
    const lowScore = scorePriority(lowPriorityTask, state, StrategyMode.APPLY_MODE);
    
    expect(highScore.score).toBeGreaterThan(lowScore.score);
  });
});

// ==================== Task Prioritization ====================

describe('Task Prioritization', () => {
  test('prioritizeTasks sorts by priority descending', () => {
    const state = createBaseState();
    const tasks = [
      createMockTask({ task_id: 'low', action_type: ActionType.UPDATE_TARGETS }),
      createMockTask({ task_id: 'high', action_type: ActionType.APPLY_TO_JOB, payload: { match_score: 90 } }),
      createMockTask({ task_id: 'medium', action_type: ActionType.FOLLOW_UP }),
    ];
    
    const prioritized = prioritizeTasks(tasks, state, StrategyMode.APPLY_MODE);
    
    expect(prioritized[0].priority).toBeGreaterThanOrEqual(prioritized[1].priority);
    expect(prioritized[1].priority).toBeGreaterThanOrEqual(prioritized[2].priority);
  });

  test('prioritizeTasks is deterministic', () => {
    const state = createBaseState();
    const tasks = [
      createMockTask({ task_id: 'a', action_type: ActionType.APPLY_TO_JOB }),
      createMockTask({ task_id: 'b', action_type: ActionType.IMPROVE_RESUME }),
      createMockTask({ task_id: 'c', action_type: ActionType.FOLLOW_UP }),
    ];
    
    const prioritized1 = prioritizeTasks(tasks, state, StrategyMode.APPLY_MODE);
    const prioritized2 = prioritizeTasks(tasks, state, StrategyMode.APPLY_MODE);
    
    expect(prioritized1.map(t => t.task_id)).toEqual(prioritized2.map(t => t.task_id));
  });
});

// ==================== Priority Helpers ====================

describe('Priority Level Helpers', () => {
  test('getPriorityLevel returns correct level', () => {
    expect(getPriorityLevel(85)).toBe('high');
    expect(getPriorityLevel(55)).toBe('medium');
    expect(getPriorityLevel(25)).toBe('low');
  });

  test('isHighPriority identifies high priority tasks', () => {
    const highTask = createMockTask({ priority: 80 });
    const lowTask = createMockTask({ priority: 30 });
    
    expect(isHighPriority(highTask)).toBe(true);
    expect(isHighPriority(lowTask)).toBe(false);
  });
});
