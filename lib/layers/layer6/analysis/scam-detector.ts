/**
 * Layer 6 - Job Discovery & Matching Module
 * Scam Detector
 *
 * Detects potential scam or low-quality job postings.
 */

import type { ParsedJob, ScamDetectionResult, ScamRiskLevel } from '../types';
import { getScamDetectionConfig } from '../config';

// ==================== Red Flag Detection ====================

/**
 * Check if company is unknown/suspicious
 */
function checkUnknownCompany(company: string): { flag: boolean; reason: string } {
  const suspicious = (
    !company ||
    company === 'Unknown Company' ||
    company.length < 3 ||
    /^[a-z]+$/i.test(company) && company.length < 5
  );
  
  return {
    flag: suspicious,
    reason: 'Company name is missing or appears suspicious',
  };
}

/**
 * Check if job description is too short
 */
function checkShortJD(rawText: string, minLength: number): { flag: boolean; reason: string } {
  const flag = rawText.length < minLength;
  return {
    flag,
    reason: `Job description is very short (${rawText.length} chars, minimum expected: ${minLength})`,
  };
}

/**
 * Check for unrealistic salary
 */
function checkUnrealisticSalary(
  salaryMax: number | undefined,
  threshold: number
): { flag: boolean; reason: string } {
  if (!salaryMax) {
    return { flag: false, reason: '' };
  }
  
  const flag = salaryMax > threshold;
  return {
    flag,
    reason: `Salary ($${salaryMax.toLocaleString()}) seems unrealistically high`,
  };
}

/**
 * Check for suspicious keywords
 */
function checkSuspiciousKeywords(
  rawText: string,
  keywords: string[]
): { flag: boolean; reasons: string[] } {
  const textLower = rawText.toLowerCase();
  const foundKeywords: string[] = [];
  
  for (const keyword of keywords) {
    if (textLower.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }
  
  return {
    flag: foundKeywords.length > 0,
    reasons: foundKeywords.map(kw => `Contains suspicious phrase: "${kw}"`),
  };
}

/**
 * Check if there are no specific requirements
 */
function checkNoRequirements(
  requiredSkillsCount: number,
  requiredToolsCount: number
): { flag: boolean; reason: string } {
  const flag = requiredSkillsCount === 0 && requiredToolsCount === 0;
  return {
    flag,
    reason: 'No specific skills or tools requirements listed',
  };
}

/**
 * Check for vague job title
 */
function checkVagueTitle(title: string): { flag: boolean; reason: string } {
  const vaguePatterns = [
    /^work from home/i,
    /^make money/i,
    /^earn \$/i,
    /^hiring now/i,
    /^urgent/i,
    /^opportunity$/i,
    /^position$/i,
  ];
  
  const flag = vaguePatterns.some(p => p.test(title)) || title.length < 5;
  return {
    flag,
    reason: 'Job title is vague or suspicious',
  };
}

/**
 * Check for excessive punctuation/formatting
 */
function checkExcessivePunctuation(rawText: string): { flag: boolean; reason: string } {
  const exclamationCount = (rawText.match(/!/g) || []).length;
  const dollarCount = (rawText.match(/\$/g) || []).length;
  const emojiCount = (rawText.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  
  const flag = exclamationCount > 10 || dollarCount > 5 || emojiCount > 5;
  return {
    flag,
    reason: 'Excessive use of exclamation marks, dollar signs, or emojis',
  };
}

/**
 * Check for urgency pressure
 */
function checkUrgencyPressure(rawText: string): { flag: boolean; reason: string } {
  const urgencyPatterns = [
    /apply\s+(?:now|immediately|today)/i,
    /limited\s+(?:time|spots|positions)/i,
    /don't\s+miss\s+(?:this|out)/i,
    /act\s+(?:fast|now|quickly)/i,
    /opportunity\s+(?:won't\s+last|expires)/i,
  ];
  
  const matches = urgencyPatterns.filter(p => p.test(rawText));
  const flag = matches.length >= 2;
  
  return {
    flag,
    reason: 'Excessive urgency pressure in job posting',
  };
}

/**
 * Check for personal info requests
 */
function checkPersonalInfoRequest(rawText: string): { flag: boolean; reason: string } {
  const patterns = [
    /social\s+security/i,
    /bank\s+account/i,
    /credit\s+card/i,
    /wire\s+transfer/i,
    /western\s+union/i,
    /pay\s+(?:for|fee)/i,
    /upfront\s+(?:payment|fee)/i,
    /training\s+fee/i,
  ];
  
  const flag = patterns.some(p => p.test(rawText));
  return {
    flag,
    reason: 'Requests sensitive personal/financial information',
  };
}

// ==================== Main Detection Function ====================

/**
 * Detect scam risk for a parsed job
 */
export function detectScamRisk(parsedJob: ParsedJob): ScamDetectionResult {
  const config = getScamDetectionConfig();
  const { red_flags: redFlagConfig } = config;
  
  const redFlags: string[] = [];
  let totalWeight = 0;
  
  // Check 1: Unknown company
  const companyCheck = checkUnknownCompany(parsedJob.company);
  if (companyCheck.flag) {
    redFlags.push(companyCheck.reason);
    totalWeight += redFlagConfig.no_company_weight;
  }
  
  // Check 2: Short JD
  const shortJDCheck = checkShortJD(parsedJob.raw_text, redFlagConfig.min_jd_length);
  if (shortJDCheck.flag) {
    redFlags.push(shortJDCheck.reason);
    totalWeight += redFlagConfig.short_jd_weight;
  }
  
  // Check 3: Unrealistic salary
  const salaryCheck = checkUnrealisticSalary(
    parsedJob.salary_range?.max,
    redFlagConfig.unrealistic_salary_threshold
  );
  if (salaryCheck.flag) {
    redFlags.push(salaryCheck.reason);
    totalWeight += redFlagConfig.unrealistic_salary_weight;
  }
  
  // Check 4: Suspicious keywords
  const keywordCheck = checkSuspiciousKeywords(
    parsedJob.raw_text,
    redFlagConfig.suspicious_keywords
  );
  if (keywordCheck.flag) {
    redFlags.push(...keywordCheck.reasons);
    totalWeight += redFlagConfig.suspicious_keywords_weight * Math.min(keywordCheck.reasons.length, 3);
  }
  
  // Check 5: No requirements
  const requirementsCheck = checkNoRequirements(
    parsedJob.requirements.required_skills.length,
    parsedJob.requirements.required_tools.length
  );
  if (requirementsCheck.flag) {
    redFlags.push(requirementsCheck.reason);
    totalWeight += redFlagConfig.no_requirements_weight;
  }
  
  // Check 6: Vague title
  const titleCheck = checkVagueTitle(parsedJob.job_title);
  if (titleCheck.flag) {
    redFlags.push(titleCheck.reason);
    totalWeight += 1;
  }
  
  // Check 7: Excessive punctuation
  const punctuationCheck = checkExcessivePunctuation(parsedJob.raw_text);
  if (punctuationCheck.flag) {
    redFlags.push(punctuationCheck.reason);
    totalWeight += 1;
  }
  
  // Check 8: Urgency pressure
  const urgencyCheck = checkUrgencyPressure(parsedJob.raw_text);
  if (urgencyCheck.flag) {
    redFlags.push(urgencyCheck.reason);
    totalWeight += 1;
  }
  
  // Check 9: Personal info request
  const personalInfoCheck = checkPersonalInfoRequest(parsedJob.raw_text);
  if (personalInfoCheck.flag) {
    redFlags.push(personalInfoCheck.reason);
    totalWeight += 3; // High weight - major red flag
  }
  
  // Determine risk level
  let risk_level: ScamRiskLevel;
  
  if (totalWeight >= redFlagConfig.scam_threshold + 2) {
    risk_level = 'high';
  } else if (totalWeight >= redFlagConfig.scam_threshold) {
    risk_level = 'medium';
  } else if (redFlags.length > 0) {
    risk_level = 'low';
  } else {
    risk_level = 'none';
  }
  
  return {
    risk_level,
    red_flags: redFlags,
    red_flag_count: redFlags.length,
  };
}

/**
 * Check if a job should be flagged as scam
 */
export function isScamJob(parsedJob: ParsedJob): boolean {
  const result = detectScamRisk(parsedJob);
  return result.risk_level === 'high';
}
