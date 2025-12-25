/**
 * Layer 3 - Execution Engine
 * Integration Tests
 *
 * End-to-end tests for the complete rewrite pipeline.
 * Tests evidence validation, retry logic, and no fabrication.
 */

import {
  rewriteBullet,
  rewriteSummary,
  rewriteSection,
  quickRewriteBullet,
  canImprove,
} from '../rewrite';
import { buildEvidenceLedger } from '../evidence';
import { planMicroActions } from '../planning';
import {
  validateRewrite,
  hasFabricationErrors,
} from '../validation/evidence-validator';
import {
  ALL_BULLET_SCENARIOS,
  SCENARIO_METRIC_PRESENT,
  SCENARIO_VAGUE_METRIC,
  SCENARIO_FABRICATION_DETECTION,
  SAMPLE_EVIDENCE,
} from './fixtures/scenarios';
import { BulletRewriteRequest } from '../types';
import { isLLMAvailable } from '../generation';

// Skip integration tests if LLM is not available
const describeIfLLM = isLLMAvailable() ? describe : describe.skip;

describe('Layer 3 Integration Tests (Sync)', () => {
  describe('canImprove', () => {
    test('should identify bullets that can be improved', () => {
      expect(canImprove('Helped with project')).toBe(true);
      expect(canImprove('Worked on various tasks')).toBe(true);
      expect(canImprove('Was responsible for team')).toBe(true);
    });

    test('should recognize strong bullets', () => {
      expect(canImprove('Developed REST API serving 1M+ requests/day, reducing latency by 40%')).toBe(false);
    });
  });

  describe('Evidence + Planning + Validation Pipeline', () => {
    test('should build evidence and plan actions for weak bullet', () => {
      const bullet = 'Helped build payment system';
      
      const ledger = buildEvidenceLedger({
        bullet,
        layer1: {
          extracted: {
            skills: ['Python', 'Node.js'],
            tools: ['PostgreSQL', 'Redis'],
          },
        },
      });

      const plan = planMicroActions({
        original: bullet,
        evidence: ledger,
        issues: ['weak_verb'],
      });

      expect(ledger.items.length).toBeGreaterThan(0);
      expect(plan.transformations.length).toBeGreaterThan(0);
      expect(plan.transformations.some((t) => t.type === 'verb_upgrade')).toBe(true);
    });

    test('should validate rewrite with evidence', () => {
      const original = 'Built API';
      const improved = 'Built REST API using Python';
      
      const ledger = buildEvidenceLedger({
        bullet: original,
        layer1: {
          extracted: {
            skills: ['Python', 'REST'],
            tools: [],
          },
        },
      });

      const evidenceMap = [
        { improved_span: 'REST API', evidence_ids: ['E1', 'E_skills'] },
        { improved_span: 'using Python', evidence_ids: ['E_skills'] },
      ];

      const result = validateRewrite(original, improved, ledger, evidenceMap);
      
      // Should pass because Python and REST are in evidence
      expect(hasFabricationErrors(result)).toBe(false);
    });

    test('should catch fabrication in validation', () => {
      const original = 'Built API';
      const improved = 'Built API serving 1M+ requests/day'; // Fabricated metric
      
      const ledger = buildEvidenceLedger({
        bullet: original,
      });

      const evidenceMap = [
        { improved_span: improved, evidence_ids: ['E1'] },
      ];

      const result = validateRewrite(original, improved, ledger, evidenceMap);
      
      expect(hasFabricationErrors(result)).toBe(true);
    });
  });

  describe('Scenario Validation (Sync)', () => {
    test('SCENARIO: Metric Present - must keep exact metric', () => {
      const scenario = SCENARIO_METRIC_PRESENT;
      const request = scenario.request as BulletRewriteRequest;
      
      const ledger = buildEvidenceLedger({
        bullet: request.bullet,
        layer1: request.layer1,
      });

      // Simulate an improved text that changes the metric (should fail)
      const badImproved = 'Reduced server costs by 50% through optimization'; // Changed 40% to 50%
      const badResult = validateRewrite(
        request.bullet,
        badImproved,
        ledger,
        [{ improved_span: badImproved, evidence_ids: ['E1'] }]
      );

      expect(hasFabricationErrors(badResult)).toBe(true);

      // Simulate an improved text that keeps the metric (should pass)
      const goodImproved = 'Achieved 40% reduction in server costs through optimization';
      const goodResult = validateRewrite(
        request.bullet,
        goodImproved,
        ledger,
        [{ improved_span: '40%', evidence_ids: ['E1'] }, { improved_span: goodImproved, evidence_ids: ['E1'] }]
      );

      // Should pass because 40% was kept
      const numberErrors = goodResult.items.filter((i) => i.code === 'NEW_NUMBER_ADDED');
      expect(numberErrors.length).toBe(0);
    });

    test('SCENARIO: Vague Metric - cannot add numbers', () => {
      const scenario = SCENARIO_VAGUE_METRIC;
      const request = scenario.request as BulletRewriteRequest;
      
      const ledger = buildEvidenceLedger({
        bullet: request.bullet,
        layer1: request.layer1,
      });

      // Simulate adding a fabricated metric (should fail)
      const badImproved = 'Improved performance by 50%';
      const result = validateRewrite(
        request.bullet,
        badImproved,
        ledger,
        [{ improved_span: badImproved, evidence_ids: ['E1'] }]
      );

      expect(hasFabricationErrors(result)).toBe(true);
    });

    test('SCENARIO: Fabrication Detection - should block fabricated content', () => {
      const scenario = SCENARIO_FABRICATION_DETECTION;
      const request = scenario.request as BulletRewriteRequest;
      
      const ledger = buildEvidenceLedger({
        bullet: request.bullet,
        layer1: request.layer1,
      });

      // Try various fabricated improvements
      const fabricatedTests = [
        'Led team of 20 engineers across 3 offices',
        'Led project delivering $1M in value',
        'Led cross-functional project improving efficiency by 50%',
      ];

      for (const fabricated of fabricatedTests) {
        const result = validateRewrite(
          request.bullet,
          fabricated,
          ledger,
          [{ improved_span: fabricated, evidence_ids: ['E1'] }]
        );

        expect(hasFabricationErrors(result)).toBe(true);
      }
    });
  });
});

// These tests require OpenAI API key
describeIfLLM('Layer 3 Integration Tests (LLM)', () => {
  jest.setTimeout(30000); // LLM calls can take time

  describe('rewriteBullet', () => {
    test('should rewrite weak bullet with validation', async () => {
      const result = await rewriteBullet({
        type: 'bullet',
        bullet: 'Helped with backend development',
        target_role: 'Backend Engineer',
        issues: ['weak_verb'],
        layer1: {
          extracted: {
            skills: ['Python', 'Node.js'],
            tools: ['PostgreSQL', 'Redis'],
          },
        },
      });

      expect(result.type).toBe('bullet');
      expect(result.original).toBe('Helped with backend development');
      expect(result.improved).toBeDefined();
      expect(result.validation.passed).toBe(true);
      expect(result.evidence_map).toBeDefined();
    });

    test('should not add fabricated numbers', async () => {
      const result = await rewriteBullet({
        type: 'bullet',
        bullet: 'Improved performance',
        issues: ['no_metric', 'too_vague'],
      });

      // Check that no percentage was added
      expect(result.improved).not.toMatch(/\d+%/);
      expect(result.validation.passed).toBe(true);
    });

    test('should keep existing metrics', async () => {
      const result = await rewriteBullet({
        type: 'bullet',
        bullet: 'Reduced costs by 40%',
        issues: ['weak_verb'],
      });

      // The 40% should be preserved
      expect(result.improved).toContain('40%');
      expect(result.validation.passed).toBe(true);
    });
  });

  describe('quickRewriteBullet', () => {
    test('should provide simple interface for rewriting', async () => {
      const improved = await quickRewriteBullet(
        'Helped with API development',
        {
          targetRole: 'Software Engineer',
          skills: ['REST', 'Python'],
        }
      );

      expect(typeof improved).toBe('string');
      expect(improved.length).toBeGreaterThan(0);
    });
  });
});

// Tests that always run but verify fallback behavior
describe('Fallback Behavior', () => {
  test('should handle missing LLM gracefully', async () => {
    // When OPENAI_API_KEY is not set, should fall back to sync mode
    const originalEnv = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const result = await rewriteBullet({
        type: 'bullet',
        bullet: 'Helped with project',
        issues: ['weak_verb'],
      });

      // Should return something (either improved or original)
      expect(result.type).toBe('bullet');
      expect(result.original).toBe('Helped with project');
      expect(result.validation.passed).toBe(true);
    } finally {
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      }
    }
  });
});
