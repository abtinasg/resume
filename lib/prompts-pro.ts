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

// ==================== AI Final Verdict Layer ====================

/**
 * Build AI Final Verdict Prompt
 *
 * This prompt ensures the AI model always performs the final validation and interpretation
 * after local scoring is complete. The AI reviews the structured scoring result and provides
 * expert-level reasoning and refinements.
 *
 * HYBRID REASONING MODE:
 * - The AI operates in a hybrid mode where local scoring provides structured numerical data
 * - The AI validates, refines, and optionally adjusts scores using expert reasoning
 * - The AI must always provide a final verdict that can differ from local scores
 * - Both local and AI results are returned to the user for transparency
 *
 * @param resumeText - Full resume text
 * @param jobRole - Target job role
 * @param scoringResult - Complete scoring result from local system
 * @returns Prompt string for AI analysis
 */
export function buildFinalAIPrompt(resumeText: string, jobRole: string, scoringResult: any): string {
  // Extract contextual insights from scoring result
  const localScore = scoringResult.overallScore || 0;
  const atsScore = scoringResult.componentScores?.atsCompatibility?.score || 0;
  const contentScore = scoringResult.componentScores?.contentQuality?.score || 0;
  const impactScore = scoringResult.componentScores?.impactMetrics?.score || 0;

  // Type-safe breakdown accessors
  const contentQuality = scoringResult.componentScores?.contentQuality?.breakdown as import('./scoring/types').ContentQualityBreakdown | undefined;
  const atsCompatibility = scoringResult.componentScores?.atsCompatibility?.breakdown as import('./scoring/types').ATSCompatibilityBreakdown | undefined;

  // Extract key metrics for context
  const quantificationPercentage = contentQuality?.achievementQuantification?.percentage || 0;
  const missingKeywords = scoringResult.atsDetailedReport?.keywordGapAnalysis?.mustHave?.missing || [];
  const weakVerbs = contentQuality?.actionVerbStrength?.weakVerbsFound || [];
  const formatIssues = scoringResult.atsDetailedReport?.formatIssues || [];

  // Build contextual focus areas
  const focusAreas: string[] = [];
  if (atsScore < 70) focusAreas.push('ATS compatibility and keyword optimization');
  if (quantificationPercentage < 50) focusAreas.push('achievement quantification and metrics');
  if (weakVerbs.length > 3) focusAreas.push('action verb strength and impact language');
  if (formatIssues.length > 2) focusAreas.push('formatting and structure issues');

  // Determine score confidence level
  const scoreRange = localScore >= 80 ? 'strong' : localScore >= 60 ? 'moderate' : 'needs improvement';

  return `
You are an expert resume analyst operating in HYBRID REASONING MODE.

🔄 HYBRID REASONING MODE DIRECTIVE:
You are provided with local scoring data as a reference point, but you must re-evaluate and refine
the scores using your expert reasoning and understanding of resume quality, ATS systems, and hiring practices.

Your analysis should:
- Use the local scoring data for reference, but NOT blindly accept it
- Apply your expert judgment to validate or adjust the scores
- Identify gaps, inconsistencies, or areas where the local algorithm may have under/over-scored
- Provide a final AI-refined score that reflects your expert assessment
- Explain your reasoning when your assessment differs from local scores

---

### 📋 CONTEXT SUMMARY
- **Target Role**: ${jobRole}
- **Local Score**: ${localScore}/100 (${scoreRange} range)
- **Primary Focus Areas**: ${focusAreas.length > 0 ? focusAreas.join('; ') : 'General optimization'}
- **Key Metrics**:
  * ATS Compatibility: ${atsScore}/100
  * Content Quality: ${contentScore}/100
  * Quantified Achievements: ${quantificationPercentage}%
  * Missing Critical Keywords: ${missingKeywords.length} (${missingKeywords.slice(0, 3).join(', ')})
  * Weak Action Verbs: ${weakVerbs.length} found
  * Format Issues: ${formatIssues.length} detected

---

### 📄 Resume Text
${resumeText}

---

### 📊 Local Scoring Data (for reference)
${JSON.stringify(scoringResult, null, 2)}

---

### Your Task:
As an expert resume analyst, perform a comprehensive hybrid evaluation:

1. **Validate Local Scoring**: Review the local scoring data and identify any inconsistencies,
   over-scoring, or under-scoring based on actual resume content.

2. **Expert Re-Evaluation**: Read the actual resume text and apply your expert judgment to assess:
   - Content quality and achievement quantification
   - ATS compatibility and keyword optimization
   - Format and structure effectiveness
   - Impact and measurable results
   - Overall professional presentation

3. **Identify Strengths**: List 3-5 specific strengths that will help this candidate for the target role.
   Reference actual content from the resume, not just the scores.

4. **Identify Weaknesses**: List 3-5 specific weaknesses or areas needing improvement.
   Be specific about what's missing or could be improved.

5. **Provide Improvement Suggestions**: Offer 3-5 actionable, high-impact recommendations
   that will meaningfully improve the resume's effectiveness.

6. **Final AI Verdict**: Provide your expert-adjusted final score (0-100) with reasoning.
   This score should reflect your assessment, which may differ from the local score.

### Required Output Format (JSON):
{
  "ai_final_score": <number 0-100>,
  "local_score_used": <number from local system>,
  "score_adjustment_reasoning": "<If your score differs from local, explain why>",
  "adjusted_components": {
    "content_quality": <number 0-100>,
    "ats_compatibility": <number 0-100>,
    "format_structure": <number 0-100>,
    "impact_metrics": <number 0-100>
  },
  "summary": "<2-3 sentence executive summary of resume quality and fit for role>",
  "strengths": [
    "<Specific strength with evidence from resume>",
    "<Another specific strength>",
    "<Third strength>"
  ],
  "weaknesses": [
    "<Specific weakness with explanation>",
    "<Another weakness>",
    "<Third weakness>"
  ],
  "improvement_suggestions": [
    "<High-impact actionable suggestion>",
    "<Second actionable suggestion>",
    "<Third actionable suggestion>"
  ],
  "ats_verdict": "<Pass|Conditional|Fail> with brief explanation",
  "confidence_level": "<High|Medium|Low> - your confidence in this assessment"
}

### Important Guidelines:
- Be objective and specific - reference actual resume content
- Don't just echo the local scores - provide independent expert judgment
- If local scores seem off, adjust them with clear reasoning
- Focus on actionable insights that will improve hiring outcomes
- Consider the target role when evaluating fit and relevance
- Ensure all JSON fields are properly filled with meaningful content
  `;
}

// ==================== 3D Scoring System - Strict AI Prompt ====================

/**
 * Build 3D Strict AI Verdict Prompt
 *
 * This prompt enforces stricter, more realistic scoring using the 3D model:
 * - Structure (0-40): Completeness of sections
 * - Content (0-60): Clarity, metrics, action verbs
 * - Tailoring (0-40): Match to job description
 *
 * STRICT SCORING GUIDELINES:
 * - Average resumes should score 40-60 range
 * - Good resumes should score 60-75 range
 * - Exceptional resumes should score 75-90 range
 * - Perfect score (90-100) should be VERY rare and only for flawless resumes
 * - Do NOT inflate scores - be realistic and critical
 *
 * @param resumeText - Full resume text
 * @param jobRole - Target job role
 * @param localScores - Local 3D scores for reference
 * @returns Strict AI prompt for 3D scoring
 */
export function build3DStrictAIPrompt(
  resumeText: string,
  jobRole: string,
  localScores: {
    structure: number;
    content: number;
    tailoring: number;
    overall: number;
    breakdown: any;
  }
): string {
  return `You are a critical resume evaluator with 15+ years of experience in recruiting and ATS systems.
Your role is to provide REALISTIC, STRICT scoring that reflects actual hiring standards.

🎯 CRITICAL SCORING DIRECTIVE - READ CAREFULLY:
You must be STRICT and REALISTIC in your scoring. Most resumes are average and should be scored accordingly.

**SCORING RANGES (strictly follow these):**
- 90-100: PERFECT/FLAWLESS - Extremely rare. Only for resumes with zero issues, perfect formatting, exceptional content, and complete tailoring. You should almost NEVER give scores in this range.
- 75-89: EXCEPTIONAL - Strong professional resume with minimal issues. Clear value proposition, well-quantified achievements, excellent ATS optimization.
- 60-74: GOOD - Solid resume with some strengths but noticeable gaps. Needs improvements in metrics, keywords, or structure.
- 40-59: AVERAGE - Typical resume with multiple issues. Missing quantification, weak action verbs, poor ATS optimization, or structural problems.
- 20-39: BELOW AVERAGE - Significant problems. Major gaps in content, format issues, minimal quantification.
- 0-19: POOR - Fundamental issues that make the resume unusable or unprofessional.

⚠️ IMPORTANT: Do NOT inflate scores. If you're unsure, score LOWER rather than higher.

---

### 📋 CONTEXT
- **Target Role**: ${jobRole}
- **Local Scores (for reference only)**:
  * Structure: ${localScores.structure}/40 (${Math.round((localScores.structure / 40) * 100)}%)
  * Content: ${localScores.content}/60 (${Math.round((localScores.content / 60) * 100)}%)
  * Tailoring: ${localScores.tailoring}/40 (${Math.round((localScores.tailoring / 40) * 100)}%)
  * Overall: ${localScores.overall}/100

**Local Breakdown:**
- Sections found: ${localScores.breakdown?.structure?.sectionsFound?.join(', ') || 'N/A'}
- Sections missing: ${localScores.breakdown?.structure?.sectionsMissing?.join(', ') || 'None'}
- Quantification ratio: ${localScores.breakdown?.content?.quantificationRatio || 0}%
- Strong verb %: ${localScores.breakdown?.content?.strongVerbPercentage || 0}%

---

### 📄 RESUME TEXT
${resumeText}

---

### YOUR TASK:

**Read the resume carefully and evaluate it using strict, realistic standards.**

1. **STRUCTURE (0-40 points)**: Evaluate completeness of essential sections
   - Professional summary/objective (8 pts)
   - Work experience with proper formatting (10 pts)
   - Education section (8 pts)
   - Skills section (8 pts)
   - Contact information (6 pts)

   Deduct points for:
   - Missing sections
   - Poor organization
   - Inconsistent formatting
   - Unclear section headers

2. **CONTENT (0-60 points)**: Evaluate quality of writing and impact
   - Achievement quantification (20 pts) - Are results measurable? Do bullets show impact?
   - Action verb strength (15 pts) - Strong, impactful verbs vs weak, passive language?
   - Clarity and readability (15 pts) - Is it concise? Easy to scan? Proper bullet length?
   - Impact and value proposition (10 pts) - Does it show clear value to employers?

   Deduct points for:
   - Vague, unquantified statements ("Responsible for...")
   - Weak action verbs ("Helped", "Worked on", "Involved in")
   - Too wordy or too short bullets
   - Generic statements without specifics
   - Typos or grammatical errors

3. **TAILORING (0-40 points)**: Evaluate relevance to target role
   - Keyword optimization for ${jobRole} (15 pts)
   - Relevant skills and technologies (15 pts)
   - Industry-specific terminology (10 pts)

   Deduct points for:
   - Missing critical keywords for the role
   - Irrelevant experience emphasized
   - Generic resume not tailored to role

4. **IDENTIFY ACTIONABLES**: List 5-8 specific, high-impact improvements
   Each actionable must have:
   - **title**: Brief description of the issue
   - **points**: Negative points (-5, -10, -15) showing impact on score
   - **fix**: Specific, actionable solution
   - **priority**: HIGH, MEDIUM, or LOW
   - **category**: structure, content, or tailoring

**Example actionable:**
{
  "title": "Add professional summary",
  "points": -8,
  "fix": "Write a 2-3 line summary highlighting your key achievements and value proposition. Example: 'Senior Software Engineer with 8+ years building scalable web applications. Led teams of 5+ engineers and reduced system latency by 40%.'",
  "priority": "HIGH",
  "category": "structure"
}

---

### 📊 REQUIRED OUTPUT FORMAT (Valid JSON only):

{
  "summary": "<2-3 sentence critical assessment. Be honest about weaknesses. Don't sugarcoat.>",
  "structure_score": <number 0-40>,
  "content_score": <number 0-60>,
  "tailoring_score": <number 0-40>,
  "overall_score": <number 0-100, calculated as: (structure/40 * 0.3 + content/60 * 0.4 + tailoring/40 * 0.3) * 100>,
  "actionables": [
    {
      "title": "<Issue description>",
      "points": <negative number like -10>,
      "fix": "<Specific solution with example>",
      "priority": "<HIGH|MEDIUM|LOW>",
      "category": "<structure|content|tailoring>"
    }
  ],
  "confidence_level": "<high|medium|low>",
  "reasoning": "<Brief explanation of your scoring decisions, especially if you scored significantly different from local scores>"
}

### ✅ FINAL REMINDERS:
- Be CRITICAL and REALISTIC
- Most resumes are AVERAGE (40-60 range)
- Only give 75+ for truly EXCEPTIONAL resumes
- NEVER give 100 unless the resume is absolutely PERFECT (which is almost never)
- Provide SPECIFIC actionables that will genuinely improve the score
- Reference actual content from the resume in your assessment
- Your output must be valid JSON that can be parsed`;
}

