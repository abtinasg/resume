/**
 * PRO Resume Scoring System - Test Cases
 *
 * Comprehensive test suite for the scoring system.
 * These tests validate the accuracy and reliability of scoring algorithms.
 */

import { calculatePROScore } from '../index';
import {
  detectBulletPoints,
  countQuantifiedBullets,
  categorizeActionVerbs,
  isQuantified,
  findMatchingKeywords,
  estimatePageCount,
  estimateYearsOfExperience,
} from '../analyzers';

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

const SAMPLE_RESUME_SOFTWARE_ENGINEER = `
Alex Johnson
alex.johnson@email.com | (555) 987-6543 | github.com/alexj

SUMMARY
Full-stack Software Engineer with 6 years of experience building scalable web applications.
Specialized in React, Node.js, and AWS cloud infrastructure.

EXPERIENCE

Senior Software Engineer | CloudTech Solutions | 2020 - Present
- Architected and deployed microservices infrastructure serving 1M+ daily active users
- Reduced API response time by 60% through database optimization and caching strategies
- Led migration from monolith to microservices, improving deployment frequency by 10x
- Implemented CI/CD pipeline using GitHub Actions, reducing deployment time from 2h to 15min
- Mentored 5 junior engineers and conducted 50+ code reviews per month

Software Engineer | WebStartup | 2018 - 2020
- Developed RESTful APIs using Node.js and Express serving 500K requests/day
- Built responsive React applications with 98% test coverage using Jest and React Testing Library
- Optimized database queries, reducing load time by 45%
- Integrated third-party APIs (Stripe, Twilio, SendGrid) for payment and communication features
- Participated in agile sprint planning and retrospectives

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL
Frontend: React, Redux, Next.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, Django, Spring Boot, GraphQL
Database: PostgreSQL, MongoDB, Redis, MySQL
Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, CI/CD, Jenkins
Testing: Jest, Cypress, Unit Testing, Integration Testing

EDUCATION
B.S. Computer Science | Stanford University | 2018
GPA: 3.8/4.0
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
    expect(result.componentScores.contentQuality.breakdown.achievementQuantification.percentage).toBeLessThan(30);
    expect(result.componentScores.contentQuality.breakdown.actionVerbStrength.weakVerbsFound.length).toBeGreaterThan(0);
  });

  test('should score technical resume for correct role', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME_SOFTWARE_ENGINEER, 'Software Engineer');

    expect(result.overallScore).toBeGreaterThan(75);
    expect(result.componentScores.atsCompatibility.breakdown.keywordDensity.score).toBeGreaterThan(60);
    expect(result.atsDetailedReport.keywordGapAnalysis.mustHave.found).toBeGreaterThan(5);
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

    const result = await calculatePROScore(shortResume, 'Software Engineer');
    expect(result.overallScore).toBeLessThan(70);
  });

  test('should handle resume without clear sections', async () => {
    const unstructuredResume = `
      Jane Smith has 5 years of experience in product management.
      She worked at Company A and Company B. She knows agile and scrum.
      She increased revenue by 20% and improved customer satisfaction.
      She has a degree in Computer Science.
    `;

    const result = await calculatePROScore(unstructuredResume, 'Product Manager');
    expect(result.componentScores.formatStructure.score).toBeLessThan(80);
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
