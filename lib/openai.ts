import OpenAI from 'openai';
import { Agent } from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { lookup as dnsLookup } from 'dns';
import { promisify } from 'util';

let openaiClient: OpenAI | null = null;

// Promisify DNS lookup for better error handling
const lookupAsync = promisify(dnsLookup);

// Model configuration with fallback
const PRIMARY_MODEL = 'gpt-4o-mini';
const FALLBACK_MODEL = 'gpt-3.5-turbo';
const TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 2;

/**
 * Custom DNS lookup with retry logic for EAI_AGAIN errors
 */
function customLookup(
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
): void {
  const maxAttempts = 3;
  let attempt = 0;

  const attemptLookup = async () => {
    try {
      attempt++;
      const result = await lookupAsync(hostname, options);
      if (typeof result === 'object' && result && 'address' in result && 'family' in result) {
        callback(null, result.address as string, result.family as number);
      } else if (typeof result === 'string') {
        callback(null, result, 4);
      } else {
        // Handle array case or unexpected types
        callback(null, (result as unknown) as string, 4);
      }
    } catch (error: any) {
      // Retry on EAI_AGAIN error
      if (error.code === 'EAI_AGAIN' && attempt < maxAttempts) {
        console.warn(`[OpenAI] DNS lookup failed (attempt ${attempt}/${maxAttempts}), retrying...`);
        setTimeout(attemptLookup, 200 * attempt); // Exponential backoff
      } else {
        console.error(`[OpenAI] DNS lookup failed after ${attempt} attempts:`, error.message);
        callback(error, '', 0);
      }
    }
  };

  attemptLookup();
}

/**
 * Get or create OpenAI client instance
 * @throws Error with code MISSING_API_KEY if API key is not set
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('[OpenAI] MISSING_API_KEY: OPENAI_API_KEY environment variable is not set');
      const error = new Error('OPENAI_API_KEY environment variable is not set');
      error.name = 'MISSING_API_KEY';
      throw error;
    }

    // Create a custom HTTPS agent with proxy and DNS retry logic
    let httpAgent: Agent;

    // Check if we're in a proxy environment
    const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;

    if (proxyUrl) {
      // Use proxy agent when proxy is configured
      httpAgent = new HttpsProxyAgent(proxyUrl, {
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: TIMEOUT_MS,
      });
      console.log('[OpenAI] Using proxy configuration for HTTP agent');
    } else {
      // Use regular agent with custom DNS lookup
      httpAgent = new Agent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: TIMEOUT_MS,
        // Use custom DNS lookup with retry logic for EAI_AGAIN errors
        lookup: customLookup,
      });
      console.log('[OpenAI] Using custom DNS lookup for HTTP agent');
    }

    openaiClient = new OpenAI({
      apiKey,
      timeout: TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
      httpAgent,
    } as any);

    console.log('[OpenAI] Client initialized successfully');
  }
  return openaiClient;
}

export interface ResumeAnalysis {
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
}

/**
 * Call OpenAI API with model fallback support
 */
async function callOpenAIWithFallback(
  openai: OpenAI,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  temperature: number,
  maxTokens: number
): Promise<OpenAI.Chat.ChatCompletion> {
  const startTime = Date.now();

  // Try primary model first
  try {
    console.log(`[OpenAI] Attempting analysis with model: ${PRIMARY_MODEL}`);
    const completion = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });

    const processingTime = Date.now() - startTime;
    console.log(`[OpenAI] ✓ Success with ${PRIMARY_MODEL} (${processingTime}ms)`);

    return completion;
  } catch (primaryError) {
    const primaryErrorMsg = primaryError instanceof Error ? primaryError.message : 'Unknown error';
    console.warn(`[OpenAI] ⚠ Primary model (${PRIMARY_MODEL}) failed: ${primaryErrorMsg}`);

    // Log full error details for debugging
    if (primaryError && typeof primaryError === 'object') {
      console.warn('[OpenAI] Full error details:', JSON.stringify(primaryError, Object.getOwnPropertyNames(primaryError), 2));
    }

    // Check if error is due to model access (404, permission errors)
    const shouldFallback =
      primaryErrorMsg.includes('does not exist') ||
      primaryErrorMsg.includes('model_not_found') ||
      primaryErrorMsg.includes('404') ||
      primaryErrorMsg.includes('permission');

    if (!shouldFallback) {
      // For non-model-access errors, throw immediately
      throw primaryError;
    }

    // Try fallback model
    try {
      console.log(`[OpenAI] Attempting fallback to model: ${FALLBACK_MODEL}`);
      const fallbackStartTime = Date.now();

      const completion = await openai.chat.completions.create({
        model: FALLBACK_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      });

      const processingTime = Date.now() - fallbackStartTime;
      console.log(`[OpenAI] ✓ Success with fallback ${FALLBACK_MODEL} (${processingTime}ms)`);

      return completion;
    } catch (fallbackError) {
      const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
      console.error(`[OpenAI] ✗ Fallback model (${FALLBACK_MODEL}) also failed: ${fallbackErrorMsg}`);

      // Throw the fallback error as it's the most recent
      throw fallbackError;
    }
  }
}

/**
 * Analyze resume using OpenAI with comprehensive error handling
 * @param resumeText - The resume text to analyze
 * @returns Promise<ResumeAnalysis> - Structured analysis result
 * @throws Error with specific error codes for different failure scenarios
 */
export async function analyzeResumeWithAI(
  resumeText: string
): Promise<ResumeAnalysis> {
  const overallStartTime = Date.now();

  const prompt = `Analyze the following resume and provide structured feedback in JSON format.

Resume:
${resumeText}

Respond with a JSON object containing:
- score (number 0-100): Overall resume quality score
- summary:
  - overall (string): 2-3 sentence overview
  - topStrength (string): The single best aspect
  - topWeakness (string): The most critical improvement area
- strengths (array of 3-5 items):
  - title (string)
  - description (string)
  - example (string): Specific example from the resume
  - category (string): "content", "format", or "ats"
- suggestions (array of 3-5 items):
  - title (string)
  - description (string)
  - priority (string): "high", "medium", or "low"
  - beforeExample (string): Current version
  - afterExample (string): Improved version
  - actionSteps (array of strings): Concrete steps to implement

Focus on:
1. Content quality and impact
2. ATS (Applicant Tracking System) optimization
3. Format and readability
4. Quantifiable achievements
5. Keywords and industry relevance

Respond ONLY with valid JSON, no additional text.`;

  try {
    // Get OpenAI client (validates API key)
    const openai = getOpenAIClient();

    // Call OpenAI with fallback support
    const completion = await callOpenAIWithFallback(
      openai,
      [
        {
          role: 'system',
          content:
            'You are an expert resume reviewer and career coach. Provide detailed, actionable feedback in JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      0.7,
      2000
    );

    // Extract and validate response content
    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      console.error('[OpenAI] ✗ Empty response from API');
      throw new Error('OPENAI_ERROR: Empty response from OpenAI');
    }

    // Parse JSON response
    let analysis: ResumeAnalysis;
    try {
      analysis = JSON.parse(responseContent) as ResumeAnalysis;
    } catch (parseError) {
      console.error('[OpenAI] ✗ Failed to parse JSON response:', parseError);
      console.error('[OpenAI] Response content:', responseContent.substring(0, 200));
      throw new Error('OPENAI_ERROR: Invalid JSON response from OpenAI');
    }

    // Validate response structure
    if (
      typeof analysis.score !== 'number' ||
      !analysis.summary ||
      typeof analysis.summary.overall !== 'string' ||
      typeof analysis.summary.topStrength !== 'string' ||
      typeof analysis.summary.topWeakness !== 'string' ||
      !Array.isArray(analysis.strengths) ||
      !Array.isArray(analysis.suggestions)
    ) {
      console.error('[OpenAI] ✗ Invalid response structure:', {
        hasScore: typeof analysis.score === 'number',
        hasSummary: !!analysis.summary,
        hasStrengths: Array.isArray(analysis.strengths),
        hasSuggestions: Array.isArray(analysis.suggestions),
      });
      throw new Error('OPENAI_ERROR: Invalid response structure from OpenAI');
    }

    // Validate that arrays are not empty
    if (analysis.strengths.length === 0 || analysis.suggestions.length === 0) {
      console.error('[OpenAI] ✗ Empty strengths or suggestions array');
      throw new Error('OPENAI_ERROR: Incomplete analysis from OpenAI');
    }

    const totalProcessingTime = Date.now() - overallStartTime;
    console.log(`[OpenAI] ✓ Analysis completed successfully in ${totalProcessingTime}ms`);
    console.log(`[OpenAI] Response stats: score=${analysis.score}, strengths=${analysis.strengths.length}, suggestions=${analysis.suggestions.length}`);

    return analysis;
  } catch (error) {
    const totalProcessingTime = Date.now() - overallStartTime;

    // Handle specific error types
    if (error instanceof Error) {
      // If it's already a formatted error, re-throw it
      if (error.name === 'MISSING_API_KEY' || error.message.startsWith('OPENAI_ERROR:')) {
        throw error;
      }

      // Log detailed error information
      console.error(`[OpenAI] ✗ Analysis failed after ${totalProcessingTime}ms:`, {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });

      // Handle timeout errors
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('OPENAI_ERROR: Request timed out after 30 seconds');
      }

      // Handle rate limit errors
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        throw new Error('OPENAI_ERROR: Rate limit exceeded, please try again later');
      }

      // Handle authentication errors
      if (error.message.includes('401') || error.message.includes('authentication')) {
        throw new Error('OPENAI_ERROR: Invalid API key');
      }

      // Handle insufficient quota errors
      if (error.message.includes('insufficient_quota') || error.message.includes('quota')) {
        throw new Error('OPENAI_ERROR: API quota exceeded');
      }

      // Generic OpenAI error
      throw new Error(`OPENAI_ERROR: ${error.message}`);
    }

    // Unknown error type
    console.error('[OpenAI] ✗ Unknown error type:', error);
    throw new Error('OPENAI_ERROR: Unknown error occurred');
  }
}
