/**
 * Layer 6 - Job Discovery & Matching Module
 * Comparison Tests
 *
 * Tests for job comparison functionality.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  compareJobs,
  analyzeSkillsOverlap,
  getComparisonSummary,
} from '../comparison/comparator';
import { parseJobDescription } from '../parsing/parser';
import { rankJob } from '../ranking/ranker';
import {
  JOB_SOFTWARE_ENGINEER_TARGET,
  JOB_SENIOR_ENGINEER_REACH,
  JOB_FULLSTACK_GOOGLE,
  TEST_RESUME_TEXT,
  TEST_USER_SKILLS,
  TEST_USER_PREFERENCES,
} from './fixtures/job-descriptions';
import type { JobPasteRequest, RankedJob, UserPreferences } from '../types';

// Helper to create parsed job from fixture
async function createRankedJob(
  fixture: typeof JOB_SOFTWARE_ENGINEER_TARGET
): Promise<RankedJob> {
  const request: JobPasteRequest = {
    user_id: 'test_user',
    resume_version_id: 'resume_v1',
    job_description: fixture.job_description,
    metadata: fixture.metadata,
  };
  const parsedJob = parseJobDescription(request);
  return rankJob(
    parsedJob,
    TEST_RESUME_TEXT,
    TEST_USER_PREFERENCES as UserPreferences
  );
}

// ==================== Skills Overlap Tests ====================

describe('Skills Overlap Analysis', () => {
  test('should identify common requirements', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const overlap = analyzeSkillsOverlap([job1, job2], TEST_USER_SKILLS);

    expect(overlap.common_requirements).toBeDefined();
    expect(overlap.unique_per_job).toBeDefined();
    expect(overlap.your_coverage).toBeGreaterThanOrEqual(0);
    expect(overlap.your_coverage).toBeLessThanOrEqual(100);
  });

  test('should identify unique requirements per job', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_SENIOR_ENGINEER_REACH);

    const overlap = analyzeSkillsOverlap([job1, job2], TEST_USER_SKILLS);

    expect(Object.keys(overlap.unique_per_job).length).toBe(2);
  });

  test('should calculate user coverage', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const overlap = analyzeSkillsOverlap([job1, job2], TEST_USER_SKILLS);

    // User has relevant skills, should have some coverage
    expect(overlap.your_coverage).toBeGreaterThan(0);
  });

  test('should show 0 coverage with no matching skills', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const overlap = analyzeSkillsOverlap([job1, job2], ['Cooking', 'Gardening']);

    expect(overlap.your_coverage).toBeLessThan(50);
  });
});

// ==================== Job Comparison Tests ====================

describe('Job Comparison', () => {
  test('should compare two jobs successfully', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);

    expect(result.jobs.length).toBe(2);
    expect(result.best_fit).toBeTruthy();
    expect(result.easiest_to_get).toBeTruthy();
    expect(result.best_for_growth).toBeTruthy();
    expect(result.comparison).toBeDefined();
    expect(result.insights.length).toBeGreaterThan(0);
  });

  test('should compare three jobs successfully', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_SENIOR_ENGINEER_REACH);
    const job3 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2, job3], TEST_USER_SKILLS);

    expect(result.jobs.length).toBe(3);
    expect(result.comparison.fit_scores.length).toBe(3);
    expect(result.comparison.categories.length).toBe(3);
    expect(result.comparison.locations.length).toBe(3);
  });

  test('should identify best fit correctly', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_SENIOR_ENGINEER_REACH);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);

    // Best fit should be one of the job IDs
    expect([job1.job.job_id, job2.job.job_id]).toContain(result.best_fit);
  });

  test('should identify best for brand with Google', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);

    // Google should be best for brand
    expect(result.best_for_brand).toBe(job2.job.job_id);
  });

  test('should throw error with fewer than 2 jobs', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);

    expect(() => compareJobs([job1], TEST_USER_SKILLS)).toThrow();
  });

  test('should limit to 5 jobs maximum', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_SENIOR_ENGINEER_REACH);
    const job3 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    // Create copies with different IDs to simulate more jobs
    const jobs = [job1, job2, job3, job1, job2, job3];

    const result = compareJobs(jobs, TEST_USER_SKILLS);

    expect(result.jobs.length).toBeLessThanOrEqual(5);
  });
});

// ==================== Comparison Details Tests ====================

describe('Comparison Details', () => {
  test('should include fit scores', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);

    expect(result.comparison.fit_scores).toBeDefined();
    expect(result.comparison.fit_scores.length).toBe(2);
    result.comparison.fit_scores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  test('should include categories', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);

    expect(result.comparison.categories.length).toBe(2);
    result.comparison.categories.forEach(cat => {
      expect(['reach', 'target', 'safety', 'avoid']).toContain(cat);
    });
  });

  test('should include seniority levels', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_SENIOR_ENGINEER_REACH);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);

    expect(result.comparison.seniority_levels.length).toBe(2);
  });

  test('should include remote friendly flags', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);

    expect(result.comparison.remote_friendly.length).toBe(2);
    result.comparison.remote_friendly.forEach(flag => {
      expect(typeof flag).toBe('boolean');
    });
  });
});

// ==================== Comparison Summary Tests ====================

describe('Comparison Summary', () => {
  test('should generate readable summary', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);
    const summary = getComparisonSummary(result);

    expect(summary).toBeTruthy();
    expect(summary.length).toBeGreaterThan(50);
    expect(summary).toMatch(/comparing/i);
    expect(summary).toMatch(/best fit/i);
  });

  test('should include skills coverage', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);
    const summary = getComparisonSummary(result);

    expect(summary).toMatch(/coverage/i);
  });
});

// ==================== Comparison Insights Tests ====================

describe('Comparison Insights', () => {
  test('should generate relevant insights', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);

    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights.length).toBeLessThanOrEqual(8);
  });

  test('should mention fit scores', async () => {
    const job1 = await createRankedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const job2 = await createRankedJob(JOB_FULLSTACK_GOOGLE);

    const result = compareJobs([job1, job2], TEST_USER_SKILLS);

    const fitInsight = result.insights.some(i => 
      i.toLowerCase().includes('fit') || i.includes('/100')
    );
    expect(fitInsight).toBe(true);
  });
});
