/**
 * Public copy may not make claims we cannot back up (Stage 0, see PR #189).
 *
 * Scans the source of every page and component for phrases that were removed
 * because nothing supports them. Admin pages and API routes are not public copy.
 * To add a claim back, first record the evidence for it in the decision log.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');
const SCANNED_DIRS = ['app', 'components'];
const SKIPPED_DIRS = [path.join('app', 'admin'), path.join('app', 'api')];

const BANNED: { pattern: RegExp; why: string }[] = [
  { pattern: /\b\d{1,3}(,\d{3})+\+/, why: 'user-count claim such as "10,000+"' },
  { pattern: /\bthousands of (professionals|job seekers|users)/i, why: 'unsupported user count' },
  { pattern: /(?<![\w-])\d(\.\d)?\/5\b/, why: 'star-rating claim' },
  { pattern: /\b\d{2,3}% (accuracy|satisfaction|ats pass)/i, why: 'unsupported accuracy or satisfaction rate' },
  { pattern: /(Accuracy Rate|User Satisfaction|ATS Pass Rate)/, why: 'unsupported metric label' },
  { pattern: /GPT-4o?\b/, why: 'model-brand claim; the default product does not call a model' },
  { pattern: /\b6[- ]?min(ute)?s?\b|6m 21s/i, why: 'unmeasured time claim' },
  { pattern: /money[- ]back|14-Day/i, why: 'refund promise without a refund policy' },
  { pattern: /100% (Secure|Free)/i, why: 'absolute safety or price promise' },
  { pattern: /\$(29|49)\/mo/, why: 'undated competitor price' },
  { pattern: /cohort of [\d,]+/i, why: 'unsupported study claim' },
  { pattern: /Calibrated with human reviewers/i, why: 'scoring is not calibrated (D-014)' },
  { pattern: /3 free scans|scans per month/i, why: 'quota the product does not enforce' },
];

function sourceFiles(dir: string): string[] {
  const full = path.join(ROOT, dir);
  if (SKIPPED_DIRS.includes(dir)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(rel);
    return /\.(tsx|ts)$/.test(entry.name) ? [rel] : [];
  });
}

describe('public copy', () => {
  const files = SCANNED_DIRS.flatMap(sourceFiles);

  test('scans the pages and components', () => {
    expect(files).toEqual(expect.arrayContaining([path.join('app', 'page.tsx'), path.join('app', 'pricing', 'page.tsx')]));
  });

  test.each(BANNED.map((b) => [b.why, b.pattern] as const))('contains no %s', (_why, pattern) => {
    const hits = files.flatMap((file) =>
      fs
        .readFileSync(path.join(ROOT, file), 'utf8')
        .split('\n')
        .map((line, i) => ({ file, line: i + 1, text: line.trim() }))
        .filter(({ text }) => pattern.test(text))
    );
    expect(hits).toEqual([]);
  });
});
