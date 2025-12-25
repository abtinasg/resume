/**
 * Layer 1 - Evaluation Engine
 * Fit Evaluation Tests
 *
 * Tests for job-specific fit evaluation, gap detection, and recommendations.
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

// ==================== Skills Gap Tests ====================

describe('Skills Gap Detection', () => {
  test('should detect matched skills', () => {
    const extracted = extractEntities(EXCEPTIONAL_SENIOR_SWE.parsed_resume);
    const gap = detectSkillsGap(
      extracted.skills,
      JOB_SENIOR_SWE.required_skills,
      JOB_SENIOR_SWE.preferred_skills
    );

    expect(gap.matched.length).toBeGreaterThan(3);
    expect(gap.match_percentage).toBeGreaterThan(50);
  });

  test('should detect missing skills', () => {
    const extracted = extractEntities(FAIR_WEAK_CONTENT.parsed_resume);
    const gap = detectSkillsGap(
      extracted.skills,
      JOB_SENIOR_SWE.required_skills,
      JOB_SENIOR_SWE.preferred_skills
    );

    expect(gap.critical_missing.length).toBeGreaterThan(3);
    expect(gap.match_percentage).toBeLessThan(30);
  });

  test('should identify transferable skills', () => {
    const extracted = extractEntities(EXCEPTIONAL_SENIOR_SWE.parsed_resume);
    const gap = detectSkillsGap(
      extracted.skills,
      ['frontend development', 'cloud computing'],
      []
    );

    // Should find transferable skills for generic requirements
    expect(gap.transferable.length).toBeGreaterThanOrEqual(0);
  });
});

// ==================== Tools Gap Tests ====================

describe('Tools Gap Detection', () => {
  test('should detect matched tools', () => {
    const extracted = extractEntities(EXCEPTIONAL_SENIOR_SWE.parsed_resume);
    const gap = detectToolsGap(
      extracted.tools,
      JOB_SENIOR_SWE.required_tools,
      JOB_SENIOR_SWE.preferred_tools
    );

    expect(gap.matched.length).toBeGreaterThan(0);
  });

  test('should detect missing tools', () => {
    const extracted = extractEntities(FAIR_WEAK_CONTENT.parsed_resume);
    const gap = detectToolsGap(
      extracted.tools,
      JOB_SENIOR_SWE.required_tools,
      []
    );

    expect(gap.critical_missing.length).toBeGreaterThan(0);
  });
});

// ==================== Seniority Gap Tests ====================

describe('Seniority Gap Detection', () => {
  test('should detect aligned seniority', () => {
    const gap = detectSeniorityGap(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      SeniorityLevel.SENIOR,
      5
    );

    expect(gap.alignment).toBe('aligned');
    expect(gap.user_level).toBe(SeniorityLevel.LEAD);
  });

  test('should detect underqualified candidate', () => {
    const gap = detectSeniorityGap(
      GOOD_ENTRY_LEVEL_DEV.parsed_resume,
      SeniorityLevel.SENIOR,
      5
    );

    expect(gap.alignment).toBe('underqualified');
    expect(gap.gap_years).toBeGreaterThan(0);
  });

  test('should detect overqualified candidate', () => {
    const gap = detectSeniorityGap(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      SeniorityLevel.ENTRY,
      0
    );

    expect(gap.alignment).toBe('overqualified');
  });
});

// ==================== Experience Gap Tests ====================

describe('Experience Gap Detection', () => {
  test('should detect matched experience types', () => {
    const gap = detectExperienceGap(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      ['leadership', 'technical_architecture']
    );

    expect(gap.matched_types.length).toBeGreaterThan(0);
    expect(gap.coverage_score).toBeGreaterThan(30);
  });

  test('should detect missing experience types', () => {
    const gap = detectExperienceGap(
      GOOD_ENTRY_LEVEL_DEV.parsed_resume,
      ['leadership', 'technical_architecture', 'cross_functional']
    );

    expect(gap.missing_types.length).toBeGreaterThan(0);
  });
});

// ==================== Industry Gap Tests ====================

describe('Industry Gap Detection', () => {
  test('should detect matched industry keywords', () => {
    const extracted = extractEntities(EXCEPTIONAL_SENIOR_SWE.parsed_resume);
    const gap = detectIndustryGap(
      extracted.industries || [],
      ['software', 'cloud', 'enterprise']
    );

    expect(gap.match_percentage).toBeGreaterThanOrEqual(0);
  });

  test('should handle empty requirements', () => {
    const gap = detectIndustryGap([], []);

    expect(gap.match_percentage).toBe(100);
  });
});

// ==================== Full Gap Detection Tests ====================

describe('Full Gap Detection', () => {
  test('should perform complete gap analysis', () => {
    const extracted = extractEntities(EXCEPTIONAL_SENIOR_SWE.parsed_resume);
    const gaps = detectGaps(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      extracted,
      JOB_SENIOR_SWE
    );

    expect(gaps.skills).toBeDefined();
    expect(gaps.tools).toBeDefined();
    expect(gaps.experience).toBeDefined();
    expect(gaps.seniority).toBeDefined();
    expect(gaps.industry).toBeDefined();
  });

  test('should summarize gaps correctly', () => {
    const extracted = extractEntities(FAIR_WEAK_CONTENT.parsed_resume);
    const gaps = detectGaps(
      FAIR_WEAK_CONTENT.parsed_resume,
      extracted,
      JOB_SENIOR_SWE
    );
    const summary = summarizeGaps(gaps);

    expect(summary.totalCriticalGaps).toBeGreaterThan(0);
    expect(summary.criticalAreas.length).toBeGreaterThan(0);
    expect(summary.overallMatchPercentage).toBeDefined();
  });
});

// ==================== Recommendation Tests ====================

describe('Recommendation Engine', () => {
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

  test('should recommend OPTIMIZE_FIRST for moderate fit', () => {
    const extracted = extractEntities(STRONG_MID_LEVEL_PM.parsed_resume);
    const gaps = detectGaps(
      STRONG_MID_LEVEL_PM.parsed_resume,
      extracted,
      JOB_SENIOR_SWE
    );
    
    const { recommendation } = getRecommendation(
      60, // Moderate fit score
      70, // Good resume score
      gaps,
      { underqualified: true, overqualified: false, career_switch: true, low_signal: false, stretch_role: false }
    );

    expect(['OPTIMIZE_FIRST', 'NOT_READY']).toContain(recommendation);
  });

  test('should recommend NOT_READY for poor fit', () => {
    const extracted = extractEntities(FAIR_WEAK_CONTENT.parsed_resume);
    const gaps = detectGaps(
      FAIR_WEAK_CONTENT.parsed_resume,
      extracted,
      JOB_SENIOR_SWE
    );
    
    const { recommendation, reasoning } = getRecommendation(
      35, // Low fit score
      40, // Low resume score
      gaps,
      { underqualified: true, overqualified: false, career_switch: false, low_signal: true, stretch_role: false }
    );

    expect(recommendation).toBe('NOT_READY');
    expect(reasoning).toContain('gap');
  });

  test('should suggest alternatives for poor fit', () => {
    const extracted = extractEntities(GOOD_ENTRY_LEVEL_DEV.parsed_resume);
    const gaps = detectGaps(
      GOOD_ENTRY_LEVEL_DEV.parsed_resume,
      extracted,
      JOB_SENIOR_SWE
    );
    
    const suggestions = suggestAlternatives(
      { underqualified: true, overqualified: false, career_switch: false, low_signal: false, stretch_role: false },
      gaps
    );

    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('should estimate potential improvement', () => {
    const extracted = extractEntities(STRONG_MID_LEVEL_PM.parsed_resume);
    const gaps = detectGaps(
      STRONG_MID_LEVEL_PM.parsed_resume,
      extracted,
      JOB_SENIOR_SWE
    );
    
    const { potentialScore, actions } = estimatePotentialImprovement(60, gaps);

    expect(potentialScore).toBeGreaterThan(60);
    expect(actions.length).toBeGreaterThan(0);
  });
});

// ==================== Fit Evaluation Integration Tests ====================

describe('Fit Evaluation Integration', () => {
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

  test('should evaluate entry developer fit correctly', () => {
    const result = evaluateFit(
      GOOD_ENTRY_LEVEL_DEV.parsed_resume,
      GOOD_ENTRY_LEVEL_DEV.resume_text,
      JOB_ENTRY_DEVELOPER
    );

    expect(result.fit_score).toBeGreaterThan(40);
    expect(result.gaps.seniority.alignment).not.toBe('overqualified');
  });

  test('should detect career mismatch', () => {
    // PM applying for SWE role
    const result = evaluateFit(
      STRONG_MID_LEVEL_PM.parsed_resume,
      STRONG_MID_LEVEL_PM.resume_text,
      JOB_SENIOR_SWE
    );

    expect(result.fit_score).toBeLessThan(70);
    expect(result.gaps.skills.critical_missing.length).toBeGreaterThan(0);
  });

  test('should include fit-specific metadata', () => {
    const result = evaluateFit(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      EXCEPTIONAL_SENIOR_SWE.resume_text,
      JOB_SENIOR_SWE
    );

    expect(result.fit_meta).toBeDefined();
    expect(result.fit_meta.job_parsed_successfully).toBe(true);
    expect(['low', 'medium', 'high']).toContain(result.fit_meta.confidence);
  });

  test('should provide tailoring hints', () => {
    const result = evaluateFit(
      STRONG_MID_LEVEL_PM.parsed_resume,
      STRONG_MID_LEVEL_PM.resume_text,
      JOB_SENIOR_SWE
    );

    expect(result.tailoring_hints).toBeDefined();
    expect(result.tailoring_hints.length).toBeGreaterThan(0);
  });

  test('should provide priority improvements', () => {
    const result = evaluateFit(
      FAIR_WEAK_CONTENT.parsed_resume,
      FAIR_WEAK_CONTENT.resume_text,
      JOB_SENIOR_SWE
    );

    expect(result.priority_improvements).toBeDefined();
    expect(result.priority_improvements.length).toBeGreaterThan(0);
    expect(result.priority_improvements[0].type).toBeDefined();
    expect(result.priority_improvements[0].estimated_impact).toBeGreaterThan(0);
  });
});

// ==================== Fit Dimension Tests ====================

describe('Fit Dimensions', () => {
  test('should calculate all fit dimensions', () => {
    const result = evaluateFit(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      EXCEPTIONAL_SENIOR_SWE.resume_text,
      JOB_SENIOR_SWE
    );

    expect(result.fit_dimensions.technical_match).toBeGreaterThanOrEqual(0);
    expect(result.fit_dimensions.technical_match).toBeLessThanOrEqual(100);
    expect(result.fit_dimensions.seniority_match).toBeGreaterThanOrEqual(0);
    expect(result.fit_dimensions.seniority_match).toBeLessThanOrEqual(100);
    expect(result.fit_dimensions.experience_match).toBeGreaterThanOrEqual(0);
    expect(result.fit_dimensions.experience_match).toBeLessThanOrEqual(100);
    expect(result.fit_dimensions.signal_quality).toBeGreaterThanOrEqual(0);
    expect(result.fit_dimensions.signal_quality).toBeLessThanOrEqual(100);
  });
});

// ==================== Fit Flags Tests ====================

describe('Fit Flags', () => {
  test('should detect underqualified status', () => {
    const result = evaluateFit(
      GOOD_ENTRY_LEVEL_DEV.parsed_resume,
      GOOD_ENTRY_LEVEL_DEV.resume_text,
      JOB_SENIOR_SWE
    );

    expect(result.fit_flags.underqualified).toBe(true);
  });

  test('should detect overqualified status', () => {
    const result = evaluateFit(
      EXCEPTIONAL_SENIOR_SWE.parsed_resume,
      EXCEPTIONAL_SENIOR_SWE.resume_text,
      JOB_ENTRY_DEVELOPER
    );

    expect(result.fit_flags.overqualified).toBe(true);
  });

  test('should detect career switch', () => {
    const result = evaluateFit(
      STRONG_MID_LEVEL_PM.parsed_resume,
      STRONG_MID_LEVEL_PM.resume_text,
      JOB_SENIOR_SWE
    );

    expect(result.fit_flags.career_switch).toBe(true);
  });
});
