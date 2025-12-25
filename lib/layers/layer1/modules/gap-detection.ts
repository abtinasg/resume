/**
 * Layer 1 - Evaluation Engine
 * Gap Detection Module (SHARED)
 *
 * Detects gaps between resume and job requirements:
 * - Skills gap
 * - Tools gap
 * - Experience gap
 * - Seniority gap
 * - Industry gap
 */

import type {
  ParsedResume,
  ExtractedEntities,
  ParsedJobRequirements,
  GapAnalysis,
  SkillsGap,
  ToolsGap,
  ExperienceGap,
  SeniorityGap,
  IndustryGap,
  SeniorityAlignment,
} from '../types';
import { SeniorityLevel } from '../../shared/types';
import { normalizeSkills } from '../config/skills';
import { normalizeTools } from '../config/tools';
import { findTransferableSkills } from './entity-extraction';
import { inferSeniorityFromTitle } from './entity-extraction';
import { EXPERIENCE_TYPE_PATTERNS, estimateYearsGap, WEAK_ACTION_VERBS, GENERIC_PHRASES } from '../config/weights';

// ==================== Main Gap Detection ====================

/**
 * Perform complete gap analysis between resume and job requirements
 */
export function detectGaps(
  parsed: ParsedResume,
  extracted: ExtractedEntities,
  requirements: ParsedJobRequirements
): GapAnalysis {
  // Skills gap
  const skills = detectSkillsGap(
    extracted.skills,
    requirements.required_skills,
    requirements.preferred_skills || []
  );

  // Tools gap
  const tools = detectToolsGap(
    extracted.tools,
    requirements.required_tools,
    requirements.preferred_tools || []
  );

  // Experience gap
  const experience = detectExperienceGap(
    parsed,
    requirements.domain_keywords || []
  );

  // Seniority gap
  const seniority = detectSeniorityGap(
    parsed,
    requirements.seniority_expected,
    requirements.years_experience_min
  );

  // Industry gap
  const industry = detectIndustryGap(
    extracted.industries || [],
    requirements.domain_keywords || []
  );

  return {
    skills,
    tools,
    experience,
    seniority,
    industry,
  };
}

// ==================== Skills Gap Detection ====================

/**
 * Detect gap between resume skills and job requirements
 */
export function detectSkillsGap(
  extractedSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[] = []
): SkillsGap {
  // Normalize all skills for comparison
  const resumeSkills = new Set(normalizeSkills(extractedSkills).map(s => s.toLowerCase()));
  const required = normalizeSkills(requiredSkills).map(s => s.toLowerCase());
  const preferred = normalizeSkills(preferredSkills).map(s => s.toLowerCase());

  // Find matches
  const matched: string[] = [];
  const criticalMissing: string[] = [];
  const niceToHaveMissing: string[] = [];

  // Check required skills
  for (const skill of required) {
    if (resumeSkills.has(skill)) {
      // Return original case from required
      const originalSkill = requiredSkills.find(s => s.toLowerCase() === skill);
      if (originalSkill) matched.push(originalSkill);
    } else {
      const originalSkill = requiredSkills.find(s => s.toLowerCase() === skill);
      if (originalSkill) criticalMissing.push(originalSkill);
    }
  }

  // Check preferred skills
  for (const skill of preferred) {
    if (!resumeSkills.has(skill)) {
      const originalSkill = preferredSkills.find(s => s.toLowerCase() === skill);
      if (originalSkill) niceToHaveMissing.push(originalSkill);
    }
  }

  // Find transferable skills
  const transferable = findTransferableSkills(
    extractedSkills,
    criticalMissing
  );

  // Calculate match percentage
  const matchPercentage =
    required.length > 0 ? (matched.length / required.length) * 100 : 100;

  return {
    matched,
    critical_missing: criticalMissing,
    nice_to_have_missing: niceToHaveMissing,
    transferable,
    match_percentage: Math.round(matchPercentage * 10) / 10,
  };
}

// ==================== Tools Gap Detection ====================

/**
 * Detect gap between resume tools and job requirements
 */
export function detectToolsGap(
  extractedTools: string[],
  requiredTools: string[],
  preferredTools: string[] = []
): ToolsGap {
  // Normalize all tools
  const resumeTools = new Set(normalizeTools(extractedTools).map(t => t.toLowerCase()));
  const required = normalizeTools(requiredTools).map(t => t.toLowerCase());
  const preferred = normalizeTools(preferredTools).map(t => t.toLowerCase());

  // Find matches
  const matched: string[] = [];
  const criticalMissing: string[] = [];
  const niceToHaveMissing: string[] = [];

  // Check required tools
  for (const tool of required) {
    if (resumeTools.has(tool)) {
      const originalTool = requiredTools.find(t => t.toLowerCase() === tool);
      if (originalTool) matched.push(originalTool);
    } else {
      const originalTool = requiredTools.find(t => t.toLowerCase() === tool);
      if (originalTool) criticalMissing.push(originalTool);
    }
  }

  // Check preferred tools
  for (const tool of preferred) {
    if (!resumeTools.has(tool)) {
      const originalTool = preferredTools.find(t => t.toLowerCase() === tool);
      if (originalTool) niceToHaveMissing.push(originalTool);
    }
  }

  // Calculate match percentage
  const matchPercentage =
    required.length > 0 ? (matched.length / required.length) * 100 : 100;

  return {
    matched,
    critical_missing: criticalMissing,
    nice_to_have_missing: niceToHaveMissing,
    match_percentage: Math.round(matchPercentage * 10) / 10,
  };
}

// ==================== Experience Gap Detection ====================

/**
 * Detect missing experience types
 */
export function detectExperienceGap(
  parsed: ParsedResume,
  requiredExperienceTypes: string[]
): ExperienceGap {
  // Extract experience types from all bullets
  const allBullets = parsed.experiences.flatMap(exp => exp.bullets);
  const detectedTypes = extractExperienceTypes(allBullets);

  // Normalize required types
  const requiredNormalized = requiredExperienceTypes.map(t => t.toLowerCase());
  const detectedNormalized = new Set(detectedTypes.map(t => t.toLowerCase()));

  // Find matches and gaps
  const matchedTypes: string[] = [];
  const missingTypes: string[] = [];

  for (const required of requiredNormalized) {
    if (
      detectedNormalized.has(required) ||
      Array.from(detectedNormalized).some(d => d.includes(required) || required.includes(d))
    ) {
      matchedTypes.push(required);
    } else {
      missingTypes.push(required);
    }
  }

  // Calculate coverage
  const coverageScore =
    requiredNormalized.length > 0
      ? (matchedTypes.length / requiredNormalized.length) * 100
      : 100;

  return {
    matched_types: matchedTypes,
    missing_types: missingTypes,
    coverage_score: Math.round(coverageScore * 10) / 10,
  };
}

/**
 * Extract experience types from bullet points
 */
export function extractExperienceTypes(bullets: string[]): string[] {
  const types = new Set<string>();

  for (const bullet of bullets) {
    const bulletLower = bullet.toLowerCase();

    for (const [experienceType, keywords] of Object.entries(EXPERIENCE_TYPE_PATTERNS)) {
      if (keywords.some(kw => bulletLower.includes(kw))) {
        types.add(experienceType);
      }
    }
  }

  return Array.from(types);
}

// ==================== Seniority Gap Detection ====================

/**
 * Detect seniority alignment between resume and role
 */
export function detectSeniorityGap(
  parsed: ParsedResume,
  roleExpected?: SeniorityLevel,
  minYearsRequired?: number
): SeniorityGap {
  // Estimate user's seniority level
  const userLevel = estimateUserSeniority(parsed);

  // Default role expectation if not provided
  const expectedLevel = roleExpected || SeniorityLevel.MID;

  // Determine alignment
  const hierarchy: Record<SeniorityLevel, number> = {
    [SeniorityLevel.ENTRY]: 1,
    [SeniorityLevel.MID]: 2,
    [SeniorityLevel.SENIOR]: 3,
    [SeniorityLevel.LEAD]: 4,
  };

  const userRank = hierarchy[userLevel];
  const roleRank = hierarchy[expectedLevel];

  let alignment: SeniorityAlignment;
  let gapYears: number | undefined;

  if (userRank < roleRank) {
    alignment = 'underqualified';
    gapYears = estimateYearsGap(userLevel, expectedLevel);
  } else if (userRank > roleRank) {
    alignment = 'overqualified';
  } else {
    alignment = 'aligned';
  }

  // Also check years if provided
  if (minYearsRequired && alignment === 'aligned') {
    const estimatedYears = estimateTotalYearsExperience(parsed);
    if (estimatedYears < minYearsRequired) {
      alignment = 'underqualified';
      gapYears = minYearsRequired - estimatedYears;
    }
  }

  return {
    user_level: userLevel,
    role_expected: expectedLevel,
    alignment,
    gap_years: gapYears,
  };
}

/**
 * Estimate user's seniority level from resume
 */
function estimateUserSeniority(
  parsed: ParsedResume
): SeniorityLevel {
  // Check most recent job title
  if (parsed.experiences.length > 0) {
    const recentTitle = parsed.experiences[0].title;
    const titleSeniority = inferSeniorityFromTitle(recentTitle);
    
    // Also factor in total experience
    const totalYears = estimateTotalYearsExperience(parsed);
    
    // Combine title-based and years-based estimation
    if (titleSeniority === SeniorityLevel.LEAD || totalYears >= 10) {
      return SeniorityLevel.LEAD;
    }
    if (titleSeniority === SeniorityLevel.SENIOR || totalYears >= 5) {
      return SeniorityLevel.SENIOR;
    }
    if (totalYears >= 2) {
      return SeniorityLevel.MID;
    }
  }

  return SeniorityLevel.ENTRY;
}

/**
 * Estimate total years of experience from resume
 */
function estimateTotalYearsExperience(parsed: ParsedResume): number {
  let totalMonths = 0;

  for (const exp of parsed.experiences) {
    totalMonths += exp.duration_months || 0;
  }

  // If duration wasn't calculated, estimate from number of positions
  if (totalMonths === 0 && parsed.experiences.length > 0) {
    // Assume average 2.5 years per position
    totalMonths = parsed.experiences.length * 30;
  }

  return Math.round(totalMonths / 12);
}

// ==================== Industry Gap Detection ====================

/**
 * Detect industry/domain alignment
 */
export function detectIndustryGap(
  extractedIndustries: string[],
  domainKeywords: string[]
): IndustryGap {
  // If no domain keywords specified, assume full match
  if (domainKeywords.length === 0) {
    return {
      keywords_matched: extractedIndustries,
      keywords_missing: [],
      match_percentage: 100,
    };
  }

  const extractedLower = new Set(extractedIndustries.map(i => i.toLowerCase()));
  const keywordsLower = domainKeywords.map(k => k.toLowerCase());

  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of keywordsLower) {
    // Check if any extracted industry contains this keyword
    const found = Array.from(extractedLower).some(
      industry => industry.includes(keyword) || keyword.includes(industry)
    );

    if (found) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const matchPercentage =
    keywordsLower.length > 0 ? (matched.length / keywordsLower.length) * 100 : 100;

  return {
    keywords_matched: matched,
    keywords_missing: missing,
    match_percentage: Math.round(matchPercentage * 10) / 10,
  };
}

// ==================== Gap Summary ====================

/**
 * Get a summary of all critical gaps
 */
export function summarizeGaps(gaps: GapAnalysis): {
  totalCriticalGaps: number;
  criticalAreas: string[];
  overallMatchPercentage: number;
} {
  const criticalAreas: string[] = [];
  let totalCriticalGaps = 0;

  // Skills gaps
  if (gaps.skills.critical_missing.length > 0) {
    criticalAreas.push('skills');
    totalCriticalGaps += gaps.skills.critical_missing.length;
  }

  // Tools gaps
  if (gaps.tools.critical_missing.length > 0) {
    criticalAreas.push('tools');
    totalCriticalGaps += gaps.tools.critical_missing.length;
  }

  // Experience gaps
  if (gaps.experience.missing_types.length > 0) {
    criticalAreas.push('experience');
    totalCriticalGaps += gaps.experience.missing_types.length;
  }

  // Seniority gap
  if (gaps.seniority.alignment === 'underqualified') {
    criticalAreas.push('seniority');
    totalCriticalGaps += 1;
  }

  // Industry gap
  if (gaps.industry.match_percentage < 50) {
    criticalAreas.push('industry');
    totalCriticalGaps += gaps.industry.keywords_missing.length;
  }

  // Calculate overall match percentage (weighted average)
  const overallMatchPercentage = Math.round(
    (gaps.skills.match_percentage * 0.4 +
      gaps.tools.match_percentage * 0.2 +
      gaps.experience.coverage_score * 0.2 +
      (gaps.seniority.alignment === 'aligned' ? 100 : 60) * 0.1 +
      gaps.industry.match_percentage * 0.1)
  );

  return {
    totalCriticalGaps,
    criticalAreas,
    overallMatchPercentage,
  };
}

// ==================== Generic Gap Detection ====================

/**
 * Detect gaps without job requirements (for generic evaluation)
 * Identifies general resume weaknesses
 */
export function detectGenericGaps(
  parsed: ParsedResume,
  extracted: ExtractedEntities
): {
  missing_skills: boolean;
  missing_metrics: boolean;
  weak_action_verbs: boolean;
  generic_descriptions: boolean;
  poor_formatting: boolean;
  no_education: boolean;
  spelling_errors: boolean;
} {
  // Check for missing/few skills
  const missingSkills = extracted.skills.length < 5;

  // Check for missing metrics in bullets
  const allBullets = parsed.experiences.flatMap(exp => exp.bullets);
  const metricsPattern = /\d+%|\$[\d,]+|[\d,]+\s*(users|customers|sales|increase|decrease)/i;
  const bulletsWithMetrics = allBullets.filter(b => metricsPattern.test(b));
  const missingMetrics = bulletsWithMetrics.length < allBullets.length * 0.3;

  // Check for weak action verbs
  const bulletsWithWeakVerbs = allBullets.filter(b => 
    WEAK_ACTION_VERBS.some(v => b.toLowerCase().startsWith(v))
  );
  const weakActionVerbs = bulletsWithWeakVerbs.length > allBullets.length * 0.5;

  // Check for generic descriptions
  const genericBullets = allBullets.filter(b =>
    GENERIC_PHRASES.some(p => b.toLowerCase().includes(p))
  );
  const genericDescriptions = genericBullets.length > allBullets.length * 0.4;

  // Check for poor formatting (limited ability without original document)
  const poorFormatting = parsed.metadata.parse_quality === 'low';

  // Check for missing education
  const noEducation = parsed.education.length === 0;

  // Check for potential spelling errors (very basic)
  // In production, use a proper spell checker
  const spellingErrors = false; // Placeholder

  return {
    missing_skills: missingSkills,
    missing_metrics: missingMetrics,
    weak_action_verbs: weakActionVerbs,
    generic_descriptions: genericDescriptions,
    poor_formatting: poorFormatting,
    no_education: noEducation,
    spelling_errors: spellingErrors,
  };
}

// ==================== Export ====================

export { extractExperienceTypes as extractExperienceTypesFromBullets };
