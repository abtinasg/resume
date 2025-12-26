/**
 * Integration Tests - Edge Cases
 *
 * Tests edge cases and error handling across all layers.
 * Verifies:
 * 1. Stale state handling
 * 2. Determinism (same inputs → same outputs)
 * 3. Graceful degradation
 * 4. Boundary conditions
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  Layer2,
  Layer5,
  mockLayer4State,
  mockLayer2Analysis,
  verifyPlanDeterminism,
  StrategyMode,
  SeniorityLevel,
  ActionType,
  FocusArea,
} from './setup';

// ==================== Setup ====================

beforeEach(() => {
  try {
    Layer2.clearConfigCache();
    Layer5.clearConfigCache();
  } catch {
    // Ignore if config cache functions don't exist
  }
});

// ==================== Test: Stale State Handling ====================

describe('Stale State Handling', () => {
  test('should handle critically stale state', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const staleState = mockLayer4State({
      freshness: {
        is_stale: true,
        staleness_severity: 'critical',
        staleness_reason: 'no_activity_30_days',
        last_resume_update: tenDaysAgo.toISOString(),
        last_application: tenDaysAgo.toISOString(),
        last_user_interaction: tenDaysAgo.toISOString(),
      },
    });

    const analysis = mockLayer2Analysis({
      recommended_mode: StrategyMode.APPLY_MODE,
    });

    const plan = Layer5.orchestrateWeeklyPlan(staleState, analysis);

    // Should have zero application target for stale state
    expect(plan.target_applications).toBe(0);

    // Should have refresh task
    const refreshTask = plan.task_pool.find(
      (t) => t.action_type === ActionType.REFRESH_STATE
    );
    expect(refreshTask).toBeDefined();
    expect(refreshTask!.priority).toBeGreaterThan(80);
  });

  test('should detect stale state via isCriticallyStale', () => {
    const staleState = mockLayer4State({
      freshness: {
        is_stale: true,
        staleness_severity: 'critical',
        staleness_reason: 'no_recent_activity',
      },
    });

    const isStale = Layer5.isCriticallyStale(staleState);
    expect(isStale).toBe(true);
  });

  test('should not flag fresh state as stale', () => {
    const freshState = mockLayer4State({
      freshness: {
        is_stale: false,
        staleness_severity: 'none',
      },
    });

    const isStale = Layer5.isCriticallyStale(freshState);
    expect(isStale).toBe(false);
  });

  test('should handle warning-level staleness', () => {
    const warningState = mockLayer4State({
      freshness: {
        is_stale: true,
        staleness_severity: 'warning',
        staleness_reason: 'no_activity_7_days',
      },
    });

    const hasWarning = Layer5.hasStaleWarning(warningState);
    expect(hasWarning).toBe(true);
  });
});

// ==================== Test: Determinism ====================

describe('Determinism', () => {
  test('should generate same plan for same inputs', () => {
    const state = mockLayer4State({
      resume: { resume_score: 75 },
      pipeline_state: {
        total_applications: 10,
        applications_last_7_days: 5,
        applications_last_30_days: 10,
        interview_requests: 2,
        interview_rate: 0.2,
      },
    });

    const analysis = mockLayer2Analysis({
      recommended_mode: StrategyMode.APPLY_MODE,
      action_blueprints: [
        {
          type: 'apply_to_job',
          objective: 'Apply to matching positions',
          why: 'Resume is ready',
          confidence: 'high',
          priority: 8,
        },
      ],
    });

    const plan1 = Layer5.orchestrateWeeklyPlan(state, analysis);
    const plan2 = Layer5.orchestrateWeeklyPlan(state, analysis);

    // Core structure should be identical
    expect(plan1.strategy_mode).toBe(plan2.strategy_mode);
    expect(plan1.target_applications).toBe(plan2.target_applications);
    expect(plan1.task_pool.length).toBe(plan2.task_pool.length);
    expect(plan1.focus_mix).toEqual(plan2.focus_mix);

    // Verify with helper
    expect(verifyPlanDeterminism(plan1, plan2)).toBe(true);
  });

  test('should generate deterministic daily plans', () => {
    const state = mockLayer4State({
      resume: { resume_score: 80 },
    });

    const analysis = mockLayer2Analysis({
      recommended_mode: StrategyMode.APPLY_MODE,
    });

    const weeklyPlan = Layer5.orchestrateWeeklyPlan(state, analysis);
    const dailyPlan1 = Layer5.orchestrateDailyPlan(weeklyPlan, state);
    const dailyPlan2 = Layer5.orchestrateDailyPlan(weeklyPlan, state);

    // Daily plans should be identical
    expect(dailyPlan1.tasks.length).toBe(dailyPlan2.tasks.length);
    expect(dailyPlan1.focus_area).toBe(dailyPlan2.focus_area);
    expect(dailyPlan1.total_estimated_minutes).toBe(dailyPlan2.total_estimated_minutes);
  });

  test('should maintain task order consistency', () => {
    const state = mockLayer4State({
      resume: { resume_score: 70 },
    });

    const analysis = mockLayer2Analysis({
      recommended_mode: StrategyMode.IMPROVE_RESUME_FIRST,
      action_blueprints: [
        {
          type: 'improve_resume',
          objective: 'Improve bullet 1',
          why: 'Weak verb',
          confidence: 'high',
          priority: 9,
        },
        {
          type: 'improve_resume',
          objective: 'Improve bullet 2',
          why: 'No metrics',
          confidence: 'medium',
          priority: 8,
        },
        {
          type: 'apply_to_job',
          objective: 'Apply to job',
          why: 'Good match',
          confidence: 'medium',
          priority: 7,
        },
      ],
    });

    const plan1 = Layer5.orchestrateWeeklyPlan(state, analysis);
    const plan2 = Layer5.orchestrateWeeklyPlan(state, analysis);

    // Task types and priorities should match in order
    for (let i = 0; i < plan1.task_pool.length; i++) {
      const task1 = plan1.task_pool[i];
      const task2 = plan2.task_pool[i];

      expect(task1.action_type).toBe(task2.action_type);
      expect(task1.priority).toBe(task2.priority);
    }
  });
});

// ==================== Test: State Validation ====================

describe('State Validation', () => {
  test('should validate valid state', () => {
    const validState = mockLayer4State({
      resume: { resume_score: 80 },
    });

    const validation = Layer5.validateState(validState);
    expect(validation.passed).toBe(true);
    expect(validation.issues.length).toBe(0);
  });

  test('should validate state for planning', () => {
    const validState = mockLayer4State({
      resume: { resume_score: 80 },
      freshness: { is_stale: false, staleness_severity: 'none' },
    });

    const validation = Layer5.validateStateForPlanning(validState);
    expect(validation.valid).toBe(true);
  });

  test('should provide validation summary', () => {
    const validState = mockLayer4State();
    const validation = Layer5.validateState(validState);
    const summary = Layer5.getValidationSummary(validation);

    expect(summary).toBeDefined();
    expect(summary.status).toBeDefined();
    expect(summary.details).toBeInstanceOf(Array);
  });
});

// ==================== Test: Focus Mix Boundaries ====================

describe('Focus Mix Boundaries', () => {
  test('focus mix values should sum approximately to 1.0', () => {
    const state = mockLayer4State({ resume: { resume_score: 75 } });
    const analysis = mockLayer2Analysis({ recommended_mode: StrategyMode.APPLY_MODE });

    const plan = Layer5.orchestrateWeeklyPlan(state, analysis);

    const focusMixSum = Object.values(plan.focus_mix).reduce((sum, val) => sum + val, 0);

    // Allow small tolerance for floating point
    expect(focusMixSum).toBeGreaterThan(0.95);
    expect(focusMixSum).toBeLessThanOrEqual(1.05);
  });

  test('focus mix values should be between 0 and 1', () => {
    const state = mockLayer4State({ resume: { resume_score: 75 } });
    const analysis = mockLayer2Analysis({ recommended_mode: StrategyMode.APPLY_MODE });

    const plan = Layer5.orchestrateWeeklyPlan(state, analysis);

    Object.values(plan.focus_mix).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  test('IMPROVE mode should have high resume improvement focus', () => {
    const state = mockLayer4State({
      resume: { resume_score: 65 },
    });

    const analysis = mockLayer2Analysis({
      recommended_mode: StrategyMode.IMPROVE_RESUME_FIRST,
      action_blueprints: [
        {
          type: 'improve_resume',
          objective: 'Improve weak bullet points',
          why: 'Resume score is below threshold',
          confidence: 'high',
          priority: 9,
        },
        {
          type: 'improve_resume',
          objective: 'Add metrics to bullets',
          why: 'Bullets lack quantifiable impact',
          confidence: 'medium',
          priority: 8,
        },
      ],
    });

    const plan = Layer5.orchestrateWeeklyPlan(state, analysis);

    // Should have resume improvement focus (could vary based on task generation)
    expect(plan.focus_mix[FocusArea.RESUME_IMPROVEMENT]).toBeGreaterThan(0);
    expect(plan.strategy_mode).toBe(StrategyMode.IMPROVE_RESUME_FIRST);
  });

  test('APPLY mode should have applications focus', () => {
    const state = mockLayer4State({
      resume: { resume_score: 85 },
    });

    const analysis = mockLayer2Analysis({
      recommended_mode: StrategyMode.APPLY_MODE,
    });

    const plan = Layer5.orchestrateWeeklyPlan(state, analysis);

    expect(plan.focus_mix[FocusArea.APPLICATIONS]).toBeGreaterThan(0);
  });
});

// ==================== Test: Task Priority Boundaries ====================

describe('Task Priority Boundaries', () => {
  test('task priorities should be between 0 and 100', () => {
    const state = mockLayer4State({ resume: { resume_score: 75 } });
    const analysis = mockLayer2Analysis();

    const plan = Layer5.orchestrateWeeklyPlan(state, analysis);

    plan.task_pool.forEach((task) => {
      expect(task.priority).toBeGreaterThanOrEqual(0);
      expect(task.priority).toBeLessThanOrEqual(100);
    });
  });

  test('high priority refresh task for stale state', () => {
    const staleState = mockLayer4State({
      freshness: {
        is_stale: true,
        staleness_severity: 'critical',
      },
    });

    const analysis = mockLayer2Analysis();
    const plan = Layer5.orchestrateWeeklyPlan(staleState, analysis);

    const refreshTask = plan.task_pool.find(
      (t) => t.action_type === ActionType.REFRESH_STATE
    );

    if (refreshTask) {
      expect(refreshTask.priority).toBeGreaterThan(80);
    }
  });
});

// ==================== Test: Daily Plan Limits ====================

describe('Daily Plan Limits', () => {
  test('daily plan should have at most 5 tasks', () => {
    const state = mockLayer4State({
      resume: { resume_score: 80 },
    });

    const analysis = mockLayer2Analysis({
      action_blueprints: Array(10).fill({
        type: 'apply_to_job',
        objective: 'Apply to job',
        why: 'Good match',
        confidence: 'high',
        priority: 8,
      }),
    });

    const weeklyPlan = Layer5.orchestrateWeeklyPlan(state, analysis);
    const dailyPlan = Layer5.orchestrateDailyPlan(weeklyPlan, state);

    expect(dailyPlan.tasks.length).toBeLessThanOrEqual(5);
  });

  test('daily plan should have at least 1 task if weekly plan has tasks', () => {
    const state = mockLayer4State({
      resume: { resume_score: 75 },
    });

    const analysis = mockLayer2Analysis({
      action_blueprints: [
        {
          type: 'apply_to_job',
          objective: 'Apply to job',
          why: 'Good match',
          confidence: 'high',
          priority: 8,
        },
      ],
    });

    const weeklyPlan = Layer5.orchestrateWeeklyPlan(state, analysis);
    const dailyPlan = Layer5.orchestrateDailyPlan(weeklyPlan, state);

    expect(dailyPlan.tasks.length).toBeGreaterThanOrEqual(1);
  });

  test('daily plan time budget should be reasonable', () => {
    const state = mockLayer4State({
      resume: { resume_score: 75 },
    });

    const analysis = mockLayer2Analysis();
    const weeklyPlan = Layer5.orchestrateWeeklyPlan(state, analysis);
    const dailyPlan = Layer5.orchestrateDailyPlan(weeklyPlan, state);

    // Should not exceed 3 hours
    expect(dailyPlan.total_estimated_minutes).toBeLessThanOrEqual(180);
  });
});

// ==================== Test: Follow-up Task Generation ====================

describe('Follow-up Task Generation', () => {
  test('should include follow-up tasks from state', () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const state = mockLayer4State({
      followups: {
        applications_needing_followup: [
          {
            application_id: 'app_001',
            job_title: 'Software Engineer',
            company: 'TechCorp',
            applied_at: sevenDaysAgo.toISOString(),
            days_since_application: 7,
            follow_up_count: 0,
            suggested_action: 'FOLLOW_UP' as const,
            reason: 'Optimal follow-up window',
          },
        ],
      },
    });

    const analysis = mockLayer2Analysis({
      recommended_mode: StrategyMode.APPLY_MODE,
    });

    const plan = Layer5.orchestrateWeeklyPlan(state, analysis);

    const followUpTasks = plan.task_pool.filter(
      (t) => t.action_type === ActionType.FOLLOW_UP
    );

    expect(followUpTasks.length).toBeGreaterThanOrEqual(1);
  });

  test('follow-up tasks should have correct payload', () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const state = mockLayer4State({
      followups: {
        applications_needing_followup: [
          {
            application_id: 'app_001',
            job_title: 'Software Engineer',
            company: 'TechCorp',
            applied_at: sevenDaysAgo.toISOString(),
            days_since_application: 7,
            follow_up_count: 0,
            suggested_action: 'FOLLOW_UP' as const,
            reason: 'Optimal follow-up window',
          },
        ],
      },
    });

    const analysis = mockLayer2Analysis();
    const plan = Layer5.orchestrateWeeklyPlan(state, analysis);

    const followUpTasks = plan.task_pool.filter(
      (t) => t.action_type === ActionType.FOLLOW_UP
    );

    followUpTasks.forEach((task) => {
      expect(task.payload.application_id).toBeDefined();
      expect(task.payload.company).toBeDefined();
    });
  });
});

// ==================== Test: Re-planning Triggers ====================

describe('Re-planning Triggers', () => {
  test('should detect strategy mode change', () => {
    const state = mockLayer4State({ resume: { resume_score: 80 } });
    const analysis = mockLayer2Analysis({ recommended_mode: StrategyMode.APPLY_MODE });
    const newAnalysis = mockLayer2Analysis({ recommended_mode: StrategyMode.RETHINK_TARGETS });

    const { weeklyPlan, dailyPlan } = Layer5.orchestrate(state, analysis);

    const trigger = Layer5.checkReplanNeeded(weeklyPlan, dailyPlan, state, newAnalysis);

    expect(trigger.should_replan).toBe(true);
    expect(trigger.trigger_type).toBe('strategy_mode_changed');
  });

  test('should not trigger unnecessary replan', () => {
    const state = mockLayer4State({ resume: { resume_score: 80 } });
    const analysis = mockLayer2Analysis({ recommended_mode: StrategyMode.APPLY_MODE });

    const { weeklyPlan, dailyPlan } = Layer5.orchestrate(state, analysis);

    const trigger = Layer5.checkReplanNeeded(weeklyPlan, dailyPlan, state, analysis);

    // Should not trigger mode change replan if mode hasn't changed
    if (trigger.should_replan) {
      expect(trigger.trigger_type).not.toBe('strategy_mode_changed');
    }
  });
});

// ==================== Test: Empty and Edge State ====================

describe('Empty and Edge States', () => {
  test('should handle state with no applications', () => {
    const emptyState = mockLayer4State({
      pipeline_state: {
        total_applications: 0,
        applications_last_7_days: 0,
        applications_last_30_days: 0,
        interview_requests: 0,
        interview_rate: 0,
        offers: 0,
        rejections: 0,
      },
    });

    const analysis = mockLayer2Analysis();
    const plan = Layer5.orchestrateWeeklyPlan(emptyState, analysis);

    expect(plan).toBeDefined();
    expect(plan.task_pool.length).toBeGreaterThan(0);
  });

  test('should handle state with minimal profile', () => {
    const minimalState = mockLayer4State({
      user_profile: {
        target_roles: ['Developer'],
      },
    });

    const analysis = mockLayer2Analysis();
    const plan = Layer5.orchestrateWeeklyPlan(minimalState, analysis);

    expect(plan).toBeDefined();
    expect(plan.strategy_mode).toBeDefined();
  });

  test('should handle high interview rate scenario', () => {
    const successState = mockLayer4State({
      resume: { resume_score: 90 },
      pipeline_state: {
        total_applications: 10,
        applications_last_7_days: 5,
        applications_last_30_days: 10,
        interview_requests: 5,
        interview_rate: 0.5, // 50% interview rate
        offers: 2,
        rejections: 0,
      },
    });

    const analysis = mockLayer2Analysis({
      recommended_mode: StrategyMode.APPLY_MODE,
    });

    const plan = Layer5.orchestrateWeeklyPlan(successState, analysis);

    // Should continue with APPLY mode
    expect(plan.strategy_mode).toBe(StrategyMode.APPLY_MODE);
  });
});

// ==================== Test: Evidence Anchoring ====================

describe('Evidence Anchoring in All Plans', () => {
  test('all weekly tasks should have why_now', () => {
    const state = mockLayer4State();
    const analysis = mockLayer2Analysis();

    const plan = Layer5.orchestrateWeeklyPlan(state, analysis);

    plan.task_pool.forEach((task) => {
      expect(task.why_now).toBeDefined();
      expect(task.why_now.length).toBeGreaterThan(0);
    });
  });

  test('all daily tasks should have why_now', () => {
    const state = mockLayer4State();
    const analysis = mockLayer2Analysis();

    const weeklyPlan = Layer5.orchestrateWeeklyPlan(state, analysis);
    const dailyPlan = Layer5.orchestrateDailyPlan(weeklyPlan, state);

    dailyPlan.tasks.forEach((task) => {
      expect(task.why_now).toBeDefined();
      expect(task.why_now.length).toBeGreaterThan(0);
    });
  });

  test('tasks from different modes should have evidence', () => {
    const modes = [
      StrategyMode.IMPROVE_RESUME_FIRST,
      StrategyMode.APPLY_MODE,
      StrategyMode.RETHINK_TARGETS,
    ];

    modes.forEach((mode) => {
      const state = mockLayer4State();
      const analysis = mockLayer2Analysis({ recommended_mode: mode });

      const plan = Layer5.orchestrateWeeklyPlan(state, analysis);

      plan.task_pool.forEach((task) => {
        expect(task.why_now).toBeDefined();
        expect(Layer5.isEvidenceAnchored(task)).toBe(true);
      });
    });
  });
});
