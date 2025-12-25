/**
 * Layer 3 - Execution Engine
 * Evidence Ledger Builder
 *
 * Builds evidence ledgers from resume content.
 * Every claim in improved text must trace back to evidence in the ledger.
 *
 * This is the foundation of evidence-anchored rewriting.
 */

import {
  EvidenceItem,
  EvidenceLedger,
  EvidenceScope,
  EvidenceType,
  Layer1Signals,
  BulletContext,
} from '../types';

// ==================== Constants ====================

/** Prefix for evidence IDs */
const EVIDENCE_ID_PREFIX = 'E';

/** ID for resume-level skills evidence */
const SKILLS_EVIDENCE_ID = 'E_skills';

/** ID for resume-level tools evidence */
const TOOLS_EVIDENCE_ID = 'E_tools';

/** ID for resume-level titles evidence */
const TITLES_EVIDENCE_ID = 'E_titles';

// ==================== Helper Functions ====================

/**
 * Generate unique evidence ID
 */
function generateEvidenceId(index: number): string {
  return `${EVIDENCE_ID_PREFIX}${index}`;
}

/**
 * Normalize terms from text (extract keywords)
 * Simple MVP version - extracts significant words
 */
function normalizeTerms(text: string): string[] {
  // Remove punctuation and convert to lowercase
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');

  // Split into words
  const words = cleaned.split(/\s+/).filter((w) => w.length > 2);

  // Remove common stop words
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'was',
    'were',
    'with',
    'that',
    'this',
    'from',
    'have',
    'has',
    'had',
    'but',
    'not',
    'are',
    'been',
    'can',
    'will',
    'our',
    'their',
    'which',
    'into',
    'also',
    'than',
    'them',
    'its',
    'over',
    'such',
    'more',
    'other',
    'some',
    'about',
  ]);

  return words.filter((w) => !stopWords.has(w));
}

/**
 * Check if resume-level enrichment is allowed for experience bullets
 * Resume-level skills/tools can only be added if:
 * 1. Section is summary/skills/headline, OR
 * 2. Same tool appears in another bullet in same role
 */
export function allowResumeEnrichmentInBullet(
  bulletContext: BulletContext | undefined,
  tool: string,
  sectionBullets: string[]
): { allowed: boolean; reason: string } {
  // If no context, assume not experience section (conservative)
  if (!bulletContext) {
    return { allowed: false, reason: 'no_context_provided' };
  }

  // If bullet is in Summary or Skills section → always OK
  if (['summary', 'skills', 'headline'].includes(bulletContext.section_type)) {
    return { allowed: true, reason: 'summary_or_skills_section' };
  }

  // If bullet is in Experience section → need additional evidence
  if (bulletContext.section_type === 'experience') {
    // Check: Does same tool appear in another bullet from same role?
    const toolLower = tool.toLowerCase();

    for (const bullet of sectionBullets) {
      if (bullet.toLowerCase().includes(toolLower)) {
        return { allowed: true, reason: 'tool_used_in_same_role' };
      }
    }

    // Tool not found in same role → need user confirmation
    return { allowed: false, reason: 'needs_user_confirmation' };
  }

  // Projects section - allow with caution
  if (bulletContext.section_type === 'projects') {
    return { allowed: true, reason: 'projects_section' };
  }

  // Default: don't allow
  return { allowed: false, reason: 'unknown_section_type' };
}

// ==================== Main Builder Functions ====================

/**
 * Build evidence item from a bullet
 */
function buildBulletEvidence(
  bullet: string,
  id: string,
  scope: EvidenceScope
): EvidenceItem {
  return {
    id,
    type: 'bullet',
    scope,
    source: 'bullet',
    text: bullet,
    normalized_terms: normalizeTerms(bullet),
  };
}

/**
 * Build evidence item from section bullets
 */
function buildSectionEvidence(
  bullet: string,
  id: string
): EvidenceItem {
  return {
    id,
    type: 'section',
    scope: 'section',
    source: 'section',
    text: bullet,
    normalized_terms: normalizeTerms(bullet),
  };
}

/**
 * Build evidence from Layer 1 extracted skills
 */
function buildSkillsEvidence(skills: string[]): EvidenceItem {
  return {
    id: SKILLS_EVIDENCE_ID,
    type: 'skills',
    scope: 'resume',
    source: 'resume',
    text: skills.join(', '),
    normalized_terms: skills.map((s) => s.toLowerCase()),
  };
}

/**
 * Build evidence from Layer 1 extracted tools
 */
function buildToolsEvidence(tools: string[]): EvidenceItem {
  return {
    id: TOOLS_EVIDENCE_ID,
    type: 'tools',
    scope: 'resume',
    source: 'resume',
    text: tools.join(', '),
    normalized_terms: tools.map((t) => t.toLowerCase()),
  };
}

/**
 * Build evidence from Layer 1 extracted titles
 */
function buildTitlesEvidence(titles: string[]): EvidenceItem {
  return {
    id: TITLES_EVIDENCE_ID,
    type: 'titles',
    scope: 'resume',
    source: 'resume',
    text: titles.join(', '),
    normalized_terms: titles.map((t) => t.toLowerCase()),
  };
}

// ==================== Public Interface ====================

export interface BuildEvidenceLedgerParams {
  /** The bullet being rewritten */
  bullet?: string;
  /** Other bullets in the same section */
  sectionBullets?: string[];
  /** Evidence scope */
  scope?: EvidenceScope;
  /** Allow resume-level enrichment */
  allowResumeEnrichment?: boolean;
  /** Layer 1 extracted data */
  layer1?: Layer1Signals;
  /** Pre-computed evidence (optional) */
  precomputedEvidence?: EvidenceItem[];
}

/**
 * Build evidence ledger for a bullet rewrite
 *
 * The evidence ledger contains all facts that can be used in the rewrite.
 * This is the foundation of evidence-anchored rewriting.
 *
 * @param params - Parameters for building the ledger
 * @returns EvidenceLedger with all available evidence
 */
export function buildEvidenceLedger(params: BuildEvidenceLedgerParams): EvidenceLedger {
  const {
    bullet,
    sectionBullets = [],
    scope = 'section',
    allowResumeEnrichment = true,
    layer1,
    precomputedEvidence,
  } = params;

  // If pre-computed evidence is provided, use it directly
  if (precomputedEvidence && precomputedEvidence.length > 0) {
    return {
      items: precomputedEvidence,
      scope,
      allow_resume_enrichment: allowResumeEnrichment,
    };
  }

  const items: EvidenceItem[] = [];
  let idCounter = 1;

  // E1: The bullet itself (always included if provided)
  if (bullet) {
    items.push(buildBulletEvidence(bullet, generateEvidenceId(idCounter++), scope));
  }

  // E2-En: Section bullets (if scope is section or resume)
  if (scope !== 'bullet_only' && sectionBullets.length > 0) {
    for (const sectionBullet of sectionBullets) {
      // Don't duplicate the main bullet
      if (sectionBullet !== bullet) {
        items.push(buildSectionEvidence(sectionBullet, generateEvidenceId(idCounter++)));
      }
    }
  }

  // Resume-level evidence (if allowed and scope is resume)
  if (allowResumeEnrichment && scope === 'resume' && layer1?.extracted) {
    const { skills, tools, titles } = layer1.extracted;

    if (skills && skills.length > 0) {
      items.push(buildSkillsEvidence(skills));
    }

    if (tools && tools.length > 0) {
      items.push(buildToolsEvidence(tools));
    }

    if (titles && titles.length > 0) {
      items.push(buildTitlesEvidence(titles));
    }
  }

  // Also add skills/tools for section scope if layer1 has them
  if (allowResumeEnrichment && scope === 'section' && layer1?.extracted) {
    const { skills, tools } = layer1.extracted;

    // For section scope, we still include resume skills/tools but they have resume scope
    // The validation will enforce scope rules
    if (skills && skills.length > 0) {
      items.push(buildSkillsEvidence(skills));
    }

    if (tools && tools.length > 0) {
      items.push(buildToolsEvidence(tools));
    }
  }

  return {
    items,
    scope,
    allow_resume_enrichment: allowResumeEnrichment,
  };
}

/**
 * Build evidence ledger for a section rewrite
 *
 * @param bullets - All bullets in the section
 * @param params - Additional parameters
 * @returns EvidenceLedger for the section
 */
export function buildSectionEvidenceLedger(
  bullets: string[],
  params: Omit<BuildEvidenceLedgerParams, 'bullet' | 'sectionBullets'>
): EvidenceLedger {
  const { scope = 'section', allowResumeEnrichment = true, layer1, precomputedEvidence } = params;

  // If pre-computed evidence is provided, use it directly
  if (precomputedEvidence && precomputedEvidence.length > 0) {
    return {
      items: precomputedEvidence,
      scope,
      allow_resume_enrichment: allowResumeEnrichment,
    };
  }

  const items: EvidenceItem[] = [];
  let idCounter = 1;

  // All bullets as section evidence
  for (const bullet of bullets) {
    items.push(buildSectionEvidence(bullet, generateEvidenceId(idCounter++)));
  }

  // Resume-level evidence
  if (allowResumeEnrichment && layer1?.extracted) {
    const { skills, tools, titles } = layer1.extracted;

    if (skills && skills.length > 0) {
      items.push(buildSkillsEvidence(skills));
    }

    if (tools && tools.length > 0) {
      items.push(buildToolsEvidence(tools));
    }

    if (titles && titles.length > 0) {
      items.push(buildTitlesEvidence(titles));
    }
  }

  return {
    items,
    scope,
    allow_resume_enrichment: allowResumeEnrichment,
  };
}

/**
 * Build evidence ledger for a summary rewrite
 * Summaries can use all resume-level evidence freely
 *
 * @param summary - The summary text
 * @param params - Additional parameters
 * @returns EvidenceLedger for the summary
 */
export function buildSummaryEvidenceLedger(
  summary: string,
  params: Omit<BuildEvidenceLedgerParams, 'bullet' | 'sectionBullets'>
): EvidenceLedger {
  const { scope = 'resume', allowResumeEnrichment = true, layer1, precomputedEvidence } = params;

  // If pre-computed evidence is provided, use it directly
  if (precomputedEvidence && precomputedEvidence.length > 0) {
    return {
      items: precomputedEvidence,
      scope,
      allow_resume_enrichment: allowResumeEnrichment,
    };
  }

  const items: EvidenceItem[] = [];

  // E1: The summary itself
  items.push({
    id: 'E1',
    type: 'bullet', // Treat summary as a bullet for evidence purposes
    scope: 'bullet_only',
    source: 'bullet',
    text: summary,
    normalized_terms: normalizeTerms(summary),
  });

  // Resume-level evidence (summaries can use everything)
  if (layer1?.extracted) {
    const { skills, tools, titles } = layer1.extracted;

    if (skills && skills.length > 0) {
      items.push(buildSkillsEvidence(skills));
    }

    if (tools && tools.length > 0) {
      items.push(buildToolsEvidence(tools));
    }

    if (titles && titles.length > 0) {
      items.push(buildTitlesEvidence(titles));
    }
  }

  return {
    items,
    scope,
    allow_resume_enrichment: allowResumeEnrichment,
  };
}

// ==================== Utility Functions ====================

/**
 * Get evidence by ID from ledger
 */
export function getEvidenceById(
  ledger: EvidenceLedger,
  id: string
): EvidenceItem | undefined {
  return ledger.items.find((item) => item.id === id);
}

/**
 * Get all evidence of a specific type
 */
export function getEvidenceByType(
  ledger: EvidenceLedger,
  type: EvidenceType
): EvidenceItem[] {
  return ledger.items.filter((item) => item.type === type);
}

/**
 * Get all evidence from a specific source
 */
export function getEvidenceBySource(
  ledger: EvidenceLedger,
  source: 'bullet' | 'section' | 'resume'
): EvidenceItem[] {
  return ledger.items.filter((item) => item.source === source);
}

/**
 * Get all normalized terms from the ledger
 */
export function getAllNormalizedTerms(ledger: EvidenceLedger): Set<string> {
  const terms = new Set<string>();

  for (const item of ledger.items) {
    if (item.normalized_terms) {
      for (const term of item.normalized_terms) {
        terms.add(term);
      }
    }
  }

  return terms;
}

/**
 * Check if a term exists in the evidence ledger
 */
export function termExistsInLedger(ledger: EvidenceLedger, term: string): boolean {
  const termLower = term.toLowerCase();
  const allTerms = getAllNormalizedTerms(ledger);

  // Check normalized terms
  if (allTerms.has(termLower)) {
    return true;
  }

  // Also check raw text
  for (const item of ledger.items) {
    if (item.text.toLowerCase().includes(termLower)) {
      return true;
    }
  }

  return false;
}

/**
 * Find which evidence IDs contain a specific term
 */
export function findEvidenceForTerm(ledger: EvidenceLedger, term: string): string[] {
  const termLower = term.toLowerCase();
  const evidenceIds: string[] = [];

  for (const item of ledger.items) {
    // Check normalized terms
    if (item.normalized_terms?.includes(termLower)) {
      evidenceIds.push(item.id);
      continue;
    }

    // Check raw text
    if (item.text.toLowerCase().includes(termLower)) {
      evidenceIds.push(item.id);
    }
  }

  return evidenceIds;
}
