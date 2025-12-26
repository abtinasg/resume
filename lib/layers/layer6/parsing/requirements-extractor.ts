/**
 * Layer 6 - Job Discovery & Matching Module
 * Requirements Extractor
 *
 * Extracts job requirements: skills, tools, seniority, years of experience, etc.
 */

import { SeniorityLevel } from '../../shared/types';
import type { 
  JobRequirements, 
  ExtractedItem, 
  EvidenceSpan,
  ImportanceLevel 
} from '../types';
import { 
  getRequirementsExtractionConfig, 
  detectSeniorityFromText,
  detectSeniorityFromYears,
} from '../config';

// ==================== Section Detection ====================

/**
 * Find a section in text by keywords
 */
export function findSection(
  text: string, 
  keywords: string[]
): { content: string; startIndex: number; endIndex: number } | null {
  const textLower = text.toLowerCase();
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    const index = textLower.indexOf(keywordLower);
    
    if (index !== -1) {
      // Find section boundaries
      const lineStart = text.lastIndexOf('\n', index) + 1;
      
      // Find next section (look for next header-like pattern)
      const nextSectionMatch = text.slice(index + keyword.length).match(
        /\n\s*(?:[A-Z][A-Za-z\s]+[:：]|\n\s*[A-Z][A-Z\s]+\n)/
      );
      
      const endIndex = nextSectionMatch 
        ? index + keyword.length + (nextSectionMatch.index ?? text.length)
        : text.length;
      
      return {
        content: text.slice(lineStart, endIndex),
        startIndex: lineStart,
        endIndex,
      };
    }
  }
  
  return null;
}

/**
 * Extract bullet points from text
 */
export function extractBullets(text: string): string[] {
  const bullets: string[] = [];
  
  // Match various bullet formats
  const bulletPatterns = [
    /^[\s]*[•●○■□▪▸▹►▻◆◇★☆✓✔✗✘➤➢→⭐🔹🔸]\s*(.+)$/gm,
    /^[\s]*[-–—]\s*(.+)$/gm,
    /^[\s]*\d+[.)]\s*(.+)$/gm,
    /^[\s]*[a-zA-Z][.)]\s*(.+)$/gm,
  ];
  
  for (const pattern of bulletPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const bullet = match[1]?.trim();
      if (bullet && bullet.length > 10) {
        bullets.push(bullet);
      }
    }
  }
  
  // Also extract lines that look like requirements
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 20 &&
      !bullets.includes(trimmed) &&
      (
        /^(?:experience|proficiency|knowledge|ability|familiarity|understanding|expertise)/i.test(trimmed) ||
        /\d+\+?\s*years?/i.test(trimmed)
      )
    ) {
      bullets.push(trimmed);
    }
  }
  
  return [...new Set(bullets)];
}

// ==================== Skills Extraction ====================

/**
 * Common programming languages and skills
 */
const KNOWN_SKILLS = new Set([
  // Programming languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'golang',
  'rust', 'swift', 'kotlin', 'scala', 'php', 'perl', 'r', 'matlab', 'sql', 'bash',
  'shell', 'powershell', 'html', 'css', 'sass', 'less',
  
  // Frameworks
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nextjs', 'nuxt', 'gatsby',
  'express', 'fastify', 'nestjs', 'django', 'flask', 'fastapi', 'spring', 'rails',
  '.net', 'asp.net', 'laravel', 'symfony', 'tensorflow', 'pytorch', 'keras',
  
  // Skills/concepts
  'machine learning', 'deep learning', 'data science', 'data engineering',
  'software engineering', 'backend', 'frontend', 'full stack', 'fullstack',
  'devops', 'mlops', 'cloud', 'microservices', 'api', 'rest', 'graphql',
  'agile', 'scrum', 'kanban', 'ci/cd', 'tdd', 'bdd', 'oop', 'functional programming',
  'system design', 'distributed systems', 'algorithms', 'data structures',
  'security', 'cybersecurity', 'networking', 'database', 'data modeling',
  'product management', 'project management', 'technical writing',
  'communication', 'leadership', 'problem solving', 'critical thinking',
]);

/**
 * Extract skills from text section
 */
export function extractSkillsFromText(
  text: string, 
  context: 'required' | 'preferred',
  fullText: string
): ExtractedItem[] {
  const skills: ExtractedItem[] = [];
  const textLower = text.toLowerCase();
  const foundSkills = new Set<string>();
  
  // Pattern-based extraction
  const patterns = [
    // "Experience with X, Y, and Z"
    /(?:experience|proficiency|expertise|knowledge)\s+(?:with|in)\s+([^.]+)/gi,
    // "Strong X skills"
    /strong\s+([a-zA-Z\s]+?)\s+skills?/gi,
    // "X programming"
    /([a-zA-Z+#]+)\s+programming/gi,
    // Standalone skills in lists
    /(?:^|\n|,|;)\s*([A-Za-z][A-Za-z0-9+#.\s-]{1,30})(?=\s*[,;.\n]|$)/gm,
  ];
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const extracted = match[1]?.trim();
      if (extracted) {
        const items = extracted.split(/[,;]/).map(s => s.trim().toLowerCase());
        for (const item of items) {
          if (item.length >= 2 && item.length <= 50 && !foundSkills.has(item)) {
            // Check if it matches known skills or looks like a skill
            if (KNOWN_SKILLS.has(item) || looksLikeSkill(item)) {
              foundSkills.add(item);
              const evidence = findEvidence(item, fullText);
              skills.push({
                value: normalizeSkillName(item),
                evidence: evidence ? [evidence] : [],
                importance: context === 'required' ? 'critical' : 'nice_to_have',
              });
            }
          }
        }
      }
    }
  }
  
  // Check for known skills directly in text
  for (const skill of KNOWN_SKILLS) {
    if (textLower.includes(skill) && !foundSkills.has(skill)) {
      foundSkills.add(skill);
      const evidence = findEvidence(skill, fullText);
      skills.push({
        value: normalizeSkillName(skill),
        evidence: evidence ? [evidence] : [],
        importance: context === 'required' ? 'critical' : 'nice_to_have',
      });
    }
  }
  
  return skills;
}

/**
 * Common non-skill words to filter out (module-level constant for performance)
 */
const NON_SKILLS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'to', 'of', 'in', 'on',
  'is', 'are', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
  'you', 'your', 'we', 'our', 'they', 'their', 'this', 'that', 'these', 'those',
  'ability', 'experience', 'knowledge', 'understanding', 'familiarity',
  'minimum', 'preferred', 'required', 'strong', 'excellent', 'good',
]);

/**
 * Check if text looks like a skill
 */
function looksLikeSkill(text: string): boolean {
  if (NON_SKILLS.has(text)) {
    return false;
  }
  
  // Skills typically contain alphanumeric chars or specific symbols
  return /^[a-zA-Z][a-zA-Z0-9+#.\s-]*[a-zA-Z0-9+#]$/.test(text);
}

/**
 * Normalize skill name
 */
function normalizeSkillName(skill: string): string {
  const normalizations: Record<string, string> = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'c++': 'C++',
    'c#': 'C#',
    'golang': 'Go',
    'go': 'Go',
    'react': 'React',
    'angular': 'Angular',
    'vue': 'Vue.js',
    'nextjs': 'Next.js',
    'next.js': 'Next.js',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'aws': 'AWS',
    'gcp': 'GCP',
    'azure': 'Azure',
    'sql': 'SQL',
    'nosql': 'NoSQL',
    'mongodb': 'MongoDB',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'redis': 'Redis',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'k8s': 'Kubernetes',
    'terraform': 'Terraform',
    'ci/cd': 'CI/CD',
    'rest': 'REST',
    'graphql': 'GraphQL',
    'html': 'HTML',
    'css': 'CSS',
    'sass': 'Sass',
    'machine learning': 'Machine Learning',
    'deep learning': 'Deep Learning',
    'ai': 'AI',
    'ml': 'Machine Learning',
    'fullstack': 'Full Stack',
    'full stack': 'Full Stack',
    'backend': 'Backend',
    'frontend': 'Frontend',
    'devops': 'DevOps',
    'agile': 'Agile',
    'scrum': 'Scrum',
  };
  
  return normalizations[skill.toLowerCase()] || 
    skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Find evidence for a skill in text
 */
function findEvidence(skill: string, text: string): EvidenceSpan | null {
  const skillLower = skill.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(skillLower);
  
  if (index === -1) {
    return null;
  }
  
  // Extract surrounding context (up to 100 chars on each side)
  const start = Math.max(0, text.lastIndexOf('\n', index) + 1);
  const end = Math.min(text.length, text.indexOf('\n', index + skill.length));
  const quote = text.slice(start, end === -1 ? undefined : end).trim();
  
  return {
    quote: quote.slice(0, 200), // Limit quote length
    start,
    end: end === -1 ? text.length : end,
    confidence: 0.9,
  };
}

// ==================== Tools Extraction ====================

/**
 * Known tools and technologies
 */
const KNOWN_TOOLS = new Set([
  // Cloud platforms
  'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 'vercel', 'netlify',
  
  // Databases
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
  'oracle', 'sqlite', 'neo4j', 'couchdb', 'firebase', 'supabase',
  
  // DevOps & Infrastructure
  'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'circleci', 'github actions',
  'gitlab ci', 'travis ci', 'prometheus', 'grafana', 'datadog', 'splunk', 'nginx',
  
  // Version control
  'git', 'github', 'gitlab', 'bitbucket', 'svn',
  
  // IDEs & Editors
  'vscode', 'intellij', 'vim', 'emacs', 'sublime',
  
  // Testing
  'jest', 'mocha', 'jasmine', 'pytest', 'junit', 'selenium', 'cypress', 'playwright',
  
  // Project management
  'jira', 'asana', 'trello', 'monday', 'notion', 'confluence', 'slack',
  
  // Design
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
  
  // Data tools
  'spark', 'hadoop', 'airflow', 'kafka', 'pandas', 'numpy', 'tableau', 'power bi',
  'looker', 'dbt', 'snowflake', 'bigquery', 'redshift',
  
  // Other
  'linux', 'unix', 'windows', 'macos', 'postman', 'swagger', 'openapi',
]);

/**
 * Extract tools from text
 */
export function extractToolsFromText(
  text: string,
  context: 'required' | 'preferred',
  fullText: string
): ExtractedItem[] {
  const tools: ExtractedItem[] = [];
  const textLower = text.toLowerCase();
  const foundTools = new Set<string>();
  
  // Check for known tools
  for (const tool of KNOWN_TOOLS) {
    if (textLower.includes(tool) && !foundTools.has(tool)) {
      foundTools.add(tool);
      const evidence = findEvidence(tool, fullText);
      tools.push({
        value: normalizeToolName(tool),
        evidence: evidence ? [evidence] : [],
        importance: context === 'required' ? 'critical' : 'nice_to_have',
      });
    }
  }
  
  return tools;
}

/**
 * Normalize tool name
 */
function normalizeToolName(tool: string): string {
  const normalizations: Record<string, string> = {
    'aws': 'AWS',
    'gcp': 'GCP',
    'google cloud': 'Google Cloud',
    'azure': 'Azure',
    'postgresql': 'PostgreSQL',
    'mysql': 'MySQL',
    'mongodb': 'MongoDB',
    'redis': 'Redis',
    'elasticsearch': 'Elasticsearch',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'terraform': 'Terraform',
    'jenkins': 'Jenkins',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'git': 'Git',
    'jira': 'Jira',
    'figma': 'Figma',
    'kafka': 'Kafka',
    'spark': 'Apache Spark',
    'hadoop': 'Hadoop',
    'linux': 'Linux',
    'jest': 'Jest',
    'cypress': 'Cypress',
    'vscode': 'VS Code',
  };
  
  return normalizations[tool.toLowerCase()] || 
    tool.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ==================== Experience Extraction ====================

/**
 * Years of experience patterns
 */
const YEARS_PATTERNS = [
  // "5+ years" or "5 years"
  /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)?/gi,
  // "minimum 5 years"
  /minimum\s+(?:of\s+)?(\d+)\s*(?:years?|yrs?)/gi,
  // "at least 5 years"
  /at\s+least\s+(\d+)\s*(?:years?|yrs?)/gi,
  // "3-5 years"
  /(\d+)\s*[-–—]\s*(\d+)\s*(?:years?|yrs?)/gi,
];

/**
 * Extract years of experience from text
 */
export function extractYearsExperience(text: string): { min?: number; max?: number } {
  const results: { min: number; max: number }[] = [];
  
  for (const pattern of YEARS_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const num1 = parseInt(match[1], 10);
      const num2 = match[2] ? parseInt(match[2], 10) : undefined;
      
      if (num1 >= 0 && num1 <= 30) {
        if (num2 && num2 >= num1 && num2 <= 30) {
          results.push({ min: num1, max: num2 });
        } else {
          results.push({ min: num1, max: num1 + 2 }); // Estimate max
        }
      }
    }
  }
  
  if (results.length === 0) {
    return {};
  }
  
  // Return the most common or median values
  const mins = results.map(r => r.min);
  const maxes = results.map(r => r.max);
  
  return {
    min: Math.min(...mins),
    max: Math.max(...maxes),
  };
}

// ==================== Seniority Detection ====================

/**
 * Detect seniority level from text
 */
export function detectSeniority(
  text: string, 
  yearsMin?: number
): SeniorityLevel {
  // First, try text-based detection
  const textBasedSeniority = detectSeniorityFromText(text);
  
  // If we have years, validate or override
  if (yearsMin !== undefined) {
    const yearsBasedSeniority = detectSeniorityFromYears(yearsMin);
    
    // If text says senior but years says entry, trust years
    // (probably wrong extraction or intern position)
    if (
      yearsMin <= 2 && 
      (textBasedSeniority === SeniorityLevel.SENIOR || textBasedSeniority === SeniorityLevel.LEAD)
    ) {
      return SeniorityLevel.ENTRY;
    }
    
    // Generally trust text-based detection as it's more explicit
    return textBasedSeniority;
  }
  
  return textBasedSeniority;
}

// ==================== Domain Keywords ====================

/**
 * Extract domain keywords
 */
export function extractDomainKeywords(text: string): string[] {
  const domains = new Set<string>();
  const textLower = text.toLowerCase();
  
  const domainKeywords = [
    'fintech', 'healthtech', 'edtech', 'e-commerce', 'ecommerce', 'saas',
    'b2b', 'b2c', 'enterprise', 'startup', 'ai', 'ml', 'blockchain',
    'crypto', 'defi', 'web3', 'iot', 'ar', 'vr', 'gaming', 'social',
    'media', 'advertising', 'adtech', 'martech', 'proptech', 'insurtech',
    'regtech', 'legaltech', 'hrtech', 'logistics', 'supply chain',
    'healthcare', 'biotech', 'pharma', 'energy', 'cleantech', 'climate',
    'automotive', 'manufacturing', 'retail', 'hospitality', 'travel',
    'real estate', 'construction', 'telecommunications', 'cybersecurity',
  ];
  
  for (const keyword of domainKeywords) {
    if (textLower.includes(keyword)) {
      domains.add(keyword);
    }
  }
  
  return Array.from(domains);
}

// ==================== Main Extraction Function ====================

/**
 * Extract all requirements from job description
 */
export function extractRequirements(text: string): JobRequirements {
  const config = getRequirementsExtractionConfig();
  
  // Find requirements section
  const requirementsSection = findSection(text, config.skill_section_keywords);
  const requirementsText = requirementsSection?.content || text;
  
  // Find preferred section (if separate)
  const preferredPatterns = config.preferred_keywords.map(
    kw => new RegExp(`(?:^|\\n)\\s*${kw}[:\\s]`, 'i')
  );
  let preferredSection = '';
  for (const pattern of preferredPatterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      const start = match.index;
      const end = text.indexOf('\n\n', start + 50) || text.length;
      preferredSection = text.slice(start, end);
      break;
    }
  }
  
  // Extract skills
  const required_skills = extractSkillsFromText(requirementsText, 'required', text);
  const preferred_skills = preferredSection 
    ? extractSkillsFromText(preferredSection, 'preferred', text)
    : [];
  
  // Extract tools
  const required_tools = extractToolsFromText(requirementsText, 'required', text);
  const preferred_tools = preferredSection
    ? extractToolsFromText(preferredSection, 'preferred', text)
    : [];
  
  // Extract years of experience
  const yearsExp = extractYearsExperience(text);
  
  // Detect seniority
  const seniority_expected = detectSeniority(text, yearsExp.min);
  
  // Extract domain keywords
  const domain_keywords = extractDomainKeywords(text);
  
  // Calculate extraction confidence
  const extraction_confidence = calculateExtractionConfidence(
    required_skills.length,
    required_tools.length,
    requirementsSection !== null
  );
  
  return {
    required_skills,
    preferred_skills,
    required_tools,
    preferred_tools,
    seniority_expected,
    years_experience_min: yearsExp.min,
    years_experience_max: yearsExp.max,
    education_requirements: extractEducation(text),
    certifications: extractCertifications(text),
    domain_keywords,
    extraction_confidence,
    extraction_method: 'regex',
  };
}

/**
 * Calculate extraction confidence based on what was found
 */
function calculateExtractionConfidence(
  skillsCount: number,
  toolsCount: number,
  hasRequirementsSection: boolean
): number {
  let confidence = 0.5; // Base confidence
  
  if (hasRequirementsSection) confidence += 0.2;
  if (skillsCount >= 3) confidence += 0.15;
  if (skillsCount >= 5) confidence += 0.05;
  if (toolsCount >= 2) confidence += 0.1;
  
  return Math.min(1, confidence);
}

/**
 * Extract education requirements
 */
function extractEducation(text: string): string[] {
  const education: string[] = [];
  const textLower = text.toLowerCase();
  
  const patterns = [
    /bachelor'?s?\s+(?:degree|in)/gi,
    /master'?s?\s+(?:degree|in)/gi,
    /phd|doctorate/gi,
    /bs\/ms|ms\/phd/gi,
    /(?:computer science|cs|engineering|mathematics|physics|statistics)/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      education.push(match[0].trim());
    }
  }
  
  return [...new Set(education)];
}

/**
 * Extract certifications
 */
function extractCertifications(text: string): string[] {
  const certs: string[] = [];
  
  const knownCerts = [
    'AWS Certified', 'Azure Certified', 'GCP Certified',
    'PMP', 'Scrum Master', 'CSM', 'PSM',
    'CISSP', 'CISM', 'CompTIA',
    'CKA', 'CKAD', 'CKS',
    'Terraform Certified',
  ];
  
  const textLower = text.toLowerCase();
  for (const cert of knownCerts) {
    if (textLower.includes(cert.toLowerCase())) {
      certs.push(cert);
    }
  }
  
  return certs;
}

// ==================== Responsibilities Extraction ====================

/**
 * Extract responsibilities from text
 */
export function extractResponsibilities(text: string): string[] {
  const config = getRequirementsExtractionConfig();
  
  // Find responsibilities section
  const section = findSection(text, config.responsibility_section_keywords);
  const sectionText = section?.content || text;
  
  // Extract bullet points
  const bullets = extractBullets(sectionText);
  
  // Filter to only responsibility-like bullets
  const responsibilities = bullets.filter(bullet => {
    const bulletLower = bullet.toLowerCase();
    return (
      bulletLower.includes('develop') ||
      bulletLower.includes('build') ||
      bulletLower.includes('design') ||
      bulletLower.includes('implement') ||
      bulletLower.includes('maintain') ||
      bulletLower.includes('collaborate') ||
      bulletLower.includes('lead') ||
      bulletLower.includes('manage') ||
      bulletLower.includes('create') ||
      bulletLower.includes('work with') ||
      bulletLower.includes('ensure') ||
      bulletLower.includes('support') ||
      bulletLower.includes('review') ||
      bulletLower.includes('write') ||
      bulletLower.includes('participate') ||
      /^(?:you\s+will|you'll|as\s+a)/i.test(bullet)
    );
  });
  
  return responsibilities.slice(0, 15); // Limit to top 15
}

/**
 * Extract benefits from text
 */
export function extractBenefits(text: string): string[] {
  const section = findSection(text, [
    'benefits', 'perks', 'what we offer', 'why join', 'compensation',
  ]);
  
  if (!section) {
    return [];
  }
  
  const bullets = extractBullets(section.content);
  return bullets.slice(0, 10); // Limit to top 10
}
