/**
 * Layer 5 - Orchestrator
 * Resume Actions
 *
 * Handles resume improvement actions by calling Layer 3 (Execution Engine).
 * Updates scores via Layer 1 (Evaluation Engine).
 *
 * KEY INNOVATION: Evidence-preserving rewrite pipeline
 * - Layer 3 rewrites content
 * - Layer 1 re-scores
 * - Layer 4 logs the event
 */

import type {
  Task,
  ActionExecutionResult,
  Layer4StateForLayer5,
} from '../types';
import { getStateFreshnessConfig } from '../config';

// ==================== Types ====================

/**
 * Rewrite result from Layer 3
 */
interface RewriteResult {
  success: boolean;
  improved_text?: string;
  evidence_map?: Record<string, unknown>;
  validation?: {
    passed: boolean;
    items?: Array<{ code: string; message: string }>;
  };
  estimated_score_gain?: number;
}

/**
 * Apply result from Layer 4
 */
interface ApplyResult {
  success: boolean;
  old_score?: number;
  new_score?: number;
  actual_gain?: number;
}

// ==================== Layer Integration Stubs ====================

/**
 * Call Layer 3 to rewrite a bullet
 * In production, this would import from '@/lib/layers/layer3'
 */
async function callLayer3RewriteBullet(request: {
  bullet: string;
  target_role?: string;
  evidence_scope?: string;
}): Promise<RewriteResult> {
  // TODO: Integrate with actual Layer 3
  // For now, return a mock success
  console.log('[Layer5] Would call Layer 3 rewriteBullet:', request);
  
  return {
    success: true,
    improved_text: request.bullet, // Would be improved text
    evidence_map: {},
    validation: { passed: true },
    estimated_score_gain: 5,
  };
}

/**
 * Call Layer 3 to rewrite a summary
 */
async function callLayer3RewriteSummary(request: {
  summary: string;
  target_role?: string;
  bullets?: string[];
}): Promise<RewriteResult> {
  // TODO: Integrate with actual Layer 3
  console.log('[Layer5] Would call Layer 3 rewriteSummary:', request);
  
  return {
    success: true,
    improved_text: request.summary,
    evidence_map: {},
    validation: { passed: true },
    estimated_score_gain: 3,
  };
}

/**
 * Call Layer 3 to rewrite a section
 */
async function callLayer3RewriteSection(request: {
  section: string;
  bullets: string[];
  target_role?: string;
}): Promise<RewriteResult> {
  // TODO: Integrate with actual Layer 3
  console.log('[Layer5] Would call Layer 3 rewriteSection:', request);
  
  return {
    success: true,
    improved_text: request.bullets.join('\n'),
    evidence_map: {},
    validation: { passed: true },
    estimated_score_gain: 8,
  };
}

/**
 * Apply rewrite with scoring via Layer 4
 * This handles Layer 1 re-scoring internally
 */
async function callLayer4ApplyRewrite(
  userId: string,
  result: RewriteResult
): Promise<ApplyResult> {
  // TODO: Integrate with actual Layer 4
  console.log('[Layer5] Would call Layer 4 applyRewriteWithScoring');
  
  return {
    success: true,
    old_score: 70,
    new_score: 75,
    actual_gain: 5,
  };
}

// ==================== Resume Actions ====================

/**
 * Execute a bullet improvement action
 */
export async function executeImproveResume(
  task: Task,
  state: Layer4StateForLayer5
): Promise<ActionExecutionResult> {
  const { payload } = task;
  
  // Validate we have a bullet to improve
  if (!payload.bullet) {
    return {
      success: false,
      error: 'No bullet provided for improvement',
    };
  }
  
  try {
    // Step 1: Build rewrite request
    const request = {
      bullet: payload.bullet,
      target_role: state.user_profile.target_roles[0],
      evidence_scope: 'section',
    };
    
    // Step 2: Call Layer 3
    const rewriteResult = await callLayer3RewriteBullet(request);
    
    if (!rewriteResult.success) {
      return {
        success: false,
        error: 'Rewrite failed',
        fallback: 'manual_edit',
        suggestion: 'Try editing the bullet manually in the editor',
      };
    }
    
    // Step 3: Validate result
    if (!rewriteResult.validation?.passed) {
      return {
        success: false,
        error: 'Validation failed',
        details: rewriteResult.validation?.items as unknown as Record<string, unknown>,
      };
    }
    
    // Step 4: Check score gain threshold
    const minScoreGain = typeof payload.min_score_gain === 'number' ? payload.min_score_gain : 3;
    if ((rewriteResult.estimated_score_gain ?? 0) < minScoreGain) {
      return {
        success: false,
        error: 'Insufficient score gain',
        details: { gain: rewriteResult.estimated_score_gain },
        suggestion: 'The improvement was not significant enough. Consider manual editing.',
      };
    }
    
    // Step 5: Apply rewrite with scoring (via Layer 4)
    const userId = 'current_user'; // Would come from context
    const applyResult = await callLayer4ApplyRewrite(userId, rewriteResult);
    
    if (!applyResult.success) {
      return {
        success: false,
        error: 'Failed to apply rewrite',
        fallback: 'manual_edit',
      };
    }
    
    // Step 6: Return success with evidence
    return {
      success: true,
      evidence_map: rewriteResult.evidence_map,
      estimated_score_gain: rewriteResult.estimated_score_gain,
      actual_score_gain: applyResult.actual_gain,
      old_score: applyResult.old_score,
      new_score: applyResult.new_score,
    };
    
  } catch (error) {
    console.error('[Layer5] Resume action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'manual_edit',
      suggestion: 'Try editing the resume manually in the editor',
    };
  }
}

/**
 * Execute a summary improvement action
 */
export async function executeImproveSummary(
  task: Task,
  state: Layer4StateForLayer5
): Promise<ActionExecutionResult> {
  const { payload } = task;
  
  try {
    // Build request
    const request = {
      summary: typeof payload.summary === 'string' ? payload.summary : '',
      target_role: state.user_profile.target_roles[0],
      bullets: Array.isArray(payload.bullets) ? payload.bullets as string[] : undefined,
    };
    
    // Call Layer 3
    const rewriteResult = await callLayer3RewriteSummary(request);
    
    if (!rewriteResult.success || !rewriteResult.validation?.passed) {
      return {
        success: false,
        error: 'Summary rewrite failed',
        fallback: 'manual_edit',
      };
    }
    
    // Apply rewrite
    const userId = 'current_user';
    const applyResult = await callLayer4ApplyRewrite(userId, rewriteResult);
    
    return {
      success: applyResult.success,
      evidence_map: rewriteResult.evidence_map,
      estimated_score_gain: rewriteResult.estimated_score_gain,
      actual_score_gain: applyResult.actual_gain,
      old_score: applyResult.old_score,
      new_score: applyResult.new_score,
    };
    
  } catch (error) {
    console.error('[Layer5] Summary action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'manual_edit',
    };
  }
}

/**
 * Execute a section improvement action
 */
export async function executeImproveSection(
  task: Task,
  state: Layer4StateForLayer5
): Promise<ActionExecutionResult> {
  const { payload } = task;
  
  if (!payload.section) {
    return {
      success: false,
      error: 'No section specified for improvement',
    };
  }
  
  try {
    // Build request
    const request = {
      section: payload.section,
      bullets: payload.weak_bullets?.map(wb => wb.bullet) ?? [],
      target_role: state.user_profile.target_roles[0],
    };
    
    // Call Layer 3
    const rewriteResult = await callLayer3RewriteSection(request);
    
    if (!rewriteResult.success || !rewriteResult.validation?.passed) {
      return {
        success: false,
        error: 'Section rewrite failed',
        fallback: 'manual_edit',
      };
    }
    
    // Apply rewrite
    const userId = 'current_user';
    const applyResult = await callLayer4ApplyRewrite(userId, rewriteResult);
    
    return {
      success: applyResult.success,
      evidence_map: rewriteResult.evidence_map,
      estimated_score_gain: rewriteResult.estimated_score_gain,
      actual_score_gain: applyResult.actual_gain,
      old_score: applyResult.old_score,
      new_score: applyResult.new_score,
    };
    
  } catch (error) {
    console.error('[Layer5] Section action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'manual_edit',
    };
  }
}

/**
 * Check if resume is ready for applications
 */
export function isResumeReadyForApplications(
  state: Layer4StateForLayer5
): { ready: boolean; reason?: string } {
  const config = getStateFreshnessConfig();
  
  // Check if resume exists
  if (!state.resume.master_resume_id) {
    return { ready: false, reason: 'No resume uploaded' };
  }
  
  // Check resume score
  const score = state.resume.resume_score ?? 0;
  if (config.require_resume_for_apply && score < config.min_resume_score_for_apply) {
    return {
      ready: false,
      reason: `Resume score (${score}) is below minimum (${config.min_resume_score_for_apply})`,
    };
  }
  
  return { ready: true };
}
