/**
 * Layer 1 - Evaluation Engine
 * Job Description Parser Module
 *
 * Parses job descriptions to extract requirements for fit evaluation.
 */

import type { ParsedJobRequirements } from '../types';
import { SeniorityLevel } from '../../shared/types';
import { SKILL_NORMALIZATION, normalizeSkill } from '../config/skills';
import { TOOL_PATTERNS, detectToolsInText } from '../config/tools';
import { INDUSTRY_KEYWORDS } from '../config/industries';

// ==================== Main Parser Function ====================

/**
 * Parse job description text into structured requirements
 */
export async function parseJobDescription(
  rawText: string
): Promise<ParsedJobRequirements> {
  const textLower = rawText.toLowerCase();

  // Extract skills
  const { required, preferred } = extractSkills(rawText);

  // Extract tools
  const tools = detectToolsInText(rawText);
  const requiredTools = tools.slice(0, Math.ceil(tools.length * 0.6));
  const preferredTools = tools.slice(Math.ceil(tools.length * 0.6));

  // Determine seniority
  const seniority = extractSeniority(rawText);

  // Extract domain keywords
  const domainKeywords = extractDomainKeywords(rawText);

  // Extract years of experience
  const yearsExp = extractYearsExperience(rawText);

  return {
    required_skills: required,
    preferred_skills: preferred,
    required_tools: requiredTools,
    preferred_tools: preferredTools,
    seniority_expected: seniority,
    domain_keywords: domainKeywords,
    years_experience_min: yearsExp.min,
    years_experience_max: yearsExp.max,
  };
}

// ==================== Skill Extraction ====================

interface ExtractedSkills {
  required: string[];
  preferred: string[];
}

/**
 * Extract required and preferred skills from job description
 */
function extractSkills(text: string): ExtractedSkills {
  const required: Set<string> = new Set();
  const preferred: Set<string> = new Set();
  const textLower = text.toLowerCase();

  // Section patterns
  const requiredSectionPatterns = [
    /requirements?:?\s*([\s\S]*?)(?=preferred|nice to have|bonus|about|benefits|$)/i,
    /must have:?\s*([\s\S]*?)(?=nice to have|preferred|bonus|$)/i,
    /required:?\s*([\s\S]*?)(?=preferred|nice to have|$)/i,
    /qualifications?:?\s*([\s\S]*?)(?=preferred|nice to have|$)/i,
  ];

  const preferredSectionPatterns = [
    /preferred:?\s*([\s\S]*?)(?=about|benefits|$)/i,
    /nice to have:?\s*([\s\S]*?)(?=about|benefits|$)/i,
    /bonus:?\s*([\s\S]*?)(?=about|benefits|$)/i,
  ];

  // Extract from required sections
  for (const pattern of requiredSectionPatterns) {
    const match = text.match(pattern);
    if (match) {
      const sectionText = match[1];
      const skills = extractSkillsFromSection(sectionText);
      skills.forEach(s => required.add(s));
    }
  }

  // Extract from preferred sections
  for (const pattern of preferredSectionPatterns) {
    const match = text.match(pattern);
    if (match) {
      const sectionText = match[1];
      const skills = extractSkillsFromSection(sectionText);
      skills.forEach(s => {
        if (!required.has(s)) {
          preferred.add(s);
        }
      });
    }
  }

  // If no sections found, extract from full text
  if (required.size === 0) {
    const allSkills = extractSkillsFromSection(text);
    // First 60% are considered required, rest preferred
    const skillArray = Array.from(allSkills);
    const splitIndex = Math.ceil(skillArray.length * 0.6);
    skillArray.slice(0, splitIndex).forEach(s => required.add(s));
    skillArray.slice(splitIndex).forEach(s => preferred.add(s));
  }

  return {
    required: Array.from(required),
    preferred: Array.from(preferred),
  };
}

/**
 * Extract skills from a text section
 */
function extractSkillsFromSection(sectionText: string): Set<string> {
  const skills = new Set<string>();
  const textLower = sectionText.toLowerCase();

  // Check against known skills
  for (const [variant, canonical] of Object.entries(SKILL_NORMALIZATION)) {
    // Word boundary check
    const pattern = new RegExp(`\\b${escapeRegex(variant)}\\b`, 'i');
    if (pattern.test(textLower)) {
      skills.add(canonical);
    }
  }

  // Also look for skill-like patterns
  const skillPatterns = [
    /experience\s+(?:with|in)\s+([A-Za-z+#.]+)/gi,
    /proficient\s+(?:in|with)\s+([A-Za-z+#.]+)/gi,
    /knowledge\s+of\s+([A-Za-z+#.]+)/gi,
    /familiarity\s+with\s+([A-Za-z+#.]+)/gi,
  ];

  for (const pattern of skillPatterns) {
    const matches = Array.from(sectionText.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        const skill = normalizeSkill(match[1].trim());
        if (skill.length > 1 && skill.length < 30) {
          skills.add(skill);
        }
      }
    }
  }

  return skills;
}

// ==================== Seniority Extraction ====================

/**
 * Extract expected seniority level from job description
 */
function extractSeniority(text: string): SeniorityLevel {
  const textLower = text.toLowerCase();

  // Lead/Principal patterns
  if (
    /\b(lead|principal|staff|architect|head|director|vp|chief)\b/.test(textLower) &&
    !/\b(junior|entry)\b/.test(textLower)
  ) {
    return SeniorityLevel.LEAD;
  }

  // Senior patterns
  if (
    /\b(senior|sr\.?|iii|level\s*3)\b/.test(textLower) &&
    !/\b(junior|entry)\b/.test(textLower)
  ) {
    return SeniorityLevel.SENIOR;
  }

  // Entry patterns
  if (
    /\b(junior|jr\.?|entry|intern|associate|graduate|trainee)\b/.test(textLower)
  ) {
    return SeniorityLevel.ENTRY;
  }

  // Check years of experience as fallback
  const yearsMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years >= 8) return SeniorityLevel.LEAD;
    if (years >= 5) return SeniorityLevel.SENIOR;
    if (years >= 2) return SeniorityLevel.MID;
    return SeniorityLevel.ENTRY;
  }

  // Default to mid
  return SeniorityLevel.MID;
}

// ==================== Domain Keywords ====================

/**
 * Extract domain/industry keywords from job description
 */
function extractDomainKeywords(text: string): string[] {
  const keywords = new Set<string>();
  const textLower = text.toLowerCase();

  // Check against known industry keywords
  for (const [industry, industryKeywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const keyword of industryKeywords) {
      if (textLower.includes(keyword)) {
        keywords.add(keyword);
        // Don't add too many from same industry
        if (Array.from(keywords).filter(k => industryKeywords.includes(k)).length >= 3) {
          break;
        }
      }
    }
  }

  // Look for domain-specific patterns
  const domainPatterns = [
    /(?:experience\s+in|knowledge\s+of)\s+(?:the\s+)?([a-z]+(?:\s+[a-z]+)?)\s+(?:industry|sector|domain)/gi,
    /(?:background\s+in)\s+([a-z]+(?:\s+[a-z]+)?)/gi,
  ];

  for (const pattern of domainPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      if (match[1] && match[1].length > 3) {
        keywords.add(match[1].toLowerCase().trim());
      }
    }
  }

  return Array.from(keywords).slice(0, 10);
}

// ==================== Years of Experience ====================

interface YearsExperience {
  min?: number;
  max?: number;
}

/**
 * Extract years of experience requirements
 */
function extractYearsExperience(text: string): YearsExperience {
  const result: YearsExperience = {};

  // Patterns for years of experience
  const patterns = [
    /(\d+)\s*[-–to]+\s*(\d+)\s*(?:\+)?\s*(?:years?|yrs?)/i, // "3-5 years"
    /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i, // "5+ years"
    /minimum\s+(?:of\s+)?(\d+)\s*(?:years?|yrs?)/i, // "minimum 3 years"
    /at\s+least\s+(\d+)\s*(?:years?|yrs?)/i, // "at least 5 years"
  ];

  // Try range pattern first
  const rangeMatch = text.match(patterns[0]);
  if (rangeMatch) {
    result.min = parseInt(rangeMatch[1]);
    result.max = parseInt(rangeMatch[2]);
    return result;
  }

  // Try single number patterns
  for (const pattern of patterns.slice(1)) {
    const match = text.match(pattern);
    if (match) {
      result.min = parseInt(match[1]);
      return result;
    }
  }

  return result;
}

// ==================== Utility Functions ====================

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== Export ====================

export { parseJobDescription as default };
