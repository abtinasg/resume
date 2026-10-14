/**
 * Cross-site request forgery defense for API routes.
 *
 * Browsers attach an Origin header to every POST, PUT, PATCH and DELETE request, and
 * a page on another site cannot forge it or add custom headers without a CORS
 * preflight, which these routes never grant. So a state-changing request is accepted
 * only when its Origin (or, failing that, its Referer) is this site.
 *
 * Edge-compatible: no Node APIs.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export type OriginCheckResult = { allowed: true } | { allowed: false; reason: string };

function originOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Hosts this request may come from: the Host header the browser sent, the host a
 * reverse proxy forwarded, and any origins listed in ALLOWED_ORIGINS (comma-separated).
 */
function allowedHosts(headers: Headers, extraOrigins: string | undefined): Set<string> {
  const hosts = new Set<string>();
  const host = headers.get('host');
  if (host) hosts.add(host.toLowerCase());
  const forwardedHost = headers.get('x-forwarded-host');
  if (forwardedHost) hosts.add(forwardedHost.split(',')[0].trim().toLowerCase());
  for (const entry of (extraOrigins ?? '').split(',')) {
    const origin = originOf(entry.trim());
    if (origin) hosts.add(new URL(origin).host.toLowerCase());
  }
  return hosts;
}

export function checkSameOrigin(
  method: string,
  headers: Headers,
  extraOrigins: string | undefined = process.env.ALLOWED_ORIGINS
): OriginCheckResult {
  if (SAFE_METHODS.has(method.toUpperCase())) return { allowed: true };

  const hosts = allowedHosts(headers, extraOrigins);
  const origin = headers.get('origin');

  if (origin !== null) {
    // "null" is sent by sandboxed frames and some redirects: never trusted
    const parsed = originOf(origin);
    if (parsed && hosts.has(new URL(parsed).host.toLowerCase())) return { allowed: true };
    return { allowed: false, reason: 'Cross-origin request blocked' };
  }

  // No Origin: fall back to Fetch Metadata, then Referer
  const fetchSite = headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') {
    return { allowed: false, reason: 'Cross-site request blocked' };
  }

  const referer = originOf(headers.get('referer'));
  if (referer) {
    if (hosts.has(new URL(referer).host.toLowerCase())) return { allowed: true };
    return { allowed: false, reason: 'Cross-origin request blocked' };
  }

  // Neither header: not a browser form or fetch (e.g. curl or a server-side caller),
  // which cannot ride on a victim's cookies.
  return { allowed: true };
}
