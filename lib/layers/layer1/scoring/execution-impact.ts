/**
 * Layer 1 - Evaluation Engine
 * Execution Impact Scoring Module
 *
 * Evaluates how well the resume demonstrates impact:
 * - Metric detection in bullet points
 * - Action verb strength
 * - Scope and scale indicators
 * - Impact quantification
 */

import type { ParsedResume, DimensionScore, WeakBullet, BulletIssue } from '../types';
import {
  METRIC_PATTERNS,
  STRONG_ACTION_VERBS,
  WEAK_ACTION_VERBS,
  CONTENT_THRESHOLDS,
} from '../config/weights';

// ==================== Main Scoring Function ====================

/**
 * Calculate execution impact score (0-100)
 */
export function calculateExecutionImpactScore(
  parsed: ParsedResume
): { score: DimensionScore; weakBullets: WeakBullet[] } {
  const breakdown: Record<string, number> = {};
  const issues: string[] = [];
  const weakBullets: WeakBullet[] = [];

  // Get all bullets from experiences
  const allBullets = parsed.experiences.flatMap((exp, expIdx) =>
    exp.bullets.map((bullet, bulletIdx) => ({
      bullet,
      company: exp.company,
      title: exp.title,
      index: bulletIdx,
    }))
  );

  if (allBullets.length === 0) {
    return {
      score: {
        score: 0,
        breakdown: { no_content: 0 },
        issues: ['no_experience_bullets'],
      },
      weakBullets: [],
    };
  }

  // 1. Metric quantification score (0-35)
  const metricScore = calculateMetricScore(allBullets, issues, weakBullets);
  breakdown.metrics_ratio = metricScore;

  // 2. Action verb strength score (0-35)
  const actionScore = calculateActionVerbScore(allBullets, issues, weakBullets);
  breakdown.action_ratio = actionScore;

  // 3. Scope and impact indicators (0-30)
  const scopeScore = calculateScopeScore(allBullets, issues);
  breakdown.scope_indicators = scopeScore;

  // Calculate total score
  const totalScore = metricScore + actionScore + scopeScore;
  const normalizedScore = Math.min(100, totalScore);

  // Calculate generic ratio for weakness detection
  const genericRatio = calculateGenericRatio(allBullets);
  breakdown.generic_ratio = Math.round(genericRatio * 100);

  if (genericRatio > CONTENT_THRESHOLDS.max_generic_ratio) {
    issues.push('generic_descriptions');
  }

  return {
    score: {
      score: Math.round(normalizedScore),
      breakdown,
      issues: issues.length > 0 ? issues : undefined,
    },
    weakBullets,
  };
}

// ==================== Metric Detection ====================

interface BulletInfo {
  bullet: string;
  company: string;
  title: string;
  index: number;
}

/**
 * Calculate score based on quantified metrics in bullets
 */
function calculateMetricScore(
  bullets: BulletInfo[],
  issues: string[],
  weakBullets: WeakBullet[]
): number {
  let bulletsWithMetrics = 0;

  for (const bulletInfo of bullets) {
    const hasMetric = METRIC_PATTERNS.some((pattern) =>
      pattern.test(bulletInfo.bullet)
    );

    if (hasMetric) {
      bulletsWithMetrics++;
    } else {
      // Track as weak bullet if no metric
      addWeakBulletIssue(bulletInfo, 'no_metric', weakBullets);
    }
  }

  const metricRatio = bulletsWithMetrics / bullets.length;

  // Check against threshold
  if (metricRatio < CONTENT_THRESHOLDS.min_metric_ratio) {
    issues.push('no_metrics');
  }

  // Score calculation
  let score: number;
  if (metricRatio >= 0.6) {
    score = 35; // Full marks - 60%+ with metrics
  } else if (metricRatio >= 0.45) {
    score = 30;
  } else if (metricRatio >= 0.3) {
    score = 24;
  } else if (metricRatio >= 0.15) {
    score = 16;
  } else {
    score = 8;
  }

  return score;
}

// ==================== Action Verb Analysis ====================

/**
 * Calculate score based on action verb strength
 */
function calculateActionVerbScore(
  bullets: BulletInfo[],
  issues: string[],
  weakBullets: WeakBullet[]
): number {
  let strongVerbCount = 0;
  let weakVerbCount = 0;

  for (const bulletInfo of bullets) {
    const firstWord = bulletInfo.bullet.trim().split(/\s+/)[0]?.toLowerCase();
    
    if (!firstWord) continue;

    // Check for strong verbs
    const isStrong = STRONG_ACTION_VERBS.some(
      (verb) => firstWord === verb || firstWord.startsWith(verb)
    );

    // Check for weak verbs
    const isWeak = WEAK_ACTION_VERBS.some(
      (verb) => firstWord === verb || bulletInfo.bullet.toLowerCase().startsWith(verb)
    );

    if (isStrong) {
      strongVerbCount++;
    } else if (isWeak) {
      weakVerbCount++;
      addWeakBulletIssue(bulletInfo, 'weak_verb', weakBullets);
    }
  }

  const strongRatio = strongVerbCount / bullets.length;
  const weakRatio = weakVerbCount / bullets.length;

  // Check against threshold
  if (strongRatio < CONTENT_THRESHOLDS.min_strong_verb_ratio) {
    issues.push('weak_verbs');
  }

  // Score calculation
  let score: number;
  if (strongRatio >= 0.7) {
    score = 35; // Full marks
  } else if (strongRatio >= 0.5) {
    score = 30;
  } else if (strongRatio >= 0.35) {
    score = 24;
  } else if (strongRatio >= 0.2) {
    score = 16;
  } else {
    score = 8;
  }

  // Penalty for weak verbs
  if (weakRatio > 0.3) {
    score = Math.max(5, score - 8);
  }

  return score;
}

// ==================== Scope and Scale ====================

/**
 * Calculate score based on scope and scale indicators
 */
function calculateScopeScore(
  bullets: BulletInfo[],
  issues: string[]
): number {
  const scopeIndicators = {
    leadership: 0,
    scale: 0,
    ownership: 0,
    impact: 0,
  };

  const leadershipPatterns = [
    /led\s+(?:a\s+)?team/i,
    /managed\s+\d+/i,
    /mentored/i,
    /supervised/i,
    /directed/i,
    /coordinated\s+(?:with\s+)?\d+/i,
  ];

  const scalePatterns = [
    /\d+\s*(million|billion|thousand|k\s+users)/i,
    /enterprise/i,
    /organization-wide/i,
    /company-wide/i,
    /cross-functional/i,
    /global/i,
    /international/i,
  ];

  const ownershipPatterns = [
    /owned/i,
    /end-to-end/i,
    /architected/i,
    /designed\s+and\s+implemented/i,
    /built\s+from\s+scratch/i,
    /spearheaded/i,
    /pioneered/i,
  ];

  const impactPatterns = [
    /increased\s+.*\d+%/i,
    /reduced\s+.*\d+%/i,
    /improved\s+.*\d+%/i,
    /saved\s+.*\$[\d,]+/i,
    /generated\s+.*\$[\d,]+/i,
    /drove\s+.*\d+/i,
    /achieved\s+.*\d+/i,
  ];

  for (const bulletInfo of bullets) {
    const bullet = bulletInfo.bullet;

    if (leadershipPatterns.some((p) => p.test(bullet))) {
      scopeIndicators.leadership++;
    }
    if (scalePatterns.some((p) => p.test(bullet))) {
      scopeIndicators.scale++;
    }
    if (ownershipPatterns.some((p) => p.test(bullet))) {
      scopeIndicators.ownership++;
    }
    if (impactPatterns.some((p) => p.test(bullet))) {
      scopeIndicators.impact++;
    }
  }

  // Calculate score based on indicators
  const totalIndicators =
    scopeIndicators.leadership +
    scopeIndicators.scale +
    scopeIndicators.ownership +
    scopeIndicators.impact;

  const indicatorRatio = totalIndicators / bullets.length;

  let score: number;
  if (indicatorRatio >= 0.6) {
    score = 30; // Full marks
  } else if (indicatorRatio >= 0.4) {
    score = 25;
  } else if (indicatorRatio >= 0.25) {
    score = 18;
  } else if (indicatorRatio >= 0.1) {
    score = 12;
  } else {
    score = 5;
    issues.push('low_impact_indicators');
  }

  // Check for specific missing elements
  if (scopeIndicators.leadership === 0 && bullets.length > 5) {
    issues.push('no_leadership_indicators');
  }

  return score;
}

// ==================== Generic Detection ====================

/**
 * Calculate ratio of generic descriptions
 */
function calculateGenericRatio(bullets: BulletInfo[]): number {
  const genericPatterns = [
    /responsible\s+for/i,
    /helped\s+with/i,
    /worked\s+on/i,
    /participated\s+in/i,
    /involved\s+in/i,
    /assisted\s+with/i,
    /various\s+projects/i,
    /day-to-day/i,
    /duties\s+included/i,
    /tasks\s+included/i,
  ];

  let genericCount = 0;

  for (const bulletInfo of bullets) {
    if (genericPatterns.some((p) => p.test(bulletInfo.bullet))) {
      genericCount++;
    }
  }

  return genericCount / bullets.length;
}

// ==================== Weak Bullet Tracking ====================

/**
 * Add or update weak bullet entry
 */
function addWeakBulletIssue(
  bulletInfo: BulletInfo,
  issue: BulletIssue,
  weakBullets: WeakBullet[]
): void {
  // Find existing entry
  const existing = weakBullets.find(
    (wb) =>
      wb.location.company === bulletInfo.company &&
      wb.location.title === bulletInfo.title &&
      wb.location.index === bulletInfo.index
  );

  if (existing) {
    if (!existing.issues.includes(issue)) {
      existing.issues.push(issue);
    }
  } else {
    weakBullets.push({
      bullet: bulletInfo.bullet,
      issues: [issue],
      location: {
        company: bulletInfo.company,
        title: bulletInfo.title,
        index: bulletInfo.index,
      },
    });
  }
}

/**
 * Analyze a single bullet for all quality issues
 */
export function analyzeBulletQuality(bullet: string): BulletIssue[] {
  const issues: BulletIssue[] = [];

  // Check for weak verb
  const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase();
  if (firstWord && WEAK_ACTION_VERBS.some((v) => firstWord === v || bullet.toLowerCase().startsWith(v))) {
    issues.push('weak_verb');
  }

  // Check for no metric
  if (!METRIC_PATTERNS.some((p) => p.test(bullet))) {
    issues.push('no_metric');
  }

  // Check for vagueness
  const vaguePatterns = [
    /responsible\s+for/i,
    /worked\s+on/i,
    /various/i,
    /different/i,
    /multiple/i,
    /some/i,
  ];
  if (vaguePatterns.some((p) => p.test(bullet))) {
    issues.push('vague');
  }

  // Check for length
  const wordCount = bullet.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount < CONTENT_THRESHOLDS.optimal_bullet_length.min) {
    issues.push('too_short');
  }

  return issues;
}

// ==================== Export ====================

export { calculateExecutionImpactScore as default };
