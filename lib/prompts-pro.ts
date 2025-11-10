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
  // Type-safe breakdown accessors
  const contentQuality = scoringResult.componentScores.contentQuality.breakdown as import('./scoring/types').ContentQualityBreakdown;
  const atsCompatibility = scoringResult.componentScores.atsCompatibility.breakdown as import('./scoring/types').ATSCompatibilityBreakdown;
  const formatStructure = scoringResult.componentScores.formatStructure.breakdown as import('./scoring/types').FormatStructureBreakdown;
  const impactMetrics = scoringResult.componentScores.impactMetrics.breakdown as import('./scoring/types').ImpactMetricsBreakdown;

  return `You are an expert resume reviewer and career coach with deep knowledge of ATS systems,
recruiting best practices, and modern hiring trends.

RESUME TEXT:
${resumeText}

COMPREHENSIVE SCORING ANALYSIS:
- Overall Score: ${scoringResult.overallScore}/100 (Grade: ${scoringResult.grade})
- ATS Pass Probability: ${scoringResult.atsPassProbability}%

COMPONENT BREAKDOWN:
1. Content Quality: ${scoringResult.componentScores.contentQuality.score}/100 (${scoringResult.componentScores.contentQuality.weight}% weight)
   - Achievement Quantification: ${contentQuality.achievementQuantification.score}/100
     ${contentQuality.achievementQuantification.details}
   - Action Verb Strength: ${contentQuality.actionVerbStrength.score}/100
     Strong verbs: ${contentQuality.actionVerbStrength.strongVerbsFound.join(', ')}
     Weak verbs to replace: ${contentQuality.actionVerbStrength.weakVerbsFound.join(', ')}

2. ATS Compatibility: ${scoringResult.componentScores.atsCompatibility.score}/100 (${scoringResult.componentScores.atsCompatibility.weight}% weight)
   - Keyword Density: ${atsCompatibility.keywordDensity.score}/100
   - Missing Critical Keywords: ${scoringResult.atsDetailedReport.keywordGapAnalysis.mustHave.missing.slice(0, 5).join(', ')}
   - Format Issues: ${scoringResult.atsDetailedReport.formatIssues.length} issue(s) detected

3. Format & Structure: ${scoringResult.componentScores.formatStructure.score}/100 (${scoringResult.componentScores.formatStructure.weight}% weight)
   - Length: ${formatStructure.lengthOptimization.pageCount} pages (${formatStructure.lengthOptimization.verdict})

4. Impact & Metrics: ${scoringResult.componentScores.impactMetrics.score}/100 (${scoringResult.componentScores.impactMetrics.weight}% weight)
   - Quantified Results: ${impactMetrics.quantifiedResults.percentage}% of bullets

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
      "score": ${atsCompatibility.formatCompatibility.score},
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

// ==================== PRO: AI Interpretation Layers ====================

/**
 * Generate AI Summary Layer prompt
 * Creates high-level interpretation of resume performance
 */
export function generateAISummaryPrompt(
  resumeText: string,
  scoringResult: ScoringResult
): string {
  return `You are an expert resume analyst. Provide a high-level executive summary of this resume.

RESUME TEXT:
${resumeText}

SCORING DATA:
- Overall Score: ${scoringResult.overallScore}/100 (${scoringResult.grade})
- Content Quality: ${scoringResult.componentScores.contentQuality.score}/100
- ATS Compatibility: ${scoringResult.componentScores.atsCompatibility.score}/100
- Format & Structure: ${scoringResult.componentScores.formatStructure.score}/100
- Impact & Metrics: ${scoringResult.componentScores.impactMetrics.score}/100
- ATS Pass Probability: ${scoringResult.atsPassProbability}%

Provide a JSON response with:
{
  "executive_summary": "2-3 sentence professional summary",
  "top_strengths": [
    {
      "title": "Strength title",
      "description": "Why this is strong",
      "evidence": "Specific example from resume"
    }
  ],
  "weakest_sections": [
    {
      "section": "Section name",
      "issue": "What's wrong",
      "impact": "Why it matters"
    }
  ],
  "performance_level": "Exceptional|Strong|Good|Fair|Needs Work",
  "seniority_level": "Entry-Level|Mid-Level|Senior|Lead|Executive"
}

Be concise, specific, and actionable. Focus on the most impactful insights.`;
}

/**
 * Generate AI Action Layer prompt
 * Creates specific rewrite suggestions and improvements
 */
export function generateAIActionPrompt(
  resumeText: string,
  scoringResult: ScoringResult
): string {
  // Type-safe breakdown accessors
  const contentQuality = scoringResult.componentScores.contentQuality.breakdown as import('./scoring/types').ContentQualityBreakdown;

  const bullets = resumeText
    .split('\n')
    .filter(line => line.trim().match(/^[-•*]\s+/))
    .slice(0, 10);

  return `You are an expert resume writer. Analyze this resume and provide specific, actionable improvements.

RESUME TEXT:
${resumeText}

CURRENT BULLET POINTS (sample):
${bullets.map((b, i) => `${i + 1}. ${b.trim()}`).join('\n')}

SCORING CONTEXT:
- Achievement Quantification: ${contentQuality.achievementQuantification.percentage}% quantified
- ATS Keywords Missing: ${scoringResult.atsDetailedReport.keywordGapAnalysis.mustHave.missing.slice(0, 5).join(', ')}
- Weak Action Verbs Found: ${contentQuality.actionVerbStrength.weakVerbsFound.join(', ')}

Provide a JSON response with:
{
  "bullet_rewrites": [
    {
      "original": "Current bullet point",
      "improved": "Rewritten version with metrics and strong verbs",
      "reason": "Why this is better",
      "impact_gain": "Expected improvement"
    }
  ],
  "section_improvements": [
    {
      "section": "Section name",
      "current_issue": "What's wrong now",
      "recommendation": "How to fix it",
      "example": "Concrete example"
    }
  ],
  "quick_wins": [
    {
      "action": "Specific action to take",
      "effort": "Low|Medium|High",
      "impact": "Low|Medium|High",
      "estimated_score_gain": 5
    }
  ],
  "keyword_actions": [
    {
      "keyword": "Missing keyword",
      "location": "Where to add it",
      "suggested_phrase": "Example phrase using the keyword"
    }
  ]
}

Provide 3-5 bullet rewrites, 2-3 section improvements, 3-5 quick wins, and 3-5 keyword actions.
Focus on HIGH IMPACT changes that will most improve the ATS pass rate and overall score.`;
}

/**
 * Generate comprehensive resume insights combining scoring + AI analysis
 *
 * This is the main PRO function that combines both layers:
 * - Summary Layer: High-level interpretation
 * - Action Layer: Specific improvements
 *
 * @param resumeText - Full resume text
 * @param scoringResult - Complete scoring result
 * @returns Promise with both AI layers (can be called with AI model)
 */
export async function generateResumeInsights(
  resumeText: string,
  scoringResult: ScoringResult
): Promise<{
  summary: any; // AISummaryLayer
  actions: any; // AIActionLayer
}> {
  // Generate prompts
  const summaryPrompt = generateAISummaryPrompt(resumeText, scoringResult);
  const actionPrompt = generateAIActionPrompt(resumeText, scoringResult);

  // TODO: In production, call AI model with these prompts
  // Example:
  // const summaryResponse = await callAI(summaryPrompt);
  // const actionResponse = await callAI(actionPrompt);

  // For now, return placeholder structure
  const summary = {
    executive_summary: `This ${scoringResult.metadata?.jobRole || 'candidate'} resume scores ${scoringResult.overallScore}/100, demonstrating ${scoringResult.grade}-level quality. ${
      scoringResult.overallScore >= 80
        ? 'Strong ATS compatibility and content quality.'
        : scoringResult.overallScore >= 70
        ? 'Good foundation with room for keyword and metric improvements.'
        : 'Significant improvements needed in ATS optimization and achievement quantification.'
    }`,
    top_strengths: [
      {
        title: 'Content Structure',
        description: `Well-organized with ${scoringResult.metadata?.resumeStats?.totalBullets || 0} bullet points`,
        evidence: 'Clear experience section with consistent formatting',
      },
    ],
    weakest_sections: [
      {
        section: 'Keywords',
        issue: `Missing ${scoringResult.atsDetailedReport.keywordGapAnalysis.mustHave.missing.length} critical keywords`,
        impact: 'May fail ATS screening for target role',
      },
    ],
    performance_level:
      scoringResult.overallScore >= 90
        ? 'Exceptional'
        : scoringResult.overallScore >= 80
        ? 'Strong'
        : scoringResult.overallScore >= 70
        ? 'Good'
        : scoringResult.overallScore >= 60
        ? 'Fair'
        : 'Needs Work',
    seniority_level: 'Mid-Level', // TODO: Detect from resume
  };

  const actions = {
    bullet_rewrites: [],
    section_improvements: [],
    quick_wins: [
      {
        action: `Add ${scoringResult.atsDetailedReport.keywordGapAnalysis.mustHave.missing.slice(0, 3).join(', ')} to skills or experience`,
        effort: 'Low',
        impact: 'High',
        estimated_score_gain: 8,
      },
    ],
    keyword_actions: scoringResult.atsDetailedReport.keywordGapAnalysis.mustHave.missing
      .slice(0, 5)
      .map(keyword => ({
        keyword,
        location: 'Skills section or relevant experience bullet',
        suggested_phrase: `Incorporate "${keyword}" naturally into project descriptions`,
      })),
  };

  return { summary, actions };
}

/**
 * Generate role-specific insights based on job role and market trends
 *
 * @param resumeText - Resume text
 * @param jobRole - Target job role
 * @param scoringResult - Scoring result
 * @returns Role-specific insights and recommendations
 */
export function generateRoleInsights(
  resumeText: string,
  jobRole: string,
  scoringResult: ScoringResult
): any {
  // Placeholder for role-specific analysis
  // In production, this would use AI to analyze market fit

  return {
    role: jobRole,
    market_fit_score: Math.min(scoringResult.overallScore + 5, 95),
    best_suited_for: [jobRole, `Senior ${jobRole}`, `Lead ${jobRole}`],
    skill_gaps: scoringResult.atsDetailedReport.keywordGapAnalysis.mustHave.missing.slice(0, 5),
    competitive_advantages: scoringResult.atsDetailedReport.keywordGapAnalysis.mustHave.foundKeywords.slice(0, 3),
  };
}
