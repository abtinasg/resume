import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeResumePro, ResumeAnalysisPro } from '@/lib/openai';
import { extractTextFromBase64PDF } from '@/lib/pdfParser';

export const runtime = 'nodejs';

const MAX_TEXT_LENGTH = 15000;

const ResumeAnalyzeSchema = z.object({
  resumeText: z
    .string()
    .min(1, 'Resume text cannot be empty')
    .max(
      MAX_TEXT_LENGTH,
      `Resume text is too long (maximum ${MAX_TEXT_LENGTH} characters)`
    ),
  format: z.enum(['pdf', 'text']),
});

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
        console.log('[API] Starting PDF extraction...');
        const extractionResult = await extractTextFromBase64PDF(validatedInput.resumeText);
        console.log(`[API] Extraction result: status=${extractionResult.status}, chars=${extractionResult.characterCount}, method=${extractionResult.method}`);

        // Check extraction status - only reject if completely failed with no text
        if (extractionResult.status === 'failed' && extractionResult.characterCount === 0) {
          console.error('[API] PDF extraction completely failed');
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

        // Handle partial extraction - still proceed if we have any text
        if (extractionResult.status === 'partial') {
          console.log(`[API] ⚠️ Partial extraction: ${extractionResult.message}`);

          // Accept even very short extractions (minimum 1 character)
          if (extractionResult.characterCount < 1) {
            return NextResponse.json<ErrorResponse>(
              {
                success: false,
                error: {
                  code: 'PDF_INSUFFICIENT_CONTENT',
                  message: 'Could not extract any text from PDF. Please try a different file.',
                },
              },
              { status: 400 }
            );
          }
          // Proceed with whatever text we got
          console.log(`[API] Proceeding with partial extraction (${extractionResult.characterCount} characters)`);
        }

        // Get extracted text
        resumeText = extractionResult.text;

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

        // Only reject if completely empty
        if (resumeText.length < 1) {
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: {
                code: 'PDF_INSUFFICIENT_CONTENT',
                message: 'Could not extract any text from PDF. Please try a different file.',
              },
            },
            { status: 400 }
          );
        }

        // Log if text is very short (but still proceed)
        if (resumeText.length < 50) {
          console.log(`[API] ⚠️ Warning: Extracted text is very short (${resumeText.length} chars), but proceeding with analysis`);
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

    // Analyze resume with OpenAI Pro
    let analysis: ResumeAnalysisPro;
    try {
      analysis = await analyzeResumePro(resumeText);

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
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'OPENAI_ERROR',
            message:
              error instanceof Error
                ? 'AI analysis service is currently unavailable. Please try again later.'
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
