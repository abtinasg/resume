/**
 * Layer 2 - Strategy Engine
 * Mode Selection Tests
 *
 * Tests for strategy mode selection logic including decision tree and hysteresis.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  selectMode,
  selectModeFromLayers,
  getModeName,
  getModeDescription,
  checkHysteresis,
  getDaysInCurrentMode,
} from '../strategy';
import { analyzeAllGaps } from '../gap-analysis';
import {
  SCENARIO_STRONG_RESUME_NO_APPS,
  SCENARIO_LOW_INTERVIEW_RATE,
  SCENARIO_EXCELLENT_READY,
  SCENARIO_MID_RESUME_HIGH_INTERVIEWS,
  SCENARIO_ENTRY_TARGETING_SENIOR,
  ALL_SCENARIOS,
} from './fixtures/scenarios';
import { StrategyMode, SeniorityLevel } from '../types';
import type { GapAnalysis } from '../types';
import { clearConfigCache } from '../config';

// ==================== Setup ====================

beforeEach(() => {
  clearConfigCache();
});

// ==================== Helper to Create Default Gaps ====================

function createDefaultGaps(): GapAnalysis {
  return {
    skills: {
      matched: ['typescript', 'react'],
      critical_missing: [],
      nice_to_have_missing: [],
      match_percentage: 80,
      confidence: 'medium',
    },
    tools: {
      matched: ['docker', 'git'],
      critical_missing: [],
      nice_to_have_missing: [],
      match_percentage: 75,
      confidence: 'medium',
    },
    experience: {
      present_types: ['leadership', 'shipping_ownership'],
      missing_types: [],
      coverage_score: 70,
      confidence: 'medium',
    },
    seniority: {
      user_level: SeniorityLevel.MID,
      role_expected: SeniorityLevel.MID,
      alignment: 'aligned',
      confidence: 'medium',
    },
    industry: {
      keywords_matched: ['technology'],
      keywords_missing: [],
      match_percentage: 80,
      confidence: 'medium',
    },
  };
}

// ==================== Mode Selection Decision Tree Tests ====================

describe('Mode Selection Decision Tree', () => {
  test('should recommend IMPROVE_RESUME_FIRST when resume score below threshold', () => {
    const result = selectMode({
      resumeScore: 65, // Below 75 threshold
      totalApplications: 0,
      applicationsLast30Days: 0,
      interviewRate: 0,
      gaps: createDefaultGaps(),
    });

    expect(result.recommendedMode).toBe(StrategyMode.IMPROVE_RESUME_FIRST);
    expect(result.reasoning.primary_reason).toBe('resume_below_threshold');
  });

  test('should recommend RETHINK_TARGETS when low interview rate after volume', () => {
    const result = selectMode({
      resumeScore: 80, // Above threshold
      totalApplications: 40,
      applicationsLast30Days: 35, // Above 30 threshold
      interviewRate: 0.01, // Below 2% threshold
      gaps: createDefaultGaps(),
    });

    expect(result.recommendedMode).toBe(StrategyMode.RETHINK_TARGETS);
    expect(result.reasoning.primary_reason).toBe('low_interview_rate_after_volume');
  });

  test('should recommend APPLY_MODE when healthy state', () => {
    const result = selectMode({
      resumeScore: 85, // Above threshold
      totalApplications: 10,
      applicationsLast30Days: 10,
      interviewRate: 0.05, // Above threshold
      gaps: createDefaultGaps(),
    });

    expect(result.recommendedMode).toBe(StrategyMode.APPLY_MODE);
    expect(result.reasoning.primary_reason).toBe('healthy_state_default');
  });

  test('should recommend APPLY_MODE with zero applications but good resume', () => {
    const result = selectMode({
      resumeScore: 80,
      totalApplications: 0,
      applicationsLast30Days: 0,
      interviewRate: 0,
      gaps: createDefaultGaps(),
    });

    expect(result.recommendedMode).toBe(StrategyMode.APPLY_MODE);
    expect(result.reasoning.primary_reason).toBe('healthy_state_default');
  });

  test('should not recommend RETHINK without sufficient volume', () => {
    const result = selectMode({
      resumeScore: 80,
      totalApplications: 20,
      applicationsLast30Days: 20, // Below 30 threshold
      interviewRate: 0.01, // Low but not enough volume
      gaps: createDefaultGaps(),
    });

    // Should not be RETHINK because volume threshold not met
    expect(result.recommendedMode).toBe(StrategyMode.APPLY_MODE);
  });
});

// ==================== Hysteresis Tests ====================

describe('Mode Hysteresis', () => {
  test('should keep IMPROVE mode when score in buffer zone', () => {
    const result = checkHysteresis({
      currentMode: StrategyMode.IMPROVE_RESUME_FIRST,
      proposedMode: StrategyMode.APPLY_MODE,
      resumeScore: 76, // In buffer zone [75, 78)
    });

    expect(result.shouldChange).toBe(false);
    expect(result.finalMode).toBe(StrategyMode.IMPROVE_RESUME_FIRST);
    expect(result.hysteresisApplied).toBe(true);
    expect(result.reason).toContain('buffer zone');
  });

  test('should allow change when score exceeds buffer', () => {
    const result = checkHysteresis({
      currentMode: StrategyMode.IMPROVE_RESUME_FIRST,
      proposedMode: StrategyMode.APPLY_MODE,
      resumeScore: 80, // Above buffer zone
    });

    expect(result.shouldChange).toBe(true);
    expect(result.finalMode).toBe(StrategyMode.APPLY_MODE);
    expect(result.hysteresisApplied).toBe(false);
  });

  test('should block rapid mode changes within min days', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2); // 2 days ago

    const result = checkHysteresis({
      currentMode: StrategyMode.APPLY_MODE,
      proposedMode: StrategyMode.RETHINK_TARGETS,
      resumeScore: 80,
      modeActivatedAt: recentDate.toISOString(),
    });

    expect(result.shouldChange).toBe(false);
    expect(result.hysteresisApplied).toBe(true);
    expect(result.reason).toContain('days');
  });

  test('should allow mode change after min days', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

    const result = checkHysteresis({
      currentMode: StrategyMode.APPLY_MODE,
      proposedMode: StrategyMode.RETHINK_TARGETS,
      resumeScore: 80,
      modeActivatedAt: oldDate.toISOString(),
    });

    expect(result.shouldChange).toBe(true);
    expect(result.hysteresisApplied).toBe(false);
  });

  test('should detect mode ping-pong pattern', () => {
    const result = checkHysteresis({
      currentMode: StrategyMode.APPLY_MODE,
      proposedMode: StrategyMode.RETHINK_TARGETS,
      resumeScore: 80,
      strategyHistory: [
        { from: StrategyMode.APPLY_MODE, to: StrategyMode.RETHINK_TARGETS, changed_at: '2024-01-01', reason: 'test' },
        { from: StrategyMode.RETHINK_TARGETS, to: StrategyMode.APPLY_MODE, changed_at: '2024-01-02', reason: 'test' },
        { from: StrategyMode.APPLY_MODE, to: StrategyMode.RETHINK_TARGETS, changed_at: '2024-01-03', reason: 'test' },
      ],
    });

    expect(result.shouldChange).toBe(false);
    expect(result.reason).toContain('ping-pong');
  });

  test('should allow change when no current mode', () => {
    const result = checkHysteresis({
      currentMode: null,
      proposedMode: StrategyMode.APPLY_MODE,
      resumeScore: 80,
    });

    expect(result.shouldChange).toBe(true);
    expect(result.finalMode).toBe(StrategyMode.APPLY_MODE);
    expect(result.hysteresisApplied).toBe(false);
  });

  test('should not change when same mode proposed', () => {
    const result = checkHysteresis({
      currentMode: StrategyMode.APPLY_MODE,
      proposedMode: StrategyMode.APPLY_MODE,
      resumeScore: 80,
    });

    expect(result.shouldChange).toBe(false);
    expect(result.finalMode).toBe(StrategyMode.APPLY_MODE);
    expect(result.hysteresisApplied).toBe(false);
  });
});

// ==================== Supporting Factors Tests ====================

describe('Supporting Factors', () => {
  test('should identify critical missing skills as supporting factor', () => {
    const gaps = createDefaultGaps();
    gaps.skills.critical_missing = ['kubernetes', 'terraform'];

    const result = selectMode({
      resumeScore: 65,
      totalApplications: 0,
      applicationsLast30Days: 0,
      interviewRate: 0,
      gaps,
    });

    expect(result.reasoning.supporting_factors).toContain('critical_missing_skills');
  });

  test('should identify seniority mismatch as supporting factor', () => {
    const gaps = createDefaultGaps();
    gaps.seniority.alignment = 'underqualified';

    const result = selectMode({
      resumeScore: 65,
      totalApplications: 0,
      applicationsLast30Days: 0,
      interviewRate: 0,
      gaps,
    });

    expect(result.reasoning.supporting_factors).toContain('seniority_mismatch');
  });

  test('should identify industry mismatch as supporting factor', () => {
    const gaps = createDefaultGaps();
    gaps.industry.match_percentage = 20;

    const result = selectMode({
      resumeScore: 65,
      totalApplications: 0,
      applicationsLast30Days: 0,
      interviewRate: 0,
      gaps,
    });

    expect(result.reasoning.supporting_factors).toContain('industry_mismatch');
  });

  test('should identify weak bullets from weaknesses', () => {
    const result = selectMode({
      resumeScore: 65,
      totalApplications: 0,
      applicationsLast30Days: 0,
      interviewRate: 0,
      gaps: createDefaultGaps(),
      weaknesses: ['weak_verbs', 'no_metrics'],
    });

    expect(result.reasoning.supporting_factors).toContain('weak_bullets_high');
  });
});

// ==================== Integration with Layers Tests ====================

describe('Mode Selection from Layer Data', () => {
  test.each(ALL_SCENARIOS)('should select expected mode for scenario: $name', (scenario) => {
    const { layer1_evaluation, layer4_state, job_context } = scenario.request;

    const gaps = analyzeAllGaps(layer1_evaluation, layer4_state, job_context);
    const result = selectModeFromLayers(layer1_evaluation, layer4_state, gaps);

    expect(result.recommendedMode).toBe(scenario.expected.mode);

    if (scenario.expected.reasoning_contains) {
      expect(result.reasoning.primary_reason).toContain(scenario.expected.reasoning_contains);
    }
  });
});

// ==================== Utility Function Tests ====================

describe('Mode Utility Functions', () => {
  test('should get human-readable mode names', () => {
    expect(getModeName(StrategyMode.IMPROVE_RESUME_FIRST)).toBe('Improve Resume First');
    expect(getModeName(StrategyMode.APPLY_MODE)).toBe('Apply Mode');
    expect(getModeName(StrategyMode.RETHINK_TARGETS)).toBe('Rethink Targets');
  });

  test('should get mode descriptions', () => {
    const improveDesc = getModeDescription(StrategyMode.IMPROVE_RESUME_FIRST);
    expect(improveDesc).toContain('resume');

    const applyDesc = getModeDescription(StrategyMode.APPLY_MODE);
    expect(applyDesc).toContain('ready');

    const rethinkDesc = getModeDescription(StrategyMode.RETHINK_TARGETS);
    expect(rethinkDesc).toContain('adjust');
  });

  test('should calculate days in current mode', () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const days = getDaysInCurrentMode(fiveDaysAgo.toISOString());
    expect(days).toBe(5);
  });

  test('should return undefined for no activation date', () => {
    const days = getDaysInCurrentMode(undefined);
    expect(days).toBeUndefined();
  });
});

// ==================== Confidence Level Tests ====================

describe('Mode Selection Confidence', () => {
  test('should have high confidence with good data', () => {
    const result = selectMode({
      resumeScore: 80,
      totalApplications: 20,
      applicationsLast30Days: 15,
      interviewRate: 0.1,
      gaps: createDefaultGaps(),
    });

    expect(result.reasoning.confidence).toBe('high');
  });

  test('should have medium confidence with partial data', () => {
    const result = selectMode({
      resumeScore: 80,
      totalApplications: 5,
      applicationsLast30Days: 5,
      interviewRate: 0,
      gaps: createDefaultGaps(),
    });

    expect(result.reasoning.confidence).toBe('medium');
  });

  test('should have low confidence with minimal data', () => {
    const result = selectMode({
      resumeScore: 0,
      totalApplications: 0,
      applicationsLast30Days: 0,
      interviewRate: 0,
      gaps: createDefaultGaps(),
    });

    expect(result.reasoning.confidence).toBe('low');
  });
});
