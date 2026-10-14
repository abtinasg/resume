/**
 * PRO Resume Scoring System - Test Cases
 *
 * Comprehensive test suite for the scoring system.
 * These tests validate the accuracy and reliability of scoring algorithms.
 */

import { calculatePROScore } from '../index';
import type { ContentQualityBreakdown } from '../types';
import {
  detectBulletPoints,
  countQuantifiedBullets,
  categorizeActionVerbs,
  isQuantified,
  findMatchingKeywords,
  estimatePageCount,
  estimateYearsOfExperience,
} from '../analyzers';
import { SAMPLE_RESUME_SOFTWARE_ENGINEER } from './fixtures';

// ==================== Sample Resume Data ====================

const SAMPLE_RESUME_GOOD = `
John Doe
john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Results-driven Product Manager with 5+ years of experience leading cross-functional teams and
delivering data-driven product solutions that increased user engagement by 45%.

EXPERIENCE

Senior Product Manager | TechCorp Inc. | 2020 - Present
- Led roadmap planning for B2B SaaS platform serving 10K+ enterprise customers
- Increased user retention by 35% through data-driven feature prioritization and A/B testing
- Spearheaded agile transformation, reducing sprint cycle time from 3 weeks to 2 weeks
- Collaborated with engineering, design, and analytics teams to deliver 15+ major features
- Established OKR framework that improved team alignment and goal achievement by 50%
- Drove $2M in annual recurring revenue through strategic product launches

Product Manager | StartupXYZ | 2018 - 2020
- Managed product backlog and sprint planning for team of 8 engineers
- Launched mobile app that achieved 50K downloads in first 3 months
- Improved customer satisfaction score (CSAT) from 3.2 to 4.5 out of 5
- Conducted 20+ user interviews and usability tests to inform product decisions
- Reduced customer churn by 25% through targeted feature improvements

SKILLS
Product Management: Roadmap Planning, Backlog Management, Agile, Scrum, Sprint Planning
Analytics: SQL, Google Analytics, Mixpanel, A/B Testing, Data Analysis, KPI Tracking
Tools: JIRA, Confluence, Figma, Tableau, Product Analytics
Technical: API Design, PRD Writing, User Stories, Wireframing, Product Strategy

EDUCATION
Bachelor of Science in Computer Science | University of California | 2018
`;

const SAMPLE_RESUME_POOR = `
Jane Smith
jane@email.com

About Me
I am a hardworking person who likes technology and wants to work in product management.

Work History

Company ABC (2021-2023)
- Responsible for helping the product team
- Worked on various projects
- Assisted with meetings and documentation
- Participated in agile ceremonies
- Helped with user research

Company XYZ (2019-2021)
- Was part of the development team
- Involved in project planning
- Supported the product manager
- Attended daily standups

Skills
Good communication, teamwork, problem solving, Microsoft Office, basic coding

Education
Bachelor's Degree in Business
`;


// ==================== Unit Tests for Analyzers ====================

describe('Bullet Point Detection', () => {
  test('should detect bullet points correctly', () => {
    const bullets = detectBulletPoints(SAMPLE_RESUME_GOOD);
    expect(bullets.length).toBeGreaterThan(10);
    expect(bullets[0]).toContain('Led roadmap planning');
  });

  test('should handle resume with no bullets', () => {
    const bullets = detectBulletPoints('This is a resume with no bullet points at all.');
    expect(bullets.length).toBe(0);
  });
});

describe('Quantification Detection', () => {
  test('should identify quantified bullets', () => {
    expect(isQuantified('Increased revenue by 45%')).toBe(true);
    expect(isQuantified('Reduced costs by $50K')).toBe(true);
    expect(isQuantified('Managed team of 10 engineers')).toBe(true);
    expect(isQuantified('Led project to completion')).toBe(false);
  });

  test('should count quantified bullets correctly', () => {
    const bullets = [
      'Increased revenue by 45%',
      'Managed projects',
      'Reduced costs by $50K',
      'Led team meetings',
    ];
    expect(countQuantifiedBullets(bullets)).toBe(2);
  });
});

describe('Action Verb Categorization', () => {
  test('should categorize strong verbs', () => {
    const bullets = [
      'Led team of engineers',
      'Architected cloud infrastructure',
      'Managed daily operations',
      'Helped with projects',
    ];
    const categorized = categorizeActionVerbs(bullets);
    expect(categorized.strong).toContain('Led');
    expect(categorized.strong).toContain('Architected');
    expect(categorized.medium).toContain('Managed');
    expect(categorized.weak).toContain('Helped');
  });
});

describe('Keyword Matching', () => {
  test('should find matching keywords', () => {
    const text = 'Experience with React, Node.js, and AWS cloud services';
    const keywords = ['React', 'Node.js', 'AWS', 'Python', 'Django'];
    const result = findMatchingKeywords(text, keywords);

    expect(result.found).toContain('React');
    expect(result.found).toContain('Node.js');
    expect(result.found).toContain('AWS');
    expect(result.missing).toContain('Python');
    expect(result.missing).toContain('Django');
  });
});

describe('Page Count Estimation', () => {
  test('should estimate page count based on word count', () => {
    const shortText = 'A'.repeat(100); // ~100 words
    const mediumText = 'A '.repeat(600); // ~600 words
    const longText = 'A '.repeat(1200); // ~1200 words

    expect(estimatePageCount(shortText)).toBe(1);
    expect(estimatePageCount(mediumText)).toBe(2);
    expect(estimatePageCount(longText)).toBe(3);
  });
});

describe('Years of Experience Estimation', () => {
  test('should estimate years from date ranges', () => {
    const text = `
      Senior Engineer | 2020 - Present
      Engineer | 2018 - 2020
      Intern | 2017 - 2018
    `;
    const years = estimateYearsOfExperience(text);
    expect(years).toBeGreaterThan(4);
  });
});

// ==================== Integration Tests ====================

describe('Overall Scoring', () => {
  test('should score good resume highly', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_GOOD, 'Product Manager');

    expect(result.overallScore).toBeGreaterThan(70);
    expect(result.grade).toMatch(/[ABC]/);
    expect(result.atsPassProbability).toBeGreaterThan(60);
    expect(result.componentScores.contentQuality.score).toBeGreaterThan(70);
  });

  test('should score poor resume lowly', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_POOR, 'Product Manager');

    expect(result.overallScore).toBeLessThan(60);
    expect((result.componentScores.contentQuality.breakdown as ContentQualityBreakdown).achievementQuantification.percentage).toBeLessThan(30);
    expect((result.componentScores.contentQuality.breakdown as ContentQualityBreakdown).actionVerbStrength.weakVerbsFound.length).toBeGreaterThan(0);
  });

  test('should score technical resume for correct role', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_SOFTWARE_ENGINEER, 'Software Engineer');

    expect(result.overallScore).toBeGreaterThan(75);
    // Keyword expectations live in calibration.test.ts (non-blocking).
  });
});

describe('Component Scoring', () => {
  test('should calculate correct weighted contributions', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_GOOD, 'Product Manager');

    const totalWeight =
      result.componentScores.contentQuality.weight +
      result.componentScores.atsCompatibility.weight +
      result.componentScores.formatStructure.weight +
      result.componentScores.impactMetrics.weight;

    expect(totalWeight).toBe(100);

    const totalContribution =
      result.componentScores.contentQuality.weightedContribution +
      result.componentScores.atsCompatibility.weightedContribution +
      result.componentScores.formatStructure.weightedContribution +
      result.componentScores.impactMetrics.weightedContribution;

    expect(Math.round(totalContribution)).toBe(result.overallScore);
  });
});

describe('ATS Analysis', () => {
  test('should generate detailed ATS report', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_GOOD, 'Product Manager');

    expect(result.atsDetailedReport.passPrediction).toBeDefined();
    expect(result.atsDetailedReport.passPrediction.probability).toBeGreaterThan(0);
    expect(result.atsDetailedReport.keywordGapAnalysis).toBeDefined();
    expect(result.atsDetailedReport.keywordGapAnalysis.role).toBe('Product Manager');
  });

  test('should identify missing keywords', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_POOR, 'Product Manager');

    expect(result.atsDetailedReport.keywordGapAnalysis.mustHave.missing.length).toBeGreaterThan(5);
  });
});

describe('Improvement Roadmap', () => {
  test('should generate actionable improvements', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_POOR, 'Product Manager');

    expect(result.improvementRoadmap.toReach80.length).toBeGreaterThan(0);
    expect(result.improvementRoadmap.toReach80[0].action).toBeDefined();
    expect(result.improvementRoadmap.toReach80[0].pointsGain).toBeGreaterThan(0);
  });

  test('should prioritize high-impact improvements', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_POOR, 'Product Manager');

    const firstAction = result.improvementRoadmap.toReach80[0];
    expect(firstAction.priority).toMatch(/high|medium/);
  });
});

describe('Edge Cases', () => {
  test('should handle very short resume', async () => {
    const shortResume = `
      John Doe
      email@test.com
      Experience: Software Engineer at Company (2020-2023)
      - Built features
      - Fixed bugs
      - Tested code
    `;

    // The scorer rejects resumes under 50 words instead of scoring them (validateResumeText).
    await expect(calculatePROScore(shortResume, 'Software Engineer')).rejects.toThrow('too few words');
  });

  test('should handle resume without clear sections', async () => {
    const unstructuredResume = `
      Jane Smith has 5 years of experience in product management.
      She worked at Company A and Company B. She knows agile and scrum.
      She increased revenue by 20% and improved customer satisfaction.
      She has a degree in Computer Science.
    `;

    // Too short and no bullets: rejected by validateResumeText rather than scored.
    await expect(calculatePROScore(unstructuredResume, 'Product Manager')).rejects.toThrow('at least 3 bullet points');
  });
});

// ==================== Performance Tests ====================

describe('Performance', () => {
  test('should complete scoring in under 2 seconds', async () => {
    const startTime = Date.now();
    await calculatePROScore(SAMPLE_RESUME_GOOD, 'Product Manager');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000);
  });
});

// ==================== Exports for Manual Testing ====================

export const testData = {
  goodResume: SAMPLE_RESUME_GOOD,
  poorResume: SAMPLE_RESUME_POOR,
  engineerResume: SAMPLE_RESUME_SOFTWARE_ENGINEER,
};
