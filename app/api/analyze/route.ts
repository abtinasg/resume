import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeResumePro, ResumeAnalysisPro } from '@/lib/openai';
import { extractTextFromBase64PDF } from '@/lib/pdfParser';
import { calculatePROScore, ScoringResult } from '@/lib/scoring';

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

interface SuccessResponse {
  success: true;
  data: ResumeAnalysisPro;
  processingTime: number;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
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
          },
          { status: 400 }
        );
      }
    }

    // Analyze resume with PRO Scoring System
    let analysis: ResumeAnalysisPro;
    try {
      console.log('[API] 🚀 Using PRO Scoring System for analysis');

      // Use the local scoring system
      const scoringResult = await calculatePROScore(resumeText, 'General');

      // Convert to API format
      analysis = convertScoringResultToAnalysisPro(scoringResult, resumeText);

      console.log('[API] ✓ PRO Scoring completed:', {
        score: scoringResult.overallScore,
        grade: scoringResult.grade,
        processingTime: scoringResult.metadata?.processingTime,
      });

      // Validate response with Zod schema
      try {
        ResumeAnalysisProSchema.parse(analysis);
      } catch (validationError) {
        console.error('[API] ✗ Analysis validation failed:', validationError);
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Analysis response validation failed. Please try again.',
            },
          },
          { status: 500 }
        );
      }
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
        },
        { status: 503 }
      );
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Return success response
    const response: SuccessResponse = {
      success: true,
      data: analysis,
      processingTime,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Catch-all error handler
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}
