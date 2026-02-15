// @ts-nocheck
import { NextRequest } from 'next/server';

/**
 * Mock dependencies for the rewrite routes.
 *
 * The rewrite routes use:
 *  - next-auth (getServerSession)
 *  - @/lib/auth-config (authOptions)
 *  - @/lib/layers/layer3 (rewriteBullet, rewriteSummary, rewriteSection)
 */

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth-config', () => ({
  authOptions: {},
}));

jest.mock('@/lib/layers/layer3', () => ({
  rewriteBullet: jest.fn(),
  rewriteSummary: jest.fn(),
  rewriteSection: jest.fn(),
}));

import { POST as bulletPOST } from '@/app/api/rewrite/bullet/route';
import { POST as summaryPOST } from '@/app/api/rewrite/summary/route';
import { POST as sectionPOST } from '@/app/api/rewrite/section/route';
import { getServerSession } from 'next-auth';
import { rewriteBullet, rewriteSummary, rewriteSection } from '@/lib/layers/layer3';

const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockedRewriteBullet = rewriteBullet as jest.MockedFunction<typeof rewriteBullet>;
const mockedRewriteSummary = rewriteSummary as jest.MockedFunction<typeof rewriteSummary>;
const mockedRewriteSection = rewriteSection as jest.MockedFunction<typeof rewriteSection>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRequest(body: any, options?: { method?: string; headers?: Record<string, string> }) {
  return {
    json: jest.fn().mockResolvedValue(body),
    method: options?.method || 'POST',
    headers: new Headers(options?.headers || {}),
    cookies: { get: jest.fn() },
    url: 'http://localhost:3000/api/test',
    nextUrl: new URL('http://localhost:3000/api/test'),
  } as unknown as NextRequest;
}

function mockAuthenticatedSession(userId = 'user-123') {
  mockedGetServerSession.mockResolvedValue({
    user: { id: userId, email: 'test@example.com', name: 'Test User' },
    expires: '2099-01-01T00:00:00.000Z',
  } as any);
}

function mockUnauthenticatedSession() {
  mockedGetServerSession.mockResolvedValue(null);
}

// ---------------------------------------------------------------------------
// Bullet rewrite tests
// ---------------------------------------------------------------------------

describe('POST /api/rewrite/bullet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    mockUnauthenticatedSession();

    const req = createMockRequest({ bullet: 'Managed a team' });
    const res = await bulletPOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 for missing bullet text', async () => {
    mockAuthenticatedSession();

    const req = createMockRequest({ bullet: '' });
    const res = await bulletPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('bullet is required');
  });

  it('returns 200 for valid request', async () => {
    mockAuthenticatedSession();

    mockedRewriteBullet.mockResolvedValue({
      original: 'Managed a team of engineers',
      improved: 'Led a cross-functional team of 8 engineers, delivering 3 major product features ahead of schedule',
      reasoning: 'Added quantification and stronger action verb',
      changes: ['Replaced weak verb', 'Added metrics'],
      validation: { no_hallucination: true, preserves_meaning: true, evidence_anchored: true },
      evidence_map: {},
      confidence: 0.92,
      estimated_score_gain: 5,
    } as any);

    const req = createMockRequest({
      bullet: 'Managed a team of engineers',
      targetRole: 'Engineering Manager',
    });
    const res = await bulletPOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.original).toBe('Managed a team of engineers');
    expect(json.data.improved).toBeDefined();
    expect(json.data.reasoning).toBeDefined();
    expect(json.data.confidence).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Summary rewrite tests
// ---------------------------------------------------------------------------

describe('POST /api/rewrite/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    mockUnauthenticatedSession();

    const req = createMockRequest({ currentSummary: 'I am a developer' });
    const res = await summaryPOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 for missing summary', async () => {
    mockAuthenticatedSession();

    const req = createMockRequest({ currentSummary: '' });
    const res = await summaryPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('currentSummary is required');
  });

  it('returns 200 for valid request', async () => {
    mockAuthenticatedSession();

    mockedRewriteSummary.mockResolvedValue({
      original: 'I am a software developer with experience.',
      improved: 'Results-driven software engineer with 5+ years building scalable web applications.',
      reasoning: 'Made it more impactful with specifics',
      changes: ['Added years of experience', 'Replaced vague terms'],
      validation: { no_hallucination: true, preserves_meaning: true, evidence_anchored: true },
      evidence_map: {},
      confidence: 0.88,
      estimated_score_gain: 7,
    } as any);

    const req = createMockRequest({
      currentSummary: 'I am a software developer with experience.',
      targetRole: 'Senior Software Engineer',
    });
    const res = await summaryPOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.original).toBe('I am a software developer with experience.');
    expect(json.data.improved).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Section rewrite tests
// ---------------------------------------------------------------------------

describe('POST /api/rewrite/section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    mockUnauthenticatedSession();

    const req = createMockRequest({
      bullets: ['Worked on project'],
      sectionTitle: 'Experience',
    });
    const res = await sectionPOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 for missing bullets array', async () => {
    mockAuthenticatedSession();

    const req = createMockRequest({
      sectionTitle: 'Experience',
    });
    const res = await sectionPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('bullets array is required');
  });

  it('returns 400 for non-array bullets', async () => {
    mockAuthenticatedSession();

    const req = createMockRequest({
      bullets: 'not an array',
      sectionTitle: 'Experience',
    });
    const res = await sectionPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('bullets array is required');
  });

  it('returns 400 for missing section title', async () => {
    mockAuthenticatedSession();

    const req = createMockRequest({
      bullets: ['Worked on project'],
      sectionTitle: '',
    });
    const res = await sectionPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('sectionTitle is required');
  });

  it('returns 200 for valid request', async () => {
    mockAuthenticatedSession();

    mockedRewriteSection.mockResolvedValue({
      original_bullets: ['Worked on project'],
      improved_bullets: ['Spearheaded development of a customer-facing dashboard, reducing load times by 40%'],
      estimated_aggregate_gain: 12,
      validation_summary: { no_hallucination: true, preserves_meaning: true, evidence_anchored: true },
      per_bullet_details: [],
      section_notes: 'Improved action verbs and added quantification',
      confidence: 0.85,
    } as any);

    const req = createMockRequest({
      bullets: ['Worked on project'],
      sectionTitle: 'Experience',
      targetRole: 'Software Engineer',
    });
    const res = await sectionPOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.original_bullets).toBeDefined();
    expect(json.data.improved_bullets).toBeDefined();
    expect(json.data.estimated_aggregate_gain).toBeDefined();
  });
});
