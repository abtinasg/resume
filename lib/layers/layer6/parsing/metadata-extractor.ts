/**
 * Layer 6 - Job Discovery & Matching Module
 * Metadata Extractor
 *
 * Extracts job metadata: title, company, location, work arrangement, salary, etc.
 */

import type { 
  SalaryRange, 
  WorkArrangement, 
  JobMetadataInput,
  ParseQuality 
} from '../types';
import { getParsingConfig, isTechHub } from '../config';

// ==================== Type Definitions ====================

/**
 * Extracted metadata result
 */
export interface ExtractedMetadata {
  job_title: string;
  company: string;
  location: string;
  work_arrangement: WorkArrangement | undefined;
  salary_range: SalaryRange | undefined;
  posted_date: string | undefined;
  application_deadline: string | undefined;
  company_tier: 'top_tier' | 'unicorn' | 'established' | 'startup' | 'unknown';
  company_size: string | undefined;
  industry: string | undefined;
}

// ==================== Title Extraction ====================

/**
 * Common job title patterns to look for
 */
const TITLE_PATTERNS = [
  // Explicit title label patterns
  /(?:job\s*title|position|role|title)\s*[:：]\s*([^\n\r]+)/i,
  // First line often contains title
  /^([A-Z][^\n\r]{5,80})$/m,
  // "We are looking for a..." pattern
  /(?:looking\s+for|hiring|seeking)\s+(?:a|an)\s+([A-Za-z\s]+(?:engineer|developer|designer|manager|analyst|specialist|lead|director|architect|scientist|consultant|coordinator)[a-z\s]*)/i,
  // "[Company] is hiring a..." pattern  
  /(?:is\s+hiring|is\s+looking\s+for)\s+(?:a|an)\s+([A-Za-z\s]+(?:engineer|developer|designer|manager|analyst|specialist|lead|director|architect|scientist)[a-z\s]*)/i,
];

/**
 * Common job title keywords to validate extracted titles
 */
const TITLE_KEYWORDS = [
  'engineer', 'developer', 'designer', 'manager', 'analyst', 'specialist',
  'lead', 'director', 'architect', 'scientist', 'consultant', 'coordinator',
  'administrator', 'executive', 'officer', 'associate', 'intern', 'head',
  'vp', 'president', 'chief', 'senior', 'junior', 'staff', 'principal',
  'technician', 'operator', 'assistant', 'advisor', 'strategist', 'planner',
];

/**
 * Extract job title from text
 */
export function extractJobTitle(text: string, userProvided?: string): string {
  // Use user-provided title if available
  if (userProvided?.trim()) {
    return userProvided.trim();
  }

  const textLower = text.toLowerCase();

  // Try patterns
  for (const pattern of TITLE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Validate it looks like a job title
      if (candidate.length >= 5 && candidate.length <= 100) {
        const candidateLower = candidate.toLowerCase();
        if (TITLE_KEYWORDS.some(kw => candidateLower.includes(kw))) {
          return cleanTitle(candidate);
        }
      }
    }
  }

  // Try to find title in first few lines
  const lines = text.split('\n').slice(0, 10);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length >= 5 && trimmed.length <= 100) {
      const lineLower = trimmed.toLowerCase();
      if (TITLE_KEYWORDS.some(kw => lineLower.includes(kw))) {
        return cleanTitle(trimmed);
      }
    }
  }

  return 'Unknown Position';
}

/**
 * Clean extracted title
 */
function cleanTitle(title: string): string {
  return title
    .replace(/[\[\](){}]/g, '') // Remove brackets
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^[-–—:]/g, '') // Remove leading punctuation
    .replace(/[-–—:]$/g, '') // Remove trailing punctuation
    .trim();
}

// ==================== Company Extraction ====================

/**
 * Company extraction patterns
 */
const COMPANY_PATTERNS = [
  // Explicit company label
  /(?:company|employer|organization|firm)\s*[:：]\s*([^\n\r]+)/i,
  // "About [Company]" pattern
  /about\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s*\n|[:：]|\s+is\s)/i,
  // "[Company] is hiring" pattern
  /^([A-Z][A-Za-z0-9\s&.,'-]+?)\s+(?:is\s+hiring|is\s+looking|is\s+seeking)/im,
  // "Join [Company]" pattern
  /join\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s+as|\s+team|\s+and|\s*[!\n])/i,
  // "at [Company]" pattern (risky, use cautiously)
  /(?:work|working|position)\s+(?:at|with)\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s*[,.\n])/i,
];

/**
 * Extract company name from text
 */
export function extractCompany(text: string, userProvided?: string): string {
  // Use user-provided company if available
  if (userProvided?.trim()) {
    return userProvided.trim();
  }

  // Try patterns
  for (const pattern of COMPANY_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length >= 2 && candidate.length <= 100) {
        return cleanCompanyName(candidate);
      }
    }
  }

  return 'Unknown Company';
}

/**
 * Clean extracted company name
 */
function cleanCompanyName(name: string): string {
  return name
    .replace(/[,.]$/g, '') // Remove trailing punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\s*(?:Inc\.|LLC|Ltd\.|Corp\.|Corporation|Co\.)?\s*$/i, '') // Remove suffixes optionally
    .trim();
}

// ==================== Location Extraction ====================

/**
 * Location extraction patterns
 */
const LOCATION_PATTERNS = [
  // Explicit location label
  /(?:location|based\s+in|office|headquarters)\s*[:：]\s*([^\n\r]+)/i,
  // City, State pattern (US)
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2})\b/,
  // City, Country pattern
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
  // Remote patterns
  /\b(remote|fully\s+remote|100%\s+remote|work\s+from\s+home|wfh)\b/i,
  // Hybrid patterns
  /\b(hybrid|flexible\s+location|part\s+remote)\b/i,
];

/**
 * Well-known tech hub cities for fallback detection
 */
const KNOWN_CITIES = [
  'San Francisco', 'New York', 'Seattle', 'Austin', 'Boston', 'Los Angeles',
  'Chicago', 'Denver', 'Atlanta', 'Portland', 'San Diego', 'Dallas',
  'London', 'Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Singapore', 
  'Bangalore', 'Toronto', 'Vancouver', 'Sydney', 'Tokyo', 'Shanghai',
];

/**
 * Extract location from text
 */
export function extractLocation(text: string, userProvided?: string): string {
  // Use user-provided location if available
  if (userProvided?.trim()) {
    return userProvided.trim();
  }

  const textLower = text.toLowerCase();

  // Check for explicit remote/hybrid first
  if (/\b(?:fully\s+remote|100%\s+remote|remote\s+only)\b/i.test(text)) {
    return 'Remote';
  }

  // Try patterns
  for (const pattern of LOCATION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length >= 2 && candidate.length <= 100) {
        return cleanLocation(candidate);
      }
    }
  }

  // Check for known cities
  for (const city of KNOWN_CITIES) {
    if (text.includes(city)) {
      return city;
    }
  }

  // Check for generic remote mention
  if (/\bremote\b/i.test(text)) {
    return 'Remote';
  }

  return 'Location Not Specified';
}

/**
 * Clean extracted location
 */
function cleanLocation(location: string): string {
  return location
    .replace(/\s+/g, ' ')
    .replace(/[,.]$/g, '')
    .trim();
}

// ==================== Work Arrangement Extraction ====================

/**
 * Extract work arrangement from text
 */
export function extractWorkArrangement(text: string): WorkArrangement | undefined {
  const textLower = text.toLowerCase();

  // Remote indicators (check first - strongest signal)
  if (
    /\b(?:fully\s+remote|100%\s+remote|remote\s+only|remote\s+position|work\s+from\s+anywhere|work\s+from\s+home)\b/i.test(text)
  ) {
    return 'remote';
  }

  // Hybrid indicators
  if (
    /\b(?:hybrid|flexible\s+work|part[\s-]?remote|2-3\s+days|3\s+days\s+in[\s-]?office|some\s+remote)\b/i.test(text)
  ) {
    return 'hybrid';
  }

  // Onsite indicators
  if (
    /\b(?:on[\s-]?site|in[\s-]?office|in[\s-]?person|office[\s-]?based|must\s+be\s+located)\b/i.test(text)
  ) {
    return 'onsite';
  }

  // Check if "remote" appears without "no remote" or "not remote"
  if (/\bremote\b/i.test(text) && !/\b(?:no|not|non)[\s-]?remote\b/i.test(text)) {
    return 'remote';
  }

  return undefined;
}

// ==================== Salary Extraction ====================

/**
 * Salary extraction patterns
 */
const SALARY_PATTERNS = [
  // Range: $X - $Y or $X to $Y
  /\$\s*([\d,]+)\s*(?:[-–—]|to)\s*\$\s*([\d,]+)\s*(?:k|K)?(?:\s*(?:per\s+)?(?:year|yr|annually|\/yr|\/year))?/i,
  // Range with K: $Xk - $Yk
  /\$\s*([\d]+)\s*[kK]\s*(?:[-–—]|to)\s*\$?\s*([\d]+)\s*[kK]/i,
  // Single value: $X/year or $X per year
  /\$\s*([\d,]+)\s*(?:k|K)?(?:\s*(?:per\s+)?(?:year|yr|annually|\/yr|\/year))/i,
  // Range without dollar: Xk - Yk
  /([\d]+)\s*[kK]\s*(?:[-–—]|to)\s*([\d]+)\s*[kK](?:\s*(?:per\s+)?(?:year|yr|annually))?/i,
  // Salary: $X - $Y format
  /(?:salary|compensation|pay)\s*[:：]?\s*\$\s*([\d,]+)\s*(?:[-–—]|to)\s*\$\s*([\d,]+)/i,
];

/**
 * Extract salary range from text
 */
export function extractSalary(text: string): SalaryRange | undefined {
  for (const pattern of SALARY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      let min: number | undefined;
      let max: number | undefined;

      // Parse numbers
      const num1 = parseNumber(match[1]);
      const num2 = match[2] ? parseNumber(match[2]) : undefined;

      // Check if values are in thousands (K notation or small numbers)
      const isK = /[kK]/.test(match[0]) || (num1 < 1000 && num1 > 20);

      min = isK && num1 < 1000 ? num1 * 1000 : num1;
      max = num2 ? (isK && num2 < 1000 ? num2 * 1000 : num2) : undefined;

      // Validate range makes sense (annual salary typically 20k-2M)
      if (min && min >= 20000 && min <= 2000000) {
        return {
          min,
          max: max && max >= min && max <= 2000000 ? max : undefined,
          currency: 'USD',
        };
      }
    }
  }

  return undefined;
}

/**
 * Parse number from string (handles commas)
 */
function parseNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10);
}

// ==================== Date Extraction ====================

/**
 * Date patterns for posted/deadline
 */
const DATE_PATTERNS = [
  // Posted X days ago
  /posted\s+(\d+)\s+days?\s+ago/i,
  // Posted on YYYY-MM-DD
  /posted\s+(?:on\s+)?(\d{4}[-/]\d{2}[-/]\d{2})/i,
  // Posted Month DD, YYYY
  /posted\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  // Deadline: YYYY-MM-DD
  /(?:deadline|apply\s+by|closes?)\s*[:：]?\s*(\d{4}[-/]\d{2}[-/]\d{2})/i,
  // Deadline: Month DD, YYYY
  /(?:deadline|apply\s+by|closes?)\s*[:：]?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
];

/**
 * Extract posted date from text
 */
export function extractPostedDate(text: string, userProvided?: string): string | undefined {
  if (userProvided) {
    try {
      const date = new Date(userProvided);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      // Invalid date format
    }
  }

  // Check for "X days ago" pattern
  const daysAgoMatch = text.match(/posted\s+(\d+)\s+days?\s+ago/i);
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1], 10);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  }

  // Check for specific date patterns
  for (const pattern of DATE_PATTERNS.slice(1, 3)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        // Invalid date format
      }
    }
  }

  return undefined;
}

/**
 * Extract application deadline from text
 */
export function extractDeadline(text: string, userProvided?: string): string | undefined {
  if (userProvided) {
    try {
      const date = new Date(userProvided);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      // Invalid date format
    }
  }

  for (const pattern of DATE_PATTERNS.slice(3)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        // Invalid date format
      }
    }
  }

  return undefined;
}

// ==================== Company Analysis ====================

/**
 * Determine company tier based on name
 */
export function determineCompanyTier(
  company: string
): 'top_tier' | 'unicorn' | 'established' | 'startup' | 'unknown' {
  const companyLower = company.toLowerCase();

  // Top tier (FAANG + top unicorns)
  const topTier = [
    'google', 'apple', 'amazon', 'meta', 'microsoft', 'netflix',
    'openai', 'anthropic', 'stripe', 'databricks', 'alphabet',
  ];
  if (topTier.some(t => companyLower.includes(t))) {
    return 'top_tier';
  }

  // Unicorns and well-known tech companies
  const unicorns = [
    'uber', 'airbnb', 'spotify', 'shopify', 'atlassian', 'salesforce',
    'oracle', 'adobe', 'nvidia', 'linkedin', 'twitter', 'snap', 'pinterest',
    'dropbox', 'slack', 'zoom', 'coinbase', 'palantir', 'snowflake',
    'plaid', 'figma', 'notion', 'discord', 'doordash', 'instacart',
  ];
  if (unicorns.some(u => companyLower.includes(u))) {
    return 'unicorn';
  }

  // Established companies (Fortune 500, etc.)
  const established = [
    'ibm', 'intel', 'cisco', 'hp', 'dell', 'vmware', 'sap', 'accenture',
    'deloitte', 'mckinsey', 'goldman', 'jpmorgan', 'morgan stanley',
    'bank of america', 'wells fargo', 'citi', 'capital one',
  ];
  if (established.some(e => companyLower.includes(e))) {
    return 'established';
  }

  // Unknown
  if (company === 'Unknown Company' || company.length < 3) {
    return 'unknown';
  }

  // Default to startup if not recognized
  return 'startup';
}

// ==================== Main Extraction Function ====================

/**
 * Extract all metadata from job description
 */
export function extractMetadata(
  text: string,
  userMetadata?: JobMetadataInput
): ExtractedMetadata {
  const job_title = extractJobTitle(text, userMetadata?.job_title);
  const company = extractCompany(text, userMetadata?.company);
  const location = extractLocation(text, userMetadata?.location);
  const work_arrangement = extractWorkArrangement(text);
  const salary_range = extractSalary(text);
  const posted_date = extractPostedDate(text, userMetadata?.posted_date);
  const application_deadline = extractDeadline(text, userMetadata?.application_deadline);
  const company_tier = determineCompanyTier(company);

  return {
    job_title,
    company,
    location,
    work_arrangement,
    salary_range,
    posted_date,
    application_deadline,
    company_tier,
    company_size: undefined, // Would need external data
    industry: undefined, // Could be inferred but complex
  };
}
