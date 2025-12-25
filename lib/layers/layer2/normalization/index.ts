/**
 * Layer 2 - Strategy Engine
 * Normalization Module Index
 *
 * Exports canonicalization and taxonomy functions.
 */

// Canonicalization functions
export {
  canonicalize,
  canonicalizeAll,
  areEquivalent,
  findMatches,
  calculateMatchPercentage,
  clearCanonicalizationCache,
} from './canonicalize';

// Taxonomy functions
export {
  isSkill,
  isTool,
  getSkillCategory,
  getToolCategory,
  getCategory,
  getSkillsByCategory,
  getToolsByCategory,
  getSkillCategories,
  getToolCategories,
  classifyTerm,
  classifyTerms,
  getIndustryForKeyword,
  getKeywordsForIndustry,
  getAllIndustries,
  findRelatedSkills,
  findRelatedTools,
  clearTaxonomyCache,
  getTaxonomyStats,
} from './taxonomy';
