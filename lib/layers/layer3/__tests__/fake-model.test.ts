/**
 * Layer 3 - Execution Engine
 * Fake-model tests
 *
 * Runs the LLM rewrite pipeline (prompt → model → evidence validation → retry →
 * fallback) against a scripted stand-in for the OpenAI client, so it is exercised
 * in CI with no API key, no network and no spend. These tests check our pipeline,
 * not model quality: the real-model tests in integration.test.ts stay skipped
 * without a key and remain a release risk (D-014).
 */

const mockCreate = jest.fn();

jest.mock('openai', () => {
  class APIError extends Error {
    status?: number;
    code?: string;
  }
  class FakeOpenAI {
    static APIError = APIError;
    chat = { completions: { create: mockCreate } };
  }
  return { __esModule: true, default: FakeOpenAI };
});

import { rewriteBullet } from '../rewrite';
import { resetLLMClient } from '../generation';

/** A chat completion whose message is the given rewrite as JSON */
function completion(improved: string, evidenceIds: string[] = ['E1']) {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({
            improved,
            evidence_map: [{ improved_span: improved, evidence_ids: evidenceIds }],
            reasoning: 'scripted',
            changes: { stronger_verb: true },
          }),
        },
      },
    ],
    usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
  };
}

describe('Layer 3 rewrite pipeline with a fake model', () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'fake-key-for-tests';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockCreate.mockReset();
    resetLLMClient();
  });

  test('accepts a faithful rewrite on the first attempt', async () => {
    mockCreate.mockResolvedValueOnce(completion('Reduced costs by 40%'));

    const result = await rewriteBullet({
      type: 'bullet',
      bullet: 'Responsible for reducing costs by 40%',
      issues: ['weak_verb'],
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result.improved).toBe('Reduced costs by 40%');
    expect(result.validation.passed).toBe(true);
  });

  test('sends the original bullet to the model', async () => {
    mockCreate.mockResolvedValueOnce(completion('Reduced costs by 40%'));

    await rewriteBullet({ type: 'bullet', bullet: 'Responsible for reducing costs by 40%' });

    const messages = mockCreate.mock.calls[0][0].messages;
    expect(JSON.stringify(messages)).toContain('Responsible for reducing costs by 40%');
  });

  test('rejects an invented metric and retries', async () => {
    mockCreate
      .mockResolvedValueOnce(completion('Improved performance by 45%'))
      .mockResolvedValueOnce(completion('Improved performance'));

    const result = await rewriteBullet({
      type: 'bullet',
      bullet: 'Improved performance',
      issues: ['no_metric', 'too_vague'],
    });

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.improved).not.toMatch(/45%/);
    expect(result.validation.passed).toBe(true);
  });

  test('falls back to the original when every attempt fabricates', async () => {
    mockCreate.mockResolvedValue(completion('Improved performance by 45% for 2M users'));

    const result = await rewriteBullet({
      type: 'bullet',
      bullet: 'Improved performance',
      issues: ['no_metric'],
    });

    // One first attempt plus the configured retries, then the original text
    expect(mockCreate).toHaveBeenCalledTimes(3);
    expect(result.improved).toBe('Improved performance');
  });

  test('survives unparseable model output', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'not json at all' } }] });

    const result = await rewriteBullet({ type: 'bullet', bullet: 'Helped with project' });

    expect(result.improved).toBe('Helped with project');
  });
});
