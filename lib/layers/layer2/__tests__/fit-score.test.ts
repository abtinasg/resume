/**
 * Layer 2 - Strategy Engine
 * Fit Score Tests
 *
 * Tests for fit score calculation and breakdown.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  calculateFitScore,
  getFitLevel,
  getFitRecommendations,
  meetsMinimumFit,
  calculateScoreGap,
} from '../strategy';
import { SeniorityLevel } from '../types';
import type { GapAnalysis } from '../types';
import { clearConfigCache } from '../config';

// ==================== Setup ====================

beforeEach(() => {
  clearConfigCache();
});

// ==================== Helper Functions ====================

function createGaps(overrides: Partial<{
  skillsMatch: number;
  toolsMatch: number;
  experienceCoverage: number;
  seniorityAlignment: 'aligned' | 'underqualified' | 'overqualified';
  industryMatch: number;
  criticalSkillsMissing: number;
  criticalToolsMissing: number;
}>): GapAnalysis {
  const {
    skillsMatch = 80,
    toolsMatch = 75,
    experienceCoverage = 70,
    seniorityAlignment = 'aligned',
    industryMatch = 80,
    criticalSkillsMissing = 0,
    criticalToolsMissing = 0,
  } = overrides;

  return {
    skills: {
      matched: ['typescript', 'react'].slice(0, Math.floor(skillsMatch / 50)),
      critical_missing: Array(criticalSkillsMissing).fill('missing_skill'),
      nice_to_have_missing: [],
      match_percentage: skillsMatch,
      confidence: 'medium',
    },
    tools: {
      matched: ['docker', 'git'].slice(0, Math.floor(toolsMatch / 50)),
      critical_missing: Array(criticalToolsMissing).fill('missing_tool'),
      nice_to_have_missing: [],
      match_percentage: toolsMatch,
      confidence: 'medium',
    },
    experience: {
      present_types: ['leadership', 'shipping_ownership'],
      missing_types: [],
      coverage_score: experienceCoverage,
      confidence: 'medium',
    },
    seniority: {
      user_level: SeniorityLevel.MID,
      role_expected: SeniorityLevel.MID,
      alignment: seniorityAlignment,
      confidence: 'medium',
    },
    industry: {
      keywords_matched: ['technology'],
      keywords_missing: [],
      match_percentage: industryMatch,
      confidence: 'medium',
    },
  };
}

// ==================== Basic Calculation Tests ====================

describe('Fit Score Calculation', () => {
  test('should calculate perfect score for perfect match', () => {
    const gaps = createGaps({
      skillsMatch: 100,
      toolsMatch: 100,
      experienceCoverage: 100,
      seniorityAlignment: 'aligned',
      industryMatch: 100,
    });

    const result = calculateFitScore(gaps);

    expect(result.overall_fit_score).toBe(100);
    expect(result.breakdown.penalties).toBe(0);
  });

  test('should calculate weighted score correctly', () => {
    // Using default weights: skills=0.35, tools=0.20, experience=0.20, industry=0.15, seniority=0.10
    const gaps = createGaps({
      skillsMatch: 100, // 35 points
      toolsMatch: 100, // 20 points
      experienceCoverage: 100, // 20 points
      seniorityAlignment: 'aligned', // 10 points (100 * 0.10)
      industryMatch: 100, // 15 points
    });

    const result = calculateFitScore(gaps);

    // Should be approximately 100 (small rounding differences possible)
    expect(result.overall_fit_score).toBeGreaterThanOrEqual(95);
    expect(result.overall_fit_score).toBeLessThanOrEqual(100);
  });

  test('should calculate partial score correctly', () => {
    const gaps = createGaps({
      skillsMatch: 50,
      toolsMatch: 50,
      experienceCoverage: 50,
      seniorityAlignment: 'aligned',
      industryMatch: 50,
    });

    const result = calculateFitScore(gaps);

    // Expected: 0.35*50 + 0.20*50 + 0.20*50 + 0.15*50 + 0.10*100 = 17.5+10+10+7.5+10 = 55
    expect(result.overall_fit_score).toBeGreaterThanOrEqual(50);
    expect(result.overall_fit_score).toBeLessThanOrEqual(60);
  });

  test('should clamp score to 0-100 range', () => {
    // Even with many penalties, score should not go negative
    const gaps = createGaps({
      skillsMatch: 0,
      toolsMatch: 0,
      experienceCoverage: 0,
      seniorityAlignment: 'underqualified',
      industryMatch: 0,
      criticalSkillsMissing: 10,
      criticalToolsMissing: 10,
    });

    const result = calculateFitScore(gaps);

    expect(result.overall_fit_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_fit_score).toBeLessThanOrEqual(100);
  });
});

// ==================== Seniority Score Tests ====================

describe('Seniority Score Component', () => {
  test('should give full score for aligned seniority', () => {
    const gaps = createGaps({ seniorityAlignment: 'aligned' });
    const result = calculateFitScore(gaps);

    expect(result.breakdown.seniority_score).toBe(100);
  });

  test('should reduce score for underqualified', () => {
    const gaps = createGaps({ seniorityAlignment: 'underqualified' });
    const result = calculateFitScore(gaps);

    expect(result.breakdown.seniority_score).toBeLessThan(100);
    expect(result.breakdown.seniority_score).toBe(70); // Default underqualified score
  });

  test('should reduce score for overqualified', () => {
    const gaps = createGaps({ seniorityAlignment: 'overqualified' });
    const result = calculateFitScore(gaps);

    expect(result.breakdown.seniority_score).toBeLessThan(100);
    expect(result.breakdown.seniority_score).toBe(80); // Default overqualified score
  });
});

// ==================== Penalty Tests ====================

describe('Fit Score Penalties', () => {
  test('should apply penalty for critical missing skills', () => {
    const gapsWithMissing = createGaps({
      skillsMatch: 80,
      criticalSkillsMissing: 3,
    });

    const gapsWithoutMissing = createGaps({
      skillsMatch: 80,
      criticalSkillsMissing: 0,
    });

    const withMissing = calculateFitScore(gapsWithMissing);
    const withoutMissing = calculateFitScore(gapsWithoutMissing);

    expect(withMissing.overall_fit_score).toBeLessThan(withoutMissing.overall_fit_score);
    expect(withMissing.breakdown.penalties).toBeGreaterThan(0);
    expect(withMissing.penalties_applied.length).toBeGreaterThan(0);
  });

  test('should apply penalty for critical missing tools', () => {
    const gapsWithMissing = createGaps({
      toolsMatch: 80,
      criticalToolsMissing: 3,
    });

    const gapsWithoutMissing = createGaps({
      toolsMatch: 80,
      criticalToolsMissing: 0,
    });

    const withMissing = calculateFitScore(gapsWithMissing);
    const withoutMissing = calculateFitScore(gapsWithoutMissing);

    expect(withMissing.overall_fit_score).toBeLessThan(withoutMissing.overall_fit_score);
  });

  test('should cap penalties at maximum', () => {
    // Even with many missing skills, penalty should be capped
    const gaps = createGaps({
      criticalSkillsMissing: 20, // Many missing
    });

    const result = calculateFitScore(gaps);

    // Penalty should be capped (default: 20 for skills + 15 for tools = 35 max)
    expect(result.breakdown.penalties).toBeLessThanOrEqual(35);
  });

  test('should combine skill and tool penalties', () => {
    const gaps = createGaps({
      criticalSkillsMissing: 2,
      criticalToolsMissing: 2,
    });

    const result = calculateFitScore(gaps);

    // Should have both penalties
    expect(result.penalties_applied.length).toBe(2);
    expect(result.penalties_applied.some(p => p.includes('skills'))).toBe(true);
    expect(result.penalties_applied.some(p => p.includes('tools'))).toBe(true);
  });
});

// ==================== Breakdown Tests ====================

describe('Fit Score Breakdown', () => {
  test('should provide complete breakdown', () => {
    const gaps = createGaps({});
    const result = calculateFitScore(gaps);

    expect(result.breakdown).toHaveProperty('skills_score');
    expect(result.breakdown).toHaveProperty('tools_score');
    expect(result.breakdown).toHaveProperty('experience_score');
    expect(result.breakdown).toHaveProperty('industry_score');
    expect(result.breakdown).toHaveProperty('seniority_score');
    expect(result.breakdown).toHaveProperty('penalties');
    expect(result.breakdown).toHaveProperty('weighted_score');
  });

  test('should match input match percentages', () => {
    const gaps = createGaps({
      skillsMatch: 75,
      toolsMatch: 60,
      experienceCoverage: 80,
      industryMatch: 50,
    });

    const result = calculateFitScore(gaps);

    expect(result.breakdown.skills_score).toBe(75);
    expect(result.breakdown.tools_score).toBe(60);
    expect(result.breakdown.experience_score).toBe(80);
    expect(result.breakdown.industry_score).toBe(50);
  });
});

// ==================== Confidence Tests ====================

describe('Fit Score Confidence', () => {
  test('should have high confidence with majority high gap confidences', () => {
    const gaps = createGaps({});
    // Set high confidence on all gaps
    gaps.skills.confidence = 'high';
    gaps.tools.confidence = 'high';
    gaps.experience.confidence = 'high';
    gaps.seniority.confidence = 'medium';
    gaps.industry.confidence = 'medium';

    const result = calculateFitScore(gaps);
    expect(result.confidence).toBe('high');
  });

  test('should have low confidence with majority low gap confidences', () => {
    const gaps = createGaps({});
    gaps.skills.confidence = 'low';
    gaps.tools.confidence = 'low';
    gaps.experience.confidence = 'low';
    gaps.seniority.confidence = 'medium';
    gaps.industry.confidence = 'medium';

    const result = calculateFitScore(gaps);
    expect(result.confidence).toBe('low');
  });

  test('should have medium confidence by default', () => {
    const gaps = createGaps({});

    const result = calculateFitScore(gaps);
    expect(result.confidence).toBe('medium');
  });
});

// ==================== Utility Function Tests ====================

describe('Fit Score Utility Functions', () => {
  test('should get correct fit level for score ranges', () => {
    expect(getFitLevel(95)).toBe('Excellent Fit');
    expect(getFitLevel(80)).toBe('Strong Fit');
    expect(getFitLevel(65)).toBe('Good Fit');
    expect(getFitLevel(50)).toBe('Moderate Fit');
    expect(getFitLevel(35)).toBe('Weak Fit');
    expect(getFitLevel(20)).toBe('Poor Fit');
  });

  test('should get recommendations based on score', () => {
    const highRecs = getFitRecommendations(85);
    expect(highRecs.length).toBeGreaterThan(0);
    expect(highRecs.some(r => r.includes('Strong'))).toBe(true);

    const lowRecs = getFitRecommendations(35);
    expect(lowRecs.length).toBeGreaterThan(0);
    expect(lowRecs.some(r => r.includes('gap') || r.includes('skill'))).toBe(true);
  });

  test('should check minimum fit threshold', () => {
    expect(meetsMinimumFit(70, 60)).toBe(true);
    expect(meetsMinimumFit(50, 60)).toBe(false);
    expect(meetsMinimumFit(60, 60)).toBe(true);
  });

  test('should calculate score gap correctly', () => {
    expect(calculateScoreGap(60, 80)).toBe(20);
    expect(calculateScoreGap(90, 80)).toBe(0);
    expect(calculateScoreGap(50)).toBe(30); // Default target is 80
  });
});

// ==================== Edge Cases ====================

describe('Fit Score Edge Cases', () => {
  test('should handle all zeros gracefully', () => {
    const gaps = createGaps({
      skillsMatch: 0,
      toolsMatch: 0,
      experienceCoverage: 0,
      industryMatch: 0,
    });

    const result = calculateFitScore(gaps);

    expect(result.overall_fit_score).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.weighted_score).toBeGreaterThanOrEqual(0);
  });

  test('should handle all perfect scores', () => {
    const gaps = createGaps({
      skillsMatch: 100,
      toolsMatch: 100,
      experienceCoverage: 100,
      industryMatch: 100,
      seniorityAlignment: 'aligned',
    });

    const result = calculateFitScore(gaps);

    expect(result.overall_fit_score).toBe(100);
  });
});
