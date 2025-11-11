import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeResumePro, ResumeAnalysisPro } from '@/lib/openai';
import { extractTextFromBase64PDF } from '@/lib/pdfParser';
import { calculatePROScore, ScoringResult } from '@/lib/scoring';
import { buildFinalAIPrompt } from '@/lib/prompts-pro';
import { analyzeWithAIRetry, analyzeWithAIEnhanced, generateAIRewrites, AIVerdictResponse, AIAnalysisError, BeforeAfterRewrite } from '@/lib/openai/analyzeWithAI';
import { HYBRID_MODE, validateEnvironment } from '@/lib/env';

export const runtime = 'nodejs';

const MAX_TEXT_LENGTH = 15000;

const ResumeAnalyzeSchema = z.object({
  resumeText: z.string().min(1, 'Resume content missing'),
  format: z.enum(['pdf', 'text']),
}).refine(
  (data) => data.format === 'pdf' || data.resumeText.length >= 15,
  { message: 'Resume text is too short (minimum 15 characters for text input)', path: ['resumeText'] }
).refine(
  (data) => data.format === 'pdf' || data.resumeText.length <= MAX_TEXT_LENGTH,
  { message: `Resume text is too long (maximum ${MAX_TEXT_LENGTH} characters)`, path: ['resumeText'] }
);

type ResumeAnalyzeInput = z.infer<typeof ResumeAnalyzeSchema>;

// Zod schema for validating Pro analysis response
const ResumeAnalysisProSchema = z.object({
  overview: z.object({
    summary: z.string().min(1),
    overall_score: z.number().min(0).max(100),
    seniority_level: z.string().min(1),
    fit_for_roles: z.array(z.string()).min(1),
  }),
  sections: z.object({
    experience: z.object({
      score: z.number().min(0).max(100),
      strengths: z.array(z.string()),
      issues: z.array(z.string()),
    }),
    skills: z.object({
      score: z.number().min(0).max(100),
      missing_technologies: z.array(z.string()),
    }),
    education: z.object({
      score: z.number().min(0).max(100),
      suggestions: z.array(z.string()),
    }),
    formatting: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
    }),
  }),
  ats_analysis: z.object({
    keyword_density: z.object({
      total_keywords: z.number().min(0),
      top_keywords: z.array(z.string()),
    }),
    ats_pass_rate: z.number().min(0).max(100),
  }),
  improvement_actions: z.array(z.string()).min(1),
});

interface UnifiedHybridResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  rewrites: BeforeAfterRewrite[];
}

interface SuccessResponse {
  success: true;
  hybrid_mode: true;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  rewrites: BeforeAfterRewrite[];
  ai_status: 'success' | 'fallback';
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  ai_status?: 'fallback';
  timestamp?: string;
}

/**
 * Convert PRO Scoring Result to ResumeAnalysisPro format for API compatibility
 */
function convertScoringResultToAnalysisPro(
  scoringResult: ScoringResult,
  resumeText: string
): ResumeAnalysisPro {
  const { componentScores, atsDetailedReport, improvementRoadmap, overallScore, grade } = scoringResult;

  // Determine seniority level from metadata
  const yearsExp = scoringResult.metadata?.resumeStats?.pageCount || 0;
  let seniorityLevel = 'Mid-Level';
  if (yearsExp <= 1) seniorityLevel = 'Entry-Level';
  else if (yearsExp >= 3) seniorityLevel = 'Senior';

  // Type-safe breakdown accessors
  const contentQualityBreakdown = componentScores.contentQuality.breakdown as import('@/lib/scoring/types').ContentQualityBreakdown;
  const atsBreakdown = componentScores.atsCompatibility.breakdown as import('@/lib/scoring/types').ATSCompatibilityBreakdown;
  const formatBreakdown = componentScores.formatStructure.breakdown as import('@/lib/scoring/types').FormatStructureBreakdown;

  // Extract top keywords from keyword frequency
  const keywordFreq = atsBreakdown.keywordDensity.keywordFrequency || {};
  const topKeywords = Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);

  // Generate fit_for_roles based on keyword analysis
  const fitForRoles = atsDetailedReport.keywordGapAnalysis.role !== 'General'
    ? [atsDetailedReport.keywordGapAnalysis.role]
    : ['Product Manager', 'Software Engineer', 'General'];

  // Map improvement actions
  const quickWinActions = (improvementRoadmap.quickWins || []).map(action => action.action);
  const toReach80Actions = improvementRoadmap.toReach80.slice(0, 5).map(a => a.action);
  const improvementActions = [...quickWinActions, ...toReach80Actions];

  return {
    overview: {
      summary: `Professional with ${scoringResult.metadata?.resumeStats?.totalWords || 'substantial'} words of content. Overall score: ${overallScore}/100 (Grade ${grade}). ATS pass probability: ${scoringResult.atsPassProbability}%.`,
      overall_score: overallScore,
      seniority_level: seniorityLevel,
      fit_for_roles: fitForRoles,
    },
    sections: {
      experience: {
        score: componentScores.contentQuality.score,
        strengths: [
          `${contentQualityBreakdown.achievementQuantification.percentage}% of bullets are quantified`,
          `Strong action verbs: ${contentQualityBreakdown.actionVerbStrength.strongPercentage}%`,
          `${scoringResult.metadata?.resumeStats?.totalBullets || 0} bullet points detected`,
        ],
        issues: contentQualityBreakdown.actionVerbStrength.weakVerbsFound.length > 0
          ? [`Weak verbs found: ${contentQualityBreakdown.actionVerbStrength.weakVerbsFound.slice(0, 3).join(', ')}`]
          : [],
      },
      skills: {
        score: atsBreakdown.keywordDensity.score,
        missing_technologies: atsDetailedReport.keywordGapAnalysis.mustHave.missing.slice(0, 5),
      },
      education: {
        score: componentScores.formatStructure.score,
        suggestions: formatBreakdown.lengthOptimization.verdict !== 'Optimal'
          ? [`Resume length: ${formatBreakdown.lengthOptimization.verdict}`]
          : ['Education section structure looks good'],
      },
      formatting: {
        score: atsBreakdown.formatCompatibility.score,
        issues: atsDetailedReport.formatIssues.map(issue => issue.issue),
      },
    },
    ats_analysis: {
      keyword_density: {
        total_keywords: Object.keys(keywordFreq).length,
        top_keywords: topKeywords,
      },
      ats_pass_rate: scoringResult.atsPassProbability,
    },
    improvement_actions: improvementActions.slice(0, 8),
  };
}

/**
 * Merge Local Scoring and AI Verdict into a Unified Hybrid Result
 *
 * This function implements the true hybrid scoring system by:
 * 1. Calculating final score as weighted average (40% local + 60% AI)
 * 2. Merging strengths, weaknesses, and suggestions from both layers
 * 3. Using AI-generated rewrites with reasoning
 * 4. Producing a single, unified output for the user
 *
 * @param scoringResult - Local scoring result with component scores
 * @param aiVerdict - AI analysis verdict with recommendations
 * @returns UnifiedHybridResult - Single merged output
 */
function mergeHybridResult(
  scoringResult: ScoringResult,
  aiVerdict: AIVerdictResponse
): UnifiedHybridResult {
  // Step 1: Calculate unified score (40% local + 60% AI)
  const localScore = scoringResult.overallScore;
  const aiScore = aiVerdict.ai_final_score;
  const unifiedScore = Math.round(localScore * 0.4 + aiScore * 0.6);

  console.log('[Hybrid Merge] 🔄 Calculating unified score:', {
    localScore,
    aiScore,
    unifiedScore,
    formula: '(local * 0.4) + (ai * 0.6)',
  });

  // Step 2: Extract local strengths
  const localStrengths: string[] = [];
  const contentQualityBreakdown = scoringResult.componentScores.contentQuality.breakdown as import('@/lib/scoring/types').ContentQualityBreakdown;

  // Add quantifiable strengths
  if (contentQualityBreakdown.achievementQuantification.percentage >= 50) {
    localStrengths.push(`${contentQualityBreakdown.achievementQuantification.percentage}% of achievements are quantified`);
  }

  if (contentQualityBreakdown.actionVerbStrength.strongPercentage >= 60) {
    localStrengths.push(`Strong action verbs used (${contentQualityBreakdown.actionVerbStrength.strongPercentage}%)`);
  }

  if (scoringResult.atsPassProbability >= 70) {
    localStrengths.push(`High ATS compatibility (${scoringResult.atsPassProbability}% pass probability)`);
  }

  // Step 3: Extract local weaknesses
  const localWeaknesses: string[] = [];

  if (contentQualityBreakdown.achievementQuantification.percentage < 30) {
    localWeaknesses.push('Limited quantification of achievements');
  }

  if (contentQualityBreakdown.actionVerbStrength.weakVerbsFound.length > 0) {
    localWeaknesses.push(`Weak verbs detected: ${contentQualityBreakdown.actionVerbStrength.weakVerbsFound.slice(0, 3).join(', ')}`);
  }

  if (scoringResult.atsPassProbability < 50) {
    localWeaknesses.push('Low ATS compatibility score');
  }

  // Step 4: Extract local improvement suggestions
  const localImprovementSuggestions = (scoringResult.improvementRoadmap.quickWins || [])
    .map(action => action.action)
    .slice(0, 3);

  // Step 5: Merge strengths (deduplicate using Set)
  const mergedStrengths = Array.from(
    new Set([...aiVerdict.strengths, ...localStrengths])
  );

  // Step 6: Merge weaknesses (deduplicate using Set)
  const mergedWeaknesses = Array.from(
    new Set([...aiVerdict.weaknesses, ...localWeaknesses])
  );

  // Step 7: Prioritize AI suggestions, fallback to local if none
  const mergedSuggestions =
    aiVerdict.improvement_suggestions && aiVerdict.improvement_suggestions.length > 0
      ? aiVerdict.improvement_suggestions
      : localImprovementSuggestions;

  // Step 8: Use AI rewrites (or empty array if unavailable)
  const rewrites = aiVerdict.before_after_rewrites || [];

  // Step 9: Use AI summary (or generate fallback)
  const summary = aiVerdict.summary ||
    `Your resume scored ${unifiedScore}/100. Review the strengths and suggestions below for improvements.`;

  console.log('[Hybrid Merge] ✓ Merge completed:', {
    unifiedScore,
    strengthsCount: mergedStrengths.length,
    weaknessesCount: mergedWeaknesses.length,
    suggestionsCount: mergedSuggestions.length,
    rewritesCount: rewrites.length,
  });

  return {
    score: unifiedScore,
    summary,
    strengths: mergedStrengths,
    weaknesses: mergedWeaknesses,
    improvement_suggestions: mergedSuggestions,
    rewrites,
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Log hybrid mode status
    console.log('[API] 🔄 PRO Resume Scoring System - Hybrid Mode:', HYBRID_MODE ? 'ENABLED' : 'DISABLED');

    // Validate environment configuration when hybrid mode is enabled
    if (HYBRID_MODE) {
      const envValidation = validateEnvironment();
      if (!envValidation.valid) {
        console.error('[API] ✗ Environment validation failed:', envValidation.error);
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'AI_UNAVAILABLE',
              message: envValidation.error || 'AI layer failed or is unavailable.',
              details: 'HYBRID_MODE is enabled but required environment variables are not configured.',
            },
            ai_status: 'fallback',
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }
      console.log('[API] ✓ Environment validation passed');
    }

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate input
    let validatedInput: ResumeAnalyzeInput;
    try {
      validatedInput = ResumeAnalyzeSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstIssue = error.issues[0];
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: firstIssue?.message || 'Invalid input data',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Extract text from resume
    let resumeText = validatedInput.resumeText;

    if (validatedInput.format === 'pdf') {
      try {
        const extractionResult = await extractTextFromBase64PDF(validatedInput.resumeText);

        // Check extraction status
        if (extractionResult.status === 'failed') {
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: {
                code: 'PDF_EXTRACTION_FAILED',
                message: extractionResult.message,
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        // Handle partial extraction - still proceed if we have enough text
        if (extractionResult.status === 'partial') {
          console.log(`[API] ⚠️ Partial extraction: ${extractionResult.message}`);

          // Check if partial text is still usable (very lenient threshold)
          if (extractionResult.characterCount < 15) {
            return NextResponse.json<ErrorResponse>(
              {
                success: false,
                error: {
                  code: 'PDF_INSUFFICIENT_CONTENT',
                  message: extractionResult.message || 'PDF does not contain enough text content (minimum 15 characters required)',
                },
                timestamp: new Date().toISOString(),
              },
              { status: 400 }
            );
          }
          // If we have enough text, continue with partial extraction
          console.log(`[API] Proceeding with partial extraction (${extractionResult.characterCount} characters)`);
        }

        // Get extracted text
        resumeText = extractionResult.text;
        console.log('[API] Extracted text length:', resumeText.length);

        // Validate extracted text length
        if (resumeText.length > MAX_TEXT_LENGTH) {
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: {
                code: 'PDF_TOO_LARGE',
                message: `Extracted text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`,
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        if (resumeText.length < 15) {
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: {
                code: 'PDF_INSUFFICIENT_CONTENT',
                message: 'PDF does not contain enough text content (minimum 15 characters required)',
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        // Log successful extraction
        const statusEmoji = extractionResult.status === 'success' ? '✓' : '⚠️';
        console.log(`[API] ${statusEmoji} PDF extraction ${extractionResult.status} via ${extractionResult.method}: ${extractionResult.characterCount} characters`);
        if (extractionResult.confidence !== undefined) {
          console.log(`[API] OCR confidence: ${(extractionResult.confidence * 100).toFixed(0)}%`);
        }
      } catch (error) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'PDF_PARSE_ERROR',
              message:
                error instanceof Error
                  ? error.message
                  : 'Failed to parse PDF file',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // Analyze resume with PRO Scoring System (Hybrid Mode)
    let aiVerdict: AIVerdictResponse | undefined;
    let scoringResult: ScoringResult;
    let aiStatus: 'success' | 'fallback' | 'disabled' = 'disabled';
    let aiError: { code: string; message: string; timestamp: string } | undefined;

    try {
      console.log('[API] 🚀 Starting PRO Scoring System analysis in', HYBRID_MODE ? 'HYBRID' : 'LOCAL-ONLY', 'mode');

      // Step 1: Local scoring (always runs first)
      console.log('[API] 📊 Step 1/2: Running local scoring algorithm...');
      const localStartTime = Date.now();

      scoringResult = await calculatePROScore(resumeText, 'General');

      const localProcessingTime = Date.now() - localStartTime;
      console.log('[API] ✓ Local scoring completed:', {
        score: scoringResult.overallScore,
        grade: scoringResult.grade,
        atsPassProbability: scoringResult.atsPassProbability,
        processingTime: `${localProcessingTime}ms`,
      });

      // Step 2: AI final verdict layer (with graceful fallback in hybrid mode)
      if (HYBRID_MODE) {
        console.log('[API] 🤖 Step 2/2: Running AI final verdict layer (with graceful fallback)...');
        const aiStartTime = Date.now();

        try {
          // Use enhanced AI analysis with before/after rewrites (with retry logic)
          // First, wrap analyzeWithAIEnhanced in retry logic
          const maxRetries = 2;
          let lastError: AIAnalysisError | null = null;
          let retrySuccess = false;

          for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
              if (attempt > 1) {
                console.log(`[API] 🔄 AI Enhanced Retry attempt ${attempt}/${maxRetries + 1}...`);
              }

              aiVerdict = await analyzeWithAIEnhanced(resumeText, scoringResult);
              retrySuccess = true;
              break;
            } catch (error) {
              lastError = error instanceof AIAnalysisError
                ? error
                : new AIAnalysisError(
                    error instanceof Error ? error.message : 'Unknown error',
                    'UNKNOWN_ERROR'
                  );

              // Don't retry on permanent errors
              const nonRetryableErrors = [
                'MISSING_API_KEY',
                'INVALID_API_KEY',
                'INVALID_JSON',
                'INVALID_RESPONSE',
                'EMPTY_RESPONSE',
                'MODEL_NOT_FOUND',
                'BAD_REQUEST',
              ];

              if (nonRetryableErrors.includes(lastError.code)) {
                console.error(`[API] ✗ Non-retryable AI error (${lastError.code}):`, lastError.message);
                throw lastError;
              }

              // Log retry attempt for transient errors
              if (attempt <= maxRetries) {
                const waitTime = 1000 * Math.pow(2, attempt - 1);
                console.warn(`[API] ⚠ Transient AI error (${lastError.code}), retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              } else {
                console.error(`[API] ✗ All ${maxRetries + 1} AI attempts failed`);
                throw lastError;
              }
            }
          }

          if (!retrySuccess || !aiVerdict) {
            throw lastError || new AIAnalysisError('AI analysis failed after all retry attempts', 'RETRY_EXHAUSTED');
          }

          // Generate AI-powered rewrites (replacing any existing rewrites with AI-generated ones)
          console.log('[API] 🎨 Step 2b/2: Generating AI-powered before/after rewrites...');
          const rewritesStartTime = Date.now();

          try {
            aiVerdict.before_after_rewrites = await generateAIRewrites(scoringResult, resumeText);
            const rewritesProcessingTime = Date.now() - rewritesStartTime;
            console.log('[API] ✓ AI rewrites generated successfully:', {
              rewriteCount: aiVerdict.before_after_rewrites.length,
              processingTime: `${rewritesProcessingTime}ms`,
            });
          } catch (rewriteError) {
            // Log error but don't fail the entire request - AI verdict is still valid
            console.error('[API] ⚠️ AI rewrite generation failed (non-critical):', rewriteError);
            // Keep any existing rewrites or set to empty array
            if (!aiVerdict.before_after_rewrites) {
              aiVerdict.before_after_rewrites = [];
            }
          }

          const aiProcessingTime = Date.now() - aiStartTime;
          console.log('[API] ✓ AI verdict layer completed successfully:', {
            aiScore: aiVerdict.ai_final_score,
            localScore: aiVerdict.local_score_used || scoringResult.overallScore,
            scoreDifference: aiVerdict.ai_final_score - scoringResult.overallScore,
            hasAdjustments: !!aiVerdict.adjusted_components,
            hasRewrites: !!aiVerdict.before_after_rewrites,
            rewriteCount: aiVerdict.before_after_rewrites?.length || 0,
            confidenceLevel: aiVerdict.confidence_level,
            processingTime: `${aiProcessingTime}ms`,
          });

          aiStatus = 'success';
          console.log('[API] 🎯 Hybrid mode execution: SUCCESS - Both local and AI layers completed');
        } catch (aiErrorCaught) {
          // GRACEFUL FALLBACK: AI failed, but we return local results instead of error
          console.error('[API] ⚠️ AI verdict layer FAILED - Falling back to local results:', aiErrorCaught);

          const errorCode = aiErrorCaught instanceof AIAnalysisError ? aiErrorCaught.code : 'AI_ERROR';
          const errorMessage = aiErrorCaught instanceof Error ? aiErrorCaught.message : 'Unknown AI error';

          // Store error details for response
          aiError = {
            code: errorCode,
            message: errorMessage,
            timestamp: new Date().toISOString(),
          };

          // Create fallback AI verdict based on local scoring
          aiVerdict = {
            ai_final_score: scoringResult.overallScore,
            local_score_used: scoringResult.overallScore,
            score_adjustment_reasoning: 'AI analysis unavailable - using local score as fallback',
            summary: `This resume scored ${scoringResult.overallScore}/100 (Grade ${scoringResult.grade}). AI analysis was unavailable, so local scoring is used.`,
            strengths: [
              `Overall score: ${scoringResult.overallScore}/100`,
              `ATS pass probability: ${scoringResult.atsPassProbability}%`,
              'Local scoring completed successfully',
            ],
            weaknesses: [
              'AI validation layer unavailable - scores may need manual review',
            ],
            improvement_suggestions: (scoringResult.improvementRoadmap.quickWins || []).map(action => action.action).slice(0, 3),
            ats_verdict: scoringResult.atsPassProbability >= 70 ? 'Pass' : scoringResult.atsPassProbability >= 50 ? 'Conditional' : 'Fail',
            confidence_level: 'Medium',
          };

          aiStatus = 'fallback';

          // Log comprehensive fallback details
          console.log('[API] 🔄 GRACEFUL FALLBACK activated:', {
            aiErrorCode: errorCode,
            aiErrorMessage: errorMessage,
            fallbackScore: scoringResult.overallScore,
            fallbackGrade: scoringResult.grade,
            localScoringCompleted: true,
          });

          console.log('[API] 🎯 Hybrid mode execution: FALLBACK - Local results returned with AI error details');
        }
      } else {
        // Local-only mode: Skip AI layer
        console.log('[API] ⚠️ Skipping AI layer (HYBRID_MODE is disabled)');
        aiStatus = 'disabled';
        // Create a minimal AI verdict for compatibility
        aiVerdict = {
          ai_final_score: scoringResult.overallScore,
          summary: 'Local scoring only - AI layer disabled',
          strengths: ['Local scoring completed successfully'],
          weaknesses: ['AI layer not enabled'],
          improvement_suggestions: ['Enable HYBRID_MODE for AI-enhanced analysis'],
        };
      }

      // (Step 3: Convert to API format - no longer needed for unified output)
      // We now directly merge results in Step 4
    } catch (error) {
      console.error('[API] ✗ PRO Scoring failed:', error);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'SCORING_ERROR',
            message:
              error instanceof Error
                ? error.message
                : 'Failed to analyze resume',
          },
          ai_status: 'fallback',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Step 4: Merge results into unified hybrid output
    console.log('[API] 🔄 Step 3/3: Merging local and AI results into unified hybrid output...');
    const unifiedResult = mergeHybridResult(scoringResult, aiVerdict);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    console.log('[API] 🎉 Hybrid analysis completed successfully:', {
      hybridMode: HYBRID_MODE,
      localScore: scoringResult.overallScore,
      aiScore: aiVerdict.ai_final_score,
      unifiedScore: unifiedResult.score,
      aiStatus,
      totalProcessingTime: `${processingTime}ms`,
    });

    // Return unified success response
    const response: SuccessResponse = {
      success: true,
      hybrid_mode: true,
      score: unifiedResult.score,
      summary: unifiedResult.summary,
      strengths: unifiedResult.strengths,
      weaknesses: unifiedResult.weaknesses,
      improvement_suggestions: unifiedResult.improvement_suggestions,
      rewrites: unifiedResult.rewrites,
      ai_status: aiStatus === 'disabled' ? 'fallback' : aiStatus,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Catch-all error handler
    console.error('[API] ✗ Unexpected error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
