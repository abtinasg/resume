/**
 * Layer 6 - Job Discovery & Matching Module
 * Integration Tests
 *
 * End-to-end tests for the complete job discovery workflow.
 */

import { describe, test, expect } from '@jest/globals';
import {
  parseAndRankJob,
  getRankedJobs,
  compareJobsSideBySide,
  quickParseJob,
  parseJobText,
} from '../job-discovery';
import { parseJobDescription } from '../parsing/parser';
import {
  JOB_SOFTWARE_ENGINEER_TARGET,
  JOB_SENIOR_ENGINEER_REACH,
  JOB_JUNIOR_DEVELOPER_SAFETY,
  JOB_POOR_FIT_AVOID,
  JOB_SCAM,
  JOB_FULLSTACK_GOOGLE,
  TEST_RESUME_TEXT,
  TEST_USER_PREFERENCES,
  TEST_USER_SKILLS,
} from './fixtures/job-descriptions';
import type { JobPasteRequest, ParsedJob, UserPreferences } from '../types';

// Helper to create job paste request
function createRequest(
  fixture: typeof JOB_SOFTWARE_ENGINEER_TARGET
): JobPasteRequest {
  return {
    user_id: 'test_user',
    resume_version_id: 'resume_v1',
    job_description: fixture.job_description,
    metadata: fixture.metadata,
  };
}

// ==================== Parse and Rank Integration ====================

describe('parseAndRankJob Integration', () => {
  test('should parse and rank software engineer job', async () => {
    const result = await parseAndRankJob(
      createRequest(JOB_SOFTWARE_ENGINEER_TARGET),
      TEST_RESUME_TEXT,
      TEST_USER_PREFERENCES as UserPreferences
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    if (result.success && result.data) {
      expect(result.data.job.job_title).toBe('Software Engineer');
      expect(result.data.fit_score).toBeGreaterThan(0);
      expect(result.data.category).toBeDefined();
      expect(result.data.should_apply).toBeDefined();
      expect(result.data.quick_insights.length).toBeGreaterThan(0);
    }
  });

  test('should parse and rank senior engineer job', async () => {
    const result = await parseAndRankJob(
      createRequest(JOB_SENIOR_ENGINEER_REACH),
      TEST_RESUME_TEXT,
      TEST_USER_PREFERENCES as UserPreferences
    );

    expect(result.success).toBe(true);
    
    if (result.success && result.data) {
      expect(result.data.job.company).toBe('Stripe');
      expect(result.data.career_capital.brand_score).toBeGreaterThan(70);
    }
  });

  test('should detect scam job', async () => {
    const result = await parseAndRankJob(
      createRequest(JOB_SCAM),
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    expect(result.success).toBe(true);
    
    if (result.success && result.data) {
      expect(result.data.scam_detection.risk_level).toBe('high');
      expect(result.data.scam_detection.red_flags.length).toBeGreaterThan(0);
    }
  });

  test('should detect duplicate job', async () => {
    const request = createRequest(JOB_SOFTWARE_ENGINEER_TARGET);
    
    // First parse to get canonical ID
    const parsedJob = parseJobDescription(request);
    
    // Try to add again with existing ID
    const result = await parseAndRankJob(
      request,
      TEST_RESUME_TEXT,
      {} as UserPreferences,
      [parsedJob.canonical_id]
    );

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('DUPLICATE_JOB');
  });

  test('should include metadata in response', async () => {
    const result = await parseAndRankJob(
      createRequest(JOB_SOFTWARE_ENGINEER_TARGET),
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    expect(result.metadata).toBeDefined();
    expect(result.metadata.layerId).toBe(6);
    expect(result.metadata.layerName).toBe('Job Discovery');
    expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  test('should handle invalid input gracefully', async () => {
    const result = await parseAndRankJob(
      {
        user_id: 'test_user',
        resume_version_id: 'resume_v1',
        job_description: 'too short',
      },
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ==================== Ranked Jobs List Integration ====================

describe('getRankedJobs Integration', () => {
  let parsedJobs: ParsedJob[];

  beforeAll(() => {
    // Parse all test jobs
    parsedJobs = [
      parseJobDescription(createRequest(JOB_SOFTWARE_ENGINEER_TARGET)),
      parseJobDescription(createRequest(JOB_SENIOR_ENGINEER_REACH)),
      parseJobDescription(createRequest(JOB_JUNIOR_DEVELOPER_SAFETY)),
      parseJobDescription(createRequest(JOB_FULLSTACK_GOOGLE)),
    ];
  });

  test('should rank multiple jobs', async () => {
    const result = await getRankedJobs(
      parsedJobs,
      TEST_RESUME_TEXT,
      TEST_USER_PREFERENCES as UserPreferences
    );

    expect(result.success).toBe(true);
    
    if (result.success && result.data) {
      const totalJobs = 
        result.data.jobs.reach.length +
        result.data.jobs.target.length +
        result.data.jobs.safety.length +
        result.data.jobs.avoid.length;
      
      expect(totalJobs).toBe(parsedJobs.length);
    }
  });

  test('should provide summary statistics', async () => {
    const result = await getRankedJobs(
      parsedJobs,
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    expect(result.success).toBe(true);
    
    if (result.success && result.data) {
      expect(result.data.summary.total_jobs).toBe(parsedJobs.length);
      expect(result.data.summary.average_fit_score).toBeGreaterThanOrEqual(0);
    }
  });

  test('should provide top recommendations', async () => {
    const result = await getRankedJobs(
      parsedJobs,
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    expect(result.success).toBe(true);
    
    if (result.success && result.data) {
      expect(result.data.top_recommendations).toBeDefined();
      expect(result.data.top_recommendations.length).toBeLessThanOrEqual(5);
    }
  });

  test('should provide portfolio insights', async () => {
    const result = await getRankedJobs(
      parsedJobs,
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    expect(result.success).toBe(true);
    
    if (result.success && result.data) {
      expect(result.data.insights).toBeDefined();
      expect(result.data.insights.length).toBeGreaterThan(0);
    }
  });

  test('should filter by category', async () => {
    const result = await getRankedJobs(
      parsedJobs,
      TEST_RESUME_TEXT,
      {} as UserPreferences,
      { category: 'target' }
    );

    expect(result.success).toBe(true);
    
    if (result.success && result.data) {
      expect(result.data.jobs.reach.length).toBe(0);
      expect(result.data.jobs.safety.length).toBe(0);
      expect(result.data.jobs.avoid.length).toBe(0);
    }
  });

  test('should filter by should_apply', async () => {
    const result = await getRankedJobs(
      parsedJobs,
      TEST_RESUME_TEXT,
      {} as UserPreferences,
      { only_should_apply: true }
    );

    expect(result.success).toBe(true);
    
    if (result.success && result.data) {
      // All returned jobs should have should_apply = true
      const allJobs = [
        ...result.data.jobs.reach,
        ...result.data.jobs.target,
        ...result.data.jobs.safety,
        ...result.data.jobs.avoid,
      ];
      
      allJobs.forEach(job => {
        expect(job.should_apply).toBe(true);
      });
    }
  });
});

// ==================== Job Comparison Integration ====================

describe('compareJobsSideBySide Integration', () => {
  test('should compare jobs successfully', async () => {
    // First rank the jobs
    const parsedJobs = [
      parseJobDescription(createRequest(JOB_SOFTWARE_ENGINEER_TARGET)),
      parseJobDescription(createRequest(JOB_FULLSTACK_GOOGLE)),
    ];

    const rankedResult = await getRankedJobs(
      parsedJobs,
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    expect(rankedResult.success).toBe(true);
    
    if (rankedResult.success && rankedResult.data) {
      const allRanked = [
        ...rankedResult.data.jobs.reach,
        ...rankedResult.data.jobs.target,
        ...rankedResult.data.jobs.safety,
        ...rankedResult.data.jobs.avoid,
      ];

      const compareResult = await compareJobsSideBySide(
        allRanked.slice(0, 2),
        TEST_USER_SKILLS
      );

      expect(compareResult.success).toBe(true);
      
      if (compareResult.success && compareResult.data) {
        expect(compareResult.data.best_fit).toBeTruthy();
        expect(compareResult.data.comparison.skills_overlap).toBeDefined();
        expect(compareResult.data.insights.length).toBeGreaterThan(0);
      }
    }
  });

  test('should fail with fewer than 2 jobs', async () => {
    const parsedJobs = [
      parseJobDescription(createRequest(JOB_SOFTWARE_ENGINEER_TARGET)),
    ];

    const rankedResult = await getRankedJobs(
      parsedJobs,
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    expect(rankedResult.success).toBe(true);
    
    if (rankedResult.success && rankedResult.data) {
      const allRanked = [
        ...rankedResult.data.jobs.reach,
        ...rankedResult.data.jobs.target,
        ...rankedResult.data.jobs.safety,
        ...rankedResult.data.jobs.avoid,
      ];

      const compareResult = await compareJobsSideBySide(
        allRanked.slice(0, 1),
        TEST_USER_SKILLS
      );

      expect(compareResult.success).toBe(false);
      expect(compareResult.error?.code).toBe('COMPARISON_FAILED');
    }
  });
});

// ==================== Convenience Functions ====================

describe('Convenience Functions', () => {
  describe('quickParseJob', () => {
    test('should parse job without ranking', () => {
      const result = quickParseJob(createRequest(JOB_SOFTWARE_ENGINEER_TARGET));

      expect(result.job_id).toBeTruthy();
      expect(result.job_title).toBe('Software Engineer');
      expect(result.requirements.required_skills.length).toBeGreaterThan(0);
    });
  });

  describe('parseJobText', () => {
    test('should parse text directly', () => {
      const result = parseJobText(JOB_SOFTWARE_ENGINEER_TARGET.job_description);

      expect(result.job_id).toBeTruthy();
      expect(result.raw_text).toBe(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
    });

    test('should accept optional metadata', () => {
      const result = parseJobText(
        JOB_SOFTWARE_ENGINEER_TARGET.job_description,
        { job_title: 'Custom Title' }
      );

      expect(result.job_title).toBe('Custom Title');
    });
  });
});

// ==================== Performance Tests ====================

describe('Performance', () => {
  test('should parse single job within time limit', async () => {
    const startTime = Date.now();
    
    await parseAndRankJob(
      createRequest(JOB_SOFTWARE_ENGINEER_TARGET),
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    const elapsed = Date.now() - startTime;
    
    // Should complete within 1 second
    expect(elapsed).toBeLessThan(1000);
  });

  test('should rank multiple jobs efficiently', async () => {
    const parsedJobs = [
      parseJobDescription(createRequest(JOB_SOFTWARE_ENGINEER_TARGET)),
      parseJobDescription(createRequest(JOB_SENIOR_ENGINEER_REACH)),
      parseJobDescription(createRequest(JOB_FULLSTACK_GOOGLE)),
    ];

    const startTime = Date.now();
    
    await getRankedJobs(
      parsedJobs,
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    const elapsed = Date.now() - startTime;
    
    // Should complete within 2 seconds for 3 jobs
    expect(elapsed).toBeLessThan(2000);
  });
});

// ==================== Edge Cases ====================

describe('Edge Cases', () => {
  test('should handle empty job list', async () => {
    const result = await getRankedJobs(
      [],
      TEST_RESUME_TEXT,
      {} as UserPreferences
    );

    expect(result.success).toBe(true);
    
    if (result.success && result.data) {
      expect(result.data.summary.total_jobs).toBe(0);
    }
  });

  test('should handle special characters in JD', () => {
    const specialCharsJD = `
      Software Engineer – "Senior" Role
      Company: Test™ Corp®
      Salary: $100,000–$150,000/year
      Skills: C++, C#, .NET
      Location: San José, CA
    `;

    const result = parseJobText(specialCharsJD);

    expect(result.job_id).toBeTruthy();
    expect(result.raw_text).toBeTruthy();
  });

  test('should handle unicode in JD', () => {
    const unicodeJD = `
      ソフトウェアエンジニア
      Software Engineer Position
      Requirements: 5+ years experience
      Location: Tokyo, Japan
    `;

    const result = parseJobText(unicodeJD);

    expect(result.job_id).toBeTruthy();
  });
});
