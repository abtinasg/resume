/**
 * Cross-site request forgery defense for API routes (lib/edge/originCheck)
 */

import { checkSameOrigin } from '@/lib/edge/originCheck';

const URL_ = 'https://careerq.example/api/resumes';
const headers = (h: Record<string, string>) => new Headers({ host: 'careerq.example', ...h });
const check = (method: string, h: Record<string, string>, extra = '') =>
  checkSameOrigin(method, headers(h), URL_, extra).allowed;

describe('checkSameOrigin', () => {
  test('allows safe methods from anywhere', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      expect(check(method, { origin: 'https://evil.example' })).toBe(true);
    }
  });

  test('allows a same-origin POST', () => {
    expect(check('POST', { origin: 'https://careerq.example' })).toBe(true);
  });

  test('blocks cross-origin state-changing requests', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(check(method, { origin: 'https://evil.example' })).toBe(false);
    }
  });

  test('blocks a look-alike host and the opaque "null" origin', () => {
    expect(check('POST', { origin: 'https://careerq.example.evil.example' })).toBe(false);
    expect(check('POST', { origin: 'null' })).toBe(false);
  });

  test('compares the scheme and port, not just the host name', () => {
    expect(check('POST', { origin: 'http://careerq.example' })).toBe(false);
    expect(check('POST', { origin: 'https://careerq.example:8443' })).toBe(false);
    expect(check('POST', { origin: 'https://careerq.example:443' })).toBe(true);
  });

  test('uses the scheme and host reported by a reverse proxy', () => {
    const h = new Headers({
      host: 'internal:3000',
      'x-forwarded-host': 'careerq.example',
      'x-forwarded-proto': 'https',
      origin: 'https://careerq.example',
    });
    expect(checkSameOrigin('POST', h, 'http://internal:3000/api/resumes', '').allowed).toBe(true);
    h.set('origin', 'http://careerq.example');
    expect(checkSameOrigin('POST', h, 'http://internal:3000/api/resumes', '').allowed).toBe(false);
  });

  test('accepts the configured app origin (ALLOWED_ORIGIN, as used for CORS)', () => {
    expect(check('POST', { origin: 'https://www.careerq.example' })).toBe(false);
    expect(check('POST', { origin: 'https://www.careerq.example' }, 'https://www.careerq.example')).toBe(true);
    expect(check('POST', { origin: 'http://www.careerq.example' }, 'https://www.careerq.example')).toBe(false);
  });

  test('without Origin, uses Fetch Metadata and then Referer', () => {
    expect(check('POST', { 'sec-fetch-site': 'cross-site' })).toBe(false);
    expect(check('POST', { referer: 'https://evil.example/page' })).toBe(false);
    expect(check('POST', { referer: 'http://careerq.example/pricing' })).toBe(false);
    expect(check('POST', { referer: 'https://careerq.example/pricing' })).toBe(true);
  });

  test('allows non-browser callers that send neither header', () => {
    expect(check('POST', {})).toBe(true);
  });
});
