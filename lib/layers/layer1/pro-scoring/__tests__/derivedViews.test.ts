/**
 * Derived Views - Test Suite
 *
 * Tests that derive3DFromPRO correctly maps PRO (4D) scores to legacy 3D views.
 * Validates determinism, edge cases, and the bridge function.
 */

import {
  derive3DFromPRO,
  derive3DRawFromPRO,
  scoringResultToPROInput,
  type PROScoreInput,
  type JobFitInput,
  type ThreeDView,
  type ThreeDViewRaw,
} from '../derivedViews';
import type { ScoringResult } from '../types';

// ==================== Test Fixtures ====================

/** A complete PRO score input with all dimensions */
const FULL_PRO_SCORE: PROScoreInput = {
  overall: 75,
  dimensions: {
    format: { score: 80 },
    content: { score: 75 },
    ats: { score: 70 },
    impact: { score: 72 },
  },
};

/** A job fit result from Layer 6 */
const JOB_FIT: JobFitInput = { overall: 85 };

/** A PRO score with minimum values */
const ZERO_PRO_SCORE: PROScoreInput = {
  overall: 0,
  dimensions: {
    format: { score: 0 },
    content: { score: 0 },
    ats: { score: 0 },
    impact: { score: 0 },
  },
};

/** A PRO score with maximum values */
const MAX_PRO_SCORE: PROScoreInput = {
  overall: 100,
  dimensions: {
    format: { score: 100 },
    content: { score: 100 },
    ats: { score: 100 },
    impact: { score: 100 },
  },
};

/** A partial PRO score with only some dimensions */
const PARTIAL_PRO_SCORE: PROScoreInput = {
  overall: 60,
  dimensions: {
    content: { score: 65 },
    ats: { score: 55 },
  },
};

// ==================== derive3DFromPRO Tests ====================

describe('derive3DFromPRO', () => {
  test('maps format to structure', () => {
    const result = derive3DFromPRO(FULL_PRO_SCORE);

    expect(result.structure).toBe(80);
  });

  test('maps content to content', () => {
    const result = derive3DFromPRO(FULL_PRO_SCORE);

    expect(result.content).toBe(75);
  });

  test('uses ATS for tailoring when no job fit provided', () => {
    const result = derive3DFromPRO(FULL_PRO_SCORE);

    expect(result.tailoring).toBe(70); // Uses ATS score
  });

  test('uses job fit for tailoring when available', () => {
    const result = derive3DFromPRO(FULL_PRO_SCORE, JOB_FIT);

    expect(result.tailoring).toBe(85); // Uses job fit, not ATS
  });

  test('preserves overall score', () => {
    const result = derive3DFromPRO(FULL_PRO_SCORE);

    expect(result.overall).toBe(75);
  });

  test('is deterministic - same input produces same output', () => {
    const result1 = derive3DFromPRO(FULL_PRO_SCORE);
    const result2 = derive3DFromPRO(FULL_PRO_SCORE);

    expect(result1).toEqual(result2);
  });

  test('is deterministic with job fit', () => {
    const result1 = derive3DFromPRO(FULL_PRO_SCORE, JOB_FIT);
    const result2 = derive3DFromPRO(FULL_PRO_SCORE, JOB_FIT);

    expect(result1).toEqual(result2);
  });

  test('handles zero scores', () => {
    const result = derive3DFromPRO(ZERO_PRO_SCORE);

    expect(result.structure).toBe(0);
    expect(result.content).toBe(0);
    expect(result.tailoring).toBe(0);
    expect(result.overall).toBe(0);
  });

  test('handles maximum scores', () => {
    const result = derive3DFromPRO(MAX_PRO_SCORE);

    expect(result.structure).toBe(100);
    expect(result.content).toBe(100);
    expect(result.tailoring).toBe(100);
    expect(result.overall).toBe(100);
  });

  test('handles missing dimensions gracefully', () => {
    const result = derive3DFromPRO(PARTIAL_PRO_SCORE);

    expect(result.structure).toBe(0); // format not provided → defaults to 0
    expect(result.content).toBe(65);
    expect(result.tailoring).toBe(55);
    expect(result.overall).toBe(60);
  });

  test('clamps negative scores to 0', () => {
    const negativeScore: PROScoreInput = {
      overall: -5,
      dimensions: {
        format: { score: -10 },
        content: { score: -20 },
        ats: { score: -30 },
      },
    };

    const result = derive3DFromPRO(negativeScore);

    expect(result.structure).toBe(0);
    expect(result.content).toBe(0);
    expect(result.tailoring).toBe(0);
    expect(result.overall).toBe(0);
  });

  test('clamps scores above 100 to 100', () => {
    const overflowScore: PROScoreInput = {
      overall: 150,
      dimensions: {
        format: { score: 120 },
        content: { score: 110 },
        ats: { score: 105 },
      },
    };

    const result = derive3DFromPRO(overflowScore);

    expect(result.structure).toBe(100);
    expect(result.content).toBe(100);
    expect(result.tailoring).toBe(100);
    expect(result.overall).toBe(100);
  });

  test('returns rounded integer scores', () => {
    const fractionalScore: PROScoreInput = {
      overall: 75.7,
      dimensions: {
        format: { score: 80.3 },
        content: { score: 72.9 },
        ats: { score: 68.1 },
      },
    };

    const result = derive3DFromPRO(fractionalScore);

    expect(Number.isInteger(result.structure)).toBe(true);
    expect(Number.isInteger(result.content)).toBe(true);
    expect(Number.isInteger(result.tailoring)).toBe(true);
    expect(Number.isInteger(result.overall)).toBe(true);
  });

  test('job fit with zero overall still overrides ATS', () => {
    const zeroJobFit: JobFitInput = { overall: 0 };
    const result = derive3DFromPRO(FULL_PRO_SCORE, zeroJobFit);

    expect(result.tailoring).toBe(0); // Uses jobFit (0), not ATS (70)
  });

  test('returns all required fields', () => {
    const result = derive3DFromPRO(FULL_PRO_SCORE);

    expect(result).toHaveProperty('structure');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('tailoring');
    expect(result).toHaveProperty('overall');
    expect(Object.keys(result)).toHaveLength(4);
  });
});

// ==================== derive3DRawFromPRO Tests ====================

describe('derive3DRawFromPRO', () => {
  test('scales structure to 0-40 range', () => {
    const result = derive3DRawFromPRO(FULL_PRO_SCORE);

    // 80/100 * 40 = 32
    expect(result.structure).toBe(32);
    expect(result.structure).toBeGreaterThanOrEqual(0);
    expect(result.structure).toBeLessThanOrEqual(40);
  });

  test('scales content to 0-60 range', () => {
    const result = derive3DRawFromPRO(FULL_PRO_SCORE);

    // 75/100 * 60 = 45
    expect(result.content).toBe(45);
    expect(result.content).toBeGreaterThanOrEqual(0);
    expect(result.content).toBeLessThanOrEqual(60);
  });

  test('scales tailoring to 0-40 range', () => {
    const result = derive3DRawFromPRO(FULL_PRO_SCORE);

    // 70/100 * 40 = 28
    expect(result.tailoring).toBe(28);
    expect(result.tailoring).toBeGreaterThanOrEqual(0);
    expect(result.tailoring).toBeLessThanOrEqual(40);
  });

  test('preserves overall score (0-100)', () => {
    const result = derive3DRawFromPRO(FULL_PRO_SCORE);

    expect(result.overall).toBe(75);
  });

  test('max scores produce max raw values', () => {
    const result = derive3DRawFromPRO(MAX_PRO_SCORE);

    expect(result.structure).toBe(40);
    expect(result.content).toBe(60);
    expect(result.tailoring).toBe(40);
    expect(result.overall).toBe(100);
  });

  test('zero scores produce zero raw values', () => {
    const result = derive3DRawFromPRO(ZERO_PRO_SCORE);

    expect(result.structure).toBe(0);
    expect(result.content).toBe(0);
    expect(result.tailoring).toBe(0);
    expect(result.overall).toBe(0);
  });

  test('uses job fit for tailoring when available', () => {
    const result = derive3DRawFromPRO(FULL_PRO_SCORE, JOB_FIT);

    // 85/100 * 40 = 34
    expect(result.tailoring).toBe(34);
  });

  test('is deterministic', () => {
    const result1 = derive3DRawFromPRO(FULL_PRO_SCORE);
    const result2 = derive3DRawFromPRO(FULL_PRO_SCORE);

    expect(result1).toEqual(result2);
  });

  test('returns rounded integer scores', () => {
    const fractionalScore: PROScoreInput = {
      overall: 73,
      dimensions: {
        format: { score: 77 },
        content: { score: 81 },
        ats: { score: 63 },
      },
    };

    const result = derive3DRawFromPRO(fractionalScore);

    expect(Number.isInteger(result.structure)).toBe(true);
    expect(Number.isInteger(result.content)).toBe(true);
    expect(Number.isInteger(result.tailoring)).toBe(true);
  });
});

// ==================== scoringResultToPROInput Tests ====================

describe('scoringResultToPROInput', () => {
  // Build a minimal valid ScoringResult for testing
  const mockScoringResult: ScoringResult = {
    overallScore: 78,
    grade: 'C+',
    atsPassProbability: 80,
    componentScores: {
      contentQuality: {
        score: 82,
        weight: 40,
        weightedContribution: 32.8,
        breakdown: {} as any,
      },
      atsCompatibility: {
        score: 74,
        weight: 35,
        weightedContribution: 25.9,
        breakdown: {} as any,
      },
      formatStructure: {
        score: 85,
        weight: 15,
        weightedContribution: 12.75,
        breakdown: {} as any,
      },
      impactMetrics: {
        score: 65,
        weight: 10,
        weightedContribution: 6.5,
        breakdown: {} as any,
      },
    },
    atsDetailedReport: {} as any,
    improvementRoadmap: {} as any,
  };

  test('converts ScoringResult to PROScoreInput', () => {
    const input = scoringResultToPROInput(mockScoringResult);

    expect(input.overall).toBe(78);
    expect(input.dimensions.format?.score).toBe(85);
    expect(input.dimensions.content?.score).toBe(82);
    expect(input.dimensions.ats?.score).toBe(74);
    expect(input.dimensions.impact?.score).toBe(65);
  });

  test('converted input works with derive3DFromPRO', () => {
    const input = scoringResultToPROInput(mockScoringResult);
    const view = derive3DFromPRO(input);

    expect(view.structure).toBe(85);
    expect(view.content).toBe(82);
    expect(view.tailoring).toBe(74);
    expect(view.overall).toBe(78);
  });

  test('full pipeline: ScoringResult → PROInput → ThreeDView', () => {
    const input = scoringResultToPROInput(mockScoringResult);
    const view = derive3DFromPRO(input, JOB_FIT);

    expect(view.structure).toBe(85);
    expect(view.content).toBe(82);
    expect(view.tailoring).toBe(85); // Uses job fit
    expect(view.overall).toBe(78);
  });

  test('full pipeline: ScoringResult → PROInput → ThreeDViewRaw', () => {
    const input = scoringResultToPROInput(mockScoringResult);
    const raw = derive3DRawFromPRO(input);

    expect(raw.structure).toBe(34); // 85/100 * 40
    expect(raw.content).toBe(49);   // 82/100 * 60
    expect(raw.tailoring).toBe(30); // 74/100 * 40
    expect(raw.overall).toBe(78);
  });
});

// ==================== Edge Cases ====================

describe('Edge Cases', () => {
  test('empty dimensions object', () => {
    const emptyDimensions: PROScoreInput = {
      overall: 50,
      dimensions: {},
    };

    const result = derive3DFromPRO(emptyDimensions);

    expect(result.structure).toBe(0);
    expect(result.content).toBe(0);
    expect(result.tailoring).toBe(0);
    expect(result.overall).toBe(50);
  });

  test('overall does not change regardless of dimension mapping', () => {
    const testCases = [
      { overall: 0, dimensions: { format: { score: 100 } } },
      { overall: 100, dimensions: { format: { score: 0 } } },
      { overall: 50, dimensions: {} },
    ];

    for (const testCase of testCases) {
      const result = derive3DFromPRO(testCase);
      expect(result.overall).toBe(testCase.overall);
    }
  });

  test('derive3DRawFromPRO and derive3DFromPRO are consistent', () => {
    const view = derive3DFromPRO(FULL_PRO_SCORE);
    const raw = derive3DRawFromPRO(FULL_PRO_SCORE);

    // Raw should be scaled version of view
    expect(raw.structure).toBe(Math.round((view.structure / 100) * 40));
    expect(raw.content).toBe(Math.round((view.content / 100) * 60));
    expect(raw.tailoring).toBe(Math.round((view.tailoring / 100) * 40));
    expect(raw.overall).toBe(view.overall);
  });
});
