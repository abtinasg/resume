/**
 * Cleanup for text extracted from PDFs and OCR.
 *
 * Shared by lib/pdfParser.ts and lib/imageParser.ts. Kept out of those files
 * because they are "use server" modules, which may only export async functions.
 */

// Control characters other than tab, newline and carriage return
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
// Zero-width space, word joiner, soft hyphen and byte-order mark: removed without a trace.
// Zero-width (non-)joiners stay: they are part of correct spelling in Persian and other scripts.
const INVISIBLE_CHARS = /[\u00AD\u200B\u2060\uFEFF]/g;
// Unicode spaces (no-break, thin, ideographic, ...)
const UNICODE_SPACES = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
// Private-use glyphs, e.g. icon-font symbols next to phone numbers and emails
const PRIVATE_USE_CHARS = /[\uE000-\uF8FF]/g;

// Four or more single letters separated by single spaces, e.g. "T R A V E L".
// Requiring four keeps ordinary prose such as "built a web app" intact.
const SPACED_LETTERS = /(^|[^A-Za-z0-9])((?:[A-Za-z] ){3,}[A-Za-z])(?![A-Za-z0-9])/gm;

/**
 * Normalize extracted text without changing its words.
 *
 * Keeps non-ASCII letters (accented names, non-Latin scripts) and bullet
 * characters, which downstream section and bullet detection rely on.
 */
export function cleanExtractedText(text: string): string {
  if (!text) return '';

  return (
    text
      // Ligatures ("ﬁ" -> "fi"), full-width forms and similar compatibility characters
      .normalize('NFKC')
      .replace(INVISIBLE_CHARS, '')
      .replace(CONTROL_CHARS, ' ')
      .replace(PRIVATE_USE_CHARS, ' ')
      .replace(UNICODE_SPACES, ' ')
      .replace(/\t/g, ' ')
      .replace(/\r\n?/g, '\n')
      .replace(/ +/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(SPACED_LETTERS, (_match, before: string, run: string) => before + run.replace(/ /g, ''))
      .trim()
  );
}
