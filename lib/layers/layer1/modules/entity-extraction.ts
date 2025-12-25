/**
 * Layer 1 - Evaluation Engine
 * Entity Extraction Module (SHARED)
 *
 * Extracts and normalizes entities from resumes:
 * - Skills
 * - Tools
 * - Job titles
 * - Companies
 * - Industries
 */

import type { ParsedResume, ExtractedEntities } from '../types';
import { normalizeSkill, normalizeSkills, SKILL_NORMALIZATION } from '../config/skills';
import { detectToolsInText, normalizeTool, normalizeTools } from '../config/tools';
import { detectIndustries, INDUSTRY_KEYWORDS } from '../config/industries';
import {
  getCompanyIndustry,
  extractIndustriesFromCompanies,
} from '../config/companies';

// ==================== Main Extraction Function ====================

/**
 * Extract all entities from a parsed resume
 */
export function extractEntities(parsed: ParsedResume): ExtractedEntities {
  // Extract skills from multiple sources
  const skills = extractAllSkills(parsed);

  // Extract tools from content
  const tools = extractAllTools(parsed);

  // Extract job titles
  const titles = extractTitles(parsed);

  // Extract companies
  const companies = extractCompanies(parsed);

  // Infer industries from companies and content
  const industries = inferIndustries(parsed, companies);

  // Get sample bullets for improvement suggestions
  const bulletsSample = getSampleBullets(parsed);

  // Extract certifications
  const certifications = extractCertificationNames(parsed);

  return {
    skills,
    tools,
    titles,
    companies,
    industries,
    bullets_sample: bulletsSample.length > 0 ? bulletsSample : undefined,
    certifications: certifications.length > 0 ? certifications : undefined,
  };
}

// ==================== Skill Extraction ====================

/**
 * Extract skills from all resume sections
 */
function extractAllSkills(parsed: ParsedResume): string[] {
  const allSkills = new Set<string>();

  // 1. From explicit skills section
  if (parsed.skills && parsed.skills.length > 0) {
    const normalized = normalizeSkills(parsed.skills);
    normalized.forEach((s) => allSkills.add(s));
  }

  // 2. From experience bullets
  for (const exp of parsed.experiences) {
    for (const bullet of exp.bullets) {
      const detected = detectSkillsInText(bullet);
      detected.forEach((s) => allSkills.add(s));
    }
  }

  // 3. From projects
  if (parsed.projects) {
    for (const project of parsed.projects) {
      // From technologies list
      if (project.technologies) {
        const normalized = normalizeSkills(project.technologies);
        normalized.forEach((s) => allSkills.add(s));
      }
      // From description
      const detected = detectSkillsInText(project.description);
      detected.forEach((s) => allSkills.add(s));
    }
  }

  // 4. From certifications (infer related skills)
  if (parsed.certifications) {
    for (const cert of parsed.certifications) {
      const skills = inferSkillsFromCertification(cert.name);
      skills.forEach((s) => allSkills.add(s));
    }
  }

  return Array.from(allSkills).sort();
}

/**
 * Detect skills mentioned in text
 */
export function detectSkillsInText(text: string): string[] {
  const textLower = text.toLowerCase();
  const detected = new Set<string>();

  // Check against skill normalization map
  for (const [variant, canonical] of Object.entries(SKILL_NORMALIZATION)) {
    // Word boundary check for more accurate matching
    const pattern = new RegExp(`\\b${escapeRegex(variant)}\\b`, 'i');
    if (pattern.test(textLower)) {
      detected.add(canonical);
    }
  }

  return Array.from(detected);
}

/**
 * Infer skills from certification name
 */
function inferSkillsFromCertification(certName: string): string[] {
  const skills: string[] = [];
  const certLower = certName.toLowerCase();

  const certSkillMap: Record<string, string[]> = {
    aws: ['AWS', 'Cloud Computing'],
    google: ['Google Cloud', 'Cloud Computing'],
    azure: ['Azure', 'Cloud Computing'],
    kubernetes: ['Kubernetes', 'Docker', 'Container Orchestration'],
    docker: ['Docker', 'Containerization'],
    terraform: ['Terraform', 'Infrastructure as Code'],
    pmp: ['Project Management', 'Agile'],
    scrum: ['Scrum', 'Agile', 'Project Management'],
    cissp: ['Cybersecurity', 'Information Security'],
    python: ['Python'],
    java: ['Java'],
    javascript: ['JavaScript'],
  };

  for (const [keyword, relatedSkills] of Object.entries(certSkillMap)) {
    if (certLower.includes(keyword)) {
      skills.push(...relatedSkills);
    }
  }

  return skills;
}

// ==================== Tool Extraction ====================

/**
 * Extract tools from all resume sections
 */
function extractAllTools(parsed: ParsedResume): string[] {
  const allTools = new Set<string>();

  // Combine all text sources for tool detection
  const textSources: string[] = [];

  // From experience bullets
  for (const exp of parsed.experiences) {
    textSources.push(...exp.bullets);
  }

  // From projects
  if (parsed.projects) {
    for (const project of parsed.projects) {
      textSources.push(project.description);
      if (project.technologies) {
        textSources.push(project.technologies.join(' '));
      }
    }
  }

  // From skills section
  textSources.push(parsed.skills.join(' '));

  // Detect tools in combined text
  const combinedText = textSources.join(' ');
  const detected = detectToolsInText(combinedText);
  detected.forEach((t) => allTools.add(t));

  // Also normalize explicitly listed skills that might be tools
  for (const skill of parsed.skills) {
    const normalized = normalizeTool(skill);
    // Check if it's a known tool
    if (normalized !== skill) {
      allTools.add(normalized);
    }
  }

  return Array.from(allTools).sort();
}

// ==================== Title Extraction ====================

/**
 * Extract and normalize job titles from experience
 */
function extractTitles(parsed: ParsedResume): string[] {
  const titles: string[] = [];

  for (const exp of parsed.experiences) {
    const normalizedTitle = normalizeTitle(exp.title);
    if (!titles.includes(normalizedTitle)) {
      titles.push(normalizedTitle);
    }
  }

  return titles;
}

/**
 * Normalize job title to canonical form
 */
export function normalizeTitle(rawTitle: string): string {
  let title = rawTitle.trim();

  // Expand common abbreviations
  const abbreviations: Record<string, string> = {
    'Sr.': 'Senior',
    'Sr ': 'Senior ',
    'Jr.': 'Junior',
    'Jr ': 'Junior ',
    'Snr.': 'Senior',
    'Snr ': 'Senior ',
    'Jnr.': 'Junior',
    'Jnr ': 'Junior ',
    'Eng.': 'Engineer',
    'Eng ': 'Engineer ',
    'Mgr.': 'Manager',
    'Mgr ': 'Manager ',
    'Dir.': 'Director',
    'Dir ': 'Director ',
    'VP ': 'Vice President ',
    'VP,': 'Vice President,',
    'PM': 'Product Manager',
    'SWE': 'Software Engineer',
    'SDE': 'Software Development Engineer',
    'MLE': 'Machine Learning Engineer',
    'TPM': 'Technical Program Manager',
    'EM': 'Engineering Manager',
    'IC': 'Individual Contributor',
    'FE': 'Frontend Engineer',
    'BE': 'Backend Engineer',
    'QA': 'Quality Assurance',
    'UX': 'User Experience',
    'UI': 'User Interface',
    'DevOps': 'DevOps Engineer',
    'Full-stack': 'Full Stack',
    'Fullstack': 'Full Stack',
    'Full stack': 'Full Stack',
  };

  for (const [abbr, full] of Object.entries(abbreviations)) {
    if (title.includes(abbr)) {
      title = title.replace(new RegExp(escapeRegex(abbr), 'gi'), full);
    }
  }

  // Clean up extra spaces
  title = title.replace(/\s+/g, ' ').trim();

  return title;
}

/**
 * Infer seniority level from job title
 */
export function inferSeniorityFromTitle(title: string): 'entry' | 'mid' | 'senior' | 'lead' {
  const titleLower = title.toLowerCase();

  // Lead/Principal level
  if (
    titleLower.includes('lead') ||
    titleLower.includes('principal') ||
    titleLower.includes('staff') ||
    titleLower.includes('architect') ||
    titleLower.includes('director') ||
    titleLower.includes('head') ||
    titleLower.includes('chief') ||
    titleLower.includes('vp') ||
    titleLower.includes('vice president')
  ) {
    return 'lead';
  }

  // Senior level
  if (
    titleLower.includes('senior') ||
    titleLower.includes('sr.') ||
    titleLower.includes('sr ') ||
    titleLower.includes('iii') ||
    titleLower.includes('level 3')
  ) {
    return 'senior';
  }

  // Entry level
  if (
    titleLower.includes('junior') ||
    titleLower.includes('jr.') ||
    titleLower.includes('jr ') ||
    titleLower.includes('intern') ||
    titleLower.includes('associate') ||
    titleLower.includes('entry') ||
    titleLower.includes('graduate') ||
    titleLower.includes('trainee')
  ) {
    return 'entry';
  }

  // Default to mid level
  return 'mid';
}

// ==================== Company Extraction ====================

/**
 * Extract company names from experience
 */
function extractCompanies(parsed: ParsedResume): string[] {
  const companies: string[] = [];

  for (const exp of parsed.experiences) {
    if (exp.company && !companies.includes(exp.company)) {
      companies.push(exp.company);
    }
  }

  return companies;
}

// ==================== Industry Inference ====================

/**
 * Infer industries from companies and content
 */
function inferIndustries(parsed: ParsedResume, companies: string[]): string[] {
  const industries = new Set<string>();

  // 1. From known companies
  const companyIndustries = extractIndustriesFromCompanies(companies);
  companyIndustries.forEach((i) => industries.add(i));

  // 2. From experience content
  const allBullets = parsed.experiences.flatMap((exp) => exp.bullets).join(' ');
  const contentIndustries = detectIndustries(allBullets);
  contentIndustries.forEach((i) => industries.add(i));

  // 3. From project descriptions
  if (parsed.projects) {
    const projectText = parsed.projects.map((p) => p.description).join(' ');
    const projectIndustries = detectIndustries(projectText);
    projectIndustries.forEach((i) => industries.add(i));
  }

  return Array.from(industries).sort();
}

// ==================== Sample Bullets ====================

/**
 * Get sample bullets for improvement suggestions
 * Prioritizes weak bullets that could be improved
 */
function getSampleBullets(parsed: ParsedResume): string[] {
  const samples: string[] = [];

  // Get bullets from most recent experiences
  for (const exp of parsed.experiences.slice(0, 2)) {
    for (const bullet of exp.bullets.slice(0, 3)) {
      if (bullet.length > 20 && samples.length < 5) {
        samples.push(bullet);
      }
    }
  }

  return samples;
}

// ==================== Certification Names ====================

/**
 * Extract certification names as strings
 */
function extractCertificationNames(parsed: ParsedResume): string[] {
  if (!parsed.certifications) return [];
  return parsed.certifications.map((c) => c.name);
}

// ==================== Skill Transfer Detection ====================

/**
 * Check if two skills are transferable (similar/related)
 */
export function areSkillsTransferable(
  resumeSkill: string,
  targetSkill: string
): boolean {
  const transfers: Record<string, string[]> = {
    // Programming languages transfer
    Python: ['scripting', 'programming', 'coding', 'automation'],
    JavaScript: ['frontend', 'web development', 'scripting', 'TypeScript'],
    TypeScript: ['JavaScript', 'frontend', 'web development'],
    Java: ['backend', 'server-side', 'enterprise'],
    'C++': ['C', 'systems programming', 'performance'],
    C: ['C++', 'systems programming', 'embedded'],

    // Framework transfers
    React: ['frontend', 'JavaScript', 'UI development', 'Vue.js', 'Angular'],
    'Vue.js': ['frontend', 'JavaScript', 'UI development', 'React', 'Angular'],
    Angular: ['frontend', 'JavaScript', 'TypeScript', 'React', 'Vue.js'],
    'Node.js': ['backend', 'JavaScript', 'server-side', 'API development'],
    Django: ['Python', 'backend', 'web development', 'Flask'],
    Flask: ['Python', 'backend', 'web development', 'Django'],
    'Spring Boot': ['Java', 'backend', 'microservices', 'enterprise'],

    // Cloud transfers
    AWS: ['cloud computing', 'infrastructure', 'Google Cloud', 'Azure'],
    'Google Cloud': ['cloud computing', 'infrastructure', 'AWS', 'Azure'],
    Azure: ['cloud computing', 'infrastructure', 'AWS', 'Google Cloud'],

    // Soft skill transfers
    Leadership: ['people management', 'team lead', 'mentoring', 'management'],
    'Team Leadership': ['leadership', 'management', 'mentoring'],
    Communication: ['presentation', 'stakeholder management', 'collaboration'],
    'Project Management': ['Agile', 'Scrum', 'program management'],
    Agile: ['Scrum', 'Kanban', 'project management'],
    Scrum: ['Agile', 'Kanban', 'project management'],
  };

  const resumeSkillLower = resumeSkill.toLowerCase();
  const targetSkillLower = targetSkill.toLowerCase();

  // Direct match
  if (resumeSkillLower === targetSkillLower) return true;

  // Check transfer map
  for (const [skill, transferable] of Object.entries(transfers)) {
    if (
      skill.toLowerCase() === resumeSkillLower &&
      transferable.some((t) => t.toLowerCase() === targetSkillLower)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Find transferable skills from resume that could apply to missing skills
 */
export function findTransferableSkills(
  resumeSkills: string[],
  missingSkills: string[]
): string[] {
  const transferable = new Set<string>();

  for (const resumeSkill of resumeSkills) {
    for (const missingSkill of missingSkills) {
      if (areSkillsTransferable(resumeSkill, missingSkill)) {
        transferable.add(resumeSkill);
      }
    }
  }

  return Array.from(transferable);
}

// ==================== Utility Functions ====================

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== Export ====================

export {
  extractAllSkills,
  extractAllTools,
  extractTitles,
  extractCompanies,
  inferIndustries,
  detectSkillsInText as detectSkills,
};
