/**
 * Layer 1 - Evaluation Engine
 * Skill Capital Scoring Module
 *
 * Evaluates the skill-related aspects of a resume:
 * - Skill presence and quantity
 * - Skill diversity (breadth across categories)
 * - Skill depth (expertise indicators)
 */

import type { ParsedResume, DimensionScore, ExtractedEntities } from '../types';
import { findSkillCategory, SKILL_CATEGORIES } from '../config/skills';
import { CONTENT_THRESHOLDS, IMPORTANT_SKILL_CATEGORIES } from '../config/weights';

// ==================== Main Scoring Function ====================

/**
 * Calculate skill capital score (0-100)
 */
export function calculateSkillCapitalScore(
  parsed: ParsedResume,
  extracted: ExtractedEntities
): DimensionScore {
  const breakdown: Record<string, number> = {};
  const issues: string[] = [];

  // 1. Skill presence score (0-30)
  const presenceScore = calculateSkillPresence(parsed, extracted);
  breakdown.skill_presence = presenceScore.score;
  issues.push(...presenceScore.issues);

  // 2. Skill diversity score (0-40)
  const diversityScore = calculateSkillDiversity(extracted);
  breakdown.skill_diversity = diversityScore.score;
  issues.push(...diversityScore.issues);

  // 3. Skill depth score (0-30)
  const depthScore = calculateSkillDepth(parsed, extracted);
  breakdown.skill_depth = depthScore.score;
  issues.push(...depthScore.issues);

  // Calculate total score
  const totalScore = presenceScore.score + diversityScore.score + depthScore.score;
  const normalizedScore = Math.min(100, totalScore);

  return {
    score: Math.round(normalizedScore),
    breakdown,
    issues: issues.length > 0 ? issues : undefined,
  };
}

// ==================== Skill Presence ====================

/**
 * Calculate skill presence score based on quantity of skills
 */
function calculateSkillPresence(
  parsed: ParsedResume,
  extracted: ExtractedEntities
): { score: number; issues: string[] } {
  const issues: string[] = [];
  
  // Count skills from multiple sources
  const explicitSkillsCount = parsed.skills.length;
  const extractedSkillsCount = extracted.skills.length;
  const toolsCount = extracted.tools.length;
  
  // Total unique technical skills
  const totalTechnicalSkills = new Set([
    ...extracted.skills,
    ...extracted.tools,
  ]).size;

  let score = 0;

  // Scoring based on skill count
  if (totalTechnicalSkills >= 20) {
    score = 30; // Full marks
  } else if (totalTechnicalSkills >= 15) {
    score = 26;
  } else if (totalTechnicalSkills >= 10) {
    score = 22;
  } else if (totalTechnicalSkills >= CONTENT_THRESHOLDS.min_skills_count) {
    score = 18;
  } else if (totalTechnicalSkills >= 3) {
    score = 12;
    issues.push('few_skills_listed');
  } else {
    score = 5;
    issues.push('missing_skills');
  }

  // Bonus for explicit skills section
  if (explicitSkillsCount > 0) {
    score = Math.min(30, score + 2);
  } else {
    issues.push('no_skills_section');
  }

  return { score, issues };
}

// ==================== Skill Diversity ====================

/**
 * Calculate skill diversity across categories
 */
function calculateSkillDiversity(
  extracted: ExtractedEntities
): { score: number; issues: string[] } {
  const issues: string[] = [];
  
  // Count categories represented
  const categoryCounts: Record<string, number> = {};
  const allSkills = [...extracted.skills, ...extracted.tools];

  for (const skill of allSkills) {
    const category = findSkillCategory(skill);
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  }

  const categoriesRepresented = Object.keys(categoryCounts).length;
  const totalCategories = Object.keys(SKILL_CATEGORIES).length;
  const coverageRatio = categoriesRepresented / totalCategories;

  let score = 0;

  // Score based on category coverage
  if (coverageRatio >= 0.5) {
    score = 40; // Full marks - 50%+ categories covered
  } else if (coverageRatio >= 0.35) {
    score = 34;
  } else if (coverageRatio >= 0.25) {
    score = 28;
  } else if (coverageRatio >= 0.15) {
    score = 20;
    issues.push('limited_skill_diversity');
  } else {
    score = 12;
    issues.push('narrow_skill_set');
  }

  // Check for important category representation
  const importantCategoriesPresent = IMPORTANT_SKILL_CATEGORIES.filter(
    cat => categoryCounts[cat] && categoryCounts[cat] > 0
  ).length;

  if (importantCategoriesPresent < 2) {
    issues.push('missing_core_technical_skills');
  }

  // Bonus for having soft skills
  if (categoryCounts['soft_skills'] && categoryCounts['soft_skills'] > 0) {
    score = Math.min(40, score + 3);
  }

  return { score, issues };
}

// ==================== Skill Depth ====================

/**
 * Calculate skill depth based on expertise indicators
 */
function calculateSkillDepth(
  parsed: ParsedResume,
  extracted: ExtractedEntities
): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;

  // Check for depth indicators
  const depthIndicators = {
    certifications: parsed.certifications?.length || 0,
    projects: parsed.projects?.length || 0,
    yearsExperience: calculateTotalExperienceYears(parsed),
    mentionedSkillsInBullets: countSkillMentionsInBullets(parsed, extracted),
  };

  // Certifications (0-8 points)
  if (depthIndicators.certifications >= 3) {
    score += 8;
  } else if (depthIndicators.certifications >= 2) {
    score += 6;
  } else if (depthIndicators.certifications >= 1) {
    score += 4;
  }

  // Projects demonstrating skills (0-8 points)
  if (depthIndicators.projects >= 3) {
    score += 8;
  } else if (depthIndicators.projects >= 2) {
    score += 6;
  } else if (depthIndicators.projects >= 1) {
    score += 4;
  }

  // Years of experience (0-7 points)
  if (depthIndicators.yearsExperience >= 8) {
    score += 7;
  } else if (depthIndicators.yearsExperience >= 5) {
    score += 5;
  } else if (depthIndicators.yearsExperience >= 2) {
    score += 3;
  } else {
    score += 1;
  }

  // Skills actively used (mentioned in bullets) (0-7 points)
  const skillUsageRatio = depthIndicators.mentionedSkillsInBullets / 
    Math.max(1, extracted.skills.length);
  
  if (skillUsageRatio >= 0.5) {
    score += 7; // 50%+ of skills mentioned in experience
  } else if (skillUsageRatio >= 0.3) {
    score += 5;
  } else if (skillUsageRatio >= 0.15) {
    score += 3;
  } else {
    score += 1;
    issues.push('skills_not_demonstrated');
  }

  // Cap at 30
  score = Math.min(30, score);

  // Add issues based on depth indicators
  if (depthIndicators.certifications === 0) {
    issues.push('no_certifications');
  }
  if (depthIndicators.projects === 0) {
    issues.push('no_projects');
  }

  return { score, issues };
}

// ==================== Helper Functions ====================

/**
 * Calculate total years of experience
 */
function calculateTotalExperienceYears(parsed: ParsedResume): number {
  let totalMonths = 0;
  
  for (const exp of parsed.experiences) {
    totalMonths += exp.duration_months || 0;
  }

  // If no duration data, estimate from position count
  if (totalMonths === 0 && parsed.experiences.length > 0) {
    totalMonths = parsed.experiences.length * 24; // Assume 2 years per position
  }

  return Math.round(totalMonths / 12);
}

/**
 * Count how many skills are mentioned in experience bullets
 */
function countSkillMentionsInBullets(
  parsed: ParsedResume,
  extracted: ExtractedEntities
): number {
  const allBullets = parsed.experiences
    .flatMap(exp => exp.bullets)
    .join(' ')
    .toLowerCase();

  let mentionedCount = 0;
  
  for (const skill of extracted.skills) {
    if (allBullets.includes(skill.toLowerCase())) {
      mentionedCount++;
    }
  }

  return mentionedCount;
}

// ==================== Export ====================

export { calculateSkillCapitalScore as default };
