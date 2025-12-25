/**
 * Layer 3 - Execution Engine
 * Prompt Builder
 *
 * Builds prompts for evidence-anchored rewriting.
 */

import {
  EvidenceLedger,
  RewritePlan,
  ValidationItem,
  BulletRewriteRequest,
  SummaryRewriteRequest,
} from '../types';
import {
  SYSTEM_PROMPT_BULLET,
  SYSTEM_PROMPT_SUMMARY,
  USER_PROMPT_BULLET,
  USER_PROMPT_SUMMARY,
  USER_PROMPT_RETRY,
  formatEvidenceLedgerForPrompt,
  formatTransformationsForPrompt,
  buildConstraintStrings,
  formatValidationErrorsForPrompt,
} from '../config';

// ==================== Types ====================

/**
 * Complete prompt for LLM call
 */
export interface LLMPrompt {
  /** System prompt */
  system: string;
  /** User prompt */
  user: string;
}

// ==================== Main Builders ====================

/**
 * Build prompt for bullet rewrite
 */
export function buildBulletRewritePrompt(
  request: BulletRewriteRequest,
  evidence: EvidenceLedger,
  plan: RewritePlan
): LLMPrompt {
  // Format evidence
  const evidenceFormatted = formatEvidenceLedgerForPrompt(
    evidence.items.map((e) => ({ id: e.id, type: e.type, text: e.text }))
  );

  // Format transformations
  const transformationsFormatted = formatTransformationsForPrompt(
    plan.transformations.map((t) => ({ type: t.type, data: t.data as Record<string, unknown> }))
  );

  // Build constraints
  const constraints = buildConstraintStrings(plan.constraints);

  // Build user prompt from template
  const userPrompt = USER_PROMPT_BULLET
    .replace('{original}', request.bullet)
    .replace('{target_role}', request.target_role || 'General professional role')
    .replace('{transformations}', transformationsFormatted || 'No specific transformations planned')
    .replace('{evidence_ledger}', evidenceFormatted)
    .replace('{max_length}', plan.constraints.max_length.toString())
    .replace('{forbid_numbers}', constraints.forbid_numbers)
    .replace('{forbid_tools}', constraints.forbid_tools)
    .replace('{forbid_companies}', constraints.forbid_companies);

  return {
    system: SYSTEM_PROMPT_BULLET,
    user: userPrompt,
  };
}

/**
 * Build prompt for summary rewrite
 */
export function buildSummaryRewritePrompt(
  request: SummaryRewriteRequest,
  evidence: EvidenceLedger
): LLMPrompt {
  // Format evidence
  const evidenceFormatted = formatEvidenceLedgerForPrompt(
    evidence.items.map((e) => ({ id: e.id, type: e.type, text: e.text }))
  );

  // Build user prompt from template
  const userPrompt = USER_PROMPT_SUMMARY
    .replace('{original}', request.summary)
    .replace('{target_role}', request.target_role || 'General professional role')
    .replace('{evidence_ledger}', evidenceFormatted)
    .replace('{max_length}', '300'); // Summaries can be longer

  return {
    system: SYSTEM_PROMPT_SUMMARY,
    user: userPrompt,
  };
}

/**
 * Build retry prompt after validation failure
 */
export function buildRetryPrompt(
  originalText: string,
  evidence: EvidenceLedger,
  validationErrors: ValidationItem[],
  previousSystemPrompt: string
): LLMPrompt {
  // Format evidence
  const evidenceFormatted = formatEvidenceLedgerForPrompt(
    evidence.items.map((e) => ({ id: e.id, type: e.type, text: e.text }))
  );

  // Format validation errors
  const errorsFormatted = formatValidationErrorsForPrompt(
    validationErrors.map((e) => ({ code: e.code, message: e.message }))
  );

  // Build retry user prompt
  const userPrompt = USER_PROMPT_RETRY
    .replace('{validation_errors}', errorsFormatted)
    .replace('{original}', originalText)
    .replace('{evidence_ledger}', evidenceFormatted);

  return {
    system: previousSystemPrompt,
    user: userPrompt,
  };
}

// ==================== Prompt Helpers ====================

/**
 * Add examples to prompt
 */
export function addExamplesToPrompt(
  prompt: LLMPrompt,
  examples: Array<{ original: string; improved: string }>
): LLMPrompt {
  const examplesText = examples
    .map(
      (ex, i) =>
        `Example ${i + 1}:\nOriginal: "${ex.original}"\nImproved: "${ex.improved}"`
    )
    .join('\n\n');

  return {
    system: prompt.system,
    user: `${prompt.user}\n\nEXAMPLES:\n${examplesText}`,
  };
}

/**
 * Add strict constraints to prompt for retry
 */
export function addStrictConstraintsToPrompt(prompt: LLMPrompt): LLMPrompt {
  const strictConstraints = `
STRICT CONSTRAINTS - VALIDATION WILL FAIL IF VIOLATED:
- DO NOT add ANY numbers that don't appear in the evidence
- DO NOT add ANY tools/technologies that don't appear in the evidence  
- DO NOT add ANY company names that don't appear in the evidence
- DO NOT add ANY scale claims (massive, large-scale, etc.) without evidence
- EVERY phrase in your output must be traceable to specific evidence

Previous attempt was REJECTED. Be MORE conservative this time.`;

  return {
    system: prompt.system,
    user: `${prompt.user}\n${strictConstraints}`,
  };
}

/**
 * Build compact evidence summary
 */
export function buildCompactEvidenceSummary(evidence: EvidenceLedger): string {
  const skills = evidence.items.find((e) => e.type === 'skills')?.text || '';
  const tools = evidence.items.find((e) => e.type === 'tools')?.text || '';
  const bulletTexts = evidence.items
    .filter((e) => e.type === 'bullet' || e.type === 'section')
    .map((e) => e.text)
    .join(' | ');

  return `Skills: ${skills || 'None'}\nTools: ${tools || 'None'}\nContext: ${bulletTexts || 'None'}`;
}

// ==================== Response Parsing ====================

/**
 * Expected response format from LLM
 */
export interface LLMRewriteResponse {
  improved: string;
  evidence_map: Array<{ improved_span: string; evidence_ids: string[] }>;
  reasoning: string;
  changes: {
    stronger_verb: boolean;
    added_metric: boolean;
    more_specific: boolean;
    removed_fluff: boolean;
    tailored_to_role: boolean;
  };
}

/**
 * Parse LLM response JSON
 */
export function parseLLMResponse(response: string): LLMRewriteResponse | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.improved || !Array.isArray(parsed.evidence_map)) {
      return null;
    }

    // Ensure all required fields exist with defaults
    return {
      improved: parsed.improved,
      evidence_map: parsed.evidence_map.map(
        (item: { improved_span?: string; evidence_ids?: string[] }) => ({
          improved_span: item.improved_span || '',
          evidence_ids: item.evidence_ids || [],
        })
      ),
      reasoning: parsed.reasoning || 'Changes applied as planned',
      changes: {
        stronger_verb: parsed.changes?.stronger_verb ?? false,
        added_metric: parsed.changes?.added_metric ?? false,
        more_specific: parsed.changes?.more_specific ?? false,
        removed_fluff: parsed.changes?.removed_fluff ?? false,
        tailored_to_role: parsed.changes?.tailored_to_role ?? false,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Extract improved text from response (fallback if JSON parsing fails)
 */
export function extractImprovedTextFallback(response: string): string | null {
  // Try to find "improved": "..." pattern
  const match = response.match(/"improved"\s*:\s*"([^"]+)"/);
  if (match) {
    return match[1];
  }

  // Try to find text after "Improved:" or similar
  const improvedMatch = response.match(/(?:improved|rewritten|result)\s*[:=]\s*"?([^\n"]+)/i);
  if (improvedMatch) {
    return improvedMatch[1].trim();
  }

  return null;
}
