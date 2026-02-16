import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractTextFromBase64PDF } from '@/lib/pdfParser';
import { extractTextFromBase64Image } from '@/lib/imageParser';
import { calculatePROScore } from '@/lib/layers/layer1';
import { derive3DRawFromPRO, scoringResultToPROInput } from '@/lib/layers/layer1';
import { build3DStrictAIPrompt } from '@/lib/prompts-pro';
import { HYBRID_MODE, validateEnvironment } from '@/lib/env';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { trackEvent } from '@/lib/analytics';
import { checkUsageLimit, decrementUsage } from '@/lib/premium';
import { recordResumeProgress } from '@/lib/progress';
import OpenAI from 'openai';
import type { ScoringResult } from '@/lib/layers/layer1';
import type {
  ActionableItem,
  AI3DAnalysisResponse,
  Hybrid3DScoringResult
} from '@/lib/layers/layer1';

export const runtime = 'nodejs';

const MAX_TEXT_LENGTH = 15000;

const ResumeAnalyzeSchema = z
  .object({
    resumeText: z.string().min(1, 'Resume content missing'),
    format: z.enum(['pdf', 'text', 'image']),
    jobRole: z.string().optional().default('Software Engineer'),
    jobDescription: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.format === 'text') {
      if (data.resumeText.length < 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Resume text is too short (minimum 15 characters for text input)',
          path: ['resumeText'],
        });
      }

      if (data.resumeText.length > MAX_TEXT_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Resume text is too long (maximum ${MAX_TEXT_LENGTH} characters)`,
          path: ['resumeText'],
        });
      }
    }
  });

type ResumeAnalyzeInput = z.infer<typeof ResumeAnalyzeSchema>;

interface SuccessResponse {
  success: true;
  hybrid_mode: boolean;
  overall_score: number;
  sections: {
    structure: number;
    content: number;
    tailoring: number;
  };
  summary: string;
  actionables: ActionableItem[];
  ai_status: 'success' | 'fallback' | 'disabled';
  metadata: {
    processingTime: number;
    timestamp: string;
    model?: string;
  };
  estimatedImprovementTime?: number;
  targetScore?: number;
  /** PRO scoring data (primary source of truth) */
  proScore?: {
    overallScore: number;
    grade: string;
    componentScores: {
      contentQuality: { score: number };
      atsCompatibility: { score: number };
      formatStructure: { score: number };
      impactMetrics: { score: number };
    };
  };
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
 * Call OpenAI API for 3D Strict Scoring
 * Uses PRO-derived 3D scores as the local reference for AI validation.
 */
async function analyze3DWithAI(
  resumeText: string,
  jobRole: string,
  localScores: {
    structure: number;
    content: number;
    tailoring: number;
    overall: number;
    breakdown: {
      structure: { sectionsFound: string[]; sectionsMissing: string[]; completenessPercentage: number };
      content: { quantificationRatio: number; strongVerbPercentage: number; clarityScore: number; impactScore: number };
      tailoring: { keywordMatchPercentage: number; missingKeywords: string[] };
    };
  }
): Promise<AI3DAnalysisResponse> {
  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Build the strict prompt
  const prompt = build3DStrictAIPrompt(resumeText, jobRole, localScores);

  console.log('[AI] 🤖 Calling OpenAI with strict 3D prompt...');
  const startTime = Date.now();

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3, // Lower temperature for more consistent scoring
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: 'You are a critical resume evaluator. Output valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const processingTime = Date.now() - startTime;
    const rawResponse = completion.choices[0].message.content;

    if (!rawResponse) {
      throw new Error('Empty response from OpenAI');
    }

    console.log('[AI] ✓ OpenAI response received:', {
      processingTime: `${processingTime}ms`,
      model: completion.model,
      tokens: completion.usage?.total_tokens,
    });

    // Parse JSON response
    const parsed = JSON.parse(rawResponse) as AI3DAnalysisResponse;

    // Validate required fields
    if (
      typeof parsed.structure_score !== 'number' ||
      typeof parsed.content_score !== 'number' ||
      typeof parsed.tailoring_score !== 'number' ||
      typeof parsed.overall_score !== 'number' ||
      !parsed.summary ||
      !Array.isArray(parsed.actionables)
    ) {
      throw new Error('Invalid AI response format: missing required fields');
    }

    console.log('[AI] ✓ AI scores:', {
      structure: `${parsed.structure_score}/40`,
      content: `${parsed.content_score}/60`,
      tailoring: `${parsed.tailoring_score}/40`,
      overall: `${parsed.overall_score}/100`,
      actionablesCount: parsed.actionables.length,
    });

    return parsed;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[AI] ✗ AI analysis failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${processingTime}ms`,
    });
    throw error;
  }
}

/**
 * Merge Local and AI scores into Hybrid 3D Result
 * Weighting: 50% local + 50% AI (balanced approach for 3D model)
 */
function mergeHybrid3DScores(
  localScores: {
    structure: number;
    content: number;
    tailoring: number;
    overall: number;
    breakdown: any;
  },
  aiScores: AI3DAnalysisResponse
): Hybrid3DScoringResult {
  // Hybrid scores: 50% local + 50% AI
  const hybridStructure = Math.round((localScores.structure * 0.5) + (aiScores.structure_score * 0.5));
  const hybridContent = Math.round((localScores.content * 0.5) + (aiScores.content_score * 0.5));
  const hybridTailoring = Math.round((localScores.tailoring * 0.5) + (aiScores.tailoring_score * 0.5));

  // Calculate overall from hybrid scores
  const hybridOverall = Math.round(
    (hybridStructure / 40) * 0.3 * 100 +
    (hybridContent / 60) * 0.4 * 100 +
    (hybridTailoring / 40) * 0.3 * 100
  );

  console.log('[HYBRID] 🔄 Merging scores:', {
    local: `S:${localScores.structure} C:${localScores.content} T:${localScores.tailoring} → ${localScores.overall}`,
    ai: `S:${aiScores.structure_score} C:${aiScores.content_score} T:${aiScores.tailoring_score} → ${aiScores.overall_score}`,
    hybrid: `S:${hybridStructure} C:${hybridContent} T:${hybridTailoring} → ${hybridOverall}`,
  });

  // Estimate improvement time based on number of high-priority actionables
  const highPriorityCount = aiScores.actionables.filter(a => a.priority === 'HIGH').length;
  const mediumPriorityCount = aiScores.actionables.filter(a => a.priority === 'MEDIUM').length;
  const estimatedImprovementTime = (highPriorityCount * 15) + (mediumPriorityCount * 8) + 10;

  // Calculate realistic target score (don't promise more than +20 points)
  const targetScore = Math.min(hybridOverall + 20, 90);

  return {
    scores: {
      structure: hybridStructure,
      content: hybridContent,
      tailoring: hybridTailoring,
      overall: hybridOverall,
    },
    localScores: {
      structure: localScores.structure,
      content: localScores.content,
      tailoring: localScores.tailoring,
      overall: localScores.overall,
    },
    aiScores: {
      structure: aiScores.structure_score,
      content: aiScores.content_score,
      tailoring: aiScores.tailoring_score,
      overall: aiScores.overall_score,
    },
    summary: aiScores.summary,
    actionables: aiScores.actionables,
    ai_status: 'success',
    metadata: {
      processingTime: 0, // Will be set later
      timestamp: new Date().toISOString(),
      model: 'gpt-4o',
    },
    estimatedImprovementTime,
    targetScore,
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[API] Starting PRO Resume Scoring System - Hybrid Mode:', HYBRID_MODE ? 'ENABLED' : 'DISABLED');

    // Validate environment if hybrid mode is enabled
    if (HYBRID_MODE) {
      const envValidation = validateEnvironment();
      if (!envValidation.valid) {
        console.error('[API] ✗ Environment validation failed:', envValidation.error);
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'AI_UNAVAILABLE',
              message: envValidation.error || 'AI layer unavailable',
              details: 'HYBRID_MODE enabled but OPENAI_API_KEY not configured',
            },
            ai_status: 'fallback',
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }
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

    // Validate file size on backend to prevent bypass of frontend validation
    if (validatedInput.format === 'pdf' || validatedInput.format === 'image') {
      const base64Length = validatedInput.resumeText.length;
      const fileSizeBytes = (base64Length * 3) / 4; // Approximate size of base64 decoded file
      const maxSizeMB = validatedInput.format === 'pdf' ? 5 : 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (fileSizeBytes > maxSizeBytes) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: `File size exceeds maximum of ${maxSizeMB}MB`,
              details: {
                fileSize: `${(fileSizeBytes / (1024 * 1024)).toFixed(2)}MB`,
                maxSize: `${maxSizeMB}MB`,
              },
            },
            timestamp: new Date().toISOString(),
          },
          { status: 413 }
        );
      }
    }

    const tokenValue = req.cookies.get('token')?.value;
    const authenticatedUser = tokenValue ? verifyToken(tokenValue) : null;

    // Check usage limits for authenticated users
    if (authenticatedUser) {
      const userId = authenticatedUser.userId;
      const usageCheck = await checkUsageLimit(userId, 'resumeScan');

      if (!usageCheck.allowed) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'USAGE_LIMIT_REACHED',
              message: 'Resume scan limit reached for this period',
              details: {
                remaining: usageCheck.remaining,
                limit: usageCheck.limit,
                reason: usageCheck.reason,
              },
            },
            timestamp: new Date().toISOString(),
          },
          { status: 429 }
        );
      }
    }

    await trackEvent('resume_upload', {
      userId: authenticatedUser?.userId,
      request: req,
      metadata: {
        format: validatedInput.format,
        hasJobDescription: Boolean(validatedInput.jobDescription),
      },
    });

    // Extract text from PDF or image if needed
    let resumeText = validatedInput.resumeText;

    if (validatedInput.format === 'pdf') {
      try {
        const extractionResult = await extractTextFromBase64PDF(validatedInput.resumeText);

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

        if (extractionResult.status === 'partial' && extractionResult.characterCount < 15) {
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: {
                code: 'PDF_INSUFFICIENT_CONTENT',
                message: 'PDF does not contain enough text content',
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        resumeText = extractionResult.text;
        console.log('[API] ✓ PDF extraction:', {
          status: extractionResult.status,
          method: extractionResult.method,
          characters: extractionResult.characterCount,
        });

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
                message: 'PDF does not contain enough text content',
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('[API] ✗ PDF extraction failed:', error);
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'PDF_PARSE_ERROR',
              message: 'Failed to process PDF resume',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    } else if (validatedInput.format === 'image') {
      try {
        const extractionResult = await extractTextFromBase64Image(validatedInput.resumeText);

        if (extractionResult.status === 'failed') {
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: {
                code: 'IMAGE_EXTRACTION_FAILED',
                message: extractionResult.message,
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        if (extractionResult.status === 'partial' && extractionResult.characterCount < 15) {
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: {
                code: 'IMAGE_INSUFFICIENT_CONTENT',
                message: 'Captured image does not contain enough readable text',
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        resumeText = extractionResult.text;

        if (resumeText.length > MAX_TEXT_LENGTH) {
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: {
                code: 'IMAGE_TEXT_TOO_LARGE',
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
                code: 'IMAGE_INSUFFICIENT_CONTENT',
                message: 'Captured image does not contain enough readable text',
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        console.log('[API] ✓ Image extraction:', {
          status: extractionResult.status,
          characters: extractionResult.characterCount,
        });
      } catch (error) {
        console.error('[API] ✗ Image extraction failed:', error);
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: 'IMAGE_EXTRACTION_FAILED',
              message: 'Failed to process captured resume photo',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }

    // STEP 1: PRO Scoring → Derive 3D View (always runs)
    console.log('[API] Step 1/2: Running PRO scoring...');
    const localStartTime = Date.now();

    const proResult = await calculatePROScore(resumeText, validatedInput.jobRole);
    const proInput = scoringResultToPROInput(proResult);
    const derived3D = derive3DRawFromPRO(proInput);

    // Build a 3D-compatible localScores object from PRO results for backward compatibility
    const localScores = {
      structure: derived3D.structure,
      content: derived3D.content,
      tailoring: derived3D.tailoring,
      overall: derived3D.overall,
      breakdown: {
        structure: {
          sectionsFound: (proResult.componentScores.formatStructure.breakdown as any)?.sectionOrder?.found || [],
          sectionsMissing: (proResult.componentScores.formatStructure.breakdown as any)?.sectionOrder?.missing || [],
          completenessPercentage: proResult.componentScores.formatStructure.score,
        },
        content: {
          quantificationRatio: (proResult.componentScores.contentQuality.breakdown as any)?.achievementQuantification?.percentage || 0,
          strongVerbPercentage: (proResult.componentScores.contentQuality.breakdown as any)?.actionVerbStrength?.strongPercentage || 0,
          clarityScore: (proResult.componentScores.contentQuality.breakdown as any)?.clarityReadability?.score || 0,
          impactScore: proResult.componentScores.impactMetrics.score,
        },
        tailoring: {
          keywordMatchPercentage: (proResult.componentScores.atsCompatibility.breakdown as any)?.keywordDensity?.mustHaveMatch || 0,
          missingKeywords: proResult.atsDetailedReport?.keywordGapAnalysis?.mustHave?.missing || [],
        },
      },
    };

    const localProcessingTime = Date.now() - localStartTime;
    console.log('[API] PRO scoring completed:', {
      proOverall: proResult.overallScore,
      proGrade: proResult.grade,
      derived3D: `S:${localScores.structure}/40 C:${localScores.content}/60 T:${localScores.tailoring}/40`,
      overall: `${localScores.overall}/100`,
      processingTime: `${localProcessingTime}ms`,
    });

    let finalResult: Hybrid3DScoringResult;

    // STEP 2: AI 3D Scoring (if hybrid mode enabled)
    if (HYBRID_MODE) {
      console.log('[API] 🤖 Step 2/2: Running AI 3D strict scoring...');
      const aiStartTime = Date.now();

      try {
        const aiScores = await analyze3DWithAI(resumeText, validatedInput.jobRole, localScores);
        const aiProcessingTime = Date.now() - aiStartTime;

        console.log('[API] ✓ AI 3D scoring completed:', {
          structure: `${aiScores.structure_score}/40`,
          content: `${aiScores.content_score}/60`,
          tailoring: `${aiScores.tailoring_score}/40`,
          overall: `${aiScores.overall_score}/100`,
          actionables: aiScores.actionables.length,
          processingTime: `${aiProcessingTime}ms`,
        });

        // Merge local and AI scores
        finalResult = mergeHybrid3DScores(localScores, aiScores);
        finalResult.metadata.processingTime = Date.now() - startTime;

        console.log('[API] 🎯 Hybrid 3D merge completed - Final:', {
          structure: `${finalResult.scores.structure}/40`,
          content: `${finalResult.scores.content}/60`,
          tailoring: `${finalResult.scores.tailoring}/40`,
          overall: `${finalResult.scores.overall}/100`,
          ai_status: 'success',
        });
      } catch (aiError) {
        // GRACEFUL FALLBACK: Use local scores only
        console.error('[API] ⚠️ AI scoring failed - Falling back to local scores:', aiError);

        finalResult = {
          scores: {
            structure: localScores.structure,
            content: localScores.content,
            tailoring: localScores.tailoring,
            overall: localScores.overall,
          },
          localScores: {
            structure: localScores.structure,
            content: localScores.content,
            tailoring: localScores.tailoring,
            overall: localScores.overall,
          },
          summary: `Your resume scored ${localScores.overall}/100. AI validation was unavailable, so local scoring is used.`,
          actionables: generateFallbackActionables(localScores),
          ai_status: 'fallback',
          metadata: {
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
          estimatedImprovementTime: 30,
          targetScore: Math.min(localScores.overall + 15, 85),
        };

        console.log('[API] 🔄 Fallback completed - Using local scores only');
      }
    } else {
      // Local-only mode (hybrid disabled)
      console.log('[API] ⚠️ Hybrid mode disabled - Using local scores only');

      finalResult = {
        scores: {
          structure: localScores.structure,
          content: localScores.content,
          tailoring: localScores.tailoring,
          overall: localScores.overall,
        },
        localScores: {
          structure: localScores.structure,
          content: localScores.content,
          tailoring: localScores.tailoring,
          overall: localScores.overall,
        },
        summary: `Your resume scored ${localScores.overall}/100 based on local analysis.`,
        actionables: generateFallbackActionables(localScores),
        ai_status: 'disabled',
        metadata: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        estimatedImprovementTime: 30,
        targetScore: Math.min(localScores.overall + 15, 85),
      };
    }

    // Build success response
    const response: SuccessResponse = {
      success: true,
      hybrid_mode: HYBRID_MODE,
      overall_score: finalResult.scores.overall,
      sections: {
        structure: finalResult.scores.structure,
        content: finalResult.scores.content,
        tailoring: finalResult.scores.tailoring,
      },
      summary: finalResult.summary,
      actionables: finalResult.actionables,
      ai_status: finalResult.ai_status,
      metadata: finalResult.metadata,
      estimatedImprovementTime: finalResult.estimatedImprovementTime,
      targetScore: finalResult.targetScore,
      proScore: {
        overallScore: proResult.overallScore,
        grade: proResult.grade,
        componentScores: {
          contentQuality: { score: proResult.componentScores.contentQuality.score },
          atsCompatibility: { score: proResult.componentScores.atsCompatibility.score },
          formatStructure: { score: proResult.componentScores.formatStructure.score },
          impactMetrics: { score: proResult.componentScores.impactMetrics.score },
        },
      },
    };

    const totalTime = Date.now() - startTime;
    console.log('[API] 🎉 Analysis completed successfully:', {
      overall_score: response.overall_score,
      ai_status: response.ai_status,
      totalTime: `${totalTime}ms`,
    });

    await trackEvent('analysis_complete', {
      userId: authenticatedUser?.userId,
      request: req,
      metadata: {
        format: validatedInput.format,
        aiStatus: response.ai_status,
        overallScore: response.overall_score,
        processingTimeMs: totalTime,
      },
    });

    // Save resume to database if user is authenticated
    try {
      if (authenticatedUser) {
        const fileName =
          validatedInput.format === 'pdf'
            ? 'Uploaded Resume (PDF)'
            : validatedInput.format === 'image'
              ? 'Uploaded Resume (Photo)'
              : 'Uploaded Resume (Text)';

        const previousResume = await prisma.resumeVersion.findFirst({
          where: { userId: authenticatedUser.userId },
          orderBy: { createdAt: 'desc' },
        });

        const resumePayload = JSON.parse(
          JSON.stringify({
            sections: response.sections,
            actionables: response.actionables,
            ai_status: response.ai_status,
            metadata: response.metadata,
            estimatedImprovementTime: response.estimatedImprovementTime,
            targetScore: response.targetScore,
            localScores: finalResult.localScores,
            aiScores: finalResult.aiScores,
            summary: response.summary,
          })
        );

        const createdResume = await prisma.resumeVersion.create({
          data: {
            userId: authenticatedUser.userId,
            name: fileName,
            content: resumePayload,
            overallScore: response.overall_score,
            versionNumber: previousResume ? previousResume.versionNumber + 1 : 1,
          },
        });

        // Note: recordResumeProgress uses models not in current schema, skipping
        console.log('[API] ✓ Resume saved to database for user:', authenticatedUser.email, 'resumeId:', createdResume.id);

        // Decrement usage count after successful analysis
        await decrementUsage(authenticatedUser.userId, 'resumeScan');
        console.log('[API] ✓ Usage limit decremented for user:', authenticatedUser.userId);
      } else {
        console.log('[API] ℹ️ Analysis completed without authentication - resume not saved');
      }
    } catch (dbError) {
      // Don't fail the request if database save fails
      console.error('[API] ⚠️ Failed to save resume to database:', dbError);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[API] ✗ Unexpected error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Generate fallback actionables based on PRO-derived scoring breakdown
 */
function generateFallbackActionables(
  localScores: {
    structure: number;
    content: number;
    tailoring: number;
    overall: number;
    breakdown: {
      structure: { sectionsFound: string[]; sectionsMissing: string[]; completenessPercentage: number };
      content: { quantificationRatio: number; strongVerbPercentage: number; clarityScore: number; impactScore: number };
      tailoring: { keywordMatchPercentage: number; missingKeywords: string[] };
    };
  }
): ActionableItem[] {
  const actionables: ActionableItem[] = [];

  // Structure actionables
  if (localScores.breakdown.structure.sectionsMissing.length > 0) {
    actionables.push({
      title: `Add missing sections: ${localScores.breakdown.structure.sectionsMissing.join(', ')}`,
      points: -8 * localScores.breakdown.structure.sectionsMissing.length,
      fix: `Include these essential sections: ${localScores.breakdown.structure.sectionsMissing.join(', ')}. Each section should be clearly labeled and well-organized.`,
      category: 'structure',
      priority: 'HIGH',
    });
  }

  // Content actionables
  if (localScores.breakdown.content.quantificationRatio < 50) {
    actionables.push({
      title: 'Add metrics and quantification to achievements',
      points: -15,
      fix: 'Quantify your achievements with specific numbers, percentages, or metrics. Example: "Increased sales by 30%" instead of "Increased sales".',
      category: 'content',
      priority: 'HIGH',
    });
  }

  if (localScores.breakdown.content.strongVerbPercentage < 50) {
    actionables.push({
      title: 'Replace weak action verbs with strong ones',
      points: -10,
      fix: 'Use powerful action verbs like "Led", "Achieved", "Optimized" instead of weak verbs like "Helped", "Worked on", "Responsible for".',
      category: 'content',
      priority: 'MEDIUM',
    });
  }

  // Tailoring actionables
  if (localScores.breakdown.tailoring.missingKeywords.length > 0) {
    actionables.push({
      title: `Add missing keywords: ${localScores.breakdown.tailoring.missingKeywords.slice(0, 3).join(', ')}`,
      points: -10,
      fix: `Include these relevant keywords in your resume: ${localScores.breakdown.tailoring.missingKeywords.slice(0, 5).join(', ')}`,
      category: 'tailoring',
      priority: 'HIGH',
    });
  }

  // If no actionables, add a generic one
  if (actionables.length === 0) {
    actionables.push({
      title: 'Polish and refine your resume',
      points: -5,
      fix: 'Review your resume for clarity, consistency, and impact. Ensure all sections are complete and well-formatted.',
      category: 'content',
      priority: 'LOW',
    });
  }

  return actionables;
}
