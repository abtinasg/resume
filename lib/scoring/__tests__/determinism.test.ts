/**
 * PRO Scoring Determinism Tests
 *
 * Validates that the PRO scoring system is deterministic:
 * same resume text + same job role → same score, every time.
 *
 * Also validates that PRO scoring operates on resume-only data
 * (no job description dependency at the base level).
 */

import { calculatePROScore } from '../index';
import {
  calculateContentQualityScore,
  calculateATSScore,
  calculateFormatScore,
  calculateImpactScore,
  calculateOverallScore,
  calculateGrade,
} from '../algorithms';

// ==================== Sample Resumes ====================

const SAMPLE_RESUME = `
John Doe
john.doe@email.com | (555) 123-4567

SUMMARY
Results-driven Software Engineer with 5+ years of experience building scalable applications.

EXPERIENCE

Senior Software Engineer | TechCorp | 2020 - Present
- Architected microservices infrastructure serving 1M+ daily active users
- Reduced API response time by 60% through database optimization and caching
- Led migration from monolith to microservices, improving deployment frequency by 10x
- Implemented CI/CD pipeline using GitHub Actions, reducing deployment time from 2h to 15min
- Mentored 5 junior engineers and conducted 50+ code reviews per month

Software Engineer | StartupXYZ | 2018 - 2020
- Developed RESTful APIs using Node.js and Express serving 500K requests/day
- Built responsive React applications with 98% test coverage
- Optimized database queries, reducing load time by 45%

SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL
Frontend: React, Next.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, Django, GraphQL
Cloud: AWS (EC2, S3, Lambda), Docker, Kubernetes
Testing: Jest, Cypress, Unit Testing

EDUCATION
B.S. Computer Science | Stanford University | 2018
`;

const MINIMAL_RESUME = `
Jane Smith
jane@test.com | (555) 999-0000

EXPERIENCE

Developer at Company ABC (2021-2023)
- Built web applications using basic HTML and CSS
- Fixed production bugs and resolved customer issues
- Participated in code reviews and team meetings weekly
- Wrote unit tests for frontend components and features
- Assisted with deployment and release management tasks

Junior Developer at Company XYZ (2019-2021)
- Helped maintain existing web applications and services
- Worked on bug fixes and minor feature improvements
- Attended daily standups and sprint planning meetings

SKILLS
JavaScript, Python, SQL, HTML, CSS

EDUCATION
B.S. in Computer Science | State University | 2019
`;

// ==================== Determinism Tests ====================

describe('PRO Scoring Determinism', () => {
  test('same resume produces identical overall score across multiple runs', async () => {
    const results = await Promise.all([
      calculatePROScore(SAMPLE_RESUME, 'Software Engineer'),
      calculatePROScore(SAMPLE_RESUME, 'Software Engineer'),
      calculatePROScore(SAMPLE_RESUME, 'Software Engineer'),
    ]);

    expect(results[0].overallScore).toBe(results[1].overallScore);
    expect(results[1].overallScore).toBe(results[2].overallScore);
  });

  test('same resume produces identical grade across multiple runs', async () => {
    const result1 = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');
    const result2 = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');

    expect(result1.grade).toBe(result2.grade);
  });

  test('same resume produces identical component scores across multiple runs', async () => {
    const result1 = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');
    const result2 = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');

    expect(result1.componentScores.contentQuality.score)
      .toBe(result2.componentScores.contentQuality.score);
    expect(result1.componentScores.atsCompatibility.score)
      .toBe(result2.componentScores.atsCompatibility.score);
    expect(result1.componentScores.formatStructure.score)
      .toBe(result2.componentScores.formatStructure.score);
    expect(result1.componentScores.impactMetrics.score)
      .toBe(result2.componentScores.impactMetrics.score);
  });

  test('same resume produces identical ATS pass probability', async () => {
    const result1 = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');
    const result2 = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');

    expect(result1.atsPassProbability).toBe(result2.atsPassProbability);
  });

  test('different resumes produce different scores', async () => {
    const result1 = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');
    const result2 = await calculatePROScore(MINIMAL_RESUME, 'Software Engineer');

    // Good resume should score higher than minimal resume
    expect(result1.overallScore).toBeGreaterThan(result2.overallScore);
  });
});

// ==================== Individual Algorithm Determinism ====================

describe('Individual Algorithm Determinism', () => {
  test('calculateContentQualityScore is deterministic', () => {
    const score1 = calculateContentQualityScore(SAMPLE_RESUME, 'Software Engineer');
    const score2 = calculateContentQualityScore(SAMPLE_RESUME, 'Software Engineer');

    expect(score1.score).toBe(score2.score);
    expect(score1.weightedContribution).toBe(score2.weightedContribution);
  });

  test('calculateATSScore is deterministic', () => {
    const score1 = calculateATSScore(SAMPLE_RESUME, 'Software Engineer');
    const score2 = calculateATSScore(SAMPLE_RESUME, 'Software Engineer');

    expect(score1.score).toBe(score2.score);
  });

  test('calculateFormatScore is deterministic', () => {
    const score1 = calculateFormatScore(SAMPLE_RESUME);
    const score2 = calculateFormatScore(SAMPLE_RESUME);

    expect(score1.score).toBe(score2.score);
  });

  test('calculateImpactScore is deterministic', () => {
    const score1 = calculateImpactScore(SAMPLE_RESUME);
    const score2 = calculateImpactScore(SAMPLE_RESUME);

    expect(score1.score).toBe(score2.score);
  });

  test('calculateGrade is deterministic for same score', () => {
    expect(calculateGrade(85)).toBe(calculateGrade(85));
    expect(calculateGrade(72)).toBe(calculateGrade(72));
    expect(calculateGrade(95)).toBe(calculateGrade(95));
  });
});

// ==================== PRO Is Resume-Only ====================

describe('PRO Score is resume-only at base level', () => {
  test('calculatePROScore accepts only resumeText and jobRole', async () => {
    // This test validates the function signature.
    // calculatePROScore should accept (resumeText, jobRole) - no jobDescription param.
    const result = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');

    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(typeof result.overallScore).toBe('number');
  });

  test('same resume with different roles produces different scores', async () => {
    const seResult = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');
    const pmResult = await calculatePROScore(SAMPLE_RESUME, 'Product Manager');

    // Scores should differ because keyword expectations differ
    // (the same resume will match different keyword sets)
    expect(seResult.componentScores.atsCompatibility.score)
      .not.toBe(pmResult.componentScores.atsCompatibility.score);
  });

  test('PRO score does not change based on external state', async () => {
    // Run at different "times" - score should be the same
    const result1 = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');

    // Simulate some time passing (score should not change)
    await new Promise(resolve => setTimeout(resolve, 10));

    const result2 = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');

    expect(result1.overallScore).toBe(result2.overallScore);
    expect(result1.grade).toBe(result2.grade);
  });
});

// ==================== Score Consistency ====================

describe('Score Consistency', () => {
  test('overall score equals sum of weighted contributions', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');

    const sumOfContributions =
      result.componentScores.contentQuality.weightedContribution +
      result.componentScores.atsCompatibility.weightedContribution +
      result.componentScores.formatStructure.weightedContribution +
      result.componentScores.impactMetrics.weightedContribution;

    expect(result.overallScore).toBe(Math.round(sumOfContributions));
  });

  test('component weights sum to 100', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');

    const totalWeight =
      result.componentScores.contentQuality.weight +
      result.componentScores.atsCompatibility.weight +
      result.componentScores.formatStructure.weight +
      result.componentScores.impactMetrics.weight;

    expect(totalWeight).toBe(100);
  });

  test('all scores are within 0-100 range', async () => {
    const result = await calculatePROScore(SAMPLE_RESUME, 'Software Engineer');

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);

    for (const key of ['contentQuality', 'atsCompatibility', 'formatStructure', 'impactMetrics'] as const) {
      expect(result.componentScores[key].score).toBeGreaterThanOrEqual(0);
      expect(result.componentScores[key].score).toBeLessThanOrEqual(100);
    }
  });
});
