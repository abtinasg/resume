/**
 * Layer 2 - Strategy Engine
 * Integration Tests
 *
 * End-to-end tests for the complete strategy analysis pipeline.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  analyzeStrategy,
  analyzeStrategySync,
  analyzeQuick,
  analyzeGapsOnly,
} from '../analyze';
import {
  ALL_SCENARIOS,
  MINIMAL_REQUEST,
  EDGE_CASE_NO_SKILLS,
  EDGE_CASE_PERFECT_MATCH,
} from './fixtures/scenarios';
import { StrategyMode } from '../types';
import {
  StrategyAnalysisError,
  StrategyErrorCode,
  isStrategyAnalysisError,
} from '../errors';
import { clearConfigCache } from '../config';
import { clearCanonicalizationCache, clearTaxonomyCache } from '../normalization';

// ==================== Setup ====================

beforeEach(() => {
  clearConfigCache();
  clearCanonicalizationCache();
  clearTaxonomyCache();
});

// ==================== Full Pipeline Tests ====================

describe('Full Strategy Analysis Pipeline', () => {
  test('should complete analysis for minimal input', async () => {
    const result = await analyzeStrategy(MINIMAL_REQUEST);

    // Check all required fields
    expect(result.analysis_version).toBe('2.1');
    expect(result.generated_at).toBeDefined();
    expect(result.inputs_used).toBeDefined();
    expect(result.overall_fit_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_fit_score).toBeLessThanOrEqual(100);
    expect(result.confidence_level).toBeDefined();
    expect(result.fit_score_breakdown).toBeDefined();
    expect(result.gaps).toBeDefined();
    expect(result.recommended_mode).toBeDefined();
    expect(result.mode_reasoning).toBeDefined();
    expect(result.priority_actions).toBeDefined();
    expect(result.action_blueprints).toBeDefined();
    expect(result.key_insights).toBeDefined();
  });

  test('should complete analysis for edge case: no skills', async () => {
    const result = await analyzeStrategy(EDGE_CASE_NO_SKILLS);

    // Without job requirements, the fit score depends on default calculations
    // The score may be high because there's nothing to compare against
    expect(result.overall_fit_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_fit_score).toBeLessThanOrEqual(100);
    expect(result.recommended_mode).toBe(StrategyMode.IMPROVE_RESUME_FIRST);
  });

  test('should complete analysis for edge case: perfect match', async () => {
    const result = await analyzeStrategy(EDGE_CASE_PERFECT_MATCH);

    expect(result.overall_fit_score).toBeGreaterThan(70);
    expect(result.recommended_mode).toBe(StrategyMode.APPLY_MODE);
  });

  test.each(ALL_SCENARIOS)('should pass scenario: $name', async (scenario) => {
    const result = await analyzeStrategy(scenario.request);

    // Check expected mode
    expect(result.recommended_mode).toBe(scenario.expected.mode);

    // Check fit score range
    expect(result.overall_fit_score).toBeGreaterThanOrEqual(scenario.expected.fit_score_range.min);
    expect(result.overall_fit_score).toBeLessThanOrEqual(scenario.expected.fit_score_range.max);

    // Check blueprints generated
    expect(result.action_blueprints.length > 0).toBe(scenario.expected.has_blueprints);

    // Check reasoning if specified
    if (scenario.expected.reasoning_contains) {
      expect(result.mode_reasoning.primary_reason).toContain(scenario.expected.reasoning_contains);
    }
  });
});

// ==================== Synchronous Analysis Tests ====================

describe('Synchronous Analysis', () => {
  test('should produce same result as async', async () => {
    const asyncResult = await analyzeStrategy(MINIMAL_REQUEST);
    const syncResult = analyzeStrategySync(MINIMAL_REQUEST);

    // Core results should match (timestamps will differ)
    expect(syncResult.overall_fit_score).toBe(asyncResult.overall_fit_score);
    expect(syncResult.recommended_mode).toBe(asyncResult.recommended_mode);
    expect(syncResult.gaps.skills.match_percentage).toBe(asyncResult.gaps.skills.match_percentage);
  });

  test('should complete in sync context', () => {
    const result = analyzeStrategySync(MINIMAL_REQUEST);
    expect(result).toBeDefined();
    expect(result.overall_fit_score).toBeGreaterThanOrEqual(0);
  });
});

// ==================== Quick Analysis Tests ====================

describe('Quick Analysis', () => {
  test('should return gaps and fit score without mode/blueprints', () => {
    const result = analyzeQuick(MINIMAL_REQUEST);

    expect(result.gaps).toBeDefined();
    expect(result.fit_score).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeDefined();

    // Should NOT have these
    expect(result).not.toHaveProperty('recommended_mode');
    expect(result).not.toHaveProperty('action_blueprints');
  });

  test('should be faster than full analysis', async () => {
    // Run quick analysis
    const quickStart = Date.now();
    analyzeQuick(MINIMAL_REQUEST);
    const quickTime = Date.now() - quickStart;

    // Run full analysis
    const fullStart = Date.now();
    await analyzeStrategy(MINIMAL_REQUEST);
    const fullTime = Date.now() - fullStart;

    // Quick should generally be faster (or at least not much slower)
    expect(quickTime).toBeLessThanOrEqual(fullTime + 50);
  });
});

// ==================== Gaps Only Analysis Tests ====================

describe('Gaps Only Analysis', () => {
  test('should return only gap analysis', () => {
    const gaps = analyzeGapsOnly(MINIMAL_REQUEST);

    expect(gaps.skills).toBeDefined();
    expect(gaps.tools).toBeDefined();
    expect(gaps.experience).toBeDefined();
    expect(gaps.seniority).toBeDefined();
    expect(gaps.industry).toBeDefined();
  });
});

// ==================== Input Validation Tests ====================

describe('Input Validation', () => {
  test('should reject invalid request', async () => {
    const invalidRequest = {
      // Missing required fields
      layer1_evaluation: {
        resume_score: 'not a number', // Should be number
      },
      layer4_state: {},
    };

    await expect(analyzeStrategy(invalidRequest as any)).rejects.toThrow(StrategyAnalysisError);
  });

  test('should reject negative resume score', async () => {
    const invalidRequest = {
      ...MINIMAL_REQUEST,
      layer1_evaluation: {
        ...MINIMAL_REQUEST.layer1_evaluation,
        resume_score: -10,
      },
    };

    await expect(analyzeStrategy(invalidRequest)).rejects.toThrow();
  });

  test('should reject resume score over 100', async () => {
    const invalidRequest = {
      ...MINIMAL_REQUEST,
      layer1_evaluation: {
        ...MINIMAL_REQUEST.layer1_evaluation,
        resume_score: 150,
      },
    };

    await expect(analyzeStrategy(invalidRequest)).rejects.toThrow();
  });

  test('should reject negative interview rate', async () => {
    const invalidRequest = {
      ...MINIMAL_REQUEST,
      layer4_state: {
        ...MINIMAL_REQUEST.layer4_state,
        pipeline_state: {
          ...MINIMAL_REQUEST.layer4_state.pipeline_state,
          interview_rate: -0.5,
        },
      },
    };

    await expect(analyzeStrategy(invalidRequest)).rejects.toThrow();
  });

  test('should reject interview rate over 1', async () => {
    const invalidRequest = {
      ...MINIMAL_REQUEST,
      layer4_state: {
        ...MINIMAL_REQUEST.layer4_state,
        pipeline_state: {
          ...MINIMAL_REQUEST.layer4_state.pipeline_state,
          interview_rate: 1.5,
        },
      },
    };

    await expect(analyzeStrategy(invalidRequest)).rejects.toThrow();
  });
});

// ==================== Error Handling Tests ====================

describe('Error Handling', () => {
  test('should throw StrategyAnalysisError for validation errors', async () => {
    try {
      await analyzeStrategy({} as any);
      fail('Should have thrown');
    } catch (error) {
      expect(isStrategyAnalysisError(error)).toBe(true);
      if (isStrategyAnalysisError(error)) {
        expect(error.code).toBe(StrategyErrorCode.VALIDATION_ERROR);
      }
    }
  });

  test('should provide user-friendly error info', async () => {
    try {
      await analyzeStrategy({
        layer1_evaluation: {},
        layer4_state: {},
      } as any);
      fail('Should have thrown');
    } catch (error) {
      if (isStrategyAnalysisError(error)) {
        const friendly = error.getUserFriendly();
        expect(friendly.title).toBeDefined();
        expect(friendly.message).toBeDefined();
        expect(friendly.suggestion).toBeDefined();
      }
    }
  });
});

// ==================== Result Structure Tests ====================

describe('Result Structure', () => {
  test('should have valid fit score breakdown', async () => {
    const result = await analyzeStrategy(MINIMAL_REQUEST);

    expect(result.fit_score_breakdown.skills_score).toBeGreaterThanOrEqual(0);
    expect(result.fit_score_breakdown.skills_score).toBeLessThanOrEqual(100);
    expect(result.fit_score_breakdown.tools_score).toBeGreaterThanOrEqual(0);
    expect(result.fit_score_breakdown.tools_score).toBeLessThanOrEqual(100);
    expect(result.fit_score_breakdown.experience_score).toBeGreaterThanOrEqual(0);
    expect(result.fit_score_breakdown.experience_score).toBeLessThanOrEqual(100);
    expect(result.fit_score_breakdown.industry_score).toBeGreaterThanOrEqual(0);
    expect(result.fit_score_breakdown.industry_score).toBeLessThanOrEqual(100);
    expect(result.fit_score_breakdown.seniority_score).toBeGreaterThanOrEqual(0);
    expect(result.fit_score_breakdown.seniority_score).toBeLessThanOrEqual(100);
    expect(result.fit_score_breakdown.penalties).toBeGreaterThanOrEqual(0);
  });

  test('should have valid gaps structure', async () => {
    const result = await analyzeStrategy(MINIMAL_REQUEST);

    // Skills gap
    expect(result.gaps.skills.matched).toBeDefined();
    expect(result.gaps.skills.critical_missing).toBeDefined();
    expect(result.gaps.skills.match_percentage).toBeGreaterThanOrEqual(0);
    expect(result.gaps.skills.match_percentage).toBeLessThanOrEqual(100);

    // Tools gap
    expect(result.gaps.tools.matched).toBeDefined();
    expect(result.gaps.tools.critical_missing).toBeDefined();
    expect(result.gaps.tools.match_percentage).toBeGreaterThanOrEqual(0);

    // Experience gap
    expect(result.gaps.experience.present_types).toBeDefined();
    expect(result.gaps.experience.missing_types).toBeDefined();
    expect(result.gaps.experience.coverage_score).toBeGreaterThanOrEqual(0);

    // Seniority gap
    expect(result.gaps.seniority.user_level).toBeDefined();
    expect(result.gaps.seniority.role_expected).toBeDefined();
    expect(result.gaps.seniority.alignment).toBeDefined();

    // Industry gap
    expect(result.gaps.industry.keywords_matched).toBeDefined();
    expect(result.gaps.industry.keywords_missing).toBeDefined();
    expect(result.gaps.industry.match_percentage).toBeGreaterThanOrEqual(0);
  });

  test('should have valid mode reasoning', async () => {
    const result = await analyzeStrategy(MINIMAL_REQUEST);

    expect(result.mode_reasoning.primary_reason).toBeDefined();
    expect(result.mode_reasoning.supporting_factors).toBeDefined();
    expect(Array.isArray(result.mode_reasoning.supporting_factors)).toBe(true);
    expect(result.mode_reasoning.confidence).toBeDefined();
  });

  test('should have valid action blueprints', async () => {
    const result = await analyzeStrategy(MINIMAL_REQUEST);

    expect(result.action_blueprints.length).toBeGreaterThanOrEqual(3);
    expect(result.action_blueprints.length).toBeLessThanOrEqual(7);

    for (const blueprint of result.action_blueprints) {
      expect(blueprint.type).toBeDefined();
      expect(blueprint.objective).toBeDefined();
      expect(blueprint.why).toBeDefined();
      expect(blueprint.confidence).toBeDefined();
      expect(blueprint.priority).toBeGreaterThanOrEqual(1);
      expect(blueprint.priority).toBeLessThanOrEqual(10);
    }
  });

  test('should have valid priority actions and insights', async () => {
    const result = await analyzeStrategy(MINIMAL_REQUEST);

    expect(result.priority_actions.length).toBeGreaterThanOrEqual(3);
    expect(result.priority_actions.length).toBeLessThanOrEqual(5);

    expect(result.key_insights.length).toBeGreaterThanOrEqual(3);
    expect(result.key_insights.length).toBeLessThanOrEqual(7);
  });

  test('should track inputs used', async () => {
    // Without job context
    const withoutJob = await analyzeStrategy(MINIMAL_REQUEST);
    expect(withoutJob.inputs_used.used_jd).toBe(false);
    expect(withoutJob.inputs_used.used_job_requirements).toBe(false);

    // With job context
    const withJob = await analyzeStrategy({
      ...MINIMAL_REQUEST,
      job_context: {
        job_description: 'Some job description',
        job_requirements: {
          required_skills: ['typescript'],
          required_tools: ['docker'],
        },
      },
    });
    expect(withJob.inputs_used.used_jd).toBe(true);
    expect(withJob.inputs_used.used_job_requirements).toBe(true);
  });
});

// ==================== Performance Tests ====================

describe('Performance', () => {
  test('should complete analysis in under 500ms', async () => {
    const start = Date.now();
    await analyzeStrategy(MINIMAL_REQUEST);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });

  test('should complete complex analysis in under 1000ms', async () => {
    const complexRequest = {
      ...EDGE_CASE_PERFECT_MATCH,
      job_context: {
        job_description: `
          We are looking for a Senior Software Engineer with 5+ years of experience.
          Required: TypeScript, React, Node.js, AWS, Kubernetes
          Preferred: Python, Go, Terraform
          You will lead a team of engineers and drive technical decisions.
        `,
        job_requirements: {
          required_skills: ['typescript', 'react', 'node.js', 'aws', 'kubernetes', 'system design'],
          preferred_skills: ['python', 'go', 'terraform', 'graphql'],
          required_tools: ['docker', 'github', 'jenkins', 'jira'],
          preferred_tools: ['datadog', 'terraform'],
        },
      },
    };

    const start = Date.now();
    await analyzeStrategy(complexRequest);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });
});

// ==================== Consistency Tests ====================

describe('Consistency', () => {
  test('should produce consistent results for same input', async () => {
    const result1 = await analyzeStrategy(MINIMAL_REQUEST);
    const result2 = await analyzeStrategy(MINIMAL_REQUEST);

    // Core results should be identical
    expect(result1.overall_fit_score).toBe(result2.overall_fit_score);
    expect(result1.recommended_mode).toBe(result2.recommended_mode);
    expect(result1.gaps.skills.match_percentage).toBe(result2.gaps.skills.match_percentage);
    expect(result1.action_blueprints.length).toBe(result2.action_blueprints.length);
  });
});
