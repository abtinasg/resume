/**
 * Layer 3 - Execution Engine
 * Format Unifier
 *
 * Unifies formatting across bullets for consistency.
 */

// ==================== Formatting Functions ====================

/**
 * Unify formatting of a single bullet
 */
export function unifyBulletFormatting(bullet: string): string {
  let cleaned = bullet;

  // 1. Trim whitespace
  cleaned = cleaned.trim();

  // 2. Remove extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // 3. Ensure starts with capital letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // 4. Remove trailing period (resume bullets typically don't have periods)
  cleaned = cleaned.replace(/\.\s*$/, '');

  // 5. Fix common punctuation issues
  cleaned = cleaned.replace(/\s+,/g, ',');
  cleaned = cleaned.replace(/,\s+/g, ', ');
  cleaned = cleaned.replace(/\s+;/g, ';');
  cleaned = cleaned.replace(/;\s+/g, '; ');

  // 6. Fix dash usage
  cleaned = cleaned.replace(/\s+-\s+/g, ' - ');
  cleaned = cleaned.replace(/\s+–\s+/g, ' – ');
  cleaned = cleaned.replace(/\s+—\s+/g, ' — ');

  // 7. Remove any emojis or special characters (ATS safety)
  cleaned = cleaned.replace(/[^\x00-\x7F]/g, (char) => {
    // Keep common unicode that ATS can handle
    if (char === '\u2013' || char === '\u2014') return '-';
    if (char === '\u2018' || char === '\u2019') return "'";
    if (char === '\u201C' || char === '\u201D') return '"';
    return '';
  });

  // 8. Fix multiple punctuation
  cleaned = cleaned.replace(/\.{2,}/g, '.');
  cleaned = cleaned.replace(/,{2,}/g, ',');

  // 9. Remove bullet points at start (if any)
  cleaned = cleaned.replace(/^[•\-*]\s*/, '');

  return cleaned;
}

/**
 * Unify formatting across multiple bullets
 */
export function unifyFormatting(bullets: string[]): string[] {
  return bullets.map(unifyBulletFormatting);
}

// ==================== Punctuation Functions ====================

/**
 * Check if bullet ends with punctuation
 */
export function endsWithPunctuation(bullet: string): boolean {
  return /[.!?]$/.test(bullet.trim());
}

/**
 * Remove trailing punctuation
 */
export function removeTrailingPunctuation(bullet: string): string {
  return bullet.trim().replace(/[.!?]+$/, '');
}

/**
 * Add trailing period (if needed)
 */
export function addTrailingPeriod(bullet: string): string {
  const trimmed = bullet.trim();
  if (!endsWithPunctuation(trimmed)) {
    return trimmed + '.';
  }
  return trimmed;
}

/**
 * Unify punctuation style across bullets
 */
export function unifyPunctuation(
  bullets: string[],
  style: 'none' | 'period'
): string[] {
  if (style === 'none') {
    return bullets.map(removeTrailingPunctuation);
  }
  return bullets.map(addTrailingPeriod);
}

// ==================== Capitalization Functions ====================

/**
 * Capitalize first letter of bullet
 */
export function capitalizeFirst(bullet: string): string {
  if (bullet.length === 0) return bullet;
  return bullet.charAt(0).toUpperCase() + bullet.slice(1);
}

/**
 * Check if bullet starts with capital letter
 */
export function startsWithCapital(bullet: string): boolean {
  return /^[A-Z]/.test(bullet.trim());
}

/**
 * Unify capitalization (all bullets start with capital)
 */
export function unifyCapitalization(bullets: string[]): string[] {
  return bullets.map(capitalizeFirst);
}

// ==================== Whitespace Functions ====================

/**
 * Normalize whitespace in bullet
 */
export function normalizeWhitespace(bullet: string): string {
  return bullet.replace(/\s+/g, ' ').trim();
}

/**
 * Remove leading whitespace from all bullets
 */
export function removeLeadingWhitespace(bullets: string[]): string[] {
  return bullets.map((b) => b.trimStart());
}

// ==================== Character Cleanup ====================

/**
 * Characters to remove for ATS safety
 */
const ATS_UNSAFE_CHARS = /[^\x20-\x7E\n\r\t]/g;

/**
 * Make bullet ATS-safe
 */
export function makeATSSafe(bullet: string): string {
  return bullet.replace(ATS_UNSAFE_CHARS, (char) => {
    // Common replacements
    const replacements: Record<string, string> = {
      '\u2018': "'",
      '\u2019': "'",
      '\u201C': '"',
      '\u201D': '"',
      '\u2013': '-',
      '\u2014': '-',
      '\u2026': '...',
      '\u2022': '-',
      '\u00B7': '-',
      '\u00AE': '',
      '\u2122': '',
      '\u00A9': '',
    };
    return replacements[char] || '';
  });
}

/**
 * Make all bullets ATS-safe
 */
export function makeAllATSSafe(bullets: string[]): string[] {
  return bullets.map(makeATSSafe);
}

// ==================== Length Functions ====================

/**
 * Check if bullet is too short
 */
export function isTooShort(bullet: string, minLength = 20): boolean {
  return bullet.trim().length < minLength;
}

/**
 * Check if bullet is too long
 */
export function isTooLong(bullet: string, maxLength = 200): boolean {
  return bullet.trim().length > maxLength;
}

/**
 * Get bullets that are too long
 */
export function getTooLongBullets(
  bullets: string[],
  maxLength = 200
): Array<{ index: number; bullet: string; length: number }> {
  return bullets
    .map((bullet, index) => ({
      index,
      bullet,
      length: bullet.trim().length,
    }))
    .filter((item) => item.length > maxLength);
}

// ==================== Number Formatting ====================

/**
 * Standardize number formatting
 */
export function standardizeNumbers(bullet: string): string {
  let result = bullet;

  // Standardize percentage format (40 % -> 40%)
  result = result.replace(/(\d+)\s+%/g, '$1%');

  // Standardize dollar format ($5 K -> $5K)
  result = result.replace(/\$\s*(\d+)\s*([KMB])/gi, (_, num, suffix) =>
    `$${num}${suffix.toUpperCase()}`
  );

  // Standardize multiplier format (10 x -> 10x)
  result = result.replace(/(\d+)\s*[xX]/g, '$1x');

  return result;
}

/**
 * Standardize numbers in all bullets
 */
export function standardizeAllNumbers(bullets: string[]): string[] {
  return bullets.map(standardizeNumbers);
}

// ==================== Full Formatting Pipeline ====================

/**
 * Apply all formatting fixes
 */
export function applyFullFormatting(bullet: string): string {
  let result = bullet;

  result = normalizeWhitespace(result);
  result = makeATSSafe(result);
  result = capitalizeFirst(result);
  result = standardizeNumbers(result);
  result = removeTrailingPunctuation(result);

  return result;
}

/**
 * Apply full formatting to all bullets
 */
export function applyFullFormattingToAll(bullets: string[]): string[] {
  return bullets.map(applyFullFormatting);
}
