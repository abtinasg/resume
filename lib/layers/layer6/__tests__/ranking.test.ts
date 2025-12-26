/**
 * Layer 6 - Job Discovery & Matching Module
 * Ranking Tests
 *
 * Tests for job ranking, categorization, and prioritization.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  categorizeJob,
  categorizeByFitScore,
  shouldUserApply,
  checkHardConstraints,
} from '../ranking/categorizer';
import {
  calculateUrgencyScore,
  calculateFreshnessScore,
  calculatePreferenceMatch,
  determineJobFlags,
} from '../ranking/priority-scorer';
import {
  generateJobInsights,
  generateComparisonInsights,
} from '../ranking/insights-generator';
import { parseJobDescription } from '../parsing/parser';
import { calculateCareerCapital } from '../analysis/career-capital';
import { detectScamRisk } from '../analysis/scam-detector';
import {
  JOB_SOFTWARE_ENGINEER_TARGET,
  JOB_SENIOR_ENGINEER_REACH,
  JOB_JUNIOR_DEVELOPER_SAFETY,
  JOB_POOR_FIT_AVOID,
  JOB_SCAM,
  JOB_INCOMPLETE,
  JOB_FULLSTACK_GOOGLE,
  TEST_USER_PREFERENCES,
} from './fixtures/job-descriptions';
import type { JobPasteRequest, ParsedJob, UserPreferences } from '../types';
import type { GapAnalysis } from '../../layer1/types';

// Helper to create parsed job from fixture
function createParsedJob(fixture: typeof JOB_SOFTWARE_ENGINEER_TARGET): ParsedJob {
  const request: JobPasteRequest = {
    user_id: 'test_user',
    resume_version_id: 'resume_v1',
    job_description: fixture.job_description,
    metadata: fixture.metadata,
  };
  return parseJobDescription(request);
}

// Mock gap analysis
function createMockGaps(
  skillsMatchPercent: number = 70,
  alignment: 'aligned' | 'underqualified' | 'overqualified' = 'aligned',
  criticalMissing: number = 2
): GapAnalysis {
  return {
    skills: {
      matched: ['JavaScript', 'React', 'Node.js'],
      critical_missing: Array(criticalMissing).fill('Skill'),
      nice_to_have_missing: [],
      transferable: [],
      match_percentage: skillsMatchPercent,
    },
    tools: {
      matched: ['Docker', 'AWS'],
      critical_missing: [],
      nice_to_have_missing: [],
      match_percentage: 70,
    },
    experience: {
      matched_types: ['software_development'],
      missing_types: [],
      coverage_score: 70,
    },
    seniority: {
      user_level: 'mid',
      role_expected: 'mid',
      alignment,
      gap_years: alignment === 'underqualified' ? 2 : 0,
    },
    industry: {
      keywords_matched: ['tech'],
      keywords_missing: [],
      match_percentage: 80,
    },
  };
}

// ==================== Categorization Tests ====================

describe('Job Categorization', () => {
  describe('categorizeJob', () => {
    test('should categorize high fit aligned job as target', () => {
      const { category, reasoning } = categorizeJob(75, createMockGaps(75, 'aligned', 1));
      expect(category).toBe('target');
      expect(reasoning).toBeTruthy();
    });

    test('should categorize high fit overqualified job as safety', () => {
      const { category } = categorizeJob(85, createMockGaps(85, 'overqualified', 0));
      expect(category).toBe('safety');
    });

    test('should categorize moderate fit underqualified job as reach', () => {
      const { category } = categorizeJob(65, createMockGaps(65, 'underqualified', 2));
      expect(['reach', 'target']).toContain(category);
    });

    test('should categorize low fit job as avoid', () => {
      const { category } = categorizeJob(40, createMockGaps(40, 'underqualified', 6));
      expect(category).toBe('avoid');
    });

    test('should categorize job with too many gaps as avoid', () => {
      const { category } = categorizeJob(60, createMockGaps(60, 'aligned', 8));
      expect(category).toBe('avoid');
    });
  });

  describe('categorizeByFitScore', () => {
    test('should categorize high score as safety', () => {
      expect(categorizeByFitScore(85)).toBe('safety');
    });

    test('should categorize moderate score as target', () => {
      expect(categorizeByFitScore(70)).toBe('target');
    });

    test('should categorize low-moderate score as reach', () => {
      expect(categorizeByFitScore(55)).toBe('reach');
    });

    test('should categorize very low score as avoid', () => {
      expect(categorizeByFitScore(40)).toBe('avoid');
    });
  });

  describe('shouldUserApply', () => {
    test('should recommend apply for target with good fit', () => {
      const { shouldApply, reasoning } = shouldUserApply(70, 'target', true);
      expect(shouldApply).toBe(true);
      expect(reasoning).toBeTruthy();
    });

    test('should not recommend apply for avoid category', () => {
      const { shouldApply } = shouldUserApply(60, 'avoid', true);
      expect(shouldApply).toBe(false);
    });

    test('should not recommend apply when constraints fail', () => {
      const { shouldApply } = shouldUserApply(70, 'target', false);
      expect(shouldApply).toBe(false);
    });

    test('should not recommend apply for very low fit', () => {
      const { shouldApply } = shouldUserApply(35, 'reach', true);
      expect(shouldApply).toBe(false);
    });
  });

  describe('checkHardConstraints', () => {
    test('should pass when all constraints met', () => {
      const job = createParsedJob(JOB_SOFTWARE_ENGINEER_TARGET);
      const { passed } = checkHardConstraints(job, {
        work_arrangement: ['remote', 'hybrid'],
      });
      expect(passed).toBe(true);
    });

    test('should fail when work arrangement not matched', () => {
      const job = createParsedJob(JOB_POOR_FIT_AVOID);
      const { passed, reason } = checkHardConstraints(job, {
        work_arrangement: ['remote'],
      });
      expect(passed).toBe(false);
      expect(reason).toMatch(/work arrangement/i);
    });

    test('should fail when salary below minimum', () => {
      const job = createParsedJob(JOB_JUNIOR_DEVELOPER_SAFETY);
      const { passed, reason } = checkHardConstraints(job, {
        salary_minimum: 150000,
      });
      expect(passed).toBe(false);
    });
  });
});

// ==================== Scoring Tests ====================

describe('Scoring Components', () => {
  describe('calculateUrgencyScore', () => {
    test('should give high score for near deadline', () => {
      const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const score = calculateUrgencyScore(undefined, deadline, new Date().toISOString());
      expect(score).toBeGreaterThan(70);
    });

    test('should give low score for past deadline', () => {
      const deadline = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const score = calculateUrgencyScore(undefined, deadline, new Date().toISOString());
      expect(score).toBeLessThan(30);
    });

    test('should consider recently posted', () => {
      const postedDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const score = calculateUrgencyScore(postedDate, undefined, new Date().toISOString());
      expect(score).toBeGreaterThan(40);
    });
  });

  describe('calculateFreshnessScore', () => {
    test('should give high score for today', () => {
      const score = calculateFreshnessScore(undefined, new Date().toISOString());
      expect(score).toBeGreaterThanOrEqual(90);
    });

    test('should give lower score for old posts', () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const score = calculateFreshnessScore(oldDate, new Date().toISOString());
      expect(score).toBeLessThan(50);
    });
  });

  describe('calculatePreferenceMatch', () => {
    test('should give high score when preferences match', () => {
      const job = createParsedJob(JOB_SOFTWARE_ENGINEER_TARGET);
      const score = calculatePreferenceMatch(job, TEST_USER_PREFERENCES as UserPreferences);
      expect(score).toBeGreaterThan(50);
    });
  });

  describe('determineJobFlags', () => {
    test('should detect new job', () => {
      const job = createParsedJob(JOB_SOFTWARE_ENGINEER_TARGET);
      job.created_at = new Date().toISOString(); // Just created
      const flags = determineJobFlags(job, 80);
      expect(flags.new).toBe(true);
    });

    test('should detect dream job', () => {
      const job = createParsedJob(JOB_FULLSTACK_GOOGLE);
      const flags = determineJobFlags(job, 90);
      expect(flags.dream_job).toBe(true);
    });

    test('should detect applied job', () => {
      const job = createParsedJob(JOB_SOFTWARE_ENGINEER_TARGET);
      const flags = determineJobFlags(job, 70, [job.canonical_id]);
      expect(flags.applied).toBe(true);
    });
  });
});

// ==================== Career Capital Tests ====================

describe('Career Capital Analysis', () => {
  test('should score Google as high brand', () => {
    const job = createParsedJob(JOB_FULLSTACK_GOOGLE);
    const capital = calculateCareerCapital(job);
    expect(capital.brand_score).toBeGreaterThan(80);
  });

  test('should score startup as lower brand', () => {
    const job = createParsedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const capital = calculateCareerCapital(job);
    expect(capital.brand_score).toBeLessThan(80);
  });

  test('should include all breakdown components', () => {
    const job = createParsedJob(JOB_SENIOR_ENGINEER_REACH);
    const capital = calculateCareerCapital(job);
    expect(capital.breakdown.brand).toBeTruthy();
    expect(capital.breakdown.skill_growth).toBeTruthy();
    expect(capital.breakdown.network).toBeTruthy();
    expect(capital.breakdown.comp).toBeTruthy();
  });
});

// ==================== Scam Detection Tests ====================

describe('Scam Detection', () => {
  test('should detect scam job with high risk', () => {
    const job = createParsedJob(JOB_SCAM);
    const result = detectScamRisk(job);
    expect(result.risk_level).toBe('high');
    expect(result.red_flags.length).toBeGreaterThan(0);
  });

  test('should not flag legitimate job as scam', () => {
    const job = createParsedJob(JOB_SOFTWARE_ENGINEER_TARGET);
    const result = detectScamRisk(job);
    expect(result.risk_level).not.toBe('high');
  });

  test('should flag incomplete job with low-medium risk', () => {
    const job = createParsedJob(JOB_INCOMPLETE);
    const result = detectScamRisk(job);
    expect(['low', 'medium']).toContain(result.risk_level);
  });
});

// ==================== Insights Tests ====================

describe('Insights Generation', () => {
  describe('generateJobInsights', () => {
    test('should generate quick insights', () => {
      const job = createParsedJob(JOB_SOFTWARE_ENGINEER_TARGET);
      const capital = calculateCareerCapital(job);
      const { quickInsights, redFlags, greenFlags } = generateJobInsights(
        job,
        null, // No fit analysis
        'target',
        capital
      );

      expect(quickInsights.length).toBeGreaterThan(0);
      expect(quickInsights.length).toBeLessThanOrEqual(7);
    });

    test('should include green flags for high fit', () => {
      const job = createParsedJob(JOB_FULLSTACK_GOOGLE);
      const capital = calculateCareerCapital(job);
      const mockFit = {
        fit_score: 85,
        gaps: createMockGaps(85, 'aligned', 0),
      };
      const { greenFlags } = generateJobInsights(
        job,
        mockFit as any,
        'target',
        capital
      );

      expect(greenFlags.length).toBeGreaterThan(0);
    });

    test('should include red flags for avoid category', () => {
      const job = createParsedJob(JOB_POOR_FIT_AVOID);
      const capital = calculateCareerCapital(job);
      const { redFlags } = generateJobInsights(
        job,
        null,
        'avoid',
        capital
      );

      expect(redFlags.length).toBeGreaterThan(0);
    });
  });

  describe('generateComparisonInsights', () => {
    test('should generate comparison insights', () => {
      const jobs = [
        {
          job_id: '1',
          job_title: 'SWE',
          company: 'A',
          fit_score: 80,
          category: 'target',
          required_skills: ['JS', 'React'],
          career_capital_score: 70,
        },
        {
          job_id: '2',
          job_title: 'SWE',
          company: 'B',
          fit_score: 70,
          category: 'reach',
          required_skills: ['JS', 'Python'],
          career_capital_score: 60,
        },
      ];

      const insights = generateComparisonInsights(jobs);

      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(i => i.includes('Best fit'))).toBe(true);
    });

    test('should identify common requirements', () => {
      const jobs = [
        {
          job_id: '1',
          job_title: 'SWE',
          company: 'A',
          fit_score: 80,
          category: 'target',
          required_skills: ['JavaScript', 'React', 'Node.js'],
          career_capital_score: 70,
        },
        {
          job_id: '2',
          job_title: 'SWE',
          company: 'B',
          fit_score: 70,
          category: 'reach',
          required_skills: ['JavaScript', 'React', 'Python'],
          career_capital_score: 60,
        },
      ];

      const insights = generateComparisonInsights(jobs);

      expect(insights.some(i => i.includes('Common'))).toBe(true);
    });
  });
});
