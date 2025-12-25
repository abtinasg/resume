/**
 * Layer 1 - Evaluation Engine
 * Learning & Adaptivity Scoring Module
 *
 * Evaluates learning and growth signals:
 * - Skill recency (recent technologies)
 * - Career progression (promotions, increased responsibility)
 * - Certifications and courses
 * - Stagnation detection
 */

import type { ParsedResume, DimensionScore, ExtractedEntities } from '../types';
import { LEARNING_SIGNAL_PATTERNS } from '../config/weights';
import { RECENT_TECH_SKILLS, LEGACY_TECH_ONLY } from '../config/skills';

// ==================== Main Scoring Function ====================

/**
 * Calculate learning & adaptivity score (0-100)
 */
export function calculateLearningAdaptivityScore(
  parsed: ParsedResume,
  extracted: ExtractedEntities
): DimensionScore {
  const breakdown: Record<string, number> = {};
  const issues: string[] = [];

  // 1. Skill recency score (0-30)
  const recencyScore = calculateSkillRecency(extracted, issues);
  breakdown.skill_recency = recencyScore;

  // 2. Progression score (0-30)
  const progressionScore = calculateProgression(parsed, issues);
  breakdown.progression = progressionScore;

  // 3. Certification/learning score (0-25)
  const learningScore = calculateLearningSignals(parsed, issues);
  breakdown.learning_signals = learningScore;

  // 4. Stagnation detection (0-15 penalty applied)
  const stagnationPenalty = detectStagnation(parsed, extracted, issues);
  breakdown.stagnation_penalty = stagnationPenalty;

  // Calculate total score
  let totalScore = recencyScore + progressionScore + learningScore;
  
  // Apply stagnation penalty
  totalScore = Math.max(0, totalScore - stagnationPenalty);
  
  // Normalize to 100
  const normalizedScore = Math.min(100, (totalScore / 85) * 100);

  return {
    score: Math.round(normalizedScore),
    breakdown,
    issues: issues.length > 0 ? issues : undefined,
  };
}

// ==================== Skill Recency ====================

/**
 * Calculate score based on how recent/modern skills are
 */
function calculateSkillRecency(
  extracted: ExtractedEntities,
  issues: string[]
): number {
  const allSkills = new Set([
    ...extracted.skills.map(s => s.toLowerCase()),
    ...extracted.tools.map(t => t.toLowerCase()),
  ]);

  // Count modern skills
  let modernSkillCount = 0;
  for (const recentSkill of RECENT_TECH_SKILLS) {
    if (allSkills.has(recentSkill.toLowerCase())) {
      modernSkillCount++;
    }
  }

  // Calculate ratio of modern skills
  const modernRatio = allSkills.size > 0 
    ? modernSkillCount / allSkills.size 
    : 0;

  // Score based on presence of modern technologies
  let score: number;
  if (modernSkillCount >= 8 || modernRatio >= 0.4) {
    score = 30; // Full marks
  } else if (modernSkillCount >= 5 || modernRatio >= 0.3) {
    score = 25;
  } else if (modernSkillCount >= 3 || modernRatio >= 0.2) {
    score = 18;
  } else if (modernSkillCount >= 1) {
    score = 12;
    issues.push('limited_modern_skills');
  } else {
    score = 5;
    issues.push('no_modern_skills');
  }

  return score;
}

// ==================== Career Progression ====================

/**
 * Calculate score based on career progression signals
 */
function calculateProgression(
  parsed: ParsedResume,
  issues: string[]
): number {
  const signals = {
    titleProgression: 0,
    sameBossProgression: 0,
    scopeExpansion: 0,
    promotionMentions: 0,
  };

  // Analyze title progression
  if (parsed.experiences.length >= 2) {
    const titleProgression = analyzeExperienceProgression(parsed.experiences);
    signals.titleProgression = titleProgression.score;
    
    if (titleProgression.hasProgression) {
      signals.sameBossProgression = titleProgression.sameCompanyPromotion ? 8 : 0;
    }
  }

  // Look for promotion mentions in bullets
  for (const exp of parsed.experiences) {
    for (const bullet of exp.bullets) {
      if (LEARNING_SIGNAL_PATTERNS.progression.some(p => p.test(bullet))) {
        signals.promotionMentions++;
      }
    }
  }

  // Check for scope expansion in recent roles
  signals.scopeExpansion = detectScopeExpansion(parsed);

  // Calculate score
  let score = 0;

  // Title progression (0-12)
  score += Math.min(12, signals.titleProgression);

  // Same company promotion (0-8)
  score += signals.sameBossProgression;

  // Promotion mentions (0-5)
  score += Math.min(5, signals.promotionMentions * 2);

  // Scope expansion (0-5)
  score += Math.min(5, signals.scopeExpansion);

  // Cap at 30
  score = Math.min(30, score);

  // Check for issues
  if (parsed.experiences.length >= 3 && score < 10) {
    issues.push('no_clear_progression');
  }

  return score;
}

interface ProgressionAnalysis {
  hasProgression: boolean;
  sameCompanyPromotion: boolean;
  score: number;
}

/**
 * Analyze career progression from experience entries
 */
function analyzeExperienceProgression(
  experiences: ParsedResume['experiences']
): ProgressionAnalysis {
  const seniorityLevels: Record<string, number> = {
    'intern': 1,
    'junior': 2,
    'associate': 2,
    'entry': 2,
    'mid': 3,
    'senior': 4,
    'lead': 5,
    'principal': 5,
    'staff': 5,
    'manager': 6,
    'director': 7,
    'vp': 8,
    'head': 8,
    'chief': 9,
  };

  let hasProgression = false;
  let sameCompanyPromotion = false;
  let score = 0;

  // Compare positions (most recent first)
  for (let i = 0; i < experiences.length - 1; i++) {
    const currentTitle = experiences[i].title.toLowerCase();
    const previousTitle = experiences[i + 1].title.toLowerCase();
    const sameCompany = experiences[i].company === experiences[i + 1].company;

    // Determine seniority levels
    let currentLevel = 3; // Default to mid
    let previousLevel = 3;

    for (const [keyword, level] of Object.entries(seniorityLevels)) {
      if (currentTitle.includes(keyword)) {
        currentLevel = Math.max(currentLevel, level);
      }
      if (previousTitle.includes(keyword)) {
        previousLevel = Math.max(previousLevel, level);
      }
    }

    // Check for progression
    if (currentLevel > previousLevel) {
      hasProgression = true;
      score += 4;
      
      if (sameCompany) {
        sameCompanyPromotion = true;
      }
    }
  }

  return { hasProgression, sameCompanyPromotion, score };
}

/**
 * Detect scope expansion in job responsibilities
 */
function detectScopeExpansion(parsed: ParsedResume): number {
  if (parsed.experiences.length < 2) return 0;

  const scopePatterns = [
    /team\s+of\s+(\d+)/i,
    /managed\s+(\d+)/i,
    /led\s+(\d+)/i,
    /\$(\d+)\s*(million|m|k)/i,
    /(\d+)\+?\s*engineers?/i,
  ];

  const extractNumbers = (text: string): number[] => {
    const numbers: number[] = [];
    for (const pattern of scopePatterns) {
      const match = text.match(pattern);
      if (match) {
        let num = parseInt(match[1]);
        if (match[2]?.toLowerCase() === 'million' || match[2]?.toLowerCase() === 'm') {
          num *= 1000000;
        } else if (match[2]?.toLowerCase() === 'k') {
          num *= 1000;
        }
        numbers.push(num);
      }
    }
    return numbers;
  };

  // Compare recent vs older positions
  const recentBullets = parsed.experiences[0].bullets.join(' ');
  const olderBullets = parsed.experiences
    .slice(1)
    .flatMap(e => e.bullets)
    .join(' ');

  const recentNumbers = extractNumbers(recentBullets);
  const olderNumbers = extractNumbers(olderBullets);

  // Simple comparison - if recent numbers are larger, there's expansion
  const recentMax = Math.max(0, ...recentNumbers);
  const olderMax = Math.max(0, ...olderNumbers);

  if (recentMax > olderMax * 1.5 && recentMax > 0) {
    return 5;
  } else if (recentMax > olderMax) {
    return 3;
  }

  return 0;
}

// ==================== Learning Signals ====================

/**
 * Calculate score from certifications and courses
 */
function calculateLearningSignals(
  parsed: ParsedResume,
  issues: string[]
): number {
  let score = 0;

  // Certifications (0-15)
  const certCount = parsed.certifications?.length || 0;
  if (certCount >= 3) {
    score += 15;
  } else if (certCount >= 2) {
    score += 12;
  } else if (certCount >= 1) {
    score += 8;
  }

  // Courses (0-5)
  const courseCount = parsed.courses?.length || 0;
  if (courseCount >= 3) {
    score += 5;
  } else if (courseCount >= 1) {
    score += 3;
  }

  // Look for learning signals in experience bullets
  let learningMentions = 0;
  for (const exp of parsed.experiences) {
    for (const bullet of exp.bullets) {
      if (LEARNING_SIGNAL_PATTERNS.certifications.some(p => p.test(bullet))) {
        learningMentions++;
      }
      if (LEARNING_SIGNAL_PATTERNS.courses.some(p => p.test(bullet))) {
        learningMentions++;
      }
      if (LEARNING_SIGNAL_PATTERNS.newSkills.some(p => p.test(bullet))) {
        learningMentions++;
      }
    }
  }

  // Learning mentions (0-5)
  score += Math.min(5, learningMentions);

  // Cap at 25
  score = Math.min(25, score);

  // Check for issues
  if (certCount === 0 && courseCount === 0 && learningMentions === 0) {
    issues.push('no_learning_signals');
  }

  return score;
}

// ==================== Stagnation Detection ====================

/**
 * Detect signs of career stagnation
 */
function detectStagnation(
  parsed: ParsedResume,
  extracted: ExtractedEntities,
  issues: string[]
): number {
  let penalty = 0;

  // Check for legacy-only tech stack
  const allSkills = new Set([
    ...extracted.skills.map(s => s.toLowerCase()),
    ...extracted.tools.map(t => t.toLowerCase()),
  ]);

  const hasOnlyLegacy = LEGACY_TECH_ONLY.some(legacy => 
    allSkills.has(legacy.toLowerCase())
  );
  
  const hasNoModern = !RECENT_TECH_SKILLS.some(modern => 
    allSkills.has(modern.toLowerCase())
  );

  if (hasOnlyLegacy && hasNoModern) {
    penalty += 10;
    issues.push('legacy_tech_only');
  }

  // Check for same role for too long
  if (parsed.experiences.length > 0) {
    const currentRole = parsed.experiences[0];
    if (currentRole.duration_months && currentRole.duration_months > 84) {
      // 7+ years in same role
      penalty += 5;
      issues.push('same_role_too_long');
    }
  }

  // Check for no certifications in 5+ years of experience
  const totalYears = parsed.experiences.reduce(
    (sum, exp) => sum + (exp.duration_months || 0),
    0
  ) / 12;

  if (totalYears >= 5 && !parsed.certifications?.length && !parsed.courses?.length) {
    // No formal learning in 5+ years
    penalty += 3;
    issues.push('no_recent_learning');
  }

  // Cap penalty at 15
  return Math.min(15, penalty);
}

// ==================== Export ====================

export { calculateLearningAdaptivityScore as default };
