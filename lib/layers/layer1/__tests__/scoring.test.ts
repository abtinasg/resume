/**
 * Layer 1 - Evaluation Engine
 * Scoring Tests
 *
 * Tests for dimension scoring modules and overall evaluation.
 */

import { describe, test, expect } from '@jest/globals';
import {
  GOLDEN_RESUMES,
  EXCEPTIONAL_SENIOR_SWE,
  STRONG_MID_LEVEL_PM,
  GOOD_ENTRY_LEVEL_DEV,
  FAIR_WEAK_CONTENT,
  POOR_MINIMAL,
} from './fixtures/resumes';
import { calculateSkillCapitalScore } from '../scoring/skill-capital';
import { calculateExecutionImpactScore } from '../scoring/execution-impact';
import { calculateLearningAdaptivityScore } from '../scoring/learning-adaptivity';
import { calculateSignalQualityScore } from '../scoring/signal-quality';
import { evaluateGeneric } from '../scoring/generic';
import { extractEntities } from '../modules/entity-extraction';
import { getLevel } from '../config/weights';

// ==================== Skill Capital Tests ====================

describe('Skill Capital Scoring', () => {
  test('should score high for resume with many skills', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const extracted = extractEntities(parsed_resume);
    const score = calculateSkillCapitalScore(parsed_resume, extracted);

    expect(score.score).toBeGreaterThanOrEqual(70);
    expect(score.breakdown?.skill_presence).toBeGreaterThan(20);
    expect(score.breakdown?.skill_diversity).toBeGreaterThan(20);
  });

  test('should score low for resume with few skills', () => {
    const { parsed_resume } = POOR_MINIMAL;
    const extracted = extractEntities(parsed_resume);
    const score = calculateSkillCapitalScore(parsed_resume, extracted);

    expect(score.score).toBeLessThan(40);
    expect(score.issues).toBeDefined();
    expect(score.issues?.length).toBeGreaterThan(0);
  });

  test('should give bonus for certifications', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const extracted = extractEntities(parsed_resume);
    const score = calculateSkillCapitalScore(parsed_resume, extracted);

    expect(score.breakdown?.skill_depth).toBeGreaterThan(15);
  });
});

// ==================== Execution Impact Tests ====================

describe('Execution Impact Scoring', () => {
  test('should score high for resume with metrics', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const { score } = calculateExecutionImpactScore(parsed_resume);

    expect(score.score).toBeGreaterThanOrEqual(70);
    expect(score.breakdown?.metrics_ratio).toBeGreaterThan(25);
  });

  test('should score low for resume without metrics', () => {
    const { parsed_resume } = FAIR_WEAK_CONTENT;
    const { score, weakBullets } = calculateExecutionImpactScore(parsed_resume);

    expect(score.score).toBeLessThan(50);
    expect(weakBullets.length).toBeGreaterThan(0);
    expect(score.issues).toContain('no_metrics');
  });

  test('should detect weak action verbs', () => {
    const { parsed_resume } = FAIR_WEAK_CONTENT;
    const { score, weakBullets } = calculateExecutionImpactScore(parsed_resume);

    expect(score.issues).toContain('weak_verbs');
    const verbIssues = weakBullets.filter(b => b.issues.includes('weak_verb'));
    expect(verbIssues.length).toBeGreaterThan(0);
  });

  test('should detect strong action verbs', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const { score } = calculateExecutionImpactScore(parsed_resume);

    expect(score.breakdown?.action_ratio).toBeGreaterThan(25);
  });

  test('should handle resume with no experience', () => {
    const emptyResume = { ...POOR_MINIMAL.parsed_resume, experiences: [] };
    const { score } = calculateExecutionImpactScore(emptyResume);

    expect(score.score).toBe(0);
    expect(score.issues).toContain('no_experience_bullets');
  });
});

// ==================== Learning Adaptivity Tests ====================

describe('Learning Adaptivity Scoring', () => {
  test('should score high for resume with certifications and progression', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const extracted = extractEntities(parsed_resume);
    const score = calculateLearningAdaptivityScore(parsed_resume, extracted);

    expect(score.score).toBeGreaterThanOrEqual(60);
  });

  test('should score low for resume without learning signals', () => {
    const { parsed_resume } = FAIR_WEAK_CONTENT;
    const extracted = extractEntities(parsed_resume);
    const score = calculateLearningAdaptivityScore(parsed_resume, extracted);

    expect(score.score).toBeLessThan(50);
    expect(score.issues).toContain('no_learning_signals');
  });

  test('should detect modern skills', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const extracted = extractEntities(parsed_resume);
    const score = calculateLearningAdaptivityScore(parsed_resume, extracted);

    expect(score.breakdown?.skill_recency).toBeGreaterThan(15);
  });
});

// ==================== Signal Quality Tests ====================

describe('Signal Quality Scoring', () => {
  test('should score high for well-formatted resume', () => {
    const { parsed_resume, resume_text } = EXCEPTIONAL_SENIOR_SWE;
    const score = calculateSignalQualityScore(parsed_resume, resume_text);

    expect(score.score).toBeGreaterThanOrEqual(70);
  });

  test('should score low for poorly formatted resume', () => {
    const { parsed_resume, resume_text } = POOR_MINIMAL;
    const score = calculateSignalQualityScore(parsed_resume, resume_text);

    expect(score.score).toBeLessThan(50);
  });

  test('should detect missing sections', () => {
    const { parsed_resume, resume_text } = POOR_MINIMAL;
    const score = calculateSignalQualityScore(parsed_resume, resume_text);

    expect(score.issues).toBeDefined();
    expect(score.issues?.some(i => i.includes('section') || i.includes('short'))).toBe(true);
  });
});

// ==================== Generic Evaluation Tests ====================

describe('Generic Evaluation', () => {
  test('should produce expected score range for exceptional resume', () => {
    const { parsed_resume, resume_text, expected_score_range } = EXCEPTIONAL_SENIOR_SWE;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    expect(result.resume_score).toBeGreaterThanOrEqual(expected_score_range.min);
    expect(result.resume_score).toBeLessThanOrEqual(expected_score_range.max);
    expect(result.level).toBe('Exceptional');
  });

  test('should produce expected score range for strong resume', () => {
    const { parsed_resume, resume_text, expected_score_range } = STRONG_MID_LEVEL_PM;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    expect(result.resume_score).toBeGreaterThanOrEqual(expected_score_range.min);
    expect(result.resume_score).toBeLessThanOrEqual(expected_score_range.max);
    expect(['Strong', 'Solid']).toContain(result.level);
  });

  test('should produce expected score range for good resume', () => {
    const { parsed_resume, resume_text, expected_score_range } = GOOD_ENTRY_LEVEL_DEV;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    expect(result.resume_score).toBeGreaterThanOrEqual(expected_score_range.min);
    expect(result.resume_score).toBeLessThanOrEqual(expected_score_range.max);
  });

  test('should produce expected score range for fair resume', () => {
    const { parsed_resume, resume_text, expected_score_range } = FAIR_WEAK_CONTENT;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    expect(result.resume_score).toBeGreaterThanOrEqual(expected_score_range.min);
    expect(result.resume_score).toBeLessThanOrEqual(expected_score_range.max);
  });

  test('should produce expected score range for poor resume', () => {
    const { parsed_resume, resume_text, expected_score_range } = POOR_MINIMAL;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    expect(result.resume_score).toBeGreaterThanOrEqual(expected_score_range.min);
    expect(result.resume_score).toBeLessThanOrEqual(expected_score_range.max);
  });

  test('should include all dimension scores', () => {
    const { parsed_resume, resume_text } = EXCEPTIONAL_SENIOR_SWE;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    expect(result.dimensions.skill_capital).toBeDefined();
    expect(result.dimensions.execution_impact).toBeDefined();
    expect(result.dimensions.learning_adaptivity).toBeDefined();
    expect(result.dimensions.signal_quality).toBeDefined();
  });

  test('should include feedback', () => {
    const { parsed_resume, resume_text } = STRONG_MID_LEVEL_PM;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    expect(result.feedback).toBeDefined();
    expect(result.feedback.strengths.length).toBeGreaterThan(0);
    expect(result.feedback.recommendations.length).toBeGreaterThan(0);
  });

  test('should include summary', () => {
    const { parsed_resume, resume_text } = EXCEPTIONAL_SENIOR_SWE;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    expect(result.summary).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(50);
  });

  test('should extract entities correctly', () => {
    const { parsed_resume, resume_text } = EXCEPTIONAL_SENIOR_SWE;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    expect(result.extracted.skills.length).toBeGreaterThan(10);
    expect(result.extracted.tools.length).toBeGreaterThan(5);
    expect(result.extracted.titles.length).toBeGreaterThan(0);
    expect(result.extracted.companies.length).toBeGreaterThan(0);
  });

  test('should identify weaknesses correctly', () => {
    const { parsed_resume, resume_text, expected_weaknesses } = FAIR_WEAK_CONTENT;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    for (const expectedWeakness of expected_weaknesses || []) {
      expect(result.weaknesses).toContain(expectedWeakness);
    }
  });
});

// ==================== Score Level Tests ====================

describe('Score Level Mapping', () => {
  test('should return correct levels', () => {
    expect(getLevel(95)).toBe('Exceptional');
    expect(getLevel(85)).toBe('Strong');
    expect(getLevel(65)).toBe('Solid');
    expect(getLevel(45)).toBe('Growing');
    expect(getLevel(25)).toBe('Early');
  });

  test('should handle boundary values', () => {
    expect(getLevel(90)).toBe('Exceptional');
    expect(getLevel(89)).toBe('Strong');
    expect(getLevel(75)).toBe('Strong');
    expect(getLevel(74)).toBe('Solid');
    expect(getLevel(55)).toBe('Solid');
    expect(getLevel(54)).toBe('Growing');
    expect(getLevel(35)).toBe('Growing');
    expect(getLevel(34)).toBe('Early');
  });
});

// ==================== Constraint Tests ====================

describe('Score Constraints', () => {
  test('should cap score for very poor resume', () => {
    const { parsed_resume, resume_text } = POOR_MINIMAL;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    // Poor resumes should be capped
    expect(result.resume_score).toBeLessThanOrEqual(50);
  });

  test('should not cap high-quality resume', () => {
    const { parsed_resume, resume_text } = EXCEPTIONAL_SENIOR_SWE;
    const { result } = evaluateGeneric(parsed_resume, resume_text);

    // Exceptional resumes should not be capped
    expect(result.resume_score).toBeGreaterThanOrEqual(80);
  });
});

// ==================== Golden Tests for All Fixtures ====================

describe('Golden Tests', () => {
  test.each(GOLDEN_RESUMES)(
    'should score $name within expected range',
    (fixture) => {
      const { result } = evaluateGeneric(fixture.parsed_resume, fixture.resume_text);

      expect(result.resume_score).toBeGreaterThanOrEqual(fixture.expected_score_range.min);
      expect(result.resume_score).toBeLessThanOrEqual(fixture.expected_score_range.max);
    }
  );
});
