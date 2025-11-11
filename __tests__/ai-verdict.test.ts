/**
 * AI Verdict Integration Tests
 *
 * Tests for the AI final verdict layer that validates and interprets
 * local scoring results.
 */

import { buildFinalAIPrompt } from '@/lib/prompts-pro';
import { analyzeWithAI, AIVerdictResponse } from '@/lib/openai/analyzeWithAI';

// Mock scoring result for testing
const mockScoringResult = {
  overallScore: 70,
  grade: 'B',
  atsPassProbability: 75,
  componentScores: {
    contentQuality: {
      score: 68,
      weight: 30,
      breakdown: {
        achievementQuantification: {
          score: 65,
          percentage: 45,
          quantifiedBullets: 5,
          totalBullets: 11,
        },
        actionVerbStrength: {
          score: 70,
          strongPercentage: 60,
          strongVerbsFound: ['Led', 'Developed', 'Implemented'],
          weakVerbsFound: ['Worked on', 'Helped with'],
        },
      },
    },
    atsCompatibility: {
      score: 72,
      weight: 35,
      breakdown: {
        keywordDensity: {
          score: 70,
          keywordFrequency: {
            'backend': 3,
            'performance': 2,
            'api': 2,
          },
        },
        formatCompatibility: {
          score: 75,
          issues: [
            { issue: 'Minor spacing inconsistencies', penalty: 5 },
          ],
        },
      },
    },
    formatStructure: {
      score: 75,
      weight: 20,
      breakdown: {
        lengthOptimization: {
          score: 80,
          pageCount: 1,
          recommendedPages: 1,
          verdict: 'Optimal',
        },
      },
    },
    impactMetrics: {
      score: 65,
      weight: 15,
      breakdown: {
        quantifiedResults: {
          score: 65,
          percentage: 45,
        },
      },
    },
  },
  atsDetailedReport: {
    passPrediction: {
      probability: 75,
      confidence: 'high',
      reasoning: 'Good ATS compatibility',
    },
    keywordGapAnalysis: {
      role: 'Software Engineer',
      mustHave: {
        found: 5,
        total: 10,
        missing: ['TypeScript', 'Docker', 'Kubernetes'],
        foundKeywords: ['JavaScript', 'React', 'Node.js'],
      },
      important: {
        found: 3,
        total: 8,
        missing: ['CI/CD', 'Testing'],
        foundKeywords: ['Git', 'API', 'REST'],
      },
      niceToHave: {
        found: 2,
        total: 5,
        missing: ['GraphQL', 'MongoDB'],
        foundKeywords: ['AWS', 'Redis'],
      },
      keywordFrequency: {
        'backend': 3,
        'performance': 2,
      },
    },
    formatIssues: [
      { issue: 'Minor spacing inconsistencies', penalty: 5 },
    ],
  },
  improvementRoadmap: {
    toReach80: [
      {
        action: 'Add critical keywords: TypeScript, Docker, Kubernetes',
        pointsGain: 6,
        time: '30min',
        priority: 'high',
        category: 'ATS Compatibility',
      },
    ],
    toReach90: [],
    quickWins: [
      {
        action: 'Add metrics to 2 more bullet points',
        pointsGain: 3,
        time: '20min',
        priority: 'high',
        category: 'Content Quality',
      },
    ],
  },
  metadata: {
    jobRole: 'Software Engineer',
    processingTime: 150,
    timestamp: new Date().toISOString(),
    resumeStats: {
      totalWords: 350,
      totalBullets: 11,
      pageCount: 1,
    },
  },
};

const mockResumeText = `
JOHN DOE
Software Engineer
john.doe@email.com | (555) 123-4567

EXPERIENCE

Senior Software Engineer | Tech Company | 2020-Present
• Led backend refactor for performance optimization, reducing API response time by 40%
• Developed microservices architecture using Node.js and Express
• Implemented CI/CD pipeline improving deployment frequency
• Worked on database optimization and caching strategies
• Helped with frontend improvements using React

Software Engineer | Startup Inc | 2018-2020
• Built RESTful APIs for mobile application
• Managed AWS infrastructure and deployment
• Collaborated with team on feature development
• Optimized database queries
• Participated in code reviews

SKILLS
JavaScript, React, Node.js, Express, AWS, Git, REST API, Redis

EDUCATION
B.S. Computer Science | University of Technology | 2018
`;

describe('AI Verdict Integration', () => {
  // Skip tests if OPENAI_API_KEY is not set (to avoid failures in CI)
  const shouldSkip = !process.env.OPENAI_API_KEY;

  if (shouldSkip) {
    test.skip('Skipping AI verdict tests - OPENAI_API_KEY not set', () => {
      console.warn('⚠️  OPENAI_API_KEY not configured. Skipping AI verdict tests.');
    });
    return;
  }

  test('buildFinalAIPrompt generates valid prompt', () => {
    const prompt = buildFinalAIPrompt(
      mockResumeText,
      'Software Engineer',
      mockScoringResult
    );

    expect(prompt).toBeTruthy();
    expect(prompt).toContain('Resume Text');
    expect(prompt).toContain('Job Role');
    expect(prompt).toContain('Scoring Result');
    expect(prompt).toContain('Software Engineer');
    expect(prompt).toContain('ai_final_score');
    expect(prompt).toContain('strengths');
    expect(prompt).toContain('weaknesses');
    expect(prompt).toContain('improvement_suggestions');
  });

  test('buildFinalAIPrompt includes scoring data', () => {
    const prompt = buildFinalAIPrompt(
      mockResumeText,
      'Software Engineer',
      mockScoringResult
    );

    // Check that scoring result is stringified in prompt
    expect(prompt).toContain('"overallScore":');
    expect(prompt).toContain('"grade":');
    expect(prompt).toContain('"atsPassProbability":');
  });

  test('analyzeWithAI returns structured verdict', async () => {
    const prompt = buildFinalAIPrompt(
      mockResumeText,
      'Software Engineer',
      mockScoringResult
    );

    const result = await analyzeWithAI(prompt);

    // Verify basic structure
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');

    // Verify expected fields (at least some should be present)
    // AI might return slightly different structure, so we check flexibly
    const hasRequiredFields =
      result.ai_final_score !== undefined ||
      result.summary !== undefined ||
      result.strengths !== undefined;

    expect(hasRequiredFields).toBe(true);

    console.log('✓ AI Verdict Response:', {
      hasScore: !!result.ai_final_score,
      hasSummary: !!result.summary,
      strengthsCount: result.strengths?.length || 0,
      weaknessesCount: result.weaknesses?.length || 0,
      suggestionsCount: result.improvement_suggestions?.length || 0,
    });
  }, 30000); // 30 second timeout for AI call

  test('analyzeWithAI handles valid JSON response', async () => {
    const prompt = buildFinalAIPrompt(
      'Software Engineer with 3 years experience in backend development.',
      'Software Engineer',
      { overallScore: 70, grade: 'B' }
    );

    const result = await analyzeWithAI(prompt);

    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  }, 30000);

  test('AI verdict includes actionable insights', async () => {
    const prompt = buildFinalAIPrompt(
      mockResumeText,
      'Software Engineer',
      mockScoringResult
    );

    const result = await analyzeWithAI(prompt);

    // Check that result has meaningful content
    const hasMeaningfulContent =
      (result.summary && result.summary.length > 10) ||
      (result.strengths && result.strengths.length > 0) ||
      (result.improvement_suggestions && result.improvement_suggestions.length > 0);

    expect(hasMeaningfulContent).toBe(true);

    console.log('✓ AI Verdict Content:', {
      summaryLength: result.summary?.length || 0,
      hasStrengths: (result.strengths?.length || 0) > 0,
      hasWeaknesses: (result.weaknesses?.length || 0) > 0,
      hasSuggestions: (result.improvement_suggestions?.length || 0) > 0,
    });
  }, 30000);

  test('AI verdict score is reasonable', async () => {
    const prompt = buildFinalAIPrompt(
      mockResumeText,
      'Software Engineer',
      mockScoringResult
    );

    const result = await analyzeWithAI(prompt);

    if (result.ai_final_score !== undefined) {
      expect(result.ai_final_score).toBeGreaterThanOrEqual(0);
      expect(result.ai_final_score).toBeLessThanOrEqual(100);

      // AI score should be reasonably close to local score (within 30 points)
      const scoreDiff = Math.abs(result.ai_final_score - mockScoringResult.overallScore);
      expect(scoreDiff).toBeLessThan(30);

      console.log('✓ Score Comparison:', {
        localScore: mockScoringResult.overallScore,
        aiScore: result.ai_final_score,
        difference: scoreDiff,
      });
    }
  }, 30000);
});

describe('AI Verdict Error Handling', () => {
  test('buildFinalAIPrompt handles empty resume text', () => {
    const prompt = buildFinalAIPrompt(
      '',
      'Software Engineer',
      mockScoringResult
    );

    expect(prompt).toBeTruthy();
    expect(prompt.length).toBeGreaterThan(0);
  });

  test('buildFinalAIPrompt handles minimal scoring result', () => {
    const minimalScoring = {
      overallScore: 50,
      grade: 'C',
    };

    const prompt = buildFinalAIPrompt(
      mockResumeText,
      'General',
      minimalScoring
    );

    expect(prompt).toBeTruthy();
    expect(prompt).toContain('overallScore');
  });
});
