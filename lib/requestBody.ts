/**
 * Read a JSON request body without buffering more than `maxBytes`.
 *
 * `Content-Length` alone is not enough: a chunked request has none, and
 * `request.json()` would buffer it whole.
 */

export type JsonBodyResult =
  | { ok: true; tooLarge: false; value: unknown }
  | { ok: false; tooLarge: boolean };

export async function readJsonWithLimit(
  request: Request,
  maxBytes: number
): Promise<JsonBodyResult> {
  if (!request.body) {
    // No stream to count (e.g. an empty body); json() rejects an empty body.
    try {
      return { ok: true, tooLarge: false, value: await request.json() };
    } catch {
      return { ok: false, tooLarge: false };
    }
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return { ok: false, tooLarge: true };
    }
    chunks.push(value);
  }

  try {
    const text = new TextDecoder().decode(Buffer.concat(chunks));
    return { ok: true, tooLarge: false, value: JSON.parse(text) };
  } catch {
    return { ok: false, tooLarge: false };
  }
}
