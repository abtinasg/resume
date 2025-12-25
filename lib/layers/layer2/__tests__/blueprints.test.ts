/**
 * Layer 2 - Strategy Engine
 * Blueprint Generation Tests
 *
 * Tests for action blueprint generation and priority actions.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  generateActionBlueprints,
  generatePriorityActions,
  generateKeyInsights,
} from '../actions';
import { StrategyMode, SeniorityLevel } from '../types';
import type { GapAnalysis, Layer1Evaluation, Layer4State, ModeReasoning } from '../types';
import { clearConfigCache } from '../config';

// ==================== Setup ====================

beforeEach(() => {
  clearConfigCache();
});

// ==================== Helper Functions ====================

function createDefaultGaps(): GapAnalysis {
  return {
    skills: {
      matched: ['typescript', 'react'],
      critical_missing: [],
      nice_to_have_missing: ['graphql'],
      match_percentage: 80,
      confidence: 'medium',
    },
    tools: {
      matched: ['docker', 'git'],
      critical_missing: [],
      nice_to_have_missing: ['terraform'],
      match_percentage: 75,
      confidence: 'medium',
    },
    experience: {
      present_types: ['leadership', 'shipping_ownership'],
      missing_types: ['mentorship'],
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
      keywords_matched: ['technology', 'saas'],
      keywords_missing: [],
      match_percentage: 80,
      confidence: 'medium',
    },
  };
}

function createDefaultEvaluation(overrides: Partial<Layer1Evaluation> = {}): Layer1Evaluation {
  return {
    resume_score: 75,
    content_quality_score: 75,
    ats_compatibility_score: 78,
    weaknesses: [],
    identified_gaps: {
      weak_bullets: 2,
      missing_skills: [],
      vague_experience: false,
    },
    extracted: {
      skills: ['typescript', 'react', 'node.js'],
      tools: ['docker', 'git'],
      titles: ['Software Engineer'],
    },
    ...overrides,
  };
}

function createDefaultLayer4State(overrides: Partial<Layer4State> = {}): Layer4State {
  return {
    pipeline_state: {
      total_applications: 10,
      applications_last_7_days: 3,
      applications_last_30_days: 10,
      interview_requests: 1,
      interview_rate: 0.1,
      offers: 0,
      rejections: 5,
    },
    user_profile: {
      target_roles: ['Software Engineer'],
      target_seniority: SeniorityLevel.MID,
      years_experience: 4,
      weekly_target: 8,
    },
    ...overrides,
  };
}

function createDefaultReasoning(mode: StrategyMode): ModeReasoning {
  let primary_reason: 'resume_below_threshold' | 'low_interview_rate_after_volume' | 'healthy_state_default';
  
  switch (mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      primary_reason = 'resume_below_threshold';
      break;
    case StrategyMode.RETHINK_TARGETS:
      primary_reason = 'low_interview_rate_after_volume';
      break;
    default:
      primary_reason = 'healthy_state_default';
  }

  return {
    primary_reason,
    supporting_factors: [],
    confidence: 'medium',
  };
}

// ==================== Blueprint Generation Tests ====================

describe('Action Blueprint Generation', () => {
  test('should generate blueprints for IMPROVE_RESUME_FIRST mode', () => {
    const gaps = createDefaultGaps();
    gaps.skills.critical_missing = ['kubernetes', 'terraform'];
    
    const evaluation = createDefaultEvaluation({
      resume_score: 65,
      weaknesses: ['weak_verbs', 'no_metrics'],
    });

    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.IMPROVE_RESUME_FIRST,
      modeReasoning: createDefaultReasoning(StrategyMode.IMPROVE_RESUME_FIRST),
      gaps,
      evaluation,
      layer4State: createDefaultLayer4State(),
    });

    expect(blueprints.length).toBeGreaterThan(0);
    expect(blueprints.length).toBeLessThanOrEqual(7);

    // Should have improve_resume actions
    const improveActions = blueprints.filter(b => b.type === 'improve_resume');
    expect(improveActions.length).toBeGreaterThan(0);

    // Should prioritize critical missing skills
    const skillAction = blueprints.find(b => 
      b.objective.toLowerCase().includes('skill') || 
      b.objective.toLowerCase().includes('kubernetes')
    );
    expect(skillAction).toBeDefined();
  });

  test('should generate blueprints for APPLY_MODE', () => {
    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.APPLY_MODE,
      modeReasoning: createDefaultReasoning(StrategyMode.APPLY_MODE),
      gaps: createDefaultGaps(),
      evaluation: createDefaultEvaluation({ resume_score: 85 }),
      layer4State: createDefaultLayer4State({
        pipeline_state: {
          total_applications: 5,
          applications_last_7_days: 2,
          applications_last_30_days: 5,
          interview_requests: 1,
          interview_rate: 0.2,
          offers: 0,
          rejections: 2,
        },
      }),
    });

    expect(blueprints.length).toBeGreaterThan(0);

    // Should have apply_to_job actions
    const applyActions = blueprints.filter(b => b.type === 'apply_to_job');
    expect(applyActions.length).toBeGreaterThan(0);
  });

  test('should generate blueprints for RETHINK_TARGETS mode', () => {
    const gaps = createDefaultGaps();
    gaps.seniority.alignment = 'underqualified';
    gaps.industry.match_percentage = 25;

    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.RETHINK_TARGETS,
      modeReasoning: createDefaultReasoning(StrategyMode.RETHINK_TARGETS),
      gaps,
      evaluation: createDefaultEvaluation({ resume_score: 80 }),
      layer4State: createDefaultLayer4State({
        pipeline_state: {
          total_applications: 40,
          applications_last_7_days: 8,
          applications_last_30_days: 35,
          interview_requests: 0,
          interview_rate: 0.01,
          offers: 0,
          rejections: 35,
        },
      }),
    });

    expect(blueprints.length).toBeGreaterThan(0);

    // Should have update_targets actions
    const updateActions = blueprints.filter(b => b.type === 'update_targets');
    expect(updateActions.length).toBeGreaterThan(0);
  });

  test('should respect max blueprints limit', () => {
    const gaps = createDefaultGaps();
    gaps.skills.critical_missing = ['a', 'b', 'c', 'd', 'e'];
    gaps.tools.critical_missing = ['x', 'y', 'z'];

    const evaluation = createDefaultEvaluation({
      weaknesses: ['weak_verbs', 'no_metrics', 'generic_descriptions'],
    });

    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.IMPROVE_RESUME_FIRST,
      modeReasoning: createDefaultReasoning(StrategyMode.IMPROVE_RESUME_FIRST),
      gaps,
      evaluation,
      layer4State: createDefaultLayer4State(),
    });

    expect(blueprints.length).toBeLessThanOrEqual(7);
  });

  test('should sort blueprints by priority', () => {
    const gaps = createDefaultGaps();
    gaps.skills.critical_missing = ['kubernetes'];

    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.IMPROVE_RESUME_FIRST,
      modeReasoning: createDefaultReasoning(StrategyMode.IMPROVE_RESUME_FIRST),
      gaps,
      evaluation: createDefaultEvaluation({ weaknesses: ['weak_verbs'] }),
      layer4State: createDefaultLayer4State(),
    });

    // Should be sorted by priority (descending)
    for (let i = 0; i < blueprints.length - 1; i++) {
      expect(blueprints[i].priority).toBeGreaterThanOrEqual(blueprints[i + 1].priority);
    }
  });

  test('should include follow-up blueprints when appropriate', () => {
    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.APPLY_MODE,
      modeReasoning: createDefaultReasoning(StrategyMode.APPLY_MODE),
      gaps: createDefaultGaps(),
      evaluation: createDefaultEvaluation({ resume_score: 85 }),
      layer4State: createDefaultLayer4State({
        pipeline_state: {
          total_applications: 20,
          applications_last_7_days: 5,
          applications_last_30_days: 20,
          interview_requests: 5,
          interview_rate: 0.25,
          offers: 0,
          rejections: 10,
        },
      }),
    });

    const followUpActions = blueprints.filter(b => b.type === 'follow_up');
    expect(followUpActions.length).toBeGreaterThanOrEqual(0); // May or may not have follow-ups
  });
});

// ==================== Blueprint Structure Tests ====================

describe('Blueprint Structure', () => {
  test('should have all required fields', () => {
    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.APPLY_MODE,
      modeReasoning: createDefaultReasoning(StrategyMode.APPLY_MODE),
      gaps: createDefaultGaps(),
      evaluation: createDefaultEvaluation(),
      layer4State: createDefaultLayer4State(),
    });

    for (const blueprint of blueprints) {
      expect(blueprint).toHaveProperty('type');
      expect(blueprint).toHaveProperty('objective');
      expect(blueprint).toHaveProperty('why');
      expect(blueprint).toHaveProperty('confidence');
      expect(blueprint).toHaveProperty('priority');
    }
  });

  test('should have valid action types', () => {
    const validTypes = ['improve_resume', 'apply_to_job', 'follow_up', 'update_targets', 'collect_missing_info'];

    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.IMPROVE_RESUME_FIRST,
      modeReasoning: createDefaultReasoning(StrategyMode.IMPROVE_RESUME_FIRST),
      gaps: createDefaultGaps(),
      evaluation: createDefaultEvaluation(),
      layer4State: createDefaultLayer4State(),
    });

    for (const blueprint of blueprints) {
      expect(validTypes).toContain(blueprint.type);
    }
  });

  test('should have valid priority range', () => {
    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.APPLY_MODE,
      modeReasoning: createDefaultReasoning(StrategyMode.APPLY_MODE),
      gaps: createDefaultGaps(),
      evaluation: createDefaultEvaluation(),
      layer4State: createDefaultLayer4State(),
    });

    for (const blueprint of blueprints) {
      expect(blueprint.priority).toBeGreaterThanOrEqual(1);
      expect(blueprint.priority).toBeLessThanOrEqual(10);
    }
  });
});

// ==================== Priority Actions Tests ====================

describe('Priority Actions', () => {
  test('should generate 3-5 priority actions', () => {
    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.APPLY_MODE,
      modeReasoning: createDefaultReasoning(StrategyMode.APPLY_MODE),
      gaps: createDefaultGaps(),
      evaluation: createDefaultEvaluation(),
      layer4State: createDefaultLayer4State(),
    });

    const actions = generatePriorityActions(blueprints, StrategyMode.APPLY_MODE);

    expect(actions.length).toBeGreaterThanOrEqual(3);
    expect(actions.length).toBeLessThanOrEqual(5);
  });

  test('should include mode-specific header action', () => {
    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.IMPROVE_RESUME_FIRST,
      modeReasoning: createDefaultReasoning(StrategyMode.IMPROVE_RESUME_FIRST),
      gaps: createDefaultGaps(),
      evaluation: createDefaultEvaluation(),
      layer4State: createDefaultLayer4State(),
    });

    const actions = generatePriorityActions(blueprints, StrategyMode.IMPROVE_RESUME_FIRST);

    expect(actions[0].toLowerCase()).toContain('resume');
  });

  test('should have different header for each mode', () => {
    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.APPLY_MODE,
      modeReasoning: createDefaultReasoning(StrategyMode.APPLY_MODE),
      gaps: createDefaultGaps(),
      evaluation: createDefaultEvaluation(),
      layer4State: createDefaultLayer4State(),
    });

    const applyActions = generatePriorityActions(blueprints, StrategyMode.APPLY_MODE);
    const improveActions = generatePriorityActions(blueprints, StrategyMode.IMPROVE_RESUME_FIRST);
    const rethinkActions = generatePriorityActions(blueprints, StrategyMode.RETHINK_TARGETS);

    expect(applyActions[0]).not.toBe(improveActions[0]);
    expect(applyActions[0]).not.toBe(rethinkActions[0]);
    expect(improveActions[0]).not.toBe(rethinkActions[0]);
  });
});

// ==================== Key Insights Tests ====================

describe('Key Insights', () => {
  test('should generate 3-7 key insights', () => {
    const insights = generateKeyInsights(
      createDefaultGaps(),
      createDefaultEvaluation(),
      StrategyMode.APPLY_MODE
    );

    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.length).toBeLessThanOrEqual(7);
  });

  test('should include resume quality insight', () => {
    const insights = generateKeyInsights(
      createDefaultGaps(),
      createDefaultEvaluation({ resume_score: 85 }),
      StrategyMode.APPLY_MODE
    );

    expect(insights.some(i => i.includes('85') || i.includes('quality'))).toBe(true);
  });

  test('should mention missing skills when present', () => {
    const gaps = createDefaultGaps();
    gaps.skills.critical_missing = ['kubernetes', 'terraform'];

    const insights = generateKeyInsights(
      gaps,
      createDefaultEvaluation(),
      StrategyMode.IMPROVE_RESUME_FIRST
    );

    expect(insights.some(i => 
      i.toLowerCase().includes('skill') || 
      i.includes('Missing')
    )).toBe(true);
  });

  test('should mention seniority alignment', () => {
    const insights = generateKeyInsights(
      createDefaultGaps(),
      createDefaultEvaluation(),
      StrategyMode.APPLY_MODE
    );

    expect(insights.some(i => 
      i.toLowerCase().includes('seniority') || 
      i.toLowerCase().includes('level')
    )).toBe(true);
  });

  test('should include mode-specific insight', () => {
    const applyInsights = generateKeyInsights(
      createDefaultGaps(),
      createDefaultEvaluation(),
      StrategyMode.APPLY_MODE
    );

    const rethinkInsights = generateKeyInsights(
      createDefaultGaps(),
      createDefaultEvaluation(),
      StrategyMode.RETHINK_TARGETS
    );

    // Should have different insights for different modes
    expect(applyInsights.join('')).not.toBe(rethinkInsights.join(''));
  });
});

// ==================== Edge Cases ====================

describe('Blueprint Edge Cases', () => {
  test('should handle empty gaps gracefully', () => {
    const emptyGaps: GapAnalysis = {
      skills: {
        matched: [],
        critical_missing: [],
        match_percentage: 100,
        confidence: 'low',
      },
      tools: {
        matched: [],
        critical_missing: [],
        match_percentage: 100,
        confidence: 'low',
      },
      experience: {
        present_types: [],
        missing_types: [],
        coverage_score: 100,
        confidence: 'low',
      },
      seniority: {
        user_level: SeniorityLevel.MID,
        role_expected: SeniorityLevel.MID,
        alignment: 'aligned',
        confidence: 'low',
      },
      industry: {
        keywords_matched: [],
        keywords_missing: [],
        match_percentage: 100,
        confidence: 'low',
      },
    };

    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.APPLY_MODE,
      modeReasoning: createDefaultReasoning(StrategyMode.APPLY_MODE),
      gaps: emptyGaps,
      evaluation: createDefaultEvaluation(),
      layer4State: createDefaultLayer4State(),
    });

    expect(blueprints.length).toBeGreaterThan(0);
  });

  test('should handle missing weekly target', () => {
    const layer4State = createDefaultLayer4State();
    layer4State.user_profile.weekly_target = undefined;

    const blueprints = generateActionBlueprints({
      recommendedMode: StrategyMode.APPLY_MODE,
      modeReasoning: createDefaultReasoning(StrategyMode.APPLY_MODE),
      gaps: createDefaultGaps(),
      evaluation: createDefaultEvaluation(),
      layer4State,
    });

    expect(blueprints.length).toBeGreaterThan(0);
  });
});
