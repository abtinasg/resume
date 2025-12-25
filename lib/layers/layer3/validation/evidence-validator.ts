/**
 * Layer 3 - Execution Engine
 * Evidence Validator
 *
 * Core validation logic to ensure no fabrication.
 * This is THE critical component for the competitive moat.
 */

import {
  EvidenceLedger,
  EvidenceMap,
  ValidationResult,
  ValidationItem,
  ValidationCode,
} from '../types';
import { getThresholds } from '../config';
import {
  extractNumbers,
  extractAllNumbers,
  findNewNumbers,
  detectScaleClaims,
  findNewScaleClaims,
} from '../planning';
import {
  verifySemanticOverlap,
  analyzeOverlap,
  isSubstringMatch,
} from './semantic-overlap';

// ==================== Types ====================

/**
 * Tech term extraction result
 */
interface ExtractedTechTerms {
  tools: string[];
  companies: string[];
}

// ==================== Main Validation Function ====================

/**
 * Validate a rewrite against evidence
 * This is the core fabrication-detection function
 *
 * @param original - Original text
 * @param improved - Improved text from LLM
 * @param evidenceLedger - Evidence ledger with allowed facts
 * @param evidenceMap - Map from improved spans to evidence IDs
 * @returns ValidationResult with pass/fail and items
 */
export function validateRewrite(
  original: string,
  improved: string,
  evidenceLedger: EvidenceLedger,
  evidenceMap: EvidenceMap
): ValidationResult {
  const warnings: ValidationItem[] = [];
  const thresholds = getThresholds();

  // Collect all evidence texts
  const evidenceTexts = evidenceLedger.items.map((e) => e.text);

  // 1. Check for new numbers (CRITICAL)
  const newNumbers = findNewNumbers(improved, original, evidenceTexts);
  if (newNumbers.length > 0) {
    warnings.push({
      code: ValidationCode.NEW_NUMBER_ADDED,
      severity: 'critical',
      message: `Added numbers not in evidence: ${newNumbers.join(', ')}`,
    });
  }

  // 2. Check for new tools/technologies (CRITICAL)
  const originalTools = extractTechTerms(original);
  const evidenceTools = extractAllTechTerms(evidenceTexts);
  const improvedTools = extractTechTerms(improved);

  const newTools = findNewTerms(improvedTools.tools, originalTools.tools, evidenceTools.tools);
  if (newTools.length > 0) {
    warnings.push({
      code: ValidationCode.NEW_TOOL_ADDED,
      severity: 'critical',
      message: `Added tools not in evidence: ${newTools.join(', ')}`,
    });
  }

  // 3. Check for new company names (CRITICAL)
  const newCompanies = findNewTerms(
    improvedTools.companies,
    originalTools.companies,
    evidenceTools.companies
  );
  if (newCompanies.length > 0) {
    warnings.push({
      code: ValidationCode.NEW_COMPANY_ADDED,
      severity: 'critical',
      message: `Added company names not in evidence: ${newCompanies.join(', ')}`,
    });
  }

  // 4. Check for new scale claims (CRITICAL)
  const newScaleClaims = findNewScaleClaims(improved, original, evidenceTexts);
  if (newScaleClaims.length > 0) {
    warnings.push({
      code: ValidationCode.NEW_IMPLIED_METRIC,
      severity: 'critical',
      message: `Added scale claims not in evidence: ${newScaleClaims.join(', ')}`,
    });
  }

  // 5. Validate evidence map
  const evidenceMapWarnings = validateEvidenceMap(improved, evidenceMap, evidenceLedger);
  warnings.push(...evidenceMapWarnings);

  // 6. Check length explosion (WARNING)
  if (improved.length > original.length * thresholds.max_length_multiplier) {
    warnings.push({
      code: ValidationCode.LENGTH_EXPLOSION,
      severity: 'warning',
      message: 'Rewrite significantly longer than original',
    });
  }

  // Determine if passed (no critical issues)
  const passed = !warnings.some((w) => w.severity === 'critical');

  return {
    passed,
    items: warnings,
  };
}

// ==================== Evidence Map Validation ====================

/**
 * Validate the evidence map
 * Ensures every claim is backed by real evidence
 */
export function validateEvidenceMap(
  improved: string,
  evidenceMap: EvidenceMap,
  evidenceLedger: EvidenceLedger
): ValidationItem[] {
  const warnings: ValidationItem[] = [];
  const validEvidenceIds = new Set(evidenceLedger.items.map((e) => e.id));

  // Check 1: All evidence IDs must exist in ledger
  for (const mapItem of evidenceMap) {
    for (const evidenceId of mapItem.evidence_ids) {
      if (!validEvidenceIds.has(evidenceId)) {
        warnings.push({
          code: ValidationCode.INVALID_EVIDENCE_ID,
          severity: 'critical',
          message: `Evidence ID '${evidenceId}' does not exist in ledger`,
        });
      }
    }
  }

  // Check 2: All improved_spans must exist in improved text
  for (const mapItem of evidenceMap) {
    if (!improved.includes(mapItem.improved_span)) {
      warnings.push({
        code: ValidationCode.SPAN_NOT_FOUND,
        severity: 'critical',
        message: `Span '${mapItem.improved_span}' not found in improved text`,
      });
    }
  }

  // Check 3: Every significant claim should have evidence mapping
  const allMappedSpans = new Set(evidenceMap.map((item) => item.improved_span.toLowerCase()));

  // Check tools
  const improvedTools = extractTechTerms(improved).tools;
  for (const tool of improvedTools) {
    const toolLower = tool.toLowerCase();
    const isMapped = Array.from(allMappedSpans).some((span) =>
      span.includes(toolLower) || toolLower.includes(span)
    );

    if (!isMapped) {
      warnings.push({
        code: ValidationCode.UNSUPPORTED_TOOL_CLAIM,
        severity: 'critical',
        message: `Tool '${tool}' has no evidence mapping`,
      });
    }
  }

  // Check numbers
  const improvedNumbers = extractNumbers(improved);
  for (const num of improvedNumbers) {
    const isMapped = Array.from(allMappedSpans).some((span) => span.includes(num));

    if (!isMapped) {
      warnings.push({
        code: ValidationCode.UNSUPPORTED_METRIC_CLAIM,
        severity: 'critical',
        message: `Number '${num}' has no evidence mapping`,
      });
    }
  }

  // Check 4: Verify semantic match between span and evidence
  for (const mapItem of evidenceMap) {
    // Get evidence texts for this span
    const evidenceTexts: string[] = [];
    for (const evidenceId of mapItem.evidence_ids) {
      const evidence = evidenceLedger.items.find((e) => e.id === evidenceId);
      if (evidence) {
        evidenceTexts.push(evidence.text);
      }
    }

    // Check overlap
    if (!verifySemanticOverlap(mapItem.improved_span, evidenceTexts)) {
      // Check if it's a substring match (more lenient)
      if (!isSubstringMatch(mapItem.improved_span, evidenceTexts)) {
        warnings.push({
          code: ValidationCode.WEAK_EVIDENCE_MATCH,
          severity: 'warning',
          message: `Span '${mapItem.improved_span}' weakly supported by evidence`,
        });
      }
    }
  }

  return warnings;
}

// ==================== Tech Term Extraction ====================

/**
 * Common tech terms/tools
 */
const TECH_TERMS = new Set([
  // Languages
  'python',
  'java',
  'javascript',
  'typescript',
  'c++',
  'c#',
  'ruby',
  'go',
  'rust',
  'swift',
  'kotlin',
  'scala',
  'php',
  'perl',
  'r',
  'matlab',
  
  // Frameworks
  'react',
  'angular',
  'vue',
  'node',
  'nodejs',
  'express',
  'django',
  'flask',
  'spring',
  'rails',
  'laravel',
  'nextjs',
  'nestjs',
  
  // Databases
  'sql',
  'mysql',
  'postgresql',
  'postgres',
  'mongodb',
  'redis',
  'elasticsearch',
  'dynamodb',
  'cassandra',
  'oracle',
  
  // Cloud/DevOps
  'aws',
  'azure',
  'gcp',
  'docker',
  'kubernetes',
  'k8s',
  'terraform',
  'ansible',
  'jenkins',
  'circleci',
  'github',
  'gitlab',
  
  // Data/ML
  'tensorflow',
  'pytorch',
  'pandas',
  'numpy',
  'scikit-learn',
  'spark',
  'hadoop',
  'kafka',
  'airflow',
  
  // APIs
  'rest',
  'graphql',
  'grpc',
  'api',
  'microservices',
  
  // Other
  'agile',
  'scrum',
  'jira',
  'figma',
  'tableau',
]);

/**
 * Extract tech terms from text
 */
export function extractTechTerms(text: string): ExtractedTechTerms {
  const words = text.toLowerCase().split(/\s+/);
  const tools: string[] = [];
  const companies: string[] = [];

  // Find tech terms
  for (const word of words) {
    const cleaned = word.replace(/[^a-z0-9+#-]/g, '');
    if (TECH_TERMS.has(cleaned)) {
      tools.push(cleaned);
    }
  }

  // Find company names (capitalized words not at sentence start)
  const companyPatterns = [
    /\bat\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)/g,
    /([A-Z][A-Za-z]+\s+(?:Inc\.?|Corp\.?|LLC|Ltd\.?))/g,
  ];

  for (const pattern of companyPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const company = match[1];
      if (company && !isCommonWord(company)) {
        companies.push(company);
      }
    }
  }

  return {
    tools: [...new Set(tools)],
    companies: [...new Set(companies)],
  };
}

/**
 * Extract tech terms from multiple texts
 */
function extractAllTechTerms(texts: string[]): ExtractedTechTerms {
  const allTools: string[] = [];
  const allCompanies: string[] = [];

  for (const text of texts) {
    const { tools, companies } = extractTechTerms(text);
    allTools.push(...tools);
    allCompanies.push(...companies);
  }

  return {
    tools: [...new Set(allTools)],
    companies: [...new Set(allCompanies)],
  };
}

/**
 * Check if a word is a common non-company word
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'Software',
    'Engineer',
    'Developer',
    'Manager',
    'Lead',
    'Senior',
    'Product',
    'Data',
    'Team',
    'Project',
  ]);
  return commonWords.has(word);
}

/**
 * Find terms in improved that aren't in original or evidence
 */
function findNewTerms(
  improvedTerms: string[],
  originalTerms: string[],
  evidenceTerms: string[]
): string[] {
  const originalSet = new Set(originalTerms.map((t) => t.toLowerCase()));
  const evidenceSet = new Set(evidenceTerms.map((t) => t.toLowerCase()));

  return improvedTerms.filter((term) => {
    const termLower = term.toLowerCase();
    return !originalSet.has(termLower) && !evidenceSet.has(termLower);
  });
}

// ==================== Utility Functions ====================

/**
 * Get critical validation errors only
 */
export function getCriticalErrors(result: ValidationResult): ValidationItem[] {
  return result.items.filter((item) => item.severity === 'critical');
}

/**
 * Get warning validation items only
 */
export function getWarnings(result: ValidationResult): ValidationItem[] {
  return result.items.filter((item) => item.severity === 'warning');
}

/**
 * Format validation result for logging
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.passed && result.items.length === 0) {
    return 'Validation passed with no issues';
  }

  const lines: string[] = [];
  lines.push(`Validation ${result.passed ? 'PASSED' : 'FAILED'}`);

  for (const item of result.items) {
    lines.push(`  [${item.severity.toUpperCase()}] ${item.code}: ${item.message}`);
  }

  return lines.join('\n');
}

/**
 * Check if validation failed due to fabrication
 */
export function hasFabricationErrors(result: ValidationResult): boolean {
  const fabricationCodes = [
    ValidationCode.NEW_NUMBER_ADDED,
    ValidationCode.NEW_TOOL_ADDED,
    ValidationCode.NEW_COMPANY_ADDED,
    ValidationCode.NEW_IMPLIED_METRIC,
  ];

  return result.items.some(
    (item) =>
      item.severity === 'critical' &&
      fabricationCodes.includes(item.code as ValidationCode)
  );
}
