/**
 * Layer 1 - Evaluation Engine
 * Resume Parser
 *
 * Handles parsing of PDF, DOCX, and plain text resumes
 * into a structured ParsedResume format.
 */

import type {
  ResumeInput,
  ParsedResume,
  PersonalInfo,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  CertificationEntry,
  CourseEntry,
  DocumentMetadata,
  ParseQuality,
} from './types';
import {
  EvaluationError,
  EvaluationErrorCode,
} from './errors';
import { extractTextFromBuffer } from '@/lib/pdfParser';
import { SECTION_PATTERNS, JOB_TITLE_KEYWORDS } from './config/weights';

// ==================== Constants ====================

const MIN_CONTENT_LENGTH = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Email and phone patterns
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN = /(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}/;
const LINKEDIN_PATTERN = /(?:linkedin\.com\/in\/|linkedin:?\s*)([a-zA-Z0-9-]+)/i;
const GITHUB_PATTERN = /(?:github\.com\/|github:?\s*)([a-zA-Z0-9-]+)/i;

// Date patterns - Note: Using 'i' flag only to avoid stateful lastIndex bug with 'g' flag
const DATE_PATTERN = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*,?\s*)?(?:19|20)\d{2}|\d{1,2}\/(?:19|20)?\d{2}|Present|Current|Now/i;
// Global version for matchAll and replace operations
const DATE_PATTERN_GLOBAL = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*,?\s*)?(?:19|20)\d{2}|\d{1,2}\/(?:19|20)?\d{2}|Present|Current|Now/gi;

// ==================== Main Parser Function ====================

/**
 * Parse resume file into structured format
 */
export async function parseResume(input: ResumeInput): Promise<ParsedResume> {
  // Validate input
  validateInput(input);

  // Extract text based on format
  const text = await extractText(input);

  // Validate extracted text
  if (!text || text.length < MIN_CONTENT_LENGTH) {
    throw new EvaluationError(EvaluationErrorCode.CONTENT_TOO_SHORT, {
      extractedLength: text?.length || 0,
      minimumRequired: MIN_CONTENT_LENGTH,
    });
  }

  // Parse sections
  const sections = detectSections(text);
  
  // Extract structured data
  const personal = extractPersonalInfo(text, sections);
  const experiences = extractExperiences(text, sections);
  const education = extractEducation(text, sections);
  const skills = extractSkills(text, sections);
  const projects = extractProjects(text, sections);
  const certifications = extractCertifications(text, sections);
  const courses = extractCourses(text, sections);

  // Calculate metadata (including raw_text for caching)
  const metadata = calculateMetadata(text, input);

  return {
    personal,
    experiences,
    education,
    skills,
    projects: projects.length > 0 ? projects : undefined,
    certifications: certifications.length > 0 ? certifications : undefined,
    courses: courses.length > 0 ? courses : undefined,
    metadata: {
      ...metadata,
      raw_text: text, // Cache the raw text to avoid re-parsing
    },
  };
}

// ==================== Input Validation ====================

function validateInput(input: ResumeInput): void {
  if (!input.content) {
    throw new EvaluationError(EvaluationErrorCode.NO_CONTENT);
  }

  const contentSize = typeof input.content === 'string' 
    ? input.content.length 
    : input.content.length;

  if (contentSize > MAX_FILE_SIZE) {
    throw new EvaluationError(EvaluationErrorCode.FILE_TOO_LARGE, {
      size: contentSize,
      maxSize: MAX_FILE_SIZE,
    });
  }

  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (!supportedTypes.includes(input.mimeType)) {
    throw new EvaluationError(EvaluationErrorCode.UNSUPPORTED_FORMAT, {
      provided: input.mimeType,
      supported: supportedTypes,
    });
  }
}

// ==================== Text Extraction ====================

async function extractText(input: ResumeInput): Promise<string> {
  try {
    if (input.mimeType === 'text/plain') {
      return typeof input.content === 'string' 
        ? input.content 
        : input.content.toString('utf-8');
    }

    if (input.mimeType === 'application/pdf') {
      const buffer = typeof input.content === 'string'
        ? Buffer.from(input.content, 'base64')
        : input.content;

      const result = await extractTextFromBuffer(buffer);
      
      if (result.status === 'failed') {
        throw new EvaluationError(EvaluationErrorCode.PARSING_FAILED, {
          reason: result.message,
          method: result.method,
        });
      }

      return result.text;
    }

    if (input.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX, we'll use a simple extraction approach
      // In production, you'd use mammoth or docx library
      const buffer = typeof input.content === 'string'
        ? Buffer.from(input.content, 'base64')
        : input.content;

      return await extractDocxText(buffer);
    }

    throw new EvaluationError(EvaluationErrorCode.UNSUPPORTED_FORMAT);
  } catch (error) {
    if (error instanceof EvaluationError) {
      throw error;
    }
    throw new EvaluationError(EvaluationErrorCode.PARSING_FAILED, {
      originalError: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Extract text from DOCX buffer
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for mammoth
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch {
    // Fallback: try to extract text directly from XML
    // DOCX files are ZIP archives containing XML
    const text = buffer.toString('utf-8');
    // Remove XML tags and clean up
    const cleanedText = text
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanedText.length < MIN_CONTENT_LENGTH) {
      throw new EvaluationError(EvaluationErrorCode.PARSING_FAILED, {
        reason: 'Could not extract text from DOCX file',
      });
    }
    
    return cleanedText;
  }
}

// ==================== Section Detection ====================

interface DetectedSections {
  experience?: { start: number; end: number };
  education?: { start: number; end: number };
  skills?: { start: number; end: number };
  projects?: { start: number; end: number };
  certifications?: { start: number; end: number };
  summary?: { start: number; end: number };
}

function detectSections(text: string): DetectedSections {
  const sections: DetectedSections = {};
  const lines = text.split('\n');
  
  const sectionStarts: { name: keyof DetectedSections; line: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;

    // Check each section type
    for (const [sectionName, patterns] of Object.entries(SECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          sectionStarts.push({
            name: sectionName as keyof DetectedSections,
            line: i,
          });
          break;
        }
      }
    }
  }

  // Calculate section boundaries
  for (let i = 0; i < sectionStarts.length; i++) {
    const current = sectionStarts[i];
    const next = sectionStarts[i + 1];
    
    const startPos = lines.slice(0, current.line).join('\n').length;
    const endPos = next 
      ? lines.slice(0, next.line).join('\n').length 
      : text.length;

    sections[current.name] = { start: startPos, end: endPos };
  }

  return sections;
}

function getSectionText(text: string, sections: DetectedSections, sectionName: keyof DetectedSections): string | null {
  const section = sections[sectionName];
  if (!section) return null;
  return text.substring(section.start, section.end);
}

// ==================== Personal Info Extraction ====================

function extractPersonalInfo(text: string, sections: DetectedSections): PersonalInfo {
  // Look in the first part of the resume (before first section)
  const firstSectionStart = Math.min(
    ...Object.values(sections).map(s => s?.start ?? Infinity)
  );
  const headerText = firstSectionStart < Infinity 
    ? text.substring(0, firstSectionStart) 
    : text.substring(0, 500);

  const personal: PersonalInfo = {};

  // Extract email
  const emailMatch = text.match(EMAIL_PATTERN);
  if (emailMatch) {
    personal.email = emailMatch[0];
  }

  // Extract phone
  const phoneMatch = text.match(PHONE_PATTERN);
  if (phoneMatch) {
    personal.phone = phoneMatch[0];
  }

  // Extract LinkedIn
  const linkedinMatch = text.match(LINKEDIN_PATTERN);
  if (linkedinMatch) {
    personal.linkedin = `linkedin.com/in/${linkedinMatch[1]}`;
  }

  // Extract GitHub
  const githubMatch = text.match(GITHUB_PATTERN);
  if (githubMatch) {
    personal.github = `github.com/${githubMatch[1]}`;
  }

  // Extract name (usually first non-empty line that's not an email/phone)
  const lines = headerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines) {
    // Skip if it looks like email, phone, or URL
    if (EMAIL_PATTERN.test(line) || PHONE_PATTERN.test(line) || /https?:\/\//.test(line)) {
      continue;
    }
    // Name is usually short and doesn't contain numbers (except in addresses)
    if (line.length < 50 && !/\d{3,}/.test(line)) {
      personal.name = line;
      break;
    }
  }

  // Extract location (look for city, state pattern)
  const locationPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})\b/;
  const locationMatch = headerText.match(locationPattern);
  if (locationMatch) {
    personal.location = `${locationMatch[1]}, ${locationMatch[2]}`;
  }

  return personal;
}

// ==================== Experience Extraction ====================

function extractExperiences(text: string, sections: DetectedSections): ExperienceEntry[] {
  const experienceText = getSectionText(text, sections, 'experience');
  if (!experienceText) {
    // Try to find experiences without section header
    return extractExperiencesFromText(text);
  }
  return extractExperiencesFromText(experienceText);
}

function extractExperiencesFromText(text: string): ExperienceEntry[] {
  const experiences: ExperienceEntry[] = [];
  const lines = text.split('\n');
  
  let currentExperience: Partial<ExperienceEntry> | null = null;
  let currentBullets: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if this looks like a job title line
    const isJobLine = isLikelyJobTitle(trimmedLine);
    const hasDates = DATE_PATTERN.test(trimmedLine);

    if ((isJobLine || hasDates) && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
      // Save previous experience if exists
      if (currentExperience && currentExperience.title) {
        experiences.push(finalizeExperience(currentExperience, currentBullets));
      }

      // Start new experience
      const { title, company, dates } = parseJobLine(trimmedLine);
      currentExperience = {
        title: title || 'Unknown Role',
        company: company || 'Unknown Company',
        ...dates,
      };
      currentBullets = [];
    } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
      // Add bullet point
      const bulletText = trimmedLine.replace(/^[•\-*]\s*/, '').trim();
      if (bulletText.length > 10) {
        currentBullets.push(bulletText);
      }
    } else if (currentExperience && trimmedLine.length > 20) {
      // Might be a continuation of description or a bullet without marker
      currentBullets.push(trimmedLine);
    }
  }

  // Save last experience
  if (currentExperience && currentExperience.title) {
    experiences.push(finalizeExperience(currentExperience, currentBullets));
  }

  return experiences;
}

function isLikelyJobTitle(line: string): boolean {
  const lineLower = line.toLowerCase();
  return JOB_TITLE_KEYWORDS.some(kw => lineLower.includes(kw));
}

function parseJobLine(line: string): {
  title: string | null;
  company: string | null;
  dates: { start_date: string; end_date: string; duration_months: number; is_current: boolean };
} {
  // Extract dates
  const dateMatches = line.match(DATE_PATTERN_GLOBAL);
  const dates = {
    start_date: dateMatches?.[0] || '',
    end_date: dateMatches?.[1] || dateMatches?.[0] || 'Present',
    duration_months: 0,
    is_current: /present|current|now/i.test(line),
  };

  // Try to parse dates for duration
  if (dateMatches && dateMatches.length >= 1) {
    dates.duration_months = estimateDuration(dateMatches);
  }

  // Remove dates from line to parse title/company
  let cleanLine = line.replace(DATE_PATTERN_GLOBAL, '').trim();
  cleanLine = cleanLine.replace(/[|–—\-]+/g, '|').trim();
  
  // Try common formats: "Title at Company" or "Title | Company" or "Company - Title"
  const parts = cleanLine.split(/\s*[|@,]\s*/);
  
  if (parts.length >= 2) {
    return {
      title: parts[0].trim(),
      company: parts[1].trim(),
      dates,
    };
  }

  return {
    title: cleanLine,
    company: null,
    dates,
  };
}

function estimateDuration(dateMatches: RegExpMatchArray): number {
  // Simple estimation - each date range represents roughly 24 months if we can't parse
  // In a production system, you'd parse dates properly
  const startStr = dateMatches[0];
  const endStr = dateMatches[1] || 'Present';
  
  if (/present|current|now/i.test(endStr)) {
    // Estimate from start to now
    const yearMatch = startStr.match(/(19|20)\d{2}/);
    if (yearMatch) {
      const startYear = parseInt(yearMatch[0]);
      const currentYear = new Date().getFullYear();
      return Math.max((currentYear - startYear) * 12, 12);
    }
  }
  
  // Default estimate
  return 24;
}

function finalizeExperience(
  partial: Partial<ExperienceEntry>,
  bullets: string[]
): ExperienceEntry {
  return {
    title: partial.title || 'Unknown Role',
    company: partial.company || 'Unknown Company',
    location: partial.location,
    start_date: partial.start_date || '',
    end_date: partial.end_date || 'Present',
    duration_months: partial.duration_months || 0,
    bullets: bullets.length > 0 ? bullets : ['No specific achievements listed'],
    is_current: partial.is_current || false,
  };
}

// ==================== Education Extraction ====================

function extractEducation(text: string, sections: DetectedSections): EducationEntry[] {
  const educationText = getSectionText(text, sections, 'education');
  const searchText = educationText || text;
  
  const education: EducationEntry[] = [];
  
  // Look for degree patterns
  const degreePatterns = [
    /(?:Bachelor|B\.?S\.?|B\.?A\.?|Master|M\.?S\.?|M\.?A\.?|MBA|Ph\.?D\.?|Doctor)/gi,
  ];

  const lines = searchText.split('\n');
  let currentEdu: Partial<EducationEntry> | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const hasDegree = degreePatterns.some(p => p.test(trimmedLine));
    
    if (hasDegree) {
      // Save previous if exists
      if (currentEdu && currentEdu.institution) {
        education.push(currentEdu as EducationEntry);
      }

      // Parse education line
      currentEdu = parseEducationLine(trimmedLine);
    } else if (currentEdu && !currentEdu.institution) {
      // This might be the institution line
      if (trimmedLine.length > 5 && !trimmedLine.startsWith('•')) {
        currentEdu.institution = trimmedLine;
      }
    }
  }

  // Save last entry
  if (currentEdu && currentEdu.degree) {
    education.push({
      degree: currentEdu.degree,
      field: currentEdu.field,
      institution: currentEdu.institution || 'Unknown Institution',
      graduation_year: currentEdu.graduation_year,
      gpa: currentEdu.gpa,
    });
  }

  return education;
}

function parseEducationLine(line: string): Partial<EducationEntry> {
  const entry: Partial<EducationEntry> = {};

  // Extract degree
  const degreeMatch = line.match(/(?:Bachelor|B\.?S\.?|B\.?A\.?|Master|M\.?S\.?|M\.?A\.?|MBA|Ph\.?D\.?|Doctor)(?:'s)?(?:\s+(?:of|in)\s+)?/i);
  if (degreeMatch) {
    entry.degree = degreeMatch[0].trim();
  }

  // Extract year
  const yearMatch = line.match(/(19|20)\d{2}/);
  if (yearMatch) {
    entry.graduation_year = parseInt(yearMatch[0]);
  }

  // Extract GPA
  const gpaMatch = line.match(/(?:GPA:?\s*)(\d\.\d{1,2})/i);
  if (gpaMatch) {
    entry.gpa = parseFloat(gpaMatch[1]);
  }

  // Extract field (after degree, before institution usually)
  const fieldMatch = line.match(/(?:in|of)\s+([A-Za-z\s]+?)(?:\s*,|\s*from|\s*at|\s*\d|$)/i);
  if (fieldMatch) {
    entry.field = fieldMatch[1].trim();
  }

  return entry;
}

// ==================== Skills Extraction ====================

function extractSkills(text: string, sections: DetectedSections): string[] {
  const skillsText = getSectionText(text, sections, 'skills');
  
  // Common skill delimiters
  const delimiters = /[,;|•\-\n]/;
  
  let rawSkills: string[] = [];
  
  if (skillsText) {
    // Split by delimiters and clean
    rawSkills = skillsText
      .split(delimiters)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 50);
  }

  // Also look for technologies mentioned in bullets
  const techPatterns = [
    /(?:using|with|in)\s+([A-Z][a-zA-Z+#.]+(?:\s*,\s*[A-Z][a-zA-Z+#.]+)*)/g,
    /(?:experience\s+(?:in|with))\s+([A-Z][a-zA-Z+#.]+)/gi,
  ];

  for (const pattern of techPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        const techs = match[1].split(/\s*,\s*/);
        rawSkills.push(...techs);
      }
    }
  }

  // Deduplicate and clean
  const uniqueSkills = new Set<string>();
  for (const skill of rawSkills) {
    const cleaned = skill.trim();
    if (cleaned.length > 1 && cleaned.length < 50) {
      uniqueSkills.add(cleaned);
    }
  }

  return Array.from(uniqueSkills);
}

// ==================== Projects Extraction ====================

function extractProjects(text: string, sections: DetectedSections): ProjectEntry[] {
  const projectsText = getSectionText(text, sections, 'projects');
  if (!projectsText) return [];

  const projects: ProjectEntry[] = [];
  const lines = projectsText.split('\n');

  let currentProject: Partial<ProjectEntry> | null = null;
  let description: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if this looks like a project name (short line, possibly with link)
    const isProjectName = trimmedLine.length < 60 && 
      !trimmedLine.startsWith('•') && 
      !trimmedLine.startsWith('-');

    if (isProjectName && !trimmedLine.match(SECTION_PATTERNS.projects[0])) {
      // Save previous project
      if (currentProject && currentProject.name) {
        currentProject.description = description.join(' ').trim();
        projects.push(currentProject as ProjectEntry);
      }

      currentProject = { name: trimmedLine };
      description = [];
    } else if (currentProject) {
      const cleanLine = trimmedLine.replace(/^[•\-*]\s*/, '').trim();
      if (cleanLine.length > 10) {
        description.push(cleanLine);
      }
    }
  }

  // Save last project
  if (currentProject && currentProject.name) {
    currentProject.description = description.join(' ').trim();
    projects.push(currentProject as ProjectEntry);
  }

  return projects;
}

// ==================== Certifications Extraction ====================

function extractCertifications(text: string, sections: DetectedSections): CertificationEntry[] {
  const certText = getSectionText(text, sections, 'certifications');
  const searchText = certText || text;
  
  const certifications: CertificationEntry[] = [];
  
  // Common certification patterns
  const certPatterns = [
    /(?:AWS|Google|Azure|Microsoft|Cisco|CompTIA|PMP|Scrum|CISSP|CEH|Oracle)\s+(?:Certified|Certification|Professional|Associate|Solutions)/gi,
    /Certified\s+[A-Z][a-zA-Z\s]+(?:Professional|Engineer|Developer|Administrator)/gi,
  ];

  for (const pattern of certPatterns) {
    const matches = Array.from(searchText.matchAll(pattern));
    for (const match of matches) {
      const certName = match[0].trim();
      // Avoid duplicates
      if (!certifications.some(c => c.name === certName)) {
        certifications.push({
          name: certName,
          issuer: extractIssuer(certName),
        });
      }
    }
  }

  return certifications;
}

function extractIssuer(certName: string): string {
  const issuers: Record<string, string> = {
    AWS: 'Amazon Web Services',
    Google: 'Google',
    Azure: 'Microsoft',
    Microsoft: 'Microsoft',
    Cisco: 'Cisco',
    CompTIA: 'CompTIA',
    PMP: 'PMI',
    Scrum: 'Scrum Alliance',
    CISSP: 'ISC²',
    Oracle: 'Oracle',
  };

  for (const [key, issuer] of Object.entries(issuers)) {
    if (certName.includes(key)) {
      return issuer;
    }
  }

  return 'Unknown';
}

// ==================== Courses Extraction ====================

function extractCourses(text: string, sections: DetectedSections): CourseEntry[] {
  const courses: CourseEntry[] = [];
  
  // Look for course patterns
  const coursePatterns = [
    /(?:Coursera|Udemy|edX|LinkedIn Learning|Udacity)(?:\s*[-–:]\s*)?([A-Za-z\s]+)/gi,
    /completed?\s+([A-Za-z\s]+)\s+(?:course|certification)/gi,
  ];

  for (const pattern of coursePatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const courseName = match[1]?.trim();
      if (courseName && courseName.length > 5) {
        courses.push({
          name: courseName,
          institution: extractPlatform(match[0]),
        });
      }
    }
  }

  return courses;
}

function extractPlatform(text: string): string {
  const platforms = ['Coursera', 'Udemy', 'edX', 'LinkedIn Learning', 'Udacity', 'Khan Academy'];
  for (const platform of platforms) {
    if (text.toLowerCase().includes(platform.toLowerCase())) {
      return platform;
    }
  }
  return 'Unknown';
}

// ==================== Metadata Calculation ====================

function calculateMetadata(text: string, input: ResumeInput): DocumentMetadata {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const pageCount = estimatePageCount(wordCount);
  const parseQuality = assessParseQuality(text, wordCount);

  return {
    page_count: pageCount,
    word_count: wordCount,
    has_tables: /\t.*\t/.test(text) || /│|┌|└/.test(text),
    has_images: false, // Would need PDF analysis to detect
    format: input.mimeType === 'application/pdf' 
      ? 'pdf' 
      : input.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ? 'docx'
        : 'txt',
    parse_quality: parseQuality,
  };
}

function estimatePageCount(wordCount: number): number {
  // Assume ~500 words per page for a resume
  return Math.max(1, Math.ceil(wordCount / 500));
}

function assessParseQuality(text: string, wordCount: number): ParseQuality {
  // Check for quality indicators
  const hasEmail = EMAIL_PATTERN.test(text);
  const hasPhone = PHONE_PATTERN.test(text);
  const hasBullets = /[•\-*]\s/.test(text);
  const hasReasonableLength = wordCount >= 200;
  const hasStructure = Object.values(SECTION_PATTERNS).some(patterns =>
    patterns.some(p => p.test(text))
  );

  const qualityScore = [hasEmail, hasPhone, hasBullets, hasReasonableLength, hasStructure]
    .filter(Boolean).length;

  if (qualityScore >= 4) return 'high';
  if (qualityScore >= 2) return 'medium';
  return 'low';
}

// ==================== Export ====================

export { parseResume as default };
