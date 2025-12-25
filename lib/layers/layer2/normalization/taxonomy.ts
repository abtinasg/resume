/**
 * Layer 2 - Strategy Engine
 * Taxonomy Operations
 *
 * Provides lookup functions for skills, tools, and categories
 * using the capability taxonomy.
 */

import { loadTaxonomy, getAllSkills, getAllTools, getIndustryKeywords } from '../config';
import { canonicalize } from './canonicalize';
import type { CapabilityTaxonomy } from '../types';

// ==================== Cached Lookups ====================

let skillsSetCache: Set<string> | null = null;
let toolsSetCache: Set<string> | null = null;
let skillCategoryMapCache: Map<string, string> | null = null;
let toolCategoryMapCache: Map<string, string> | null = null;

// ==================== Cache Initialization ====================

/**
 * Get cached skills set
 */
function getSkillsSet(): Set<string> {
  if (skillsSetCache === null) {
    skillsSetCache = new Set(getAllSkills().map(s => s.toLowerCase()));
  }
  return skillsSetCache;
}

/**
 * Get cached tools set
 */
function getToolsSet(): Set<string> {
  if (toolsSetCache === null) {
    toolsSetCache = new Set(getAllTools().map(t => t.toLowerCase()));
  }
  return toolsSetCache;
}

/**
 * Get cached skill category map
 */
function getSkillCategoryMap(): Map<string, string> {
  if (skillCategoryMapCache === null) {
    const taxonomy = loadTaxonomy();
    skillCategoryMapCache = new Map();
    
    for (const [category, skills] of Object.entries(taxonomy.skills)) {
      for (const skill of skills) {
        skillCategoryMapCache.set(skill.toLowerCase(), category);
      }
    }
  }
  return skillCategoryMapCache;
}

/**
 * Get cached tool category map
 */
function getToolCategoryMap(): Map<string, string> {
  if (toolCategoryMapCache === null) {
    const taxonomy = loadTaxonomy();
    toolCategoryMapCache = new Map();
    
    for (const [category, tools] of Object.entries(taxonomy.tools)) {
      for (const tool of tools) {
        toolCategoryMapCache.set(tool.toLowerCase(), category);
      }
    }
  }
  return toolCategoryMapCache;
}

// ==================== Public API ====================

/**
 * Check if a term is a recognized skill
 * 
 * @param term - The term to check
 * @returns True if the term is a known skill
 *
 * @example
 * isSkill('Python') // true
 * isSkill('React') // true
 * isSkill('randomword') // false
 */
export function isSkill(term: string): boolean {
  const canonical = canonicalize(term);
  return getSkillsSet().has(canonical);
}

/**
 * Check if a term is a recognized tool
 *
 * @param term - The term to check
 * @returns True if the term is a known tool
 *
 * @example
 * isTool('Docker') // true
 * isTool('GitHub') // true
 * isTool('randomword') // false
 */
export function isTool(term: string): boolean {
  const canonical = canonicalize(term);
  return getToolsSet().has(canonical);
}

/**
 * Get the category for a skill
 *
 * @param term - The skill term
 * @returns Category name or undefined if not found
 *
 * @example
 * getSkillCategory('Python') // 'programming_languages'
 * getSkillCategory('React') // 'frontend_frameworks'
 */
export function getSkillCategory(term: string): string | undefined {
  const canonical = canonicalize(term);
  return getSkillCategoryMap().get(canonical);
}

/**
 * Get the category for a tool
 *
 * @param term - The tool term
 * @returns Category name or undefined if not found
 *
 * @example
 * getToolCategory('Docker') // 'devops_tools'
 * getToolCategory('JIRA') // 'project_management'
 */
export function getToolCategory(term: string): string | undefined {
  const canonical = canonicalize(term);
  return getToolCategoryMap().get(canonical);
}

/**
 * Get the category for a term (skill or tool)
 *
 * @param term - The term to look up
 * @returns Category name or undefined if not found
 */
export function getCategory(term: string): string | undefined {
  // Try skill first, then tool
  return getSkillCategory(term) ?? getToolCategory(term);
}

/**
 * Get all skills in a category
 *
 * @param category - The category name
 * @returns Array of skills in the category
 */
export function getSkillsByCategory(category: string): string[] {
  const taxonomy = loadTaxonomy();
  return taxonomy.skills[category] ?? [];
}

/**
 * Get all tools in a category
 *
 * @param category - The category name
 * @returns Array of tools in the category
 */
export function getToolsByCategory(category: string): string[] {
  const taxonomy = loadTaxonomy();
  return taxonomy.tools[category] ?? [];
}

/**
 * Get all available skill categories
 *
 * @returns Array of category names
 */
export function getSkillCategories(): string[] {
  const taxonomy = loadTaxonomy();
  return Object.keys(taxonomy.skills);
}

/**
 * Get all available tool categories
 *
 * @returns Array of category names
 */
export function getToolCategories(): string[] {
  const taxonomy = loadTaxonomy();
  return Object.keys(taxonomy.tools);
}

/**
 * Classify a term as skill, tool, or unknown
 *
 * @param term - The term to classify
 * @returns 'skill' | 'tool' | 'unknown'
 */
export function classifyTerm(term: string): 'skill' | 'tool' | 'unknown' {
  // Skill takes precedence if term exists in both
  if (isSkill(term)) {
    return 'skill';
  }
  if (isTool(term)) {
    return 'tool';
  }
  return 'unknown';
}

/**
 * Classify multiple terms
 *
 * @param terms - Array of terms to classify
 * @returns Object with categorized terms
 */
export function classifyTerms(terms: string[]): {
  skills: string[];
  tools: string[];
  unknown: string[];
} {
  const skills: string[] = [];
  const tools: string[] = [];
  const unknown: string[] = [];

  for (const term of terms) {
    const canonical = canonicalize(term);
    const classification = classifyTerm(canonical);

    switch (classification) {
      case 'skill':
        skills.push(canonical);
        break;
      case 'tool':
        tools.push(canonical);
        break;
      default:
        unknown.push(canonical);
    }
  }

  return { skills, tools, unknown };
}

/**
 * Check if a term matches any industry keyword
 *
 * @param term - The term to check
 * @returns The industry name or undefined
 */
export function getIndustryForKeyword(term: string): string | undefined {
  const canonical = canonicalize(term);
  const industryKeywords = getIndustryKeywords();

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (canonicalize(keyword) === canonical) {
        return industry;
      }
    }
  }

  return undefined;
}

/**
 * Get keywords for a specific industry
 *
 * @param industry - The industry name
 * @returns Array of industry keywords
 */
export function getKeywordsForIndustry(industry: string): string[] {
  const industryKeywords = getIndustryKeywords();
  return industryKeywords[industry.toLowerCase()] ?? [];
}

/**
 * Get all industry names
 *
 * @returns Array of industry names
 */
export function getAllIndustries(): string[] {
  return Object.keys(getIndustryKeywords());
}

/**
 * Find related skills in the same category
 *
 * @param term - The skill to find related skills for
 * @param limit - Maximum number of related skills to return
 * @returns Array of related skills
 */
export function findRelatedSkills(term: string, limit: number = 5): string[] {
  const category = getSkillCategory(term);
  if (!category) {
    return [];
  }

  const canonical = canonicalize(term);
  const categorySkills = getSkillsByCategory(category);
  
  return categorySkills
    .filter(s => s.toLowerCase() !== canonical)
    .slice(0, limit);
}

/**
 * Find related tools in the same category
 *
 * @param term - The tool to find related tools for
 * @param limit - Maximum number of related tools to return
 * @returns Array of related tools
 */
export function findRelatedTools(term: string, limit: number = 5): string[] {
  const category = getToolCategory(term);
  if (!category) {
    return [];
  }

  const canonical = canonicalize(term);
  const categoryTools = getToolsByCategory(category);
  
  return categoryTools
    .filter(t => t.toLowerCase() !== canonical)
    .slice(0, limit);
}

// ==================== Cache Management ====================

/**
 * Clear taxonomy caches
 * Useful for testing
 */
export function clearTaxonomyCache(): void {
  skillsSetCache = null;
  toolsSetCache = null;
  skillCategoryMapCache = null;
  toolCategoryMapCache = null;
}

/**
 * Get taxonomy statistics
 *
 * @returns Statistics about the loaded taxonomy
 */
export function getTaxonomyStats(): {
  totalSkills: number;
  totalTools: number;
  skillCategories: number;
  toolCategories: number;
  industries: number;
} {
  const taxonomy = loadTaxonomy();
  
  return {
    totalSkills: getAllSkills().length,
    totalTools: getAllTools().length,
    skillCategories: Object.keys(taxonomy.skills).length,
    toolCategories: Object.keys(taxonomy.tools).length,
    industries: getAllIndustries().length,
  };
}
