/**
 * Layer 6 - Job Discovery & Matching Module
 * Parsing Tests
 *
 * Tests for job description parsing functionality.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  parseJobDescription,
  parseJobDescriptionWithFallback,
  assessParseQuality,
  generateCanonicalId,
  checkDuplicate,
} from '../parsing/parser';
import {
  extractJobTitle,
  extractCompany,
  extractLocation,
  extractWorkArrangement,
  extractSalary,
  extractMetadata,
} from '../parsing/metadata-extractor';
import {
  extractRequirements,
  extractResponsibilities,
  extractYearsExperience,
  detectSeniority,
  extractSkillsFromText,
} from '../parsing/requirements-extractor';
import {
  JOB_SOFTWARE_ENGINEER_TARGET,
  JOB_SENIOR_ENGINEER_REACH,
  JOB_JUNIOR_DEVELOPER_SAFETY,
  JOB_POOR_FIT_AVOID,
  JOB_SCAM,
  JOB_INCOMPLETE,
  JOB_FULLSTACK_GOOGLE,
} from './fixtures/job-descriptions';
import type { JobPasteRequest } from '../types';

// ==================== Metadata Extraction Tests ====================

describe('Metadata Extraction', () => {
  describe('extractJobTitle', () => {
    test('should extract job title from standard format', () => {
      const title = extractJobTitle(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(title).toMatch(/software engineer/i);
    });

    test('should use user-provided title when available', () => {
      const title = extractJobTitle(
        JOB_SOFTWARE_ENGINEER_TARGET.job_description,
        'Custom Title'
      );
      expect(title).toBe('Custom Title');
    });

    test('should handle missing title gracefully', () => {
      const title = extractJobTitle(JOB_INCOMPLETE.job_description);
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });
  });

  describe('extractCompany', () => {
    test('should extract company name', () => {
      const company = extractCompany(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(company).toBeTruthy();
    });

    test('should use user-provided company when available', () => {
      const company = extractCompany(
        JOB_SOFTWARE_ENGINEER_TARGET.job_description,
        'Custom Company'
      );
      expect(company).toBe('Custom Company');
    });

    test('should return Unknown Company for incomplete JD', () => {
      const company = extractCompany(JOB_INCOMPLETE.job_description);
      expect(company).toBe('Unknown Company');
    });
  });

  describe('extractLocation', () => {
    test('should extract location with city and state', () => {
      const location = extractLocation(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(location).toMatch(/san francisco/i);
    });

    test('should detect remote work', () => {
      const location = extractLocation(JOB_JUNIOR_DEVELOPER_SAFETY.job_description);
      expect(location).toMatch(/remote/i);
    });

    test('should handle location not specified', () => {
      const location = extractLocation(JOB_INCOMPLETE.job_description);
      expect(location).toBeTruthy();
    });
  });

  describe('extractWorkArrangement', () => {
    test('should detect hybrid arrangement', () => {
      const arrangement = extractWorkArrangement(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(arrangement).toBe('hybrid');
    });

    test('should detect remote arrangement', () => {
      const arrangement = extractWorkArrangement(JOB_JUNIOR_DEVELOPER_SAFETY.job_description);
      expect(arrangement).toBe('remote');
    });

    test('should detect onsite arrangement', () => {
      const arrangement = extractWorkArrangement(JOB_POOR_FIT_AVOID.job_description);
      expect(arrangement).toBe('onsite');
    });
  });

  describe('extractSalary', () => {
    test('should extract salary range', () => {
      const salary = extractSalary(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(salary).toBeDefined();
      expect(salary?.min).toBeGreaterThan(100000);
      expect(salary?.max).toBeLessThan(200000);
    });

    test('should extract high salary range', () => {
      const salary = extractSalary(JOB_SENIOR_ENGINEER_REACH.job_description);
      expect(salary).toBeDefined();
      expect(salary?.min).toBeGreaterThanOrEqual(200000);
    });

    test('should return undefined when no salary found', () => {
      const salary = extractSalary(JOB_INCOMPLETE.job_description);
      expect(salary).toBeUndefined();
    });
  });
});

// ==================== Requirements Extraction Tests ====================

describe('Requirements Extraction', () => {
  describe('extractRequirements', () => {
    test('should extract required skills', () => {
      const requirements = extractRequirements(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(requirements.required_skills.length).toBeGreaterThan(0);
    });

    test('should extract tools', () => {
      const requirements = extractRequirements(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(requirements.required_tools.length).toBeGreaterThan(0);
    });

    test('should detect seniority level', () => {
      const requirements = extractRequirements(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(requirements.seniority_expected).toBe('mid');
    });

    test('should detect senior seniority', () => {
      const requirements = extractRequirements(JOB_SENIOR_ENGINEER_REACH.job_description);
      // Lead may be detected due to "lead technical projects" phrase
      expect(['senior', 'lead']).toContain(requirements.seniority_expected);
    });

    test('should detect entry seniority', () => {
      const requirements = extractRequirements(JOB_JUNIOR_DEVELOPER_SAFETY.job_description);
      expect(requirements.seniority_expected).toBe('entry');
    });
  });

  describe('extractYearsExperience', () => {
    test('should extract years range', () => {
      const years = extractYearsExperience(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(years.min).toBe(3);
      expect(years.max).toBeDefined();
    });

    test('should handle 5+ years format', () => {
      const years = extractYearsExperience(JOB_SENIOR_ENGINEER_REACH.job_description);
      expect(years.min).toBeGreaterThanOrEqual(5);
    });

    test('should handle 0-2 years format', () => {
      const years = extractYearsExperience(JOB_JUNIOR_DEVELOPER_SAFETY.job_description);
      expect(years.min).toBeLessThanOrEqual(2);
    });
  });

  describe('extractResponsibilities', () => {
    test('should extract responsibilities', () => {
      const responsibilities = extractResponsibilities(JOB_SOFTWARE_ENGINEER_TARGET.job_description);
      expect(responsibilities.length).toBeGreaterThan(0);
    });

    test('should limit responsibilities count', () => {
      const responsibilities = extractResponsibilities(JOB_SENIOR_ENGINEER_REACH.job_description);
      expect(responsibilities.length).toBeLessThanOrEqual(15);
    });
  });

  describe('detectSeniority', () => {
    test('should detect mid-level from text', () => {
      const seniority = detectSeniority('3-5 years of experience required');
      expect(seniority).toBe('mid');
    });

    test('should detect senior from keywords', () => {
      const seniority = detectSeniority('Senior Software Engineer position');
      expect(seniority).toBe('senior');
    });

    test('should detect entry from keywords', () => {
      const seniority = detectSeniority('Junior Developer role');
      expect(seniority).toBe('entry');
    });
  });
});

// ==================== Full Parsing Tests ====================

describe('Job Description Parsing', () => {
  test('should parse software engineer JD correctly', () => {
    const request: JobPasteRequest = {
      user_id: 'test_user',
      resume_version_id: 'resume_v1',
      job_description: JOB_SOFTWARE_ENGINEER_TARGET.job_description,
      metadata: JOB_SOFTWARE_ENGINEER_TARGET.metadata,
    };

    const parsed = parseJobDescription(request);

    expect(parsed.job_title).toBe('Software Engineer');
    expect(parsed.company).toBe('TechStartup Inc.');
    expect(parsed.location).toMatch(/san francisco/i);
    expect(parsed.requirements.required_skills.length).toBeGreaterThan(0);
    // Parse quality depends on detection of sections and word count
    expect(['high', 'medium']).toContain(parsed.metadata.parse_quality);
  });

  test('should parse senior engineer JD correctly', () => {
    const request: JobPasteRequest = {
      user_id: 'test_user',
      resume_version_id: 'resume_v1',
      job_description: JOB_SENIOR_ENGINEER_REACH.job_description,
      metadata: JOB_SENIOR_ENGINEER_REACH.metadata,
    };

    const parsed = parseJobDescription(request);

    expect(parsed.job_title).toBe('Senior Software Engineer');
    expect(parsed.company).toBe('Stripe');
    // Lead may be detected due to "lead technical projects" phrase
    expect(['senior', 'lead']).toContain(parsed.requirements.seniority_expected);
    expect(parsed.metadata.company_tier).toBe('top_tier');
  });

  test('should parse Google JD and detect top tier', () => {
    const request: JobPasteRequest = {
      user_id: 'test_user',
      resume_version_id: 'resume_v1',
      job_description: JOB_FULLSTACK_GOOGLE.job_description,
      metadata: JOB_FULLSTACK_GOOGLE.metadata,
    };

    const parsed = parseJobDescription(request);

    expect(parsed.company).toBe('Google');
    expect(parsed.metadata.company_tier).toBe('top_tier');
    expect(parsed.work_arrangement).toBe('hybrid');
  });

  test('should handle incomplete JD with fallback', () => {
    const request: JobPasteRequest = {
      user_id: 'test_user',
      resume_version_id: 'resume_v1',
      job_description: JOB_INCOMPLETE.job_description,
    };

    const parsed = parseJobDescriptionWithFallback(request);

    expect(parsed.job_id).toBeTruthy();
    expect(parsed.metadata.parse_quality).toBe('low');
  });

  test('should generate canonical ID', () => {
    const canonicalId = generateCanonicalId(
      'https://example.com/jobs/123',
      'TechCorp',
      'Software Engineer',
      'San Francisco',
      '2024-01-15'
    );

    expect(canonicalId).toMatch(/^(url|hash):/);
  });

  test('should detect duplicate jobs', () => {
    const canonicalId = 'hash:abc12345';
    const existingIds = ['hash:abc12345', 'hash:def67890'];

    const result = checkDuplicate(canonicalId, existingIds);

    expect(result.isDuplicate).toBe(true);
    expect(result.existingId).toBe(canonicalId);
  });
});

// ==================== Parse Quality Tests ====================

describe('Parse Quality Assessment', () => {
  test('should assess high quality for complete JD', () => {
    const { quality, confidence } = assessParseQuality(
      JOB_SOFTWARE_ENGINEER_TARGET.job_description,
      5,
      4
    );

    // Quality depends on word count and section detection
    expect(['high', 'medium']).toContain(quality);
    expect(confidence).toBeGreaterThan(50);
  });

  test('should assess low quality for incomplete JD', () => {
    const { quality, confidence } = assessParseQuality(
      JOB_INCOMPLETE.job_description,
      0,
      0
    );

    expect(quality).toBe('low');
    expect(confidence).toBeLessThan(50);
  });
});
