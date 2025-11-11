// @ts-nocheck
import { analyzeWithAIEnhanced, buildEnhancedPrompt, AIAnalysisError } from '@/lib/openai/analyzeWithAI';

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

const baseScoringResult = {
  overallScore: 68,
  grade: 'B',
  atsPassProbability: 72,
};

describe('AI Enhanced Prompt Builder', () => {
  test('buildEnhancedPrompt embeds truncated resume and scoring JSON', () => {
    const longResume = 'A'.repeat(5100);
    const prompt = buildEnhancedPrompt(longResume, baseScoringResult as any);

    expect(prompt).toContain('Resume Text (truncated to 5000 characters)');
    expect(prompt).toContain('...[truncated to 5000 characters for AI processing]');
    expect(prompt).toContain('Local Scoring Result (JSON):');
    expect(prompt).toContain('"overallScore": 68');
    expect(prompt).toContain('before_after_rewrites');
  });
});

describe('analyzeWithAIEnhanced', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockReset();
  });

  test('returns structured verdict with before/after rewrites', async () => {
    const mockResponse = {
      ai_final_score: 74,
      score_adjustment_reasoning: 'Increased due to quantified impact not captured locally.',
      summary: 'Strong leadership and measurable wins.',
      strengths: ['Quantified achievements', 'Clear leadership narrative'],
      weaknesses: ['Limited cloud tooling keywords'],
      improvement_suggestions: ['Add AWS keyword coverage', 'Highlight platform scale metrics'],
      before_after_rewrites: [
        {
          title: 'Add cloud tooling keywords',
          before: 'Missing mention of AWS cloud experience.',
          after: "Add: 'Integrated AWS Lambda to automate data pipelines, reducing processing time by 35%.'",
          priority: 'high',
        },
      ],
      confidence_level: 'high',
    };

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockResponse),
          },
        },
      ],
    });

    const result = await analyzeWithAIEnhanced('Sample resume text', baseScoringResult as any);

    expect(result.ai_final_score).toBe(74);
    expect(result.local_score_used).toBe(68);
    expect(result.before_after_rewrites).toHaveLength(1);
    expect(result.before_after_rewrites?.[0].priority).toBe('HIGH');
    expect(result.score_adjustment_reasoning).toContain('Increased');
  });

  test('throws when AI score differs without reasoning', async () => {
    const invalidResponse = {
      ai_final_score: 50,
      summary: 'Summary',
      strengths: ['one'],
      weaknesses: ['two'],
      improvement_suggestions: ['improve'],
      before_after_rewrites: [
        {
          title: 'Fix bullet',
          before: 'before text',
          after: 'after text',
          priority: 'MEDIUM',
        },
      ],
      confidence_level: 'low',
    };

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(invalidResponse),
          },
        },
      ],
    });

    await expect(
      analyzeWithAIEnhanced('Resume body', baseScoringResult as any)
    ).rejects.toBeInstanceOf(AIAnalysisError);
  });
});
