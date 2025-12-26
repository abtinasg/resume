/**
 * Layer 6 - Job Discovery & Matching Module
 * Parsing Exports
 */

export { 
  parseJobDescription, 
  parseJobDescriptionWithFallback,
  generateCanonicalId,
  checkDuplicate,
  assessParseQuality,
} from './parser';

export {
  extractMetadata,
  extractJobTitle,
  extractCompany,
  extractLocation,
  extractWorkArrangement,
  extractSalary,
  extractPostedDate,
  extractDeadline,
  determineCompanyTier,
} from './metadata-extractor';

export type { ExtractedMetadata } from './metadata-extractor';

export {
  extractRequirements,
  extractResponsibilities,
  extractBenefits,
  extractSkillsFromText,
  extractToolsFromText,
  extractYearsExperience,
  detectSeniority,
  extractDomainKeywords,
  findSection,
  extractBullets,
} from './requirements-extractor';
