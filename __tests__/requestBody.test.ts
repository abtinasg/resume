/**
 * Body-size cap for JSON requests (Stage 0 abuse protection)
 */

import { readJsonWithLimit } from '@/lib/requestBody';

/** A request whose body arrives in chunks with no Content-Length, like chunked transfer encoding. */
function chunkedRequest(chunks: string[]): Request {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    body: stream,
    // Required by Node's fetch for streaming bodies
    duplex: 'half',
  } as RequestInit);
}

describe('readJsonWithLimit', () => {
  test('parses a body within the limit', async () => {
    const result = await readJsonWithLimit(chunkedRequest(['{"a":', '1}']), 100);
    expect(result).toEqual({ ok: true, tooLarge: false, value: { a: 1 } });
  });

  test('stops reading a chunked body once it passes the limit', async () => {
    const result = await readJsonWithLimit(chunkedRequest(['{"a":"', 'x'.repeat(60), 'x'.repeat(60), '"}']), 100);
    expect(result).toEqual({ ok: false, tooLarge: true });
  });

  test('reports invalid JSON', async () => {
    const result = await readJsonWithLimit(chunkedRequest(['not json']), 100);
    expect(result).toEqual({ ok: false, tooLarge: false });
  });

  test('reports an empty body as invalid', async () => {
    const result = await readJsonWithLimit(new Request('http://localhost/api/analyze', { method: 'POST' }), 100);
    expect(result).toEqual({ ok: false, tooLarge: false });
  });
});
