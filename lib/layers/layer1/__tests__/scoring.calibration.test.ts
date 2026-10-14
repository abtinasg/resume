/**
 * Layer 1 - Evaluation Engine
 * Generic scoring calibration expectations (non-blocking in CI).
 *
 * Moved out of the blocking suite in Stage 0: these thresholds were written
 * without labeled ground truth and have never passed on any commit. They run
 * in the `test:calibration` job until D-014 (scoring calibration) supplies
 * human-rated reference resumes. Some also encode contradictory expectations,
 * e.g. a LEAD candidate for a SENIOR role expected to be 'aligned'.
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

describe('Generic scoring calibration', () => {
  test('should score low for poorly formatted resume', () => {
    const { parsed_resume, resume_text } = POOR_MINIMAL;
    const score = calculateSignalQualityScore(parsed_resume, resume_text);

    expect(score.score).toBeLessThan(50);
  });

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
});

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
