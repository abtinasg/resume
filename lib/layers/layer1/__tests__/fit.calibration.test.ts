/**
 * Layer 1 - Evaluation Engine
 * Fit evaluation calibration expectations (non-blocking in CI).
 *
 * Moved out of the blocking suite in Stage 0: these thresholds were written
 * without labeled ground truth and have never passed on any commit. They run
 * in the `test:calibration` job until D-014 (scoring calibration) supplies
 * human-rated reference resumes. Some also encode contradictory expectations,
 * e.g. a LEAD candidate for a SENIOR role expected to be 'aligned'.
 */

import { describe, test, expect } from '@jest/globals';
import {
  EXCEPTIONAL_SENIOR_SWE,
  STRONG_MID_LEVEL_PM,
  GOOD_ENTRY_LEVEL_DEV,
  FAIR_WEAK_CONTENT,
  JOB_SENIOR_SWE,
  JOB_PRODUCT_MANAGER,
  JOB_ENTRY_DEVELOPER,
} from './fixtures/resumes';
import { SeniorityLevel } from '../../shared/types';
import { evaluateFit } from '../scoring/fit';
import {
  detectSkillsGap,
  detectToolsGap,
  detectSeniorityGap,
  detectExperienceGap,
  detectIndustryGap,
  detectGaps,
  summarizeGaps,
} from '../modules/gap-detection';
import { extractEntities } from '../modules/entity-extraction';
import {
  getRecommendation,
  suggestAlternatives,
  estimatePotentialImprovement,
} from '../modules/recommendation';

describe('Fit evaluation calibration', () => {
  test('should detect aligned seniority', () => {
    const gap = detectSeniorityGap(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      SeniorityLevel.SENIOR,
      5
    );

    expect(gap.alignment).toBe('aligned');
    expect(gap.user_level).toBe(SeniorityLevel.LEAD);
  });

  test('should recommend APPLY for strong fit', () => {
    const extracted = extractEntities(EXCEPTIONAL_SENIOR_SWE.parsed_resume);
    const gaps = detectGaps(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      extracted,
      JOB_SENIOR_SWE
    );
    
    const { recommendation, reasoning } = getRecommendation(
      85, // High fit score
      90, // High resume score
      gaps,
      { underqualified: false, overqualified: false, career_switch: false, low_signal: false, stretch_role: false }
    );

    expect(recommendation).toBe('APPLY');
    expect(reasoning.length).toBeGreaterThan(20);
  });

  test('should evaluate senior engineer fit correctly', () => {
    const result = evaluateFit(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      EXCEPTIONAL_SENIOR_SWE.resume_text,
      JOB_SENIOR_SWE
    );

    expect(result.fit_score).toBeGreaterThan(60);
    expect(result.fit_dimensions).toBeDefined();
    expect(result.gaps).toBeDefined();
    expect(result.recommendation).toBe('APPLY');
  });

  test('should evaluate product manager fit correctly', () => {
    const result = evaluateFit(
      STRONG_MID_LEVEL_PM.parsed_resume,
      STRONG_MID_LEVEL_PM.resume_text,
      JOB_PRODUCT_MANAGER
    );

    expect(result.fit_score).toBeGreaterThan(50);
    expect(['APPLY', 'OPTIMIZE_FIRST']).toContain(result.recommendation);
  });
});
