import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeResumeWithAI } from '@/lib/openai';
import { extractTextFromBase64PDF } from '@/lib/pdfParser';

export const runtime = 'nodejs';

const MAX_TEXT_LENGTH = 15000;

const ResumeAnalyzeSchema = z.object({
  resumeText: z
    .string()
    .min(50, 'Resume text is too short (minimum 50 characters)')
    .max(
      MAX_TEXT_LENGTH,
      `Resume text is too long (maximum ${MAX_TEXT_LENGTH} characters)`
    ),
  format: z.enum(['pdf', 'text']),
});

type ResumeAnalyzeInput = z.infer<typeof ResumeAnalyzeSchema>;

interface SuccessResponse {
  success: true;
  data: {
    score: number;
    summary: {
      overall: string;
      topStrength: string;
      topWeakness: string;
    };
    strengths: Array<{
      title: string;
      description: string;
      example: string;
      category: 'content' | 'format' | 'ats';
    }>;
    suggestions: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      beforeExample: string;
      afterExample: string;
      actionSteps: string[];
    }>;
  };
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
        resumeText = await extractTextFromBase64PDF(validatedInput.resumeText);

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

        if (resumeText.length < 50) {
          return NextResponse.json<ErrorResponse>(
            {
              success: false,
              error: {
                code: 'PDF_INSUFFICIENT_CONTENT',
                message: 'PDF does not contain enough text content',
              },
            },
            { status: 400 }
          );
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

    // Analyze resume with OpenAI
    let analysis;
    try {
      analysis = await analyzeResumeWithAI(resumeText);
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
