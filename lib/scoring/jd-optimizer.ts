/**
 * PRO Resume Scoring System - Job Description Optimizer
 *
 * This module provides job-specific optimization by comparing resume content
 * against a specific job description. It uses TF-IDF (Term Frequency-Inverse
 * Document Frequency) for keyword extraction and matching analysis.
 *
 * Key features:
 * - Extract critical keywords from job descriptions
 * - Calculate resume-JD match score
 * - Identify missing, underrepresented, and irrelevant keywords
 * - Generate AI-powered phrase suggestions for improvement
 */

import { extractWords, removeStopWords, normalizeText } from './analyzers';
import { analyzeResumeWithAI } from '../openai';

// ==================== Type Definitions ====================

/**
 * Result of job description matching analysis
 */
export interface JDMatchResult {
  /** Overall match score (0-100) */
  match_score: number;

  /** Critical keywords missing from resume */
  missing_critical: string[];

  /** Keywords present but underrepresented (low frequency) */
  underrepresented: string[];

  /** Keywords in resume but not in JD (potentially irrelevant) */
  irrelevant: string[];

  /** AI-generated phrase suggestions to improve match */
  suggested_phrases: string[];

  /** Detailed keyword analysis */
  keyword_analysis: {
    /** Total keywords extracted from JD */
    total_jd_keywords: number;

    /** Keywords found in resume */
    matched_keywords: number;

    /** Match ratio (0-1) */
    match_ratio: number;

    /** Keyword frequency comparison */
    frequency_comparison: Array<{
      keyword: string;
      jd_score: number;
      resume_score: number;
      status: 'matched' | 'missing' | 'underrepresented';
    }>;
  };

  /** Category-based breakdown */
  category_scores?: {
    technical_skills: number;
    soft_skills: number;
    tools_technologies: number;
    domain_knowledge: number;
  };
}

/**
 * TF-IDF scoring result for keywords
 */
interface TFIDFScore {
  term: string;
  score: number;
  frequency: number;
}

// ==================== TF-IDF Implementation ====================

/**
 * Calculate Term Frequency for a term in a document
 * TF = (Number of times term appears) / (Total number of terms)
 */
function calculateTF(term: string, document: string[]): number {
  const termCount = document.filter(word => word === term).length;
  return termCount / document.length;
}

/**
 * Calculate Inverse Document Frequency
 * For single document analysis, we use term uniqueness as proxy
 * IDF approximation = log(total_words / (1 + term_frequency))
 */
function calculateIDF(term: string, document: string[], allWords: string[]): number {
  const termFrequency = document.filter(word => word === term).length;
  const totalWords = allWords.length;

  // Prevent division by zero and add smoothing
  return Math.log((totalWords + 1) / (termFrequency + 1));
}

/**
 * Calculate TF-IDF score for a term
 * TF-IDF = TF * IDF
 */
function calculateTFIDF(term: string, document: string[], allWords: string[]): number {
  const tf = calculateTF(term, document);
  const idf = calculateIDF(term, document, allWords);
  return tf * idf;
}

/**
 * Extract top keywords from text using TF-IDF
 *
 * @param text - Input text (job description or resume)
 * @param topN - Number of top keywords to return
 * @returns Array of keywords sorted by TF-IDF score
 */
export function extractKeywordsWithTFIDF(
  text: string,
  topN: number = 30
): TFIDFScore[] {
  // Preprocess text
  const normalizedText = normalizeText(text);
  const words = extractWords(text);

  // Calculate frequency for each unique word
  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  // Get unique words
  const uniqueWords = Object.keys(wordFrequency);

  // Calculate TF-IDF for each unique word
  const tfidfScores: TFIDFScore[] = uniqueWords.map(word => ({
    term: word,
    score: calculateTFIDF(word, words, words),
    frequency: wordFrequency[word],
  }));

  // Sort by score (descending) and return top N
  return tfidfScores
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .filter(item => item.term.length > 2); // Filter out very short terms
}

/**
 * Extract multi-word phrases (bigrams and trigrams) from text
 *
 * @param text - Input text
 * @param minFrequency - Minimum frequency for a phrase to be included
 * @returns Array of phrases with frequencies
 */
function extractPhrases(
  text: string,
  minFrequency: number = 2
): Array<{ phrase: string; frequency: number }> {
  const normalizedText = normalizeText(text);
  const words = normalizedText.split(/\s+/).filter(w => w.length > 2);

  const phrases: Record<string, number> = {};

  // Extract bigrams (2-word phrases)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    phrases[bigram] = (phrases[bigram] || 0) + 1;
  }

  // Extract trigrams (3-word phrases)
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    phrases[trigram] = (phrases[trigram] || 0) + 1;
  }

  // Filter by frequency and return
  return Object.entries(phrases)
    .filter(([_, freq]) => freq >= minFrequency)
    .map(([phrase, frequency]) => ({ phrase, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
}

// ==================== Keyword Matching ====================

/**
 * Calculate keyword match between resume and job description
 *
 * @param resumeKeywords - Keywords extracted from resume
 * @param jdKeywords - Keywords extracted from job description
 * @returns Match analysis with details
 */
function analyzeKeywordMatch(
  resumeKeywords: TFIDFScore[],
  jdKeywords: TFIDFScore[]
): {
  matched: string[];
  missing: string[];
  underrepresented: Array<{ keyword: string; jd_score: number; resume_score: number }>;
  matchRatio: number;
} {
  const resumeKeywordMap = new Map(resumeKeywords.map(k => [k.term, k.score]));
  const jdKeywordMap = new Map(jdKeywords.map(k => [k.term, k.score]));

  const matched: string[] = [];
  const missing: string[] = [];
  const underrepresented: Array<{ keyword: string; jd_score: number; resume_score: number }> = [];

  // Check each JD keyword
  for (const jdKeyword of jdKeywords) {
    const resumeScore = resumeKeywordMap.get(jdKeyword.term);

    if (resumeScore === undefined) {
      // Keyword not in resume at all
      missing.push(jdKeyword.term);
    } else if (resumeScore < jdKeyword.score * 0.5) {
      // Keyword present but frequency is less than 50% of JD frequency
      underrepresented.push({
        keyword: jdKeyword.term,
        jd_score: jdKeyword.score,
        resume_score: resumeScore,
      });
      matched.push(jdKeyword.term);
    } else {
      // Keyword well-represented
      matched.push(jdKeyword.term);
    }
  }

  const matchRatio = matched.length / jdKeywords.length;

  return {
    matched,
    missing,
    underrepresented,
    matchRatio,
  };
}

/**
 * Identify irrelevant keywords (in resume but not in JD)
 *
 * @param resumeKeywords - Keywords from resume
 * @param jdKeywords - Keywords from job description
 * @param threshold - Score threshold for considering a keyword significant
 * @returns List of potentially irrelevant keywords
 */
function findIrrelevantKeywords(
  resumeKeywords: TFIDFScore[],
  jdKeywords: TFIDFScore[],
  threshold: number = 0.1
): string[] {
  const jdKeywordSet = new Set(jdKeywords.map(k => k.term));

  return resumeKeywords
    .filter(k => k.score > threshold && !jdKeywordSet.has(k.term))
    .map(k => k.term)
    .slice(0, 10); // Limit to top 10
}

// ==================== AI-Powered Suggestions ====================

/**
 * Generate AI-powered phrase suggestions to improve JD match
 *
 * @param resumeText - Resume text
 * @param jobDescription - Job description text
 * @param missingKeywords - Keywords missing from resume
 * @returns Array of suggested phrases to add
 */
export async function generatePhraseSuggestions(
  resumeText: string,
  jobDescription: string,
  missingKeywords: string[]
): Promise<string[]> {
  // For now, return template suggestions
  // In production, this would call an AI model

  const suggestions: string[] = [];

  // Generate suggestions based on missing keywords
  for (const keyword of missingKeywords.slice(0, 5)) {
    // Template-based suggestion (AI would generate more contextual ones)
    suggestions.push(
      `Add "${keyword}" to your skills section or incorporate it into relevant bullet points`
    );
  }

  // Add contextual suggestions
  if (missingKeywords.length > 5) {
    suggestions.push(
      `Consider adding ${missingKeywords.length - 5} more keywords: ${missingKeywords.slice(5, 8).join(', ')}`
    );
  }

  suggestions.push(
    'Review the job description and align your experience bullet points with the required qualifications'
  );

  return suggestions;

  // TODO: Implement actual AI-powered suggestion generation
  // Example implementation:
  // const prompt = `Generate 3-5 specific phrase suggestions...`;
  // const aiResponse = await callAIModel(prompt);
  // return aiResponse.suggestions;
}

// ==================== Main Analysis Function ====================

/**
 * Analyze job description match for a resume
 *
 * This is the main function that performs comprehensive JD matching analysis:
 * 1. Extracts keywords from both resume and JD using TF-IDF
 * 2. Calculates match score
 * 3. Identifies missing, underrepresented, and irrelevant keywords
 * 4. Generates AI-powered improvement suggestions
 *
 * @param resumeText - Full text of the resume
 * @param jobDescription - Full text of the job description
 * @returns Complete JD match analysis result
 *
 * @example
 * ```typescript
 * const result = await analyzeJDMatch(resumeText, jdText);
 * console.log(`Match Score: ${result.match_score}%`);
 * console.log(`Missing Keywords: ${result.missing_critical.join(', ')}`);
 * ```
 */
export async function analyzeJDMatch(
  resumeText: string,
  jobDescription: string
): Promise<JDMatchResult> {
  // Validate inputs
  if (!resumeText || resumeText.trim().length < 100) {
    throw new Error('Invalid resume text: too short or empty');
  }
  if (!jobDescription || jobDescription.trim().length < 50) {
    throw new Error('Invalid job description: too short or empty');
  }

  // Extract keywords using TF-IDF
  const resumeKeywords = extractKeywordsWithTFIDF(resumeText, 50);
  const jdKeywords = extractKeywordsWithTFIDF(jobDescription, 40);

  // Analyze keyword match
  const matchAnalysis = analyzeKeywordMatch(resumeKeywords, jdKeywords);

  // Calculate match score (0-100)
  const baseScore = matchAnalysis.matchRatio * 100;

  // Apply penalties for missing critical keywords
  const missingPenalty = Math.min(matchAnalysis.missing.length * 2, 20);
  const underrepresentedPenalty = Math.min(matchAnalysis.underrepresented.length * 1, 10);

  const match_score = Math.max(
    0,
    Math.round(baseScore - missingPenalty - underrepresentedPenalty)
  );

  // Identify irrelevant keywords
  const irrelevant = findIrrelevantKeywords(resumeKeywords, jdKeywords);

  // Generate AI-powered suggestions
  const suggested_phrases = await generatePhraseSuggestions(
    resumeText,
    jobDescription,
    matchAnalysis.missing
  );

  // Build detailed keyword analysis
  const frequency_comparison = jdKeywords.map(jdKw => {
    const resumeKw = resumeKeywords.find(rw => rw.term === jdKw.term);

    let status: 'matched' | 'missing' | 'underrepresented';
    if (!resumeKw) {
      status = 'missing';
    } else if (resumeKw.score < jdKw.score * 0.5) {
      status = 'underrepresented';
    } else {
      status = 'matched';
    }

    return {
      keyword: jdKw.term,
      jd_score: Math.round(jdKw.score * 100) / 100,
      resume_score: resumeKw ? Math.round(resumeKw.score * 100) / 100 : 0,
      status,
    };
  });

  // Build result
  const result: JDMatchResult = {
    match_score,
    missing_critical: matchAnalysis.missing.slice(0, 10),
    underrepresented: matchAnalysis.underrepresented.slice(0, 8).map(u => u.keyword),
    irrelevant: irrelevant.slice(0, 8),
    suggested_phrases,
    keyword_analysis: {
      total_jd_keywords: jdKeywords.length,
      matched_keywords: matchAnalysis.matched.length,
      match_ratio: Math.round(matchAnalysis.matchRatio * 100) / 100,
      frequency_comparison: frequency_comparison.slice(0, 20), // Top 20
    },
  };

  return result;
}

// ==================== Helper Functions ====================

/**
 * Quick keyword density check (lighter version of full analysis)
 *
 * @param resumeText - Resume text
 * @param requiredKeywords - List of required keywords
 * @returns Simple match percentage
 */
export function quickKeywordCheck(
  resumeText: string,
  requiredKeywords: string[]
): number {
  const normalizedResume = normalizeText(resumeText);
  let matchCount = 0;

  for (const keyword of requiredKeywords) {
    const normalizedKeyword = keyword.toLowerCase();
    const pattern = new RegExp(`\\b${normalizedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'i');

    if (pattern.test(normalizedResume)) {
      matchCount++;
    }
  }

  return Math.round((matchCount / requiredKeywords.length) * 100);
}

/**
 * Extract industry-specific terms from job description
 *
 * @param jobDescription - Job description text
 * @returns Object with categorized terms
 */
export function extractIndustryTerms(jobDescription: string): {
  technical: string[];
  soft_skills: string[];
  tools: string[];
} {
  // Common patterns for technical terms
  const technicalPatterns = [
    /\b[A-Z]{2,}\b/g, // Acronyms (API, SQL, AWS)
    /\b\w+\.js\b/g, // JS frameworks
    /\b\w+Script\b/g, // TypeScript, JavaScript
  ];

  // Common soft skills
  const softSkillKeywords = [
    'leadership', 'communication', 'teamwork', 'collaboration',
    'problem-solving', 'analytical', 'strategic', 'creative',
  ];

  const normalizedJD = jobDescription.toLowerCase();
  const words = extractWords(jobDescription);

  // Extract technical terms
  const technical: Set<string> = new Set();
  technicalPatterns.forEach(pattern => {
    const matches = jobDescription.match(pattern);
    if (matches) {
      matches.forEach(match => technical.add(match));
    }
  });

  // Extract soft skills
  const soft_skills = softSkillKeywords.filter(skill =>
    normalizedJD.includes(skill)
  );

  // Tools are typically capitalized or have specific patterns
  const tools = words.filter(word => {
    return (
      word.length > 2 &&
      (word[0] === word[0].toUpperCase() || word.includes('.'))
    );
  }).slice(0, 15);

  return {
    technical: Array.from(technical).slice(0, 15),
    soft_skills,
    tools,
  };
}

/**
 * Calculate keyword density score
 *
 * @param text - Text to analyze
 * @param keywords - Keywords to check
 * @returns Density score (0-100)
 */
export function calculateKeywordDensity(text: string, keywords: string[]): number {
  const normalizedText = normalizeText(text);
  const totalWords = extractWords(text).length;

  let keywordCount = 0;
  for (const keyword of keywords) {
    const pattern = new RegExp(`\\b${keyword.toLowerCase().replace(/\s+/g, '\\s+')}\\b`, 'g');
    const matches = normalizedText.match(pattern);
    keywordCount += matches ? matches.length : 0;
  }

  // Calculate density as percentage
  const density = (keywordCount / totalWords) * 100;

  // Normalize to 0-100 scale (optimal density is 2-5%)
  if (density < 2) return Math.round(density * 25); // Below optimal
  if (density > 5) return Math.max(50, 100 - (density - 5) * 10); // Over-optimization penalty
  return 100; // Optimal range
}
