/**
 * Layer 3 - Execution Engine
 * Section Processor
 *
 * Processes entire sections for coherence.
 * Ensures consistent tense, style, and formatting.
 */

import {
  SectionRewriteResult,
  BulletRewriteResult,
  SectionRewriteRequest,
  EvidenceLedger,
  BulletContext,
  ValidationResult,
} from '../types';
import { buildSectionEvidenceLedger } from '../evidence';
import { planMicroActions } from '../planning';
import { rewriteBulletWithRetry, rewriteBulletSync, validateRewrite } from '../validation';
import {
  detectDominantTense,
  unifyTense,
  hasConsistentTense,
  Tense,
} from './tense-unifier';
import { applyFullFormattingToAll, makeAllATSSafe } from './format-unifier';
import { isLLMAvailable } from '../generation';

// ==================== Types ====================

/**
 * Section processing context
 */
interface SectionContext {
  /** Section type */
  sectionType: 'experience' | 'summary' | 'skills' | 'headline' | 'projects';
  /** Role (for experience sections) */
  role?: string;
  /** Company (for experience sections) */
  company?: string;
  /** Target role for tailoring */
  targetRole?: string;
  /** Dominant tense */
  dominantTense: Tense;
  /** Previously used starting words (to avoid repetition) */
  usedStarts: Set<string>;
  /** Previous bullet results */
  previousResults: BulletRewriteResult[];
}

// ==================== Main Function ====================

/**
 * Rewrite entire section with coherence
 */
export async function rewriteSectionCoherent(
  request: SectionRewriteRequest,
  evidence?: EvidenceLedger
): Promise<SectionRewriteResult> {
  const { bullets, section_type, role, company, target_role, layer1 } = request;

  // Build evidence ledger if not provided
  const ledger = evidence ?? buildSectionEvidenceLedger(bullets, {
    scope: 'section',
    allowResumeEnrichment: request.allow_resume_enrichment ?? true,
    layer1: request.layer1,
  });

  // Detect dominant tense and style
  const tenseResult = detectDominantTense(bullets);

  // Create section context
  const context: SectionContext = {
    sectionType: section_type || 'experience',
    role,
    company,
    targetRole: target_role,
    dominantTense: tenseResult.tense,
    usedStarts: new Set<string>(),
    previousResults: [],
  };

  const perBulletDetails: Array<{ index: number; bullet_result: BulletRewriteResult }> = [];
  const improvedBullets: string[] = [];
  const sectionNotes: string[] = [];

  // Process each bullet
  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];

    // Create bullet context
    const bulletContext: BulletContext = {
      section_type: context.sectionType,
      role: context.role,
      company: context.company,
      index: i,
    };

    // Get issues from Layer 1 if available
    const bulletIssues = layer1?.weak_bullets?.find(
      (wb) => wb.bullet === bullet || wb.index === i
    )?.issues ?? [];

    // Plan micro-actions
    const plan = planMicroActions({
      original: bullet,
      evidence: ledger,
      issues: bulletIssues,
      context: bulletContext,
      targetRole: target_role,
      sectionBullets: bullets,
    });

    // Add tense alignment if needed
    if (!hasConsistentTense([bullet])) {
      plan.transformations.push({
        type: 'tense_align',
        data: { tense: context.dominantTense },
      });
    }

    // Rewrite bullet
    let bulletResult: BulletRewriteResult;

    if (isLLMAvailable()) {
      bulletResult = await rewriteBulletWithRetry(
        {
          type: 'bullet',
          bullet,
          context: bulletContext,
          issues: bulletIssues,
          target_role,
          layer1: request.layer1,
          layer2: request.layer2,
          evidence_scope: request.evidence_scope,
          allow_resume_enrichment: request.allow_resume_enrichment,
        },
        ledger,
        plan
      );
    } else {
      bulletResult = rewriteBulletSync(
        {
          type: 'bullet',
          bullet,
          context: bulletContext,
          issues: bulletIssues,
          target_role,
        },
        ledger
      );
    }

    // Track starting word to avoid repetition
    const startWord = getStartWord(bulletResult.improved);
    if (context.usedStarts.has(startWord.toLowerCase())) {
      // Note: In future, could request variation from LLM
      sectionNotes.push(`Note: Bullet ${i + 1} starts with repeated word "${startWord}"`);
    }
    context.usedStarts.add(startWord.toLowerCase());

    // Store result
    perBulletDetails.push({
      index: i,
      bullet_result: bulletResult,
    });
    improvedBullets.push(bulletResult.improved);
    context.previousResults.push(bulletResult);
  }

  // Post-process: Unify tense
  const unifiedBullets = unifyTense(improvedBullets, context.dominantTense);
  if (JSON.stringify(unifiedBullets) !== JSON.stringify(improvedBullets)) {
    sectionNotes.push(`Unified tense to ${context.dominantTense}`);
  }

  // Post-process: Unify formatting
  const formattedBullets = applyFullFormattingToAll(unifiedBullets);
  const atsSafeBullets = makeAllATSSafe(formattedBullets);

  // Calculate aggregate score gain
  const aggregateGain = perBulletDetails.reduce(
    (sum, detail) => sum + (detail.bullet_result.estimated_score_gain ?? 0),
    0
  );

  // Create validation summary
  const validationSummary = createValidationSummary(perBulletDetails);

  // Determine overall confidence
  const confidence = determineOverallConfidence(perBulletDetails);

  return {
    type: 'section',
    original_bullets: bullets,
    improved_bullets: atsSafeBullets,
    estimated_aggregate_gain: aggregateGain,
    validation_summary: validationSummary,
    per_bullet_details: perBulletDetails,
    section_notes: sectionNotes,
    confidence,
  };
}

// ==================== Synchronous Version ====================

/**
 * Rewrite section synchronously (without LLM)
 * Applies rule-based improvements only
 */
export function rewriteSectionSync(
  request: SectionRewriteRequest
): SectionRewriteResult {
  const { bullets, section_type, role, company } = request;

  // Detect dominant tense
  const tenseResult = detectDominantTense(bullets);

  // Apply basic formatting and tense unification
  let improvedBullets = unifyTense(bullets, tenseResult.tense);
  improvedBullets = applyFullFormattingToAll(improvedBullets);
  improvedBullets = makeAllATSSafe(improvedBullets);

  // Create per-bullet details
  const perBulletDetails = bullets.map((bullet, index) => ({
    index,
    bullet_result: {
      type: 'bullet' as const,
      original: bullet,
      improved: improvedBullets[index],
      reasoning: 'Applied formatting and tense unification',
      changes: {
        stronger_verb: false,
        added_metric: false,
        more_specific: false,
        removed_fluff: false,
        tailored_to_role: false,
      },
      evidence_map: [
        {
          improved_span: improvedBullets[index],
          evidence_ids: ['E1'],
        },
      ],
      validation: { passed: true, items: [] },
      confidence: 'low' as const,
      estimated_score_gain: 0,
    },
  }));

  const sectionNotes: string[] = [];
  if (JSON.stringify(improvedBullets) !== JSON.stringify(bullets)) {
    sectionNotes.push(`Unified tense to ${tenseResult.tense}`);
    sectionNotes.push('Applied consistent formatting');
  }

  return {
    type: 'section',
    original_bullets: bullets,
    improved_bullets: improvedBullets,
    estimated_aggregate_gain: 0,
    validation_summary: { passed: true, items: [] },
    per_bullet_details: perBulletDetails,
    section_notes: sectionNotes,
    confidence: 'low',
  };
}

// ==================== Helper Functions ====================

/**
 * Get starting word of bullet
 */
function getStartWord(bullet: string): string {
  const words = bullet.trim().split(/\s+/);
  return words[0] || '';
}

/**
 * Create validation summary from per-bullet validations
 */
function createValidationSummary(
  details: Array<{ index: number; bullet_result: BulletRewriteResult }>
): ValidationResult {
  const allItems = details.flatMap((d) => d.bullet_result.validation.items);
  const passed = details.every((d) => d.bullet_result.validation.passed);

  return {
    passed,
    items: allItems,
  };
}

/**
 * Determine overall confidence from per-bullet confidences
 */
function determineOverallConfidence(
  details: Array<{ index: number; bullet_result: BulletRewriteResult }>
): 'low' | 'medium' | 'high' {
  const confidences = details.map((d) => d.bullet_result.confidence);

  // If any is low, overall is low
  if (confidences.includes('low')) {
    return 'low';
  }

  // If all are high, overall is high
  if (confidences.every((c) => c === 'high')) {
    return 'high';
  }

  return 'medium';
}

// ==================== Variation Helpers ====================

/**
 * Get alternative starting verb (to avoid repetition)
 */
export function getAlternativeStart(
  currentStart: string,
  usedStarts: Set<string>
): string | null {
  // This is a placeholder - in a full implementation,
  // we would use verb synonyms
  const alternatives: Record<string, string[]> = {
    developed: ['built', 'created', 'engineered', 'designed'],
    built: ['developed', 'created', 'constructed', 'implemented'],
    managed: ['led', 'directed', 'oversaw', 'coordinated'],
    led: ['managed', 'directed', 'spearheaded', 'headed'],
    improved: ['enhanced', 'optimized', 'elevated', 'strengthened'],
  };

  const currentLower = currentStart.toLowerCase();
  const options = alternatives[currentLower] || [];

  for (const option of options) {
    if (!usedStarts.has(option.toLowerCase())) {
      return option.charAt(0).toUpperCase() + option.slice(1);
    }
  }

  return null;
}

/**
 * Check if section has varied starts
 */
export function hasVariedStarts(bullets: string[]): boolean {
  const starts = bullets.map((b) => getStartWord(b).toLowerCase());
  const uniqueStarts = new Set(starts);
  return uniqueStarts.size >= bullets.length * 0.7;
}
