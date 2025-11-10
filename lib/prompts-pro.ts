/**
 * PRO Resume Analysis - Enhanced Prompts
 *
 * This module contains enhanced prompts for AI-powered resume analysis
 * that leverage the PRO scoring system for more accurate and detailed feedback.
 */

import { ScoringResult } from './scoring/types';

/**
 * Generate enhanced resume analysis prompt that includes PRO scoring data
 */
export function generatePROAnalysisPrompt(
  resumeText: string,
  scoringResult: ScoringResult
): string {
  return `You are an expert resume reviewer and career coach with deep knowledge of ATS systems,
recruiting best practices, and modern hiring trends.

RESUME TEXT:
${resumeText}

COMPREHENSIVE SCORING ANALYSIS:
- Overall Score: ${scoringResult.overallScore}/100 (Grade: ${scoringResult.grade})
- ATS Pass Probability: ${scoringResult.atsPassProbability}%

COMPONENT BREAKDOWN:
1. Content Quality: ${scoringResult.componentScores.contentQuality.score}/100 (${scoringResult.componentScores.contentQuality.weight}% weight)
   - Achievement Quantification: ${scoringResult.componentScores.contentQuality.breakdown.achievementQuantification.score}/100
     ${scoringResult.componentScores.contentQuality.breakdown.achievementQuantification.details}
   - Action Verb Strength: ${scoringResult.componentScores.contentQuality.breakdown.actionVerbStrength.score}/100
     Strong verbs: ${scoringResult.componentScores.contentQuality.breakdown.actionVerbStrength.strongVerbsFound.join(', ')}
     Weak verbs to replace: ${scoringResult.componentScores.contentQuality.breakdown.actionVerbStrength.weakVerbsFound.join(', ')}

2. ATS Compatibility: ${scoringResult.componentScores.atsCompatibility.score}/100 (${scoringResult.componentScores.atsCompatibility.weight}% weight)
   - Keyword Density: ${scoringResult.componentScores.atsCompatibility.breakdown.keywordDensity.score}/100
   - Missing Critical Keywords: ${scoringResult.atsDetailedReport.keywordGapAnalysis.mustHave.missing.slice(0, 5).join(', ')}
   - Format Issues: ${scoringResult.atsDetailedReport.formatIssues.length} issue(s) detected

3. Format & Structure: ${scoringResult.componentScores.formatStructure.score}/100 (${scoringResult.componentScores.formatStructure.weight}% weight)
   - Length: ${scoringResult.componentScores.formatStructure.breakdown.lengthOptimization.pageCount} pages (${scoringResult.componentScores.formatStructure.breakdown.lengthOptimization.verdict})

4. Impact & Metrics: ${scoringResult.componentScores.impactMetrics.score}/100 (${scoringResult.componentScores.impactMetrics.weight}% weight)
   - Quantified Results: ${scoringResult.componentScores.impactMetrics.breakdown.quantifiedResults.percentage}% of bullets

IMPROVEMENT PRIORITIES:
${scoringResult.improvementRoadmap.toReach80.slice(0, 5).map((action, i) =>
  `${i + 1}. ${action.action} (+${action.pointsGain} points, ~${action.time})`
).join('\n')}

YOUR TASK:
Provide a comprehensive, actionable review in the following JSON format:

{
  "overview": {
    "summary": "A 2-3 sentence executive summary highlighting the biggest strengths and most critical areas for improvement",
    "overall_score": ${scoringResult.overallScore},
    "seniority_level": "Entry-level / Mid-level / Senior / Executive (based on content)",
    "fit_for_roles": ["List 3-5 specific job titles this resume is best suited for"]
  },
  "sections": {
    "experience": {
      "score": 85,
      "strengths": [
        "Specific strength with example",
        "Another strength"
      ],
      "issues": [
        "Specific issue with actionable fix",
        "Another issue"
      ]
    },
    "skills": {
      "score": 75,
      "missing_technologies": ["Technology 1", "Technology 2"]
    },
    "education": {
      "score": 90,
      "suggestions": ["Specific suggestion"]
    },
    "formatting": {
      "score": ${scoringResult.componentScores.atsCompatibility.breakdown.formatCompatibility.score},
      "issues": ${JSON.stringify(scoringResult.atsDetailedReport.formatIssues.map(i => i.issue))}
    }
  },
  "ats_analysis": {
    "keyword_density": {
      "total_keywords": ${Object.keys(scoringResult.atsDetailedReport.keywordGapAnalysis.keywordFrequency).length},
      "top_keywords": ${JSON.stringify(Object.entries(scoringResult.atsDetailedReport.keywordGapAnalysis.keywordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([k]) => k))}
    },
    "ats_pass_rate": ${scoringResult.atsPassProbability}
  },
  "improvement_actions": [
    "Most impactful action item",
    "Second most impactful",
    "Third most impactful",
    "Fourth action",
    "Fifth action"
  ]
}

GUIDELINES:
- Be specific and actionable - avoid generic advice
- Reference actual content from the resume in your feedback
- Prioritize fixes that will have the biggest impact on ATS pass rate and overall score
- Balance positive feedback with constructive criticism
- Focus on the data-driven insights from the scoring system
- Ensure all scores are realistic and justified
- Use the improvement priorities list to inform your recommendations`;
}

/**
 * Generate prompt for quick resume screening (lighter analysis)
 */
export function generateQuickScreenPrompt(resumeText: string): string {
  return `You are an ATS system and resume screener. Quickly analyze this resume and provide:

1. ATS Pass/Fail verdict with confidence level
2. Top 3 strengths
3. Top 3 red flags or issues
4. Recommended next steps

RESUME:
${resumeText}

Keep your response concise and actionable.`;
}

/**
 * Generate prompt for keyword optimization suggestions
 */
export function generateKeywordOptimizationPrompt(
  resumeText: string,
  targetRole: string,
  missingKeywords: string[]
): string {
  return `You are a resume optimization expert specializing in ATS keyword optimization.

TARGET ROLE: ${targetRole}

RESUME TEXT:
${resumeText}

MISSING CRITICAL KEYWORDS:
${missingKeywords.join(', ')}

YOUR TASK:
For each missing keyword, suggest:
1. Where in the resume it could naturally be added
2. Example sentence/bullet that incorporates the keyword authentically
3. Why this keyword is important for the role

Provide 5 specific, actionable recommendations that will improve ATS pass rate.`;
}

/**
 * Generate prompt for bullet point improvement
 */
export function generateBulletPointImprovementPrompt(
  bullets: string[],
  weakBullets: string[]
): string {
  return `You are a resume writing expert. Review these bullet points and suggest improvements.

CURRENT BULLETS:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

WEAK BULLETS NEEDING IMPROVEMENT:
${weakBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

For each weak bullet, provide:
1. What's wrong with it (weak verb, no metrics, too vague, etc.)
2. Improved version using STAR method (Situation, Task, Action, Result)
3. Why the improved version is better

Focus on:
- Strong action verbs
- Quantifiable metrics
- Specific outcomes and impact
- Clarity and conciseness (15-25 words per bullet)`;
}

/**
 * Generate comprehensive improvement plan prompt
 */
export function generateImprovementPlanPrompt(
  resumeText: string,
  scoringResult: ScoringResult,
  targetScore: number
): string {
  const currentScore = scoringResult.overallScore;
  const gap = targetScore - currentScore;

  return `You are a resume improvement strategist. Create a detailed action plan to improve this resume
from ${currentScore}/100 to ${targetScore}/100.

CURRENT SCORING:
${JSON.stringify(scoringResult.componentScores, null, 2)}

CURRENT ROADMAP:
${JSON.stringify(scoringResult.improvementRoadmap, null, 2)}

Create a prioritized action plan with:
1. Quick wins (30min or less) - immediate improvements
2. Medium-term improvements (1-2 hours) - substantial upgrades
3. Long-term improvements (3+ hours) - major revisions

For each action:
- Specific task
- Expected score improvement
- Time estimate
- Detailed instructions
- Example before/after

Focus on closing the ${gap}-point gap efficiently.`;
}

/**
 * Default system prompt for resume analysis
 */
export const DEFAULT_SYSTEM_PROMPT = `You are an expert resume reviewer and ATS optimization specialist with 10+ years of experience
in recruiting, talent acquisition, and career coaching. You have deep knowledge of:

- Applicant Tracking Systems (ATS) and how they parse resumes
- Modern resume best practices and industry standards
- Action verbs, achievement quantification, and impact-driven writing
- Keyword optimization for different roles and industries
- Resume formatting and structure for maximum readability

You provide specific, actionable, data-driven feedback that helps candidates improve their resumes
and increase their chances of passing ATS screening and landing interviews. Your advice is:
- Concrete and specific (with examples)
- Prioritized by impact
- Balanced (strengths and areas for improvement)
- Professional and constructive
- Based on current hiring trends and best practices`;
