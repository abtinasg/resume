/**
 * Layer 3 - Execution Engine
 * Micro-Actions Planning
 *
 * Plans micro-actions (transformations) for rewriting resume content.
 * Actions include verb upgrades, fluff removal, adding specificity, etc.
 */

import {
  MicroAction,
  MicroActionType,
  VerbUpgradeData,
  RemoveFluffData,
  AddHowData,
  SurfaceToolData,
  TenseAlignData,
  AddSpecificityData,
  RewritePlan,
  RewriteConstraints,
  RewriteGoal,
  EvidenceLedger,
  BulletContext,
  UserInputRequest,
} from '../types';

import { findWeakVerbs, suggestVerbUpgrade, hasPassiveVoice } from './verb-mapping';
import { detectFluff, DetectedFluff } from './fluff-removal';
import { hasMetric, detectMetrics } from './metric-detection';
import { getThresholds } from '../config';
import { allowResumeEnrichmentInBullet, findEvidenceForTerm } from '../evidence';

// ==================== Planning Main Function ====================

export interface PlanMicroActionsParams {
  /** Original text to rewrite */
  original: string;
  /** Evidence ledger */
  evidence: EvidenceLedger;
  /** Issues identified (from Layer 1) */
  issues?: string[];
  /** Bullet context */
  context?: BulletContext;
  /** Target role for tailoring */
  targetRole?: string;
  /** Other bullets in the section (for tool surfacing scope) */
  sectionBullets?: string[];
}

/**
 * Plan micro-actions for a bullet rewrite
 * Returns ordered list of transformations to apply
 */
export function planMicroActions(params: PlanMicroActionsParams): RewritePlan {
  const {
    original,
    evidence,
    issues = [],
    context,
    targetRole,
    sectionBullets = [],
  } = params;

  const transformations: MicroAction[] = [];
  const needsUserInput: UserInputRequest[] = [];
  const thresholds = getThresholds();

  // 1. Check for weak verbs
  const weakVerbs = findWeakVerbs(original);
  for (const { verb } of weakVerbs) {
    const upgrade = suggestVerbUpgrade(verb, original);
    if (upgrade) {
      transformations.push(createVerbUpgradeAction(verb, upgrade, original));
    }
  }

  // 2. Check for fluff
  const fluff = detectFluff(original);
  if (fluff.length > 0) {
    transformations.push(createRemoveFluffAction(fluff));
  }

  // 3. Check issues from Layer 1
  if (issues.includes('weak_verb') && weakVerbs.length === 0) {
    // Layer 1 flagged weak verb but we didn't detect one
    // Add general verb improvement action
    transformations.push({
      type: 'add_specificity',
      data: {
        specificity_type: 'technical',
        hint: 'Use stronger action verb at start',
      } as AddSpecificityData,
    });
  }

  if (issues.includes('no_metric')) {
    // Don't add numbers - add HOW instead
    transformations.push(createAddHowAction(original));
  }

  if (issues.includes('too_vague') || issues.includes('vague')) {
    transformations.push({
      type: 'add_specificity',
      data: {
        specificity_type: 'outcome',
        hint: 'Explain the specific outcome or impact',
      } as AddSpecificityData,
    });
  }

  // 4. Check for passive voice
  if (hasPassiveVoice(original)) {
    transformations.push({
      type: 'add_specificity',
      data: {
        specificity_type: 'technical',
        hint: 'Convert passive voice to active voice',
      } as AddSpecificityData,
    });
  }

  // 5. Check for tools/skills from resume that could be surfaced
  const toolActions = planToolSurfacing(
    original,
    evidence,
    context,
    sectionBullets,
    needsUserInput
  );
  transformations.push(...toolActions);

  // 6. Determine goal based on issues
  const goal = determineGoal(issues, transformations);

  // 7. Build constraints
  const constraints = buildConstraints(thresholds.max_bullet_length);

  return {
    goal,
    issues,
    transformations,
    constraints,
    needs_user_input: needsUserInput.length > 0 ? needsUserInput : undefined,
  };
}

// ==================== Action Creators ====================

/**
 * Create verb upgrade action
 */
function createVerbUpgradeAction(
  from: string,
  to: string,
  context: string
): MicroAction {
  return {
    type: 'verb_upgrade',
    data: {
      from,
      to,
      context,
    } as VerbUpgradeData,
  };
}

/**
 * Create remove fluff action
 */
function createRemoveFluffAction(fluff: DetectedFluff[]): MicroAction {
  return {
    type: 'remove_fluff',
    data: {
      terms: fluff.map((f) => f.phrase),
    } as RemoveFluffData,
  };
}

/**
 * Create add_how action
 */
function createAddHowAction(original: string): MicroAction {
  // Analyze what kind of "how" to add
  let hint = 'Explain the method or approach used';

  if (hasMetric(original)) {
    hint = 'Add more context about how this was achieved';
  } else {
    hint = 'Explain HOW this was done (method, tools, approach)';
  }

  return {
    type: 'add_how',
    data: {
      hint,
    } as AddHowData,
  };
}

/**
 * Create surface_tool action
 */
function createSurfaceToolAction(tool: string, evidenceId: string): MicroAction {
  return {
    type: 'surface_tool',
    data: {
      tool,
      evidence_id: evidenceId,
    } as SurfaceToolData,
  };
}

/**
 * Create tense alignment action
 */
export function createTenseAlignAction(tense: 'past' | 'present'): MicroAction {
  return {
    type: 'tense_align',
    data: {
      tense,
    } as TenseAlignData,
  };
}

// ==================== Tool Surfacing ====================

/**
 * Plan tool/skill surfacing from evidence
 */
function planToolSurfacing(
  original: string,
  evidence: EvidenceLedger,
  context: BulletContext | undefined,
  sectionBullets: string[],
  needsUserInput: UserInputRequest[]
): MicroAction[] {
  const actions: MicroAction[] = [];
  const originalLower = original.toLowerCase();

  // Find skills/tools evidence
  const skillsEvidence = evidence.items.find((e) => e.type === 'skills');
  const toolsEvidence = evidence.items.find((e) => e.type === 'tools');

  // Combine skills and tools
  const allTools: Array<{ tool: string; evidenceId: string }> = [];

  if (skillsEvidence && skillsEvidence.normalized_terms) {
    for (const term of skillsEvidence.normalized_terms) {
      allTools.push({ tool: term, evidenceId: skillsEvidence.id });
    }
  }

  if (toolsEvidence && toolsEvidence.normalized_terms) {
    for (const term of toolsEvidence.normalized_terms) {
      allTools.push({ tool: term, evidenceId: toolsEvidence.id });
    }
  }

  // Check each tool for relevance and permission
  for (const { tool, evidenceId } of allTools) {
    // Skip if already mentioned
    if (originalLower.includes(tool.toLowerCase())) {
      continue;
    }

    // Check if tool is relevant to the bullet content
    if (!isToolRelevant(tool, original)) {
      continue;
    }

    // Check scope permission
    const { allowed, reason } = allowResumeEnrichmentInBullet(
      context,
      tool,
      sectionBullets
    );

    if (allowed) {
      actions.push(createSurfaceToolAction(tool, evidenceId));
    } else if (reason === 'needs_user_confirmation') {
      // Add to user input requests
      needsUserInput.push({
        prompt: `Did you use ${tool} in this role?`,
        example_answer: 'Yes / No',
      });
    }
  }

  // Limit number of tool suggestions
  return actions.slice(0, 2);
}

/**
 * Check if a tool is relevant to the bullet content
 * Simple heuristic based on keywords
 */
function isToolRelevant(tool: string, bulletText: string): boolean {
  const toolLower = tool.toLowerCase();
  const bulletLower = bulletText.toLowerCase();

  // Define relevance mappings
  const relevanceMappings: Record<string, string[]> = {
    // Backend
    python: ['api', 'backend', 'data', 'script', 'automation', 'server'],
    java: ['api', 'backend', 'enterprise', 'server', 'microservice'],
    node: ['api', 'backend', 'server', 'javascript'],
    nodejs: ['api', 'backend', 'server', 'javascript'],
    'node.js': ['api', 'backend', 'server', 'javascript'],
    
    // Frontend
    react: ['frontend', 'ui', 'interface', 'web', 'dashboard', 'component'],
    angular: ['frontend', 'ui', 'interface', 'web'],
    vue: ['frontend', 'ui', 'interface', 'web'],
    
    // Database
    sql: ['database', 'data', 'query', 'report'],
    postgresql: ['database', 'data', 'query'],
    mysql: ['database', 'data', 'query'],
    mongodb: ['database', 'data', 'nosql'],
    
    // DevOps
    docker: ['deploy', 'container', 'infrastructure', 'ci/cd'],
    kubernetes: ['deploy', 'container', 'infrastructure', 'k8s', 'orchestrat'],
    aws: ['cloud', 'infrastructure', 'deploy', 'server'],
    
    // Data
    pandas: ['data', 'analysis', 'report'],
    tensorflow: ['machine learning', 'ml', 'ai', 'model'],
    pytorch: ['machine learning', 'ml', 'ai', 'model'],
  };

  const keywords = relevanceMappings[toolLower];
  if (keywords) {
    return keywords.some((kw) => bulletLower.includes(kw));
  }

  // Default: assume relevant if it's a short tool name
  return tool.length >= 3;
}

// ==================== Goal Determination ====================

/**
 * Determine the primary goal based on issues and actions
 */
function determineGoal(
  issues: string[],
  transformations: MicroAction[]
): RewriteGoal {
  // Check issues first
  if (issues.includes('no_metric') || issues.includes('weak_impact')) {
    return 'impact';
  }

  if (issues.includes('too_vague') || issues.includes('vague')) {
    return 'clarity';
  }

  if (issues.includes('too_long') || issues.includes('verbose')) {
    return 'conciseness';
  }

  // Check transformations
  const hasVerbUpgrade = transformations.some((t) => t.type === 'verb_upgrade');
  const hasFluffRemoval = transformations.some((t) => t.type === 'remove_fluff');
  const hasToolSurfacing = transformations.some((t) => t.type === 'surface_tool');

  if (hasVerbUpgrade || hasToolSurfacing) {
    return 'impact';
  }

  if (hasFluffRemoval) {
    return 'clarity';
  }

  // Default
  return 'clarity';
}

// ==================== Constraints ====================

/**
 * Build default constraints
 */
function buildConstraints(maxLength: number): RewriteConstraints {
  return {
    max_length: maxLength,
    forbid_new_numbers: true,
    forbid_new_tools: false, // Tools can come from evidence
    forbid_new_companies: true,
  };
}

// ==================== Utility Functions ====================

/**
 * Get action types from a plan
 */
export function getActionTypes(plan: RewritePlan): MicroActionType[] {
  return plan.transformations.map((t) => t.type);
}

/**
 * Check if plan has specific action type
 */
export function planHasAction(
  plan: RewritePlan,
  actionType: MicroActionType
): boolean {
  return plan.transformations.some((t) => t.type === actionType);
}

/**
 * Get verb upgrades from plan
 */
export function getVerbUpgradesFromPlan(
  plan: RewritePlan
): Array<{ from: string; to: string }> {
  return plan.transformations
    .filter((t) => t.type === 'verb_upgrade')
    .map((t) => {
      const data = t.data as VerbUpgradeData;
      return { from: data.from, to: data.to };
    });
}

/**
 * Get fluff terms to remove from plan
 */
export function getFluffTermsFromPlan(plan: RewritePlan): string[] {
  const removeFluffAction = plan.transformations.find(
    (t) => t.type === 'remove_fluff'
  );

  if (removeFluffAction) {
    return (removeFluffAction.data as RemoveFluffData).terms;
  }

  return [];
}

/**
 * Get tools to surface from plan
 */
export function getToolsToSurfaceFromPlan(
  plan: RewritePlan
): Array<{ tool: string; evidenceId: string }> {
  return plan.transformations
    .filter((t) => t.type === 'surface_tool')
    .map((t) => {
      const data = t.data as SurfaceToolData;
      return { tool: data.tool, evidenceId: data.evidence_id };
    });
}

/**
 * Check if plan requires any transformations
 */
export function planRequiresTransformations(plan: RewritePlan): boolean {
  return plan.transformations.length > 0;
}
