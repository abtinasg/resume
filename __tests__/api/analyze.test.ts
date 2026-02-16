// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock dependencies for the analyze route.
 *
 * The analyze route (/app/api/analyze/route.ts) uses:
 *  - zod validation (no mock needed, real lib is fine)
 *  - extractTextFromBase64PDF / extractTextFromBase64Image
 *  - calculatePROScore, derive3DRawFromPRO, scoringResultToPROInput
 *  - build3DStrictAIPrompt
 *  - HYBRID_MODE, validateEnvironment
 *  - verifyToken (from @/lib/auth)
 *  - prisma
 *  - trackEvent, checkUsageLimit, decrementUsage
 *  - recordResumeProgress
 *  - OpenAI
 */

jest.mock('@/lib/pdfParser', () => ({
  extractTextFromBase64PDF: jest.fn(),
}));

jest.mock('@/lib/imageParser', () => ({
  extractTextFromBase64Image: jest.fn(),
}));

jest.mock('@/lib/layers/layer1', () => ({
  calculatePROScore: jest.fn(),
  derive3DRawFromPRO: jest.fn(),
  scoringResultToPROInput: jest.fn(),
}));

jest.mock('@/lib/prompts-pro', () => ({
  build3DStrictAIPrompt: jest.fn().mockReturnValue('mock-prompt'),
}));

jest.mock('@/lib/env', () => ({
  HYBRID_MODE: false,
  validateEnvironment: jest.fn().mockReturnValue({ valid: true }),
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    resumeVersion: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/premium', () => ({
  checkUsageLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, limit: 20 }),
  decrementUsage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/progress', () => ({
  recordResumeProgress: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

import { POST } from '@/app/api/analyze/route';
import { calculatePROScore, derive3DRawFromPRO, scoringResultToPROInput } from '@/lib/layers/layer1';

const mockedCalculatePROScore = calculatePROScore as jest.MockedFunction<typeof calculatePROScore>;
const mockedDerive3DRawFromPRO = derive3DRawFromPRO as jest.MockedFunction<typeof derive3DRawFromPRO>;
const mockedScoring = scoringResultToPROInput as jest.MockedFunction<typeof scoringResultToPROInput>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRequest(body: any, options?: { method?: string; headers?: Record<string, string> }) {
  return {
    json: jest.fn().mockResolvedValue(body),
    method: options?.method || 'POST',
    headers: new Headers(options?.headers || {}),
    cookies: { get: jest.fn().mockReturnValue(undefined) },
    url: 'http://localhost:3000/api/analyze',
    nextUrl: new URL('http://localhost:3000/api/analyze'),
  } as unknown as NextRequest;
}

function mockPROScoring() {
  const proResult = {
    overallScore: 68,
    grade: 'B',
    componentScores: {
      contentQuality: { score: 65, breakdown: {} },
      atsCompatibility: { score: 70, breakdown: {} },
      formatStructure: { score: 72, breakdown: { sectionOrder: { found: ['Experience'], missing: [] } } },
      impactMetrics: { score: 60, breakdown: {} },
    },
    atsDetailedReport: { keywordGapAnalysis: { mustHave: { missing: [] } } },
  };

  mockedCalculatePROScore.mockResolvedValue(proResult as any);
  mockedScoring.mockReturnValue({} as any);
  mockedDerive3DRawFromPRO.mockReturnValue({
    structure: 30,
    content: 40,
    tailoring: 25,
    overall: 65,
  } as any);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 for missing resume text', async () => {
    const req = createMockRequest({
      resumeText: '',
      format: 'text',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = {
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      method: 'POST',
      headers: new Headers({}),
      cookies: { get: jest.fn().mockReturnValue(undefined) },
      url: 'http://localhost:3000/api/analyze',
      nextUrl: new URL('http://localhost:3000/api/analyze'),
    } as unknown as NextRequest;

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_JSON');
  });

  it('returns 200 with analysis for valid request', async () => {
    mockPROScoring();

    const req = createMockRequest({
      resumeText: 'Experienced software engineer with 5 years building web applications using React and Node.js',
      format: 'text',
      jobRole: 'Software Engineer',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(typeof json.overall_score).toBe('number');
    expect(json.sections).toBeDefined();
    expect(json.sections.structure).toBeDefined();
    expect(json.sections.content).toBeDefined();
    expect(json.sections.tailoring).toBeDefined();
    expect(json.metadata).toBeDefined();
  });

  it('returns 500 for unexpected internal errors', async () => {
    // Make calculatePROScore throw to simulate an unexpected failure
    mockedCalculatePROScore.mockRejectedValue(new Error('AI service unavailable'));

    const req = createMockRequest({
      resumeText: 'Experienced software engineer with 5 years building web applications using React and Node.js',
      format: 'text',
      jobRole: 'Software Engineer',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});
