import type { TokenData } from '@/lib/types/auth';

const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback_secret_for_development_only';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let cachedKey: CryptoKey | null = null;
let cachedSecretValue: string | null = null;

function base64UrlToUint8Array(input: string): Uint8Array {
  const paddingLength = (4 - (input.length % 4 || 4)) % 4;
  const paddedInput = `${input}${'='.repeat(paddingLength)}`
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const binary = atob(paddedInput);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function importSecretKey(secret: string): Promise<CryptoKey> {
  if (cachedKey && cachedSecretValue === secret) {
    return cachedKey;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['verify']
  );

  cachedKey = key;
  cachedSecretValue = secret;

  return key;
}

function parsePayload<T>(segment: string): T {
  const bytes = base64UrlToUint8Array(segment);
  const json = decoder.decode(bytes);
  return JSON.parse(json) as T;
}

export async function verifyTokenOnEdge(
  token: string
): Promise<TokenData | null> {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const header = parsePayload<{ alg?: string }>(encodedHeader);

    if (header.alg !== 'HS256') {
      return null;
    }

    const key = await importSecretKey(JWT_SECRET);
    const signature = base64UrlToUint8Array(encodedSignature);
    const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);

    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);

    if (!isValid) {
      return null;
    }

    const payload = parsePayload<TokenData>(encodedPayload);

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}
