/**
 * Cross-site request forgery defense for API routes (lib/edge/originCheck)
 */

import { checkSameOrigin } from '@/lib/edge/originCheck';

const headers = (h: Record<string, string>) => new Headers({ host: 'careerq.example', ...h });

describe('checkSameOrigin', () => {
  test('allows safe methods from anywhere', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      expect(checkSameOrigin(method, headers({ origin: 'https://evil.example' }), '').allowed).toBe(true);
    }
  });

  test('allows a same-origin POST', () => {
    expect(checkSameOrigin('POST', headers({ origin: 'https://careerq.example' }), '').allowed).toBe(true);
  });

  test('blocks cross-origin state-changing requests', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const result = checkSameOrigin(method, headers({ origin: 'https://evil.example' }), '');
      expect(result.allowed).toBe(false);
    }
  });

  test('blocks a look-alike host and the opaque "null" origin', () => {
    expect(checkSameOrigin('POST', headers({ origin: 'https://careerq.example.evil.example' }), '').allowed).toBe(false);
    expect(checkSameOrigin('POST', headers({ origin: 'null' }), '').allowed).toBe(false);
  });

  test('accepts the host forwarded by a reverse proxy', () => {
    const h = new Headers({ host: 'internal:3000', 'x-forwarded-host': 'careerq.example', origin: 'https://careerq.example' });
    expect(checkSameOrigin('POST', h, '').allowed).toBe(true);
  });

  test('accepts origins listed in ALLOWED_ORIGINS', () => {
    const h = headers({ origin: 'https://www.careerq.example' });
    expect(checkSameOrigin('POST', h, '').allowed).toBe(false);
    expect(checkSameOrigin('POST', h, 'https://www.careerq.example, https://other.example').allowed).toBe(true);
  });

  test('without Origin, uses Fetch Metadata and then Referer', () => {
    expect(checkSameOrigin('POST', headers({ 'sec-fetch-site': 'cross-site' }), '').allowed).toBe(false);
    expect(checkSameOrigin('POST', headers({ referer: 'https://evil.example/page' }), '').allowed).toBe(false);
    expect(checkSameOrigin('POST', headers({ referer: 'https://careerq.example/pricing' }), '').allowed).toBe(true);
  });

  test('allows non-browser callers that send neither header', () => {
    expect(checkSameOrigin('POST', headers({}), '').allowed).toBe(true);
  });
});
