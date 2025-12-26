/**
 * Layer 6 - Job Discovery & Matching Module
 * Career Capital Analyzer
 *
 * Analyzes career capital value of a job opportunity.
 */

import type { ParsedJob, CareerCapital, JobRequirements } from '../types';
import {
  getCareerCapitalConfig,
  getCompanyTierScore,
  isCuttingEdgeTech,
  isTechHub,
  getLocationMultiplier,
  getSalaryBenchmark,
} from '../config';

// ==================== Brand Value ====================

/**
 * Calculate brand value score (0-100)
 */
export function calculateBrandValue(company: string): number {
  return getCompanyTierScore(company);
}

/**
 * Get brand value interpretation
 */
export function interpretBrandScore(score: number): string {
  if (score >= 90) {
    return 'Top-tier company - excellent for career branding';
  }
  if (score >= 75) {
    return 'Well-known company - good resume value';
  }
  if (score >= 55) {
    return 'Established company - solid foundation';
  }
  if (score >= 40) {
    return 'Startup/lesser-known - build your own brand';
  }
  return 'Unknown company - verify legitimacy';
}

// ==================== Skill Growth ====================

/**
 * Calculate skill growth potential score (0-100)
 */
export function calculateSkillGrowthPotential(
  requirements: JobRequirements,
  currentSkills: string[]
): number {
  const currentSkillsLower = new Set(
    currentSkills.map(s => s.toLowerCase())
  );
  
  // Count new skills user would learn
  const allRequiredSkills = [
    ...requirements.required_skills.map(s => s.value),
    ...requirements.required_tools.map(t => t.value),
  ];
  
  let newSkillsCount = 0;
  let cuttingEdgeCount = 0;
  
  for (const skill of allRequiredSkills) {
    const skillLower = skill.toLowerCase();
    
    if (!currentSkillsLower.has(skillLower)) {
      newSkillsCount++;
    }
    
    if (isCuttingEdgeTech(skill)) {
      cuttingEdgeCount++;
    }
  }
  
  // Score based on learning opportunity
  let score = 30; // Base score
  
  // New skills bonus (up to 40 points)
  if (newSkillsCount >= 5) {
    score += 40;
  } else if (newSkillsCount >= 3) {
    score += 30;
  } else if (newSkillsCount >= 1) {
    score += 20;
  }
  
  // Cutting-edge tech bonus (up to 30 points)
  if (cuttingEdgeCount >= 3) {
    score += 30;
  } else if (cuttingEdgeCount >= 2) {
    score += 20;
  } else if (cuttingEdgeCount >= 1) {
    score += 10;
  }
  
  return Math.min(100, score);
}

/**
 * Get skill growth interpretation
 */
export function interpretSkillGrowth(score: number): string {
  if (score >= 80) {
    return 'High growth - many new skills and cutting-edge tech';
  }
  if (score >= 60) {
    return 'Good growth - solid learning opportunities';
  }
  if (score >= 40) {
    return 'Moderate growth - some new skills';
  }
  return 'Limited growth - mostly existing skills';
}

// ==================== Network Potential ====================

/**
 * Calculate network potential score (0-100)
 */
export function calculateNetworkPotential(
  location: string,
  companySize: string | undefined,
  workArrangement: string | undefined
): number {
  let score = 50; // Base score
  
  // Tech hub location bonus
  if (isTechHub(location)) {
    score += 15;
  }
  
  // Company size matters for networking
  if (companySize) {
    if (companySize.includes('1000') || companySize.includes('large')) {
      score += 20;
    } else if (companySize.includes('100') || companySize.includes('medium')) {
      score += 10;
    }
  } else {
    // Default bonus if company is known (tier 1 or 2 likely large)
    score += 5;
  }
  
  // Remote penalty for networking
  if (workArrangement === 'remote') {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get network interpretation
 */
export function interpretNetwork(score: number): string {
  if (score >= 75) {
    return 'Excellent networking - large company in tech hub';
  }
  if (score >= 55) {
    return 'Good networking - solid opportunities';
  }
  if (score >= 35) {
    return 'Moderate networking - some opportunities';
  }
  return 'Limited networking - remote/small company';
}

// ==================== Compensation ====================

/**
 * Calculate compensation competitiveness score (0-100)
 */
export function calculateCompCompetitiveness(
  salaryMax: number | undefined,
  yearsExperience: number,
  location: string
): number {
  if (!salaryMax) {
    return 50; // Unknown
  }
  
  // Get benchmark for experience level
  const benchmark = getSalaryBenchmark(yearsExperience);
  
  // Adjust for location
  const locationMultiplier = getLocationMultiplier(location);
  const adjustedBenchmark = benchmark * locationMultiplier;
  
  // Calculate ratio
  const ratio = salaryMax / adjustedBenchmark;
  
  // Score based on ratio
  if (ratio >= 1.3) {
    return 95; // Excellent - 30%+ above market
  }
  if (ratio >= 1.1) {
    return 80; // Good - 10-30% above market
  }
  if (ratio >= 0.9) {
    return 60; // Fair - within 10% of market
  }
  if (ratio >= 0.75) {
    return 40; // Below market
  }
  return 25; // Significantly below market
}

/**
 * Get compensation interpretation
 */
export function interpretComp(score: number): string {
  if (score >= 85) {
    return 'Excellent comp - above market rate';
  }
  if (score >= 70) {
    return 'Good comp - competitive offer';
  }
  if (score >= 50) {
    return 'Fair comp - at market rate';
  }
  if (score >= 35) {
    return 'Below market - negotiate or consider';
  }
  return 'Low comp - significant gap';
}

// ==================== Main Analysis Function ====================

/**
 * Calculate complete career capital analysis
 */
export function calculateCareerCapital(
  parsedJob: ParsedJob,
  currentSkills: string[] = [],
  yearsExperience: number = 5
): CareerCapital {
  const config = getCareerCapitalConfig();
  
  // Calculate each component
  const brand_score = calculateBrandValue(parsedJob.company);
  
  const skill_growth_score = calculateSkillGrowthPotential(
    parsedJob.requirements,
    currentSkills
  );
  
  const network_score = calculateNetworkPotential(
    parsedJob.location,
    parsedJob.metadata.company_size,
    parsedJob.work_arrangement
  );
  
  const comp_score = calculateCompCompetitiveness(
    parsedJob.salary_range?.max,
    yearsExperience,
    parsedJob.location
  );
  
  // Calculate weighted total
  const totalScore = 
    brand_score * config.weights.brand +
    skill_growth_score * config.weights.skill_growth +
    network_score * config.weights.network +
    comp_score * config.weights.compensation;
  
  return {
    score: Math.round(totalScore),
    brand_score: Math.round(brand_score),
    skill_growth_score: Math.round(skill_growth_score),
    network_score: Math.round(network_score),
    comp_score: Math.round(comp_score),
    breakdown: {
      brand: interpretBrandScore(brand_score),
      skill_growth: interpretSkillGrowth(skill_growth_score),
      network: interpretNetwork(network_score),
      comp: interpretComp(comp_score),
    },
  };
}
