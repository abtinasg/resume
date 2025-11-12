/**
 * Job Description Matching API
 *
 * Premium feature that uses AI to compare a resume against a job description
 * and provide detailed matching analysis with recommendations.
 *
 * Features:
 * - AI-powered matching analysis
 * - Skill gap identification
 * - Keyword optimization suggestions
 * - Match percentage calculation
 * - Premium feature with usage limits
 * - Intelligent caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { checkFeatureAccess, checkUsageLimit, decrementUsage } from '@/lib/premium';
import { FEATURES } from '@/lib/featureGating';
import { trackEvent } from '@/lib/analytics';
import { getCachedJobMatch, cacheJobMatch } from '@/lib/cache';
import { z } from 'zod';
import * as crypto from 'crypto';
import OpenAI from 'openai';

// Request validation schema
const JobMatchRequestSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  resumeId: z.number().optional(),
});

// Job match analysis response type
export interface JobMatchAnalysis {
  matchScore: number; // 0-100
  summary: {
    overview: string;
    topStrengths: string[];
    topGaps: string[];
    recommendation: string;
  };
  skillMatch: {
    matched: string[];
    missing: string[];
    transferable: string[];
  };
  keywordAnalysis: {
    requiredKeywords: {
      keyword: string;
      found: boolean;
      importance: 'critical' | 'high' | 'medium';
    }[];
    coverageScore: number; // 0-100
  };
  experienceMatch: {
    score: number; // 0-100
    analysis: string;
    gaps: string[];
  };
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionSteps: string[];
  }[];
  tailoringGuide: {
    sectionsToEmphasize: string[];
    phrasesToInclude: string[];
    skillsToHighlight: string[];
  };
}

/**
 * Generate hash for caching
 */
function generateHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Call OpenAI to analyze job match
 */
async function analyzeJobMatchWithAI(
  resumeText: string,
  jobDescription: string
): Promise<JobMatchAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({ apiKey });

  const prompt = `You are an expert recruiter and career coach. Analyze how well the following resume matches the job description and provide detailed feedback.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide a comprehensive matching analysis in the following JSON structure (respond ONLY with valid JSON):

{
  "matchScore": <number 0-100>,
  "summary": {
    "overview": "2-3 sentence summary of the match quality",
    "topStrengths": ["List 3-4 strongest matching points"],
    "topGaps": ["List 3-4 most critical gaps or missing elements"],
    "recommendation": "Should apply? What's the fit level? (Strong/Moderate/Weak fit and why)"
  },
  "skillMatch": {
    "matched": ["List all skills from resume that match job requirements"],
    "missing": ["List required skills that are absent or not evident"],
    "transferable": ["List skills from resume that could transfer to job requirements"]
  },
  "keywordAnalysis": {
    "requiredKeywords": [
      {
        "keyword": "keyword/phrase from job description",
        "found": true/false,
        "importance": "critical" | "high" | "medium"
      }
    ],
    "coverageScore": <number 0-100>
  },
  "experienceMatch": {
    "score": <number 0-100>,
    "analysis": "2-3 sentences on experience level match",
    "gaps": ["List any experience gaps or mismatches"]
  },
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "high" | "medium" | "low",
      "actionSteps": ["Specific action step 1", "Specific action step 2"]
    }
  ],
  "tailoringGuide": {
    "sectionsToEmphasize": ["Resume sections to emphasize for this job"],
    "phrasesToInclude": ["Specific phrases/terms to add"],
    "skillsToHighlight": ["Skills to prominently feature"]
  }
}

Analysis Guidelines:
1. Be honest and specific - no generic feedback
2. Identify exact keywords and phrases from job description
3. Consider both hard skills (technical) and soft skills (leadership, communication)
4. Evaluate seniority/experience level match
5. Provide actionable, specific recommendations
6. Consider ATS optimization
7. Be constructive but realistic about match quality

Respond ONLY with the JSON object, no markdown or additional text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert recruiter analyzing resume-job fit. Provide detailed, honest feedback in JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse and validate response
    const analysis = JSON.parse(responseContent) as JobMatchAnalysis;

    // Basic validation
    if (
      typeof analysis.matchScore !== 'number' ||
      !analysis.summary ||
      !analysis.skillMatch ||
      !analysis.keywordAnalysis ||
      !analysis.recommendations ||
      !analysis.tailoringGuide
    ) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return analysis;
  } catch (error: any) {
    console.error('OpenAI job match error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

/**
 * POST /api/job-match
 * Analyze how well a resume matches a job description
 *
 * Body: { resumeText: string, jobDescription: string, resumeId?: number }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate user
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
          },
        },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // Check premium feature access
    const accessCheck = await checkFeatureAccess(userId, FEATURES.JOB_MATCHING);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PREMIUM_FEATURE',
            message: 'Job matching is a premium feature',
            reason: accessCheck.reason,
            subscription: accessCheck.subscription,
          },
        },
        { status: 403 }
      );
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(userId, 'jobMatch');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USAGE_LIMIT_REACHED',
            message: 'Job match limit reached for this period',
            remaining: usageCheck.remaining,
            limit: usageCheck.limit,
          },
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = JobMatchRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { resumeText, jobDescription, resumeId } = validation.data;

    // Generate cache key based on job description hash
    const jobDescriptionHash = generateHash(jobDescription);

    // Check cache first
    const cached = await getCachedJobMatch(userId, jobDescriptionHash);
    if (cached) {
      console.log('[JobMatch] Cache hit, returning cached result');
      await trackEvent('job_match_cached', {
        userId,
        request: req,
        metadata: { matchScore: cached.matchScore, resumeId },
      });

      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        metadata: {
          processingTime: Date.now() - startTime,
          remainingMatches: usageCheck.remaining,
        },
      });
    }

    // Perform AI analysis
    console.log('[JobMatch] Performing AI analysis...');
    const analysis = await analyzeJobMatchWithAI(resumeText, jobDescription);

    // Decrement usage
    await decrementUsage(userId, 'jobMatch');

    // Cache the result
    await cacheJobMatch(userId, jobDescriptionHash, analysis);

    // Track analytics
    await trackEvent('job_match_completed', {
      userId,
      request: req,
      metadata: {
        matchScore: analysis.matchScore,
        processingTime: Date.now() - startTime,
        resumeId,
      },
    });

    const processingTime = Date.now() - startTime;
    console.log(`[JobMatch] Analysis completed in ${processingTime}ms, score: ${analysis.matchScore}`);

    return NextResponse.json({
      success: true,
      data: analysis,
      cached: false,
      metadata: {
        processingTime,
        remainingMatches: usageCheck.remaining - 1,
      },
    });
  } catch (error: any) {
    console.error('Job match error:', error);

    // Track error
    await trackEvent('job_match_error', {
      userId: undefined,
      request: req,
      metadata: { error: error.message },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to analyze job match',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/job-match
 * Get usage information for job matching
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
          },
        },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // Check feature access
    const accessCheck = await checkFeatureAccess(userId, FEATURES.JOB_MATCHING);

    // Get usage limits
    const usageCheck = await checkUsageLimit(userId, 'jobMatch');

    return NextResponse.json({
      success: true,
      data: {
        hasAccess: accessCheck.hasAccess,
        usage: {
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
          allowed: usageCheck.allowed,
        },
        subscription: accessCheck.subscription,
      },
    });
  } catch (error: any) {
    console.error('Get job match info error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve job match information',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
