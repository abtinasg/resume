/**
 * Layer 3 - Execution Engine
 * Tense Unifier
 *
 * Detects and unifies tense across bullets.
 */

// ==================== Types ====================

/**
 * Detected tense
 */
export type Tense = 'past' | 'present';

/**
 * Tense detection result
 */
export interface TenseDetectionResult {
  /** Detected tense */
  tense: Tense;
  /** Confidence in detection */
  confidence: 'low' | 'medium' | 'high';
  /** Number of past tense indicators */
  pastCount: number;
  /** Number of present tense indicators */
  presentCount: number;
}

// ==================== Detection Patterns ====================

/**
 * Past tense verb endings
 */
const PAST_TENSE_PATTERNS = [
  /\b(\w+ed)\b/g, // Regular past tense (developed, created)
  /\b(led|built|wrote|made|grew|drove|ran|won|saw|found|got|gave|took|went|sent|held|began|brought|thought)\b/gi,
];

/**
 * Present tense patterns
 */
const PRESENT_TENSE_PATTERNS = [
  /\b(\w+s)\b(?!\s+(?:team|project|system|process|code|data|users|customers|engineers|developers|clients))/g, // Third person singular (develops, creates) - exclude plurals
  /\b(develop|create|manage|lead|build|write|make|grow|drive|run|win|give|take|bring|think)\b/gi, // Base form
];

/**
 * Past tense indicators (sentence starters)
 */
const PAST_INDICATORS = [
  /^(Led|Managed|Developed|Created|Built|Designed|Implemented|Delivered|Achieved|Reduced|Increased|Improved|Drove|Directed|Oversaw|Architected|Spearheaded|Launched|Established|Initiated|Engineered|Optimized|Streamlined|Automated|Deployed|Migrated|Resolved|Collaborated|Partnered|Mentored|Trained)/,
];

/**
 * Present tense indicators (sentence starters)
 */
const PRESENT_INDICATORS = [
  /^(Lead|Manage|Develop|Create|Build|Design|Implement|Deliver|Achieve|Reduce|Increase|Improve|Drive|Direct|Oversee|Architect|Spearhead|Launch|Establish|Initiate|Engineer|Optimize|Streamline|Automate|Deploy|Migrate|Resolve|Collaborate|Partner|Mentor|Train)/,
];

// ==================== Detection Functions ====================

/**
 * Detect tense of a single bullet
 */
export function detectBulletTense(bullet: string): Tense | null {
  // Check for past tense indicators
  for (const pattern of PAST_INDICATORS) {
    if (pattern.test(bullet)) {
      return 'past';
    }
  }

  // Check for present tense indicators
  for (const pattern of PRESENT_INDICATORS) {
    if (pattern.test(bullet)) {
      return 'present';
    }
  }

  // Count past/present tense verbs
  let pastCount = 0;
  let presentCount = 0;

  for (const pattern of PAST_TENSE_PATTERNS) {
    const matches = bullet.match(pattern);
    if (matches) {
      pastCount += matches.length;
    }
  }

  for (const pattern of PRESENT_TENSE_PATTERNS) {
    const matches = bullet.match(pattern);
    if (matches) {
      presentCount += matches.length;
    }
  }

  if (pastCount > presentCount) {
    return 'past';
  }
  if (presentCount > pastCount) {
    return 'present';
  }

  return null; // Can't determine
}

/**
 * Detect dominant tense across multiple bullets
 */
export function detectDominantTense(bullets: string[]): TenseDetectionResult {
  let pastCount = 0;
  let presentCount = 0;

  for (const bullet of bullets) {
    const tense = detectBulletTense(bullet);
    if (tense === 'past') {
      pastCount++;
    } else if (tense === 'present') {
      presentCount++;
    }
  }

  const total = pastCount + presentCount;
  const tense: Tense = pastCount >= presentCount ? 'past' : 'present';

  // Determine confidence
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (total > 0) {
    const ratio = Math.max(pastCount, presentCount) / total;
    if (ratio >= 0.8) {
      confidence = 'high';
    } else if (ratio >= 0.6) {
      confidence = 'medium';
    }
  }

  return {
    tense,
    confidence,
    pastCount,
    presentCount,
  };
}

// ==================== Tense Conversion ====================

/**
 * Common verb conversions
 */
const VERB_CONVERSIONS: Record<string, { past: string; present: string }> = {
  // Irregular verbs
  lead: { past: 'Led', present: 'Lead' },
  build: { past: 'Built', present: 'Build' },
  write: { past: 'Wrote', present: 'Write' },
  make: { past: 'Made', present: 'Make' },
  grow: { past: 'Grew', present: 'Grow' },
  drive: { past: 'Drove', present: 'Drive' },
  run: { past: 'Ran', present: 'Run' },
  win: { past: 'Won', present: 'Win' },
  give: { past: 'Gave', present: 'Give' },
  take: { past: 'Took', present: 'Take' },
  begin: { past: 'Began', present: 'Begin' },
  bring: { past: 'Brought', present: 'Bring' },
  think: { past: 'Thought', present: 'Think' },
  teach: { past: 'Taught', present: 'Teach' },
  
  // Regular verbs (auto-converted)
  develop: { past: 'Developed', present: 'Develop' },
  create: { past: 'Created', present: 'Create' },
  manage: { past: 'Managed', present: 'Manage' },
  design: { past: 'Designed', present: 'Design' },
  implement: { past: 'Implemented', present: 'Implement' },
  deliver: { past: 'Delivered', present: 'Deliver' },
  achieve: { past: 'Achieved', present: 'Achieve' },
  reduce: { past: 'Reduced', present: 'Reduce' },
  increase: { past: 'Increased', present: 'Increase' },
  improve: { past: 'Improved', present: 'Improve' },
  direct: { past: 'Directed', present: 'Direct' },
  oversee: { past: 'Oversaw', present: 'Oversee' },
  architect: { past: 'Architected', present: 'Architect' },
  spearhead: { past: 'Spearheaded', present: 'Spearhead' },
  launch: { past: 'Launched', present: 'Launch' },
  establish: { past: 'Established', present: 'Establish' },
  initiate: { past: 'Initiated', present: 'Initiate' },
  engineer: { past: 'Engineered', present: 'Engineer' },
  optimize: { past: 'Optimized', present: 'Optimize' },
  streamline: { past: 'Streamlined', present: 'Streamline' },
  automate: { past: 'Automated', present: 'Automate' },
  deploy: { past: 'Deployed', present: 'Deploy' },
  migrate: { past: 'Migrated', present: 'Migrate' },
  resolve: { past: 'Resolved', present: 'Resolve' },
  collaborate: { past: 'Collaborated', present: 'Collaborate' },
  partner: { past: 'Partnered', present: 'Partner' },
  mentor: { past: 'Mentored', present: 'Mentor' },
  train: { past: 'Trained', present: 'Train' },
  coordinate: { past: 'Coordinated', present: 'Coordinate' },
  facilitate: { past: 'Facilitated', present: 'Facilitate' },
  support: { past: 'Supported', present: 'Support' },
  enable: { past: 'Enabled', present: 'Enable' },
  execute: { past: 'Executed', present: 'Execute' },
  transform: { past: 'Transformed', present: 'Transform' },
  scale: { past: 'Scaled', present: 'Scale' },
  secure: { past: 'Secured', present: 'Secure' },
};

/**
 * Convert first verb to target tense
 */
export function convertToTense(bullet: string, targetTense: Tense): string {
  const words = bullet.split(/\s+/);
  if (words.length === 0) return bullet;

  const firstWord = words[0];
  const firstWordLower = firstWord.toLowerCase();

  // Check if we have a conversion
  const conversion = VERB_CONVERSIONS[firstWordLower];
  if (conversion) {
    words[0] = targetTense === 'past' ? conversion.past : conversion.present;
    return words.join(' ');
  }

  // Try regex-based conversion for regular verbs
  if (targetTense === 'past' && !firstWordLower.endsWith('ed')) {
    // Convert to past tense
    if (firstWordLower.endsWith('e')) {
      words[0] = capitalize(firstWordLower + 'd');
    } else if (firstWordLower.match(/[aeiou][bcdfghjklmnpqrstvwxyz]$/)) {
      // Double final consonant
      words[0] = capitalize(firstWordLower + firstWordLower.slice(-1) + 'ed');
    } else {
      words[0] = capitalize(firstWordLower + 'ed');
    }
    return words.join(' ');
  }

  if (targetTense === 'present' && firstWordLower.endsWith('ed')) {
    // Convert to present tense (remove -ed)
    let base = firstWordLower.slice(0, -2);
    if (base.endsWith('i')) {
      base = base.slice(0, -1) + 'y';
    }
    words[0] = capitalize(base);
    return words.join(' ');
  }

  return bullet;
}

/**
 * Capitalize first letter
 */
function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// ==================== Unification Functions ====================

/**
 * Unify tense across multiple bullets
 */
export function unifyTense(bullets: string[], targetTense: Tense): string[] {
  return bullets.map((bullet) => convertToTense(bullet, targetTense));
}

/**
 * Unify tense to dominant tense
 */
export function unifyToDominant(bullets: string[]): {
  bullets: string[];
  tense: Tense;
  confidence: 'low' | 'medium' | 'high';
} {
  const detection = detectDominantTense(bullets);
  const unified = unifyTense(bullets, detection.tense);

  return {
    bullets: unified,
    tense: detection.tense,
    confidence: detection.confidence,
  };
}

// ==================== Analysis Functions ====================

/**
 * Check if all bullets have consistent tense
 */
export function hasConsistentTense(bullets: string[]): boolean {
  const detection = detectDominantTense(bullets);
  const total = detection.pastCount + detection.presentCount;

  if (total === 0) return true;

  const dominantCount = Math.max(detection.pastCount, detection.presentCount);
  return dominantCount === total;
}

/**
 * Get bullets that don't match dominant tense
 */
export function getInconsistentBullets(
  bullets: string[]
): Array<{ index: number; bullet: string; tense: Tense | null }> {
  const detection = detectDominantTense(bullets);
  const inconsistent: Array<{ index: number; bullet: string; tense: Tense | null }> = [];

  for (let i = 0; i < bullets.length; i++) {
    const bulletTense = detectBulletTense(bullets[i]);
    if (bulletTense !== null && bulletTense !== detection.tense) {
      inconsistent.push({
        index: i,
        bullet: bullets[i],
        tense: bulletTense,
      });
    }
  }

  return inconsistent;
}
