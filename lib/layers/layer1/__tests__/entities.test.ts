/**
 * Layer 1 - Evaluation Engine
 * Entity Extraction Tests
 *
 * Tests for skill, tool, title, and industry extraction.
 */

import { describe, test, expect } from '@jest/globals';
import {
  EXCEPTIONAL_SENIOR_SWE,
  STRONG_MID_LEVEL_PM,
  FAIR_WEAK_CONTENT,
} from './fixtures/resumes';
import { SeniorityLevel } from '../../shared/types';
import {
  extractEntities,
  normalizeTitle,
  inferSeniorityFromTitle,
  areSkillsTransferable,
  findTransferableSkills,
} from '../modules/entity-extraction';
import {
  normalizeSkill,
  normalizeSkills,
  findSkillCategory,
} from '../config/skills';
import {
  detectToolsInText,
  normalizeTool,
} from '../config/tools';
import {
  detectIndustries,
  getIndustryDisplayName,
} from '../config/industries';
import {
  getCompanyIndustry,
  isFAANGCompany,
  isUnicornCompany,
} from '../config/companies';

// ==================== Skill Normalization Tests ====================

describe('Skill Normalization', () => {
  test('should normalize JavaScript variations', () => {
    expect(normalizeSkill('js')).toBe('JavaScript');
    expect(normalizeSkill('javascript')).toBe('JavaScript');
    expect(normalizeSkill('Java Script')).toBe('JavaScript');
  });

  test('should normalize Node.js variations', () => {
    expect(normalizeSkill('nodejs')).toBe('Node.js');
    expect(normalizeSkill('node')).toBe('Node.js');
    expect(normalizeSkill('node.js')).toBe('Node.js');
  });

  test('should normalize framework names', () => {
    expect(normalizeSkill('react')).toBe('React');
    expect(normalizeSkill('reactjs')).toBe('React');
    expect(normalizeSkill('vue')).toBe('Vue.js');
    expect(normalizeSkill('angular')).toBe('Angular');
  });

  test('should normalize cloud platform names', () => {
    expect(normalizeSkill('aws')).toBe('AWS');
    expect(normalizeSkill('amazon web services')).toBe('AWS');
    expect(normalizeSkill('gcp')).toBe('Google Cloud');
  });

  test('should normalize array of skills', () => {
    const skills = ['js', 'nodejs', 'react', 'aws'];
    const normalized = normalizeSkills(skills);

    expect(normalized).toContain('JavaScript');
    expect(normalized).toContain('Node.js');
    expect(normalized).toContain('React');
    expect(normalized).toContain('AWS');
  });

  test('should deduplicate normalized skills', () => {
    const skills = ['js', 'javascript', 'JavaScript'];
    const normalized = normalizeSkills(skills);

    expect(normalized.length).toBe(1);
    expect(normalized[0]).toBe('JavaScript');
  });

  test('should preserve unknown skills', () => {
    const skill = 'CustomFramework';
    expect(normalizeSkill(skill)).toBe('CustomFramework');
  });
});

// ==================== Skill Category Tests ====================

describe('Skill Categories', () => {
  test('should find category for programming languages', () => {
    expect(findSkillCategory('JavaScript')).toBe('programming_languages');
    expect(findSkillCategory('Python')).toBe('programming_languages');
    expect(findSkillCategory('Java')).toBe('programming_languages');
  });

  test('should find category for frameworks', () => {
    expect(findSkillCategory('React')).toBe('frontend_frameworks');
    expect(findSkillCategory('Node.js')).toBe('backend_frameworks');
    expect(findSkillCategory('Django')).toBe('backend_frameworks');
  });

  test('should return null for unknown skills', () => {
    expect(findSkillCategory('UnknownSkill')).toBeNull();
  });
});

// ==================== Tool Detection Tests ====================

describe('Tool Detection', () => {
  test('should detect tools in text', () => {
    const text = 'Experience with Docker, Kubernetes, and Jenkins for CI/CD';
    const tools = detectToolsInText(text);

    expect(tools).toContain('Docker');
    expect(tools).toContain('Kubernetes');
    expect(tools).toContain('Jenkins');
  });

  test('should detect cloud platforms', () => {
    const text = 'AWS and Google Cloud experience required';
    const tools = detectToolsInText(text);

    expect(tools).toContain('AWS');
    expect(tools).toContain('Google Cloud');
  });

  test('should normalize tool names', () => {
    expect(normalizeTool('k8s')).toBe('Kubernetes');
    expect(normalizeTool('gcp')).toBe('Google Cloud');
  });
});

// ==================== Industry Detection Tests ====================

describe('Industry Detection', () => {
  test('should detect fintech keywords', () => {
    const text = 'Building payment processing systems and digital banking solutions';
    const industries = detectIndustries(text);

    expect(industries).toContain('fintech');
  });

  test('should detect healthcare keywords', () => {
    const text = 'Working on telehealth platform for patients and physicians';
    const industries = detectIndustries(text);

    expect(industries).toContain('healthcare');
  });

  test('should get display name for industry', () => {
    expect(getIndustryDisplayName('fintech')).toBe('FinTech');
    expect(getIndustryDisplayName('software')).toBe('Software & Technology');
  });
});

// ==================== Company Recognition Tests ====================

describe('Company Recognition', () => {
  test('should recognize FAANG companies', () => {
    expect(isFAANGCompany('Google')).toBe(true);
    expect(isFAANGCompany('Meta')).toBe(true);
    expect(isFAANGCompany('Amazon')).toBe(true);
    expect(isFAANGCompany('Apple')).toBe(true);
    expect(isFAANGCompany('Netflix')).toBe(true);
    expect(isFAANGCompany('Microsoft')).toBe(true);
  });

  test('should recognize unicorn companies', () => {
    expect(isUnicornCompany('Stripe')).toBe(true);
    expect(isUnicornCompany('Airbnb')).toBe(true);
    expect(isUnicornCompany('OpenAI')).toBe(true);
  });

  test('should get company industry', () => {
    expect(getCompanyIndustry('Google')).toBe('software');
    expect(getCompanyIndustry('Goldman Sachs')).toBe('finance');
    expect(getCompanyIndustry('Stripe')).toBe('fintech');
  });

  test('should handle unknown companies', () => {
    expect(getCompanyIndustry('Unknown Startup Inc')).toBeNull();
    expect(isFAANGCompany('Unknown Company')).toBe(false);
  });
});

// ==================== Title Normalization Tests ====================

describe('Title Normalization', () => {
  test('should expand abbreviations', () => {
    expect(normalizeTitle('Sr. Software Engineer')).toBe('Senior Software Engineer');
    expect(normalizeTitle('Jr. Developer')).toBe('Junior Developer');
    expect(normalizeTitle('VP of Engineering')).toBe('Vice President of Engineering');
  });

  test('should normalize full stack variations', () => {
    expect(normalizeTitle('Fullstack Developer')).toBe('Full Stack Developer');
    expect(normalizeTitle('Full-stack Engineer')).toBe('Full Stack Engineer');
  });

  test('should handle role abbreviations', () => {
    expect(normalizeTitle('SWE')).toContain('Software');
    expect(normalizeTitle('PM')).toContain('Manager');
  });
});

// ==================== Seniority Inference Tests ====================

describe('Seniority Inference', () => {
  test('should infer senior from title', () => {
    expect(inferSeniorityFromTitle('Senior Software Engineer')).toBe(SeniorityLevel.SENIOR);
    expect(inferSeniorityFromTitle('Sr. Developer')).toBe(SeniorityLevel.SENIOR);
  });

  test('should infer lead from title', () => {
    expect(inferSeniorityFromTitle('Lead Engineer')).toBe(SeniorityLevel.LEAD);
    expect(inferSeniorityFromTitle('Principal Engineer')).toBe(SeniorityLevel.LEAD);
    expect(inferSeniorityFromTitle('Staff Engineer')).toBe(SeniorityLevel.LEAD);
    expect(inferSeniorityFromTitle('Director of Engineering')).toBe(SeniorityLevel.LEAD);
  });

  test('should infer entry from title', () => {
    expect(inferSeniorityFromTitle('Junior Developer')).toBe(SeniorityLevel.ENTRY);
    expect(inferSeniorityFromTitle('Software Engineer Intern')).toBe(SeniorityLevel.ENTRY);
    expect(inferSeniorityFromTitle('Associate Developer')).toBe(SeniorityLevel.ENTRY);
  });

  test('should default to mid for ambiguous titles', () => {
    expect(inferSeniorityFromTitle('Software Engineer')).toBe(SeniorityLevel.MID);
    expect(inferSeniorityFromTitle('Developer')).toBe(SeniorityLevel.MID);
  });
});

// ==================== Skill Transfer Tests ====================

describe('Skill Transferability', () => {
  test('should recognize transferable skills', () => {
    expect(areSkillsTransferable('Python', 'scripting')).toBe(true);
    expect(areSkillsTransferable('React', 'frontend')).toBe(true);
    expect(areSkillsTransferable('AWS', 'Google Cloud')).toBe(true);
  });

  test('should find transferable skills from resume', () => {
    const resumeSkills = ['React', 'JavaScript', 'AWS'];
    const missingSkills = ['frontend', 'Google Cloud'];
    const transferable = findTransferableSkills(resumeSkills, missingSkills);

    expect(transferable.length).toBeGreaterThan(0);
  });
});

// ==================== Entity Extraction Integration Tests ====================

describe('Entity Extraction Integration', () => {
  test('should extract skills from exceptional resume', () => {
    const { parsed_resume, expected_skills } = EXCEPTIONAL_SENIOR_SWE;
    const entities = extractEntities(parsed_resume);

    for (const skill of expected_skills || []) {
      expect(entities.skills.some(s => 
        s.toLowerCase().includes(skill.toLowerCase())
      )).toBe(true);
    }
  });

  test('should extract tools from exceptional resume', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const entities = extractEntities(parsed_resume);

    expect(entities.tools.length).toBeGreaterThan(5);
    expect(entities.tools).toContain('Docker');
    expect(entities.tools).toContain('Kubernetes');
  });

  test('should extract titles from resume', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const entities = extractEntities(parsed_resume);

    expect(entities.titles.length).toBeGreaterThan(0);
    expect(entities.titles[0]).toContain('Engineer');
  });

  test('should extract companies from resume', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const entities = extractEntities(parsed_resume);

    expect(entities.companies.length).toBeGreaterThan(0);
    expect(entities.companies).toContain('Meta');
  });

  test('should infer industries from companies', () => {
    const { parsed_resume } = EXCEPTIONAL_SENIOR_SWE;
    const entities = extractEntities(parsed_resume);

    expect(entities.industries).toBeDefined();
    expect(entities.industries?.length).toBeGreaterThan(0);
  });

  test('should handle resume with few skills', () => {
    const { parsed_resume } = FAIR_WEAK_CONTENT;
    const entities = extractEntities(parsed_resume);

    // Should still work, just with fewer results
    expect(entities.skills).toBeDefined();
    expect(entities.titles).toBeDefined();
  });
});
