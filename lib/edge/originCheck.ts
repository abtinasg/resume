/**
 * Cross-site request forgery defense for API routes.
 *
 * Browsers attach an Origin header to every POST, PUT, PATCH and DELETE request, and
 * a page on another site cannot forge it or add custom headers without a CORS
 * preflight. So a state-changing request is accepted only when its Origin (or,
 * failing that, its Referer) is this site, compared as a full origin: scheme, host
 * and port. An http:// page on our own host does not count as this site.
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

const firstValue = (value: string | null) => value?.split(',')[0].trim().toLowerCase() || null;

/**
 * Origins this request may come from: this site as the browser addressed it (the
 * scheme a reverse proxy reports, else the request's own, with the Host or the
 * proxy's X-Forwarded-Host), plus the configured app origins. Those are
 * ALLOWED_ORIGIN, the same setting next.config.js sends as the CORS
 * Access-Control-Allow-Origin, falling back to NEXTAUTH_URL as it does.
 */
function allowedOrigins(headers: Headers, requestUrl: string, extraOrigins: string | undefined): Set<string> {
  const origins = new Set<string>();
  const scheme = firstValue(headers.get('x-forwarded-proto')) ?? new URL(requestUrl).protocol.replace(':', '');
  for (const host of [headers.get('host'), firstValue(headers.get('x-forwarded-host'))]) {
    const origin = host ? originOf(`${scheme}://${host}`) : null;
    if (origin) origins.add(origin);
  }
  for (const entry of (extraOrigins ?? '').split(',')) {
    const origin = originOf(entry.trim());
    if (origin) origins.add(origin);
  }
  return origins;
}

export function checkSameOrigin(
  method: string,
  headers: Headers,
  requestUrl: string,
  extraOrigins: string | undefined = process.env.ALLOWED_ORIGIN || process.env.NEXTAUTH_URL
): OriginCheckResult {
  if (SAFE_METHODS.has(method.toUpperCase())) return { allowed: true };

  const origins = allowedOrigins(headers, requestUrl, extraOrigins);
  const origin = headers.get('origin');

  if (origin !== null) {
    // "null" is sent by sandboxed frames and some redirects: never trusted
    const parsed = originOf(origin);
    if (parsed && origins.has(parsed)) return { allowed: true };
    return { allowed: false, reason: 'Cross-origin request blocked' };
  }

  // No Origin: fall back to Fetch Metadata, then Referer
  const fetchSite = headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') {
    return { allowed: false, reason: 'Cross-site request blocked' };
  }

  const referer = originOf(headers.get('referer'));
  if (referer) {
    if (origins.has(referer)) return { allowed: true };
    return { allowed: false, reason: 'Cross-origin request blocked' };
  }

  // Neither header: not a browser form or fetch (e.g. curl or a server-side caller),
  // which cannot ride on a victim's cookies.
  return { allowed: true };
}
