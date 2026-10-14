/**
 * PRO scoring calibration expectations (non-blocking in CI).
 *
 * These thresholds were written without labeled ground truth and have never
 * passed. They run in the separate `test:calibration` job until the scoring
 * calibration decision (D-014) supplies human-rated reference resumes.
 */

import { calculatePROScore } from '../index';
import type { ATSCompatibilityBreakdown } from '../types';
import { SAMPLE_RESUME_SOFTWARE_ENGINEER } from './fixtures';

describe('PRO scoring calibration', () => {
  test('strong software engineer resume has keyword density above 60', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_SOFTWARE_ENGINEER, 'Software Engineer');
    const ats = result.componentScores.atsCompatibility.breakdown as ATSCompatibilityBreakdown;
    expect(ats.keywordDensity.score).toBeGreaterThan(60);
  });

  // Finds 3 of 16 must-haves today: the list holds generic phrases ("programming",
  // "software development") and matching misses plurals/compounds ("code reviews",
  // "RESTful").
  test('strong software engineer resume matches more than 5 must-have keywords', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_SOFTWARE_ENGINEER, 'Software Engineer');
    expect(result.atsDetailedReport.keywordGapAnalysis.mustHave.found).toBeGreaterThan(5);
  });
});
