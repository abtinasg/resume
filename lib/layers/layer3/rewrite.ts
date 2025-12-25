/**
 * Layer 3 - Execution Engine
 * Main Rewrite Facade
 *
 * Public API for evidence-anchored resume rewriting.
 * This is the main entry point for Layer 3.
 */

import {
  RewriteRequest,
  RewriteResult,
  BulletRewriteRequest,
  SummaryRewriteRequest,
  SectionRewriteRequest,
  BulletRewriteResult,
  SummaryRewriteResult,
  SectionRewriteResult,
  EvidenceLedger,
  isBulletRequest,
  isSummaryRequest,
  isSectionRequest,
  RewriteRequestSchema,
} from './types';
import {
  buildEvidenceLedger,
  buildSummaryEvidenceLedger,
  buildSectionEvidenceLedger,
} from './evidence';
import { planMicroActions } from './planning';
import {
  rewriteBulletWithRetry,
  rewriteSummaryWithRetry,
  rewriteBulletSync,
  rewriteSummarySync,
} from './validation';
import {
  rewriteSectionCoherent,
  rewriteSectionSync,
} from './coherence';
import { isLLMAvailable } from './generation';
import {
  ExecutionError,
  ExecutionErrorCode,
  createInvalidInputError,
  createValidationError,
  wrapError,
} from './errors';

// ==================== Main Rewrite Function ====================

/**
 * Rewrite resume content with evidence-anchored validation
 *
 * This is the main entry point for Layer 3.
 * Routes to appropriate handler based on request type.
 *
 * @param request - Rewrite request (bullet, summary, or section)
 * @returns RewriteResult with improved text and evidence map
 * @throws ExecutionError if validation fails or LLM errors
 */
export async function rewrite(request: RewriteRequest): Promise<RewriteResult> {
  // Validate request
  const validation = RewriteRequestSchema.safeParse(request);
  if (!validation.success) {
    throw createValidationError(
      'Invalid rewrite request',
      validation.error.errors
    );
  }

  // Route to appropriate handler
  if (isBulletRequest(request)) {
    return rewriteBullet(request);
  }

  if (isSummaryRequest(request)) {
    return rewriteSummary(request);
  }

  if (isSectionRequest(request)) {
    return rewriteSection(request);
  }

  // Should never reach here due to discriminated union
  throw createInvalidInputError('Unknown rewrite type');
}

// ==================== Bullet Rewrite ====================

/**
 * Rewrite a single resume bullet
 *
 * @param request - Bullet rewrite request
 * @returns BulletRewriteResult with improved bullet
 */
export async function rewriteBullet(
  request: BulletRewriteRequest
): Promise<BulletRewriteResult> {
  try {
    // Validate input
    if (!request.bullet || request.bullet.trim().length === 0) {
      throw createInvalidInputError('Bullet text is required');
    }

    // Build evidence ledger
    const evidence = buildEvidenceLedger({
      bullet: request.bullet,
      sectionBullets: [], // Add section bullets if available
      scope: request.evidence_scope ?? 'section',
      allowResumeEnrichment: request.allow_resume_enrichment ?? true,
      layer1: request.layer1,
      precomputedEvidence: request.evidence,
    });

    // Plan micro-actions
    const plan = planMicroActions({
      original: request.bullet,
      evidence,
      issues: request.issues ?? [],
      context: request.context,
      targetRole: request.target_role,
    });

    // Check if LLM is available
    if (!isLLMAvailable()) {
      console.warn('[Layer 3] OpenAI API key not set, using sync fallback');
      return rewriteBulletSync(request, evidence);
    }

    // Rewrite with retry logic
    return rewriteBulletWithRetry(request, evidence, plan);
  } catch (error) {
    // Wrap and re-throw errors
    throw wrapError(error, ExecutionErrorCode.GENERATION_FAILED);
  }
}

// ==================== Summary Rewrite ====================

/**
 * Rewrite a professional summary
 *
 * @param request - Summary rewrite request
 * @returns SummaryRewriteResult with improved summary
 */
export async function rewriteSummary(
  request: SummaryRewriteRequest
): Promise<SummaryRewriteResult> {
  try {
    // Validate input
    if (!request.summary || request.summary.trim().length === 0) {
      throw createInvalidInputError('Summary text is required');
    }

    // Build evidence ledger (summaries can use all resume evidence)
    const evidence = buildSummaryEvidenceLedger(request.summary, {
      scope: 'resume',
      allowResumeEnrichment: true,
      layer1: request.layer1,
      precomputedEvidence: request.evidence,
    });

    // Check if LLM is available
    if (!isLLMAvailable()) {
      console.warn('[Layer 3] OpenAI API key not set, using sync fallback');
      return rewriteSummarySync(request, evidence);
    }

    // Rewrite with retry logic
    return rewriteSummaryWithRetry(request, evidence);
  } catch (error) {
    throw wrapError(error, ExecutionErrorCode.GENERATION_FAILED);
  }
}

// ==================== Section Rewrite ====================

/**
 * Rewrite an entire section with coherence
 *
 * @param request - Section rewrite request
 * @returns SectionRewriteResult with improved bullets
 */
export async function rewriteSection(
  request: SectionRewriteRequest
): Promise<SectionRewriteResult> {
  try {
    // Validate input
    if (!request.bullets || request.bullets.length === 0) {
      throw createInvalidInputError('At least one bullet is required');
    }

    // Build evidence ledger
    const evidence = buildSectionEvidenceLedger(request.bullets, {
      scope: request.evidence_scope ?? 'section',
      allowResumeEnrichment: request.allow_resume_enrichment ?? true,
      layer1: request.layer1,
      precomputedEvidence: request.evidence,
    });

    // Check if LLM is available
    if (!isLLMAvailable()) {
      console.warn('[Layer 3] OpenAI API key not set, using sync fallback');
      return rewriteSectionSync(request);
    }

    // Rewrite section with coherence
    return rewriteSectionCoherent(request, evidence);
  } catch (error) {
    throw wrapError(error, ExecutionErrorCode.GENERATION_FAILED);
  }
}

// ==================== Convenience Functions ====================

/**
 * Quick rewrite a bullet (simplified interface)
 */
export async function quickRewriteBullet(
  bullet: string,
  options?: {
    targetRole?: string;
    skills?: string[];
    tools?: string[];
    issues?: string[];
  }
): Promise<string> {
  const result = await rewriteBullet({
    type: 'bullet',
    bullet,
    target_role: options?.targetRole,
    issues: options?.issues,
    layer1: options?.skills || options?.tools
      ? {
          extracted: {
            skills: options.skills,
            tools: options.tools,
          },
        }
      : undefined,
  });

  return result.improved;
}

/**
 * Check if a bullet can be improved
 */
export function canImprove(bullet: string): boolean {
  // Simple heuristic - if it's too short or too vague, it can be improved
  if (bullet.length < 30) return true;

  // Check for weak verbs
  const weakVerbs = [
    'worked on',
    'helped',
    'was responsible for',
    'assisted',
    'participated in',
  ];

  const bulletLower = bullet.toLowerCase();
  for (const verb of weakVerbs) {
    if (bulletLower.includes(verb)) {
      return true;
    }
  }

  return false;
}

// ==================== Batch Operations ====================

/**
 * Rewrite multiple bullets in parallel
 */
export async function rewriteBulletsParallel(
  bullets: string[],
  options?: {
    targetRole?: string;
    layer1?: BulletRewriteRequest['layer1'];
    maxConcurrency?: number;
  }
): Promise<BulletRewriteResult[]> {
  const maxConcurrency = options?.maxConcurrency ?? 3;
  const results: BulletRewriteResult[] = [];

  // Process in batches
  for (let i = 0; i < bullets.length; i += maxConcurrency) {
    const batch = bullets.slice(i, i + maxConcurrency);

    const batchResults = await Promise.all(
      batch.map((bullet) =>
        rewriteBullet({
          type: 'bullet',
          bullet,
          target_role: options?.targetRole,
          layer1: options?.layer1,
        })
      )
    );

    results.push(...batchResults);
  }

  return results;
}

// ==================== Type Guards ====================

/**
 * Check if result is a bullet result
 */
export function isBulletResult(result: RewriteResult): result is BulletRewriteResult {
  return result.type === 'bullet';
}

/**
 * Check if result is a summary result
 */
export function isSummaryResult(result: RewriteResult): result is SummaryRewriteResult {
  return result.type === 'summary';
}

/**
 * Check if result is a section result
 */
export function isSectionResult(result: RewriteResult): result is SectionRewriteResult {
  return result.type === 'section';
}
