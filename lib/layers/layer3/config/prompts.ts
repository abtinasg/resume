/**
 * Layer 3 - Execution Engine
 * LLM Prompt Templates
 *
 * Contains all prompt templates for evidence-anchored rewriting.
 * These prompts are designed to prevent fabrication.
 */

// ==================== System Prompts ====================

/**
 * Base system prompt for all rewrites
 * Emphasizes no-fabrication rule
 */
export const SYSTEM_PROMPT_BASE = `You are an expert resume improvement assistant.
Your role is to rewrite resume content to be stronger, clearer, and more impactful.

CRITICAL RULES - NEVER VIOLATE:
1. NEVER add numbers, metrics, or statistics not present in the evidence
2. NEVER add tools, technologies, or skills not present in the evidence
3. NEVER add company names, organizations, or proper nouns not present in the evidence
4. NEVER add soft skills or personality traits not clearly implied by the text
5. NEVER add seniority indicators (Senior, Lead, Principal) not in the evidence
6. EVERY improvement must be traceable to specific evidence items

Your rewrites should:
- Use stronger action verbs
- Be more specific and concrete
- Remove filler words and vague language
- Be concise and impactful
- Maintain the original meaning and truthfulness

If you cannot improve the text without adding fabricated content, return the original text.`;

/**
 * System prompt for bullet rewrites
 */
export const SYSTEM_PROMPT_BULLET = `${SYSTEM_PROMPT_BASE}

You are rewriting a single resume bullet point.
Focus on:
- Starting with a strong action verb
- Being specific about what was done
- Highlighting impact where evidence supports it
- Removing fluff and vague language`;

/**
 * System prompt for summary rewrites
 */
export const SYSTEM_PROMPT_SUMMARY = `${SYSTEM_PROMPT_BASE}

You are rewriting a professional summary or headline.
Focus on:
- Capturing the person's key strengths from evidence
- Being compelling yet truthful
- Targeting the specified role if provided
- Using skills and tools from the evidence ledger`;

/**
 * System prompt for section rewrites
 */
export const SYSTEM_PROMPT_SECTION = `${SYSTEM_PROMPT_BASE}

You are rewriting a section of multiple bullet points.
Additional focus:
- Maintain consistent tense throughout
- Vary the starting words to avoid repetition
- Ensure bullets complement each other
- Order by impact when possible`;

// ==================== User Prompt Templates ====================

/**
 * User prompt template for bullet rewrite
 */
export const USER_PROMPT_BULLET = `Rewrite this resume bullet.

ORIGINAL:
{original}

TARGET ROLE: {target_role}

REWRITE PLAN (follow these transformations):
{transformations}

EVIDENCE LEDGER (ONLY use facts from these):
{evidence_ledger}

STRICT CONSTRAINTS:
- Maximum length: {max_length} characters
- {forbid_numbers}
- {forbid_tools}
- {forbid_companies}

Respond with ONLY valid JSON in this exact format:
{
  "improved": "Your improved bullet text here",
  "evidence_map": [
    {"improved_span": "phrase from improved", "evidence_ids": ["E1", "E2"]},
    ...
  ],
  "reasoning": "Brief explanation of changes made",
  "changes": {
    "stronger_verb": true/false,
    "added_metric": true/false,
    "more_specific": true/false,
    "removed_fluff": true/false,
    "tailored_to_role": true/false
  }
}`;

/**
 * User prompt template for summary rewrite
 */
export const USER_PROMPT_SUMMARY = `Rewrite this professional summary.

ORIGINAL:
{original}

TARGET ROLE: {target_role}

EVIDENCE LEDGER (use these facts to build the summary):
{evidence_ledger}

STRICT CONSTRAINTS:
- Maximum length: {max_length} characters
- ONLY use skills/tools from evidence
- ONLY make claims supported by evidence

Respond with ONLY valid JSON in this exact format:
{
  "improved": "Your improved summary here",
  "evidence_map": [
    {"improved_span": "phrase from improved", "evidence_ids": ["E1", "E_skills"]},
    ...
  ],
  "reasoning": "Brief explanation of changes made",
  "changes": {
    "stronger_verb": true/false,
    "added_metric": true/false,
    "more_specific": true/false,
    "removed_fluff": true/false,
    "tailored_to_role": true/false
  }
}`;

/**
 * User prompt for retry after validation failure
 */
export const USER_PROMPT_RETRY = `Your previous rewrite was REJECTED due to validation errors:

{validation_errors}

Please rewrite again with STRICTER adherence to the evidence.
Remember:
- DO NOT add any numbers not in evidence
- DO NOT add any tools not in evidence
- Every phrase must map to real evidence

ORIGINAL:
{original}

EVIDENCE LEDGER:
{evidence_ledger}

Respond with ONLY valid JSON in the same format as before.`;

// ==================== Few-Shot Examples ====================

/**
 * Examples of good rewrites (evidence-anchored)
 */
export const GOOD_REWRITE_EXAMPLES = [
  {
    original: 'Worked on API development',
    evidence: ['Python', 'REST', 'Flask', '5 internal services'],
    improved: 'Developed REST APIs using Python and Flask, supporting 5 internal services',
    reasoning: 'Upgraded verb, added specific technologies from evidence',
  },
  {
    original: 'Helped improve system performance',
    evidence: ['database indexing', 'query optimization'],
    improved: 'Improved system performance through database indexing and query optimization',
    reasoning: 'Added specificity using HOW from evidence, no fabricated metrics',
  },
  {
    original: 'Managed team and projects',
    evidence: ['5 engineers', 'agile', 'sprint planning'],
    improved: 'Led team of 5 engineers using agile methodology and sprint planning',
    reasoning: 'Used specific team size and methodology from evidence',
  },
];

/**
 * Examples of bad rewrites (fabrication)
 */
export const BAD_REWRITE_EXAMPLES = [
  {
    original: 'Worked on API development',
    evidence: ['Python', 'REST'],
    bad_rewrite: 'Developed high-performance APIs processing 1M+ requests/day',
    problem: 'Added fabricated metric (1M+ requests/day) not in evidence',
  },
  {
    original: 'Improved system performance',
    evidence: ['optimization'],
    bad_rewrite: 'Improved system performance by 40%',
    problem: 'Added fabricated metric (40%) not in evidence',
  },
  {
    original: 'Led project',
    evidence: ['project management'],
    bad_rewrite: 'Led cross-functional team of 15 engineers across 3 global offices',
    problem: 'Added fabricated scale (15 engineers, 3 offices) not in evidence',
  },
];

// ==================== Helper Functions ====================

/**
 * Format evidence ledger for prompt
 */
export function formatEvidenceLedgerForPrompt(
  evidence: Array<{ id: string; type: string; text: string }>
): string {
  return evidence
    .map((e) => `${e.id} (${e.type}): "${e.text}"`)
    .join('\n');
}

/**
 * Format transformations for prompt
 */
export function formatTransformationsForPrompt(
  transformations: Array<{ type: string; data: Record<string, unknown> }>
): string {
  return transformations
    .map((t) => {
      switch (t.type) {
        case 'verb_upgrade':
          return `- Upgrade verb "${t.data.from}" to "${t.data.to}"`;
        case 'remove_fluff':
          return `- Remove fluff words: ${(t.data.terms as string[]).join(', ')}`;
        case 'add_how':
          return `- Add specificity: ${t.data.hint}`;
        case 'surface_tool':
          return `- Include tool "${t.data.tool}" (evidence: ${t.data.evidence_id})`;
        case 'tense_align':
          return `- Ensure ${t.data.tense} tense`;
        default:
          return `- ${t.type}`;
      }
    })
    .join('\n');
}

/**
 * Build constraint strings for prompt
 */
export function buildConstraintStrings(constraints: {
  forbid_new_numbers: boolean;
  forbid_new_tools: boolean;
  forbid_new_companies: boolean;
}): {
  forbid_numbers: string;
  forbid_tools: string;
  forbid_companies: string;
} {
  return {
    forbid_numbers: constraints.forbid_new_numbers
      ? 'DO NOT add any numbers not in evidence'
      : 'May include metrics from evidence only',
    forbid_tools: constraints.forbid_new_tools
      ? 'DO NOT add any tools/technologies not in evidence'
      : 'May include tools from evidence only',
    forbid_companies: constraints.forbid_new_companies
      ? 'DO NOT add any company names not in evidence'
      : 'May include companies from evidence only',
  };
}

/**
 * Format validation errors for retry prompt
 */
export function formatValidationErrorsForPrompt(
  errors: Array<{ code: string; message: string }>
): string {
  return errors.map((e) => `- ${e.code}: ${e.message}`).join('\n');
}
