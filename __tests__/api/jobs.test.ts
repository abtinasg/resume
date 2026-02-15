// @ts-nocheck
import { NextRequest } from 'next/server';

/**
 * Mock dependencies for the jobs routes.
 *
 * The jobs routes use:
 *  - @/lib/verifyAuth (verifyAuth)
 *  - @/lib/layers (Layer6)
 */

jest.mock('@/lib/verifyAuth', () => ({
  verifyAuth: jest.fn(),
}));

jest.mock('@/lib/layers', () => ({
  Layer6: {
    getRankedJobs: jest.fn(),
    parseAndRankJob: jest.fn(),
    compareJobsSideBySide: jest.fn(),
  },
}));

// Also mock the sub-dependencies that verifyAuth would use internally
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth-config', () => ({
  authOptions: {},
}));

import { GET as listGET } from '@/app/api/jobs/list/route';
import { POST as pastePOST } from '@/app/api/jobs/paste/route';
import { POST as comparePOST } from '@/app/api/jobs/compare/route';
import { verifyAuth } from '@/lib/verifyAuth';
import { Layer6 } from '@/lib/layers';

const mockedVerifyAuth = verifyAuth as jest.MockedFunction<typeof verifyAuth>;
const mockedLayer6 = Layer6 as jest.Mocked<typeof Layer6>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockGETRequest(
  params: Record<string, string>,
  options?: { headers?: Record<string, string> }
) {
  const url = new URL('http://localhost:3000/api/jobs/list');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return {
    json: jest.fn(),
    method: 'GET',
    headers: new Headers(options?.headers || {}),
    cookies: { get: jest.fn() },
    url: url.toString(),
    nextUrl: url,
  } as unknown as NextRequest;
}

function createMockPOSTRequest(body: any, options?: { method?: string; headers?: Record<string, string> }) {
  return {
    json: jest.fn().mockResolvedValue(body),
    method: options?.method || 'POST',
    headers: new Headers(options?.headers || {}),
    cookies: { get: jest.fn() },
    url: 'http://localhost:3000/api/jobs/paste',
    nextUrl: new URL('http://localhost:3000/api/jobs/paste'),
  } as unknown as NextRequest;
}

function mockAuthenticated(userId = 'user-123') {
  mockedVerifyAuth.mockResolvedValue({
    isValid: true,
    userId,
    email: 'test@example.com',
  });
}

function mockUnauthenticated() {
  mockedVerifyAuth.mockResolvedValue({
    isValid: false,
  });
}

// ---------------------------------------------------------------------------
// List route tests
// ---------------------------------------------------------------------------

describe('GET /api/jobs/list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    mockUnauthenticated();

    const req = createMockGETRequest({ user_id: 'user-123' });
    const res = await listGET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 for missing user_id', async () => {
    mockAuthenticated('user-123');

    const req = createMockGETRequest({});
    const res = await listGET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing user_id');
  });

  it('returns 403 for mismatched user_id', async () => {
    mockAuthenticated('user-123');

    const req = createMockGETRequest({ user_id: 'user-999' });
    const res = await listGET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('Forbidden');
  });

  it('returns 200 with ranked jobs for valid request', async () => {
    mockAuthenticated('user-123');

    mockedLayer6.getRankedJobs.mockResolvedValue({
      success: true,
      data: {
        jobs: { reach: [], target: [], safety: [], avoid: [] },
        top_recommendations: [],
        summary: 'No jobs found',
        insights: [],
      },
    } as any);

    const req = createMockGETRequest({ user_id: 'user-123' });
    const res = await listGET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.jobs).toBeDefined();
    expect(json.jobs.reach).toBeDefined();
    expect(json.jobs.target).toBeDefined();
    expect(json.jobs.safety).toBeDefined();
    expect(json.jobs.avoid).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Paste route tests
// ---------------------------------------------------------------------------

describe('POST /api/jobs/paste', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    mockUnauthenticated();

    const req = createMockPOSTRequest({
      job_description: 'A long job description with enough characters to pass validation easily.',
      user_id: 'user-123',
    });
    const res = await pastePOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 for missing job description', async () => {
    mockAuthenticated('user-123');

    const req = createMockPOSTRequest({
      user_id: 'user-123',
    });
    const res = await pastePOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing job_description');
  });

  it('returns 400 for missing user_id', async () => {
    mockAuthenticated('user-123');

    const req = createMockPOSTRequest({
      job_description: 'A long job description with enough characters to pass validation easily.',
    });
    const res = await pastePOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing user_id');
  });

  it('returns 403 for mismatched user_id', async () => {
    mockAuthenticated('user-123');

    const req = createMockPOSTRequest({
      job_description: 'A long job description with enough characters to pass validation easily.',
      user_id: 'user-999',
    });
    const res = await pastePOST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('Forbidden');
  });

  it('returns 200 for valid job paste', async () => {
    mockAuthenticated('user-123');

    mockedLayer6.parseAndRankJob.mockResolvedValue({
      success: true,
      data: {
        job: {
          job_id: 'job-1',
          job_title: 'Senior Software Engineer',
          company: 'Acme Corp',
          location: 'Remote',
          requirements: [],
          responsibilities: [],
          work_arrangement: 'remote',
          salary_range: null,
          metadata: {},
        },
        fit_score: 82,
        category: 'target',
        category_reasoning: 'Good match for skills',
        should_apply: true,
        application_priority: 'high',
        score_breakdown: {},
        flags: [],
        quick_insights: [],
        career_capital: { score: 75 },
        scam_detection: { is_scam: false },
      },
    } as any);

    const req = createMockPOSTRequest({
      job_description: 'We are looking for a Senior Software Engineer with 5+ years of experience in React and Node.js to join our team.',
      user_id: 'user-123',
    });
    const res = await pastePOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.job).toBeDefined();
    expect(json.job.job_title).toBe('Senior Software Engineer');
    expect(json.job.fit_score).toBe(82);
  });
});

// ---------------------------------------------------------------------------
// Compare route tests
// ---------------------------------------------------------------------------

describe('POST /api/jobs/compare', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    mockUnauthenticated();

    const req = createMockPOSTRequest({
      user_id: 'user-123',
      jobs: [{ job_id: '1' }, { job_id: '2' }],
    });
    const res = await comparePOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 for missing user_id', async () => {
    mockAuthenticated('user-123');

    const req = createMockPOSTRequest({
      jobs: [{ job_id: '1' }, { job_id: '2' }],
    });
    const res = await comparePOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing user_id');
  });

  it('returns 403 for mismatched user_id', async () => {
    mockAuthenticated('user-123');

    const req = createMockPOSTRequest({
      user_id: 'user-999',
      jobs: [{ job_id: '1' }, { job_id: '2' }],
    });
    const res = await comparePOST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('Forbidden');
  });

  it('returns 400 for missing jobs array and job_ids', async () => {
    mockAuthenticated('user-123');

    const req = createMockPOSTRequest({
      user_id: 'user-123',
    });
    const res = await comparePOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing jobs array or job_ids for comparison');
  });

  it('returns 400 for fewer than 2 jobs', async () => {
    mockAuthenticated('user-123');

    const req = createMockPOSTRequest({
      user_id: 'user-123',
      jobs: [{ job_id: '1' }],
    });
    const res = await comparePOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('At least 2 jobs are required for comparison');
  });

  it('returns 200 for valid comparison', async () => {
    mockAuthenticated('user-123');

    mockedLayer6.compareJobsSideBySide.mockResolvedValue({
      success: true,
      data: {
        jobs: [
          {
            job: { job_id: '1', job_title: 'Engineer', company: 'A', location: 'NYC' },
            fit_score: 80,
            category: 'target',
            should_apply: true,
            career_capital: { score: 70 },
          },
          {
            job: { job_id: '2', job_title: 'Developer', company: 'B', location: 'SF' },
            fit_score: 75,
            category: 'target',
            should_apply: true,
            career_capital: { score: 65 },
          },
        ],
        comparison: { summary: 'Both strong options' },
        best_fit: '1',
        easiest_to_get: '2',
        best_for_growth: '1',
        best_for_brand: '1',
        best_for_compensation: '2',
        insights: ['Consider A for career growth'],
      },
    } as any);

    const req = createMockPOSTRequest({
      user_id: 'user-123',
      jobs: [
        { job_id: '1', job_title: 'Engineer', company: 'A' },
        { job_id: '2', job_title: 'Developer', company: 'B' },
      ],
    });
    const res = await comparePOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.comparison).toBeDefined();
    expect(json.comparison.jobs).toHaveLength(2);
    expect(json.comparison.best_fit).toBe('1');
  });
});
