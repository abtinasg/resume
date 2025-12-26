/**
 * Layer 6 - Job Discovery & Matching Module
 * Main Job Description Parser
 *
 * Parses job descriptions into structured format for analysis.
 */

import { v4 as uuidv4 } from 'crypto';
import type { 
  ParsedJob, 
  JobPasteRequest, 
  JobMetadata, 
  ParseQuality 
} from '../types';
import { getParsingConfig } from '../config';
import { extractMetadata } from './metadata-extractor';
import { 
  extractRequirements, 
  extractResponsibilities, 
  extractBenefits 
} from './requirements-extractor';
import { JobDiscoveryError, JobDiscoveryErrorCode } from '../errors';

// ==================== UUID Generation ====================

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Simple fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ==================== Parse Quality Assessment ====================

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Check if text has a requirements section
 */
function hasRequirementsSection(text: string): boolean {
  const patterns = [
    /requirements/i,
    /qualifications/i,
    /must have/i,
    /skills required/i,
    /what you.{1,20}need/i,
    /who you are/i,
  ];
  return patterns.some(p => p.test(text));
}

/**
 * Check if text has a responsibilities section
 */
function hasResponsibilitiesSection(text: string): boolean {
  const patterns = [
    /responsibilities/i,
    /what you.{1,20}do/i,
    /about the role/i,
    /job description/i,
    /duties/i,
    /your role/i,
  ];
  return patterns.some(p => p.test(text));
}

/**
 * Assess parse quality
 */
export function assessParseQuality(
  text: string,
  skillsCount: number,
  responsibilitiesCount: number
): { quality: ParseQuality; confidence: number } {
  const config = getParsingConfig();
  const wordCount = countWords(text);
  const hasReqs = hasRequirementsSection(text);
  const hasResps = hasResponsibilitiesSection(text);
  
  // High quality criteria
  if (
    wordCount >= config.quality_thresholds.high.min_words &&
    hasReqs &&
    hasResps &&
    skillsCount >= 3 &&
    responsibilitiesCount >= 3
  ) {
    return { quality: 'high', confidence: 90 };
  }
  
  // Medium quality criteria
  if (
    wordCount >= config.quality_thresholds.medium.min_words &&
    (hasReqs || skillsCount >= 2) &&
    (hasResps || responsibilitiesCount >= 2)
  ) {
    return { quality: 'medium', confidence: 70 };
  }
  
  // Low quality
  if (wordCount >= config.quality_thresholds.low.min_words) {
    return { quality: 'low', confidence: 40 };
  }
  
  return { quality: 'low', confidence: 20 };
}

// ==================== Canonical ID Generation ====================

/**
 * Normalize string for hashing
 */
function normalizeForHash(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Simple hash function (not cryptographic, just for deduplication)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Canonicalize URL for deduplication
 */
function canonicalizeUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'src', 'source', 'fbclid', 'gclid', 'li_fat_id',
    ];
    
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    
    // Normalize domain
    let hostname = parsed.hostname.replace(/^www\./, '');
    
    // Build canonical URL
    return `${parsed.protocol}//${hostname}${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

/**
 * Generate canonical job ID for deduplication
 */
export function generateCanonicalId(
  jobUrl: string | undefined,
  company: string,
  title: string,
  location: string,
  postedDate: string | undefined
): string {
  // Method 1: Use URL if available
  if (jobUrl) {
    const canonical = canonicalizeUrl(jobUrl);
    if (canonical) {
      return `url:${simpleHash(canonical)}`;
    }
  }
  
  // Method 2: Hash key fields
  const components = [
    normalizeForHash(company),
    normalizeForHash(title),
    normalizeForHash(location),
    postedDate?.slice(0, 10) || '', // Date only
  ].filter(c => c.length > 0);
  
  const key = components.join('|');
  return `hash:${simpleHash(key)}`;
}

// ==================== Main Parser ====================

/**
 * Parse job description into structured format
 */
export function parseJobDescription(
  request: JobPasteRequest
): ParsedJob {
  const config = getParsingConfig();
  const { job_description, metadata: userMetadata } = request;
  
  // Validate input
  if (!job_description || job_description.trim().length === 0) {
    throw new JobDiscoveryError(
      JobDiscoveryErrorCode.MISSING_JOB_DESCRIPTION
    );
  }
  
  const trimmedText = job_description.trim();
  
  if (trimmedText.length < config.min_length) {
    throw new JobDiscoveryError(
      JobDiscoveryErrorCode.JD_TOO_SHORT,
      { length: trimmedText.length, minLength: config.min_length }
    );
  }
  
  if (trimmedText.length > config.max_length) {
    throw new JobDiscoveryError(
      JobDiscoveryErrorCode.JD_TOO_LONG,
      { length: trimmedText.length, maxLength: config.max_length }
    );
  }
  
  // Extract metadata
  const extractedMetadata = extractMetadata(trimmedText, userMetadata);
  
  // Extract requirements
  const requirements = extractRequirements(trimmedText);
  
  // Extract responsibilities
  const responsibilities = extractResponsibilities(trimmedText);
  
  // Extract benefits
  const benefits = extractBenefits(trimmedText);
  
  // Assess parse quality
  const { quality, confidence } = assessParseQuality(
    trimmedText,
    requirements.required_skills.length,
    responsibilities.length
  );
  
  // Generate IDs
  const job_id = generateUUID();
  const canonical_id = generateCanonicalId(
    userMetadata?.job_url,
    extractedMetadata.company,
    extractedMetadata.job_title,
    extractedMetadata.location,
    extractedMetadata.posted_date
  );
  
  // Build metadata
  const jobMetadata: JobMetadata = {
    job_url: userMetadata?.job_url,
    source: userMetadata?.source || 'manual_paste',
    posted_date: extractedMetadata.posted_date,
    application_deadline: extractedMetadata.application_deadline,
    parse_quality: quality,
    parse_confidence: confidence,
    company_tier: extractedMetadata.company_tier,
    company_size: extractedMetadata.company_size,
    industry: extractedMetadata.industry,
  };
  
  const now = new Date().toISOString();
  
  return {
    job_id,
    canonical_id,
    job_title: extractedMetadata.job_title,
    company: extractedMetadata.company,
    location: extractedMetadata.location,
    raw_text: trimmedText,
    requirements,
    responsibilities,
    benefits: benefits.length > 0 ? benefits : undefined,
    work_arrangement: extractedMetadata.work_arrangement,
    salary_range: extractedMetadata.salary_range,
    metadata: jobMetadata,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Parse job description with fallback for low quality
 */
export function parseJobDescriptionWithFallback(
  request: JobPasteRequest
): ParsedJob {
  try {
    return parseJobDescription(request);
  } catch (error) {
    // If parsing fails completely, create minimal parsed job
    if (error instanceof JobDiscoveryError) {
      throw error;
    }
    
    console.error('[Layer6] Parsing failed, using fallback:', error);
    
    const trimmedText = request.job_description.trim();
    const job_id = generateUUID();
    const now = new Date().toISOString();
    
    return {
      job_id,
      canonical_id: `fallback:${simpleHash(trimmedText.slice(0, 500))}`,
      job_title: request.metadata?.job_title || 'Unknown Position',
      company: request.metadata?.company || 'Unknown Company',
      location: request.metadata?.location || 'Location Not Specified',
      raw_text: trimmedText,
      requirements: {
        required_skills: [],
        preferred_skills: [],
        required_tools: [],
        preferred_tools: [],
        seniority_expected: 'mid',
        domain_keywords: [],
        extraction_confidence: 0.1,
        extraction_method: 'regex',
      },
      responsibilities: [],
      work_arrangement: undefined,
      salary_range: undefined,
      metadata: {
        job_url: request.metadata?.job_url,
        source: request.metadata?.source || 'manual_paste',
        parse_quality: 'low',
        parse_confidence: 10,
      },
      created_at: now,
      updated_at: now,
    };
  }
}

/**
 * Check if a job is a duplicate based on canonical ID
 */
export function checkDuplicate(
  canonicalId: string,
  existingIds: string[]
): { isDuplicate: boolean; existingId?: string } {
  for (const existingId of existingIds) {
    if (existingId === canonicalId) {
      return { isDuplicate: true, existingId };
    }
  }
  return { isDuplicate: false };
}
