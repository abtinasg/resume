/**
 * Layer 2 - Strategy Engine
 * Gap Analysis Tests
 *
 * Tests for all gap analysis modules: skills, tools, experience, seniority, industry.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  analyzeSkillsGap,
  analyzeToolsGap,
  analyzeExperienceGap,
  analyzeSeniorityGap,
  analyzeIndustryGap,
  analyzeAllGaps,
  detectExperienceTypes,
} from '../gap-analysis';
import {
  MINIMAL_REQUEST,
  SCENARIO_STRONG_RESUME_NO_APPS,
  SCENARIO_ENTRY_TARGETING_SENIOR,
  SCENARIO_CAREER_SWITCHER,
} from './fixtures/scenarios';
import { SeniorityLevel } from '../types';
import { clearConfigCache } from '../config';
import { clearCanonicalizationCache, clearTaxonomyCache } from '../normalization';

// ==================== Setup ====================

beforeEach(() => {
  // Clear caches between tests for isolation
  clearConfigCache();
  clearCanonicalizationCache();
  clearTaxonomyCache();
});

// ==================== Skills Gap Tests ====================

describe('Skills Gap Analysis', () => {
  test('should return perfect match for exact skill overlap', () => {
    const result = analyzeSkillsGap({
      resumeSkills: ['typescript', 'react', 'node.js'],
      requiredSkills: ['typescript', 'react', 'node.js'],
    });

    expect(result.match_percentage).toBe(100);
    expect(result.critical_missing).toHaveLength(0);
    expect(result.matched).toHaveLength(3);
  });

  test('should identify missing skills', () => {
    const result = analyzeSkillsGap({
      resumeSkills: ['javascript', 'html', 'css'],
      requiredSkills: ['typescript', 'react', 'node.js'],
    });

    expect(result.match_percentage).toBe(0);
    expect(result.critical_missing).toHaveLength(3);
    expect(result.matched).toHaveLength(0);
  });

  test('should handle partial match', () => {
    const result = analyzeSkillsGap({
      resumeSkills: ['typescript', 'react', 'python'],
      requiredSkills: ['typescript', 'react', 'node.js', 'kubernetes'],
    });

    expect(result.match_percentage).toBe(50);
    expect(result.matched).toContain('typescript');
    expect(result.matched).toContain('react');
    expect(result.critical_missing).toContain('node.js');
    expect(result.critical_missing).toContain('kubernetes');
  });

  test('should apply synonym mapping', () => {
    const result = analyzeSkillsGap({
      resumeSkills: ['js', 'ts'], // Synonyms for javascript, typescript
      requiredSkills: ['javascript', 'typescript'],
    });

    expect(result.match_percentage).toBe(100);
    expect(result.matched).toHaveLength(2);
  });

  test('should use keyword importance for criticality', () => {
    const result = analyzeSkillsGap({
      resumeSkills: ['javascript'],
      requiredSkills: ['typescript', 'react', 'vue'],
      keywordImportance: {
        typescript: 'critical',
        react: 'important',
        vue: 'nice',
      },
    });

    expect(result.critical_missing).toContain('typescript');
    expect(result.critical_missing).toContain('react');
    expect(result.nice_to_have_missing).toContain('vue');
  });

  test('should handle empty inputs gracefully', () => {
    const result = analyzeSkillsGap({
      resumeSkills: [],
      requiredSkills: [],
    });

    expect(result.match_percentage).toBe(100); // Nothing required
    expect(result.confidence).toBe('low');
  });

  test('should set appropriate confidence levels', () => {
    const withRequirements = analyzeSkillsGap({
      resumeSkills: ['typescript'],
      requiredSkills: ['typescript', 'react'],
    });

    expect(withRequirements.confidence).toBe('medium');

    const withImportance = analyzeSkillsGap({
      resumeSkills: ['typescript'],
      requiredSkills: ['typescript', 'react'],
      keywordImportance: { typescript: 'critical' },
    });

    expect(withImportance.confidence).toBe('high');
  });
});

// ==================== Tools Gap Tests ====================

describe('Tools Gap Analysis', () => {
  test('should identify matched and missing tools', () => {
    const result = analyzeToolsGap({
      resumeTools: ['docker', 'kubernetes', 'git'],
      requiredTools: ['docker', 'kubernetes', 'terraform'],
    });

    expect(result.matched).toContain('docker');
    expect(result.matched).toContain('kubernetes');
    expect(result.critical_missing).toContain('terraform');
  });

  test('should handle tool synonyms', () => {
    const result = analyzeToolsGap({
      resumeTools: ['k8s'], // Synonym for kubernetes
      requiredTools: ['kubernetes'],
    });

    expect(result.match_percentage).toBe(100);
  });

  test('should handle empty tool lists', () => {
    const result = analyzeToolsGap({
      resumeTools: ['docker'],
      requiredTools: [],
    });

    expect(result.match_percentage).toBe(100);
    expect(result.confidence).toBe('low');
  });
});

// ==================== Experience Gap Tests ====================

describe('Experience Gap Analysis', () => {
  test('should detect leadership experience from titles and bullets', () => {
    const types = detectExperienceTypes(
      ['Senior Team Lead', 'Manager'],
      ['Led a team of 10 engineers', 'Mentored junior developers']
    );

    expect(types).toContain('leadership');
    expect(types).toContain('mentorship');
  });

  test('should detect cross-functional experience', () => {
    const types = detectExperienceTypes(
      ['Software Engineer'],
      ['Collaborated with product and design teams', 'Partnered with stakeholders']
    );

    expect(types).toContain('cross_functional');
  });

  test('should detect data-driven experience', () => {
    const types = detectExperienceTypes(
      ['Data Analyst'],
      ['Used analytics to drive decisions', 'Conducted A/B tests', 'Measured KPIs']
    );

    expect(types).toContain('data_driven');
  });

  test('should calculate coverage score', () => {
    const result = analyzeExperienceGap({
      titles: ['Software Engineer'],
      bulletsSample: ['Led team of 5', 'Shipped 3 major features', 'Collaborated with product'],
      requiredTypes: ['leadership', 'shipping_ownership', 'cross_functional'],
    });

    expect(result.coverage_score).toBeGreaterThan(0);
    expect(result.coverage_score).toBeLessThanOrEqual(100);
  });

  test('should handle empty inputs', () => {
    const result = analyzeExperienceGap({
      titles: [],
      bulletsSample: [],
    });

    expect(result.confidence).toBe('low');
    expect(result.present_types.length).toBeGreaterThanOrEqual(0);
  });
});

// ==================== Seniority Gap Tests ====================

describe('Seniority Gap Analysis', () => {
  test('should detect aligned seniority', () => {
    const result = analyzeSeniorityGap({
      currentTitle: 'Senior Software Engineer',
      yearsExperience: 6,
      targetSeniority: SeniorityLevel.SENIOR,
    });

    expect(result.alignment).toBe('aligned');
    expect(result.user_level).toBe(SeniorityLevel.SENIOR);
    expect(result.role_expected).toBe(SeniorityLevel.SENIOR);
  });

  test('should detect underqualified seniority', () => {
    const result = analyzeSeniorityGap({
      currentTitle: 'Junior Developer',
      yearsExperience: 1,
      targetSeniority: SeniorityLevel.SENIOR,
    });

    expect(result.alignment).toBe('underqualified');
    expect(result.gap_years).toBeDefined();
    expect(result.gap_years).toBeGreaterThan(0);
  });

  test('should detect overqualified seniority', () => {
    const result = analyzeSeniorityGap({
      currentTitle: 'Principal Engineer',
      yearsExperience: 15,
      targetSeniority: SeniorityLevel.MID,
    });

    expect(result.alignment).toBe('overqualified');
  });

  test('should use AI seniority when available', () => {
    const result = analyzeSeniorityGap({
      currentTitle: 'Engineer', // Ambiguous title
      yearsExperience: 3,
      aiSeniority: SeniorityLevel.MID,
      aiConfidence: 'high',
      targetSeniority: SeniorityLevel.MID,
    });

    expect(result.user_level).toBe(SeniorityLevel.MID);
    expect(result.confidence).toBe('high');
  });

  test('should flag title-years mismatch', () => {
    const result = analyzeSeniorityGap({
      currentTitle: 'CTO', // Lead title
      yearsExperience: 2, // Entry-level years
      targetSeniority: SeniorityLevel.LEAD,
    });

    expect(result.flags).toContain('TITLE_YEARS_MISMATCH');
    expect(result.confidence).toBe('medium');
  });

  test('should use years mapping when no title/AI', () => {
    const result = analyzeSeniorityGap({
      yearsExperience: 4,
      targetSeniority: SeniorityLevel.MID,
    });

    expect(result.user_level).toBe(SeniorityLevel.MID);
    expect(result.alignment).toBe('aligned');
  });
});

// ==================== Industry Gap Tests ====================

describe('Industry Gap Analysis', () => {
  test('should identify matched industry keywords', () => {
    const result = analyzeIndustryGap({
      resumeIndustries: ['fintech'],
      resumeSkills: ['payments', 'compliance', 'kyc'],
      domainKeywords: ['fintech', 'payments', 'banking'],
    });

    expect(result.keywords_matched.length).toBeGreaterThan(0);
    expect(result.match_percentage).toBeGreaterThan(0);
  });

  test('should identify industry gap for career switch', () => {
    const result = analyzeIndustryGap({
      resumeIndustries: ['healthcare'],
      resumeSkills: ['hipaa', 'ehr'],
      domainKeywords: ['fintech', 'payments', 'trading'],
    });

    expect(result.keywords_missing.length).toBeGreaterThan(0);
    expect(result.match_percentage).toBeLessThan(50);
  });

  test('should handle no target industry', () => {
    const result = analyzeIndustryGap({
      resumeIndustries: ['technology'],
      resumeSkills: ['python', 'javascript'],
    });

    expect(result.match_percentage).toBe(100);
    expect(result.confidence).toBe('low');
  });
});

// ==================== Aggregated Gap Analysis Tests ====================

describe('Aggregated Gap Analysis', () => {
  test('should analyze all gaps from scenario', () => {
    const { layer1_evaluation, layer4_state, job_context } = SCENARIO_STRONG_RESUME_NO_APPS.request;

    const gaps = analyzeAllGaps(layer1_evaluation, layer4_state, job_context);

    expect(gaps.skills).toBeDefined();
    expect(gaps.tools).toBeDefined();
    expect(gaps.experience).toBeDefined();
    expect(gaps.seniority).toBeDefined();
    expect(gaps.industry).toBeDefined();

    // Strong resume should have good matches
    expect(gaps.skills.match_percentage).toBeGreaterThan(70);
    expect(gaps.seniority.alignment).toBe('aligned');
  });

  test('should identify gaps for entry targeting senior', () => {
    const { layer1_evaluation, layer4_state, job_context } = SCENARIO_ENTRY_TARGETING_SENIOR.request;

    const gaps = analyzeAllGaps(layer1_evaluation, layer4_state, job_context);

    // Should identify seniority mismatch
    expect(gaps.seniority.alignment).toBe('underqualified');
    // Should have critical missing skills
    expect(gaps.skills.critical_missing.length).toBeGreaterThan(0);
  });

  test('should identify industry gap for career switcher', () => {
    const { layer1_evaluation, layer4_state, job_context } = SCENARIO_CAREER_SWITCHER.request;

    const gaps = analyzeAllGaps(layer1_evaluation, layer4_state, job_context);

    // Should have some industry mismatch
    expect(gaps.industry.match_percentage).toBeLessThan(100);
    // But has relevant skills
    expect(gaps.skills.matched.length).toBeGreaterThan(0);
  });

  test('should work with minimal input', () => {
    const { layer1_evaluation, layer4_state } = MINIMAL_REQUEST;

    const gaps = analyzeAllGaps(layer1_evaluation, layer4_state);

    expect(gaps.skills).toBeDefined();
    expect(gaps.tools).toBeDefined();
    expect(gaps.experience).toBeDefined();
    expect(gaps.seniority).toBeDefined();
    expect(gaps.industry).toBeDefined();

    // Should have low confidence without job context
    expect(gaps.skills.confidence).toBe('low');
  });
});
