/**
 * Resume text extraction: cleanup and resource caps (Stage 0 parser hardening)
 */

import { cleanExtractedText } from '@/lib/textCleanup';
import { extractTextFromBuffer } from '@/lib/pdfParser';
import { extractTextFromBase64Image } from '@/lib/imageParser';

/** Build a minimal one-page PDF whose page shows each line of `lines`. */
function makePdf(lines: string[]): Buffer {
  const content = lines
    .map((line, i) => `BT /F1 12 Tf 72 ${720 - i * 16} Td (${line.replace(/[()\\]/g, '\\$&')}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

describe('cleanExtractedText', () => {
  test('does not glue ordinary words together', () => {
    // The old cleanup turned this into "Leda team of 5 and builta web app ina month".
    const text = 'Led a team of 5 and built a web app in a month';
    expect(cleanExtractedText(text)).toBe(text);
  });

  test('joins letter-spaced headings', () => {
    expect(cleanExtractedText('E X P E R I E N C E\nT r a v e l')).toBe('EXPERIENCE\nTravel');
  });

  test('keeps accented and non-Latin letters', () => {
    expect(cleanExtractedText('José Müller — Zürich')).toBe('José Müller — Zürich');
    expect(cleanExtractedText('مهندس نرم\u200Cافزار')).toBe('مهندس نرم\u200Cافزار');
  });

  test('keeps bullet characters that bullet detection relies on', () => {
    expect(cleanExtractedText('• Shipped X\n● Cut costs 20%')).toBe('• Shipped X\n● Cut costs 20%');
  });

  test('normalizes ligatures, odd spaces and invisible characters', () => {
    expect(cleanExtractedText('Of\uFB01ce\u00A0Manager\u2060')).toBe('Office Manager');
    // A zero-width space separates words, so it must not glue them together
    expect(cleanExtractedText('Senior\u200BEngineer')).toBe('Senior Engineer');
    expect(cleanExtractedText('\uF0E0 jane@example.com')).toBe('jane@example.com');
  });

  test('collapses whitespace and blank lines', () => {
    expect(cleanExtractedText('  a\t\tb  \r\n\r\n\r\n\r\nc  ')).toBe('a b\n\nc');
  });
});

describe('extractTextFromBuffer (PDF)', () => {
  test('extracts text from a valid PDF', async () => {
    const pdf = makePdf([
      'Jane Doe, Senior Software Engineer',
      'Led a team of 5 engineers to build a payments platform',
    ]);
    const result = await extractTextFromBuffer(pdf);

    expect(result.status).toBe('success');
    expect(result.method).toBe('pdf-parse');
    expect(result.text).toContain('Led a team of 5 engineers');
  });

  test('rejects data that is not a PDF without parsing it', async () => {
    const result = await extractTextFromBuffer(Buffer.from('<html>not a pdf</html>'));
    expect(result.status).toBe('failed');
    expect(result.message).toMatch(/not a valid PDF/);
  });

  test('rejects PDFs over the size cap', async () => {
    const big = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(5 * 1024 * 1024)]);
    const result = await extractTextFromBuffer(big);
    expect(result.status).toBe('failed');
    expect(result.message).toMatch(/larger than 5MB/);
  });

  test('returns a clear failure for a damaged PDF', async () => {
    const result = await extractTextFromBuffer(Buffer.from('%PDF-1.4\ngarbage'));
    expect(result.status).toBe('failed');
    expect(result.text).toBe('');
  });
});

describe('extractTextFromBase64Image', () => {
  test('rejects files that are not a supported image', async () => {
    const result = await extractTextFromBase64Image(
      Buffer.from('%PDF-1.4 pretending to be a photo').toString('base64')
    );
    expect(result.status).toBe('failed');
    expect(result.message).toMatch(/Unsupported image format/);
  });

  test('rejects images over the size cap', async () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(10 * 1024 * 1024)]);
    const result = await extractTextFromBase64Image(big.toString('base64'));
    expect(result.status).toBe('failed');
    expect(result.message).toMatch(/larger than 10MB/);
  });
});
