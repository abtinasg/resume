import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  resumeContext: z.object({
    overall_score: z.number(),
    sections: z.object({
      structure: z.number(),
      content: z.number(),
      tailoring: z.number(),
    }),
    summary: z.string(),
    actionables: z.array(z.object({
      title: z.string(),
      points: z.number(),
      fix: z.string(),
      category: z.string().optional(),
      priority: z.string().optional(),
    })),
  }),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

interface ChatSuccessResponse {
  success: true;
  reply: string;
  timestamp: string;
}

interface ChatErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Chat AI Coach] 💬 New chat request received');

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Chat AI Coach] ✗ OPENAI_API_KEY not configured');
      return NextResponse.json<ChatErrorResponse>(
        {
          success: false,
          error: {
            code: 'AI_UNAVAILABLE',
            message: 'AI Coach is currently unavailable. Please try again later.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ChatErrorResponse>(
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

    let validatedInput: ChatRequest;
    try {
      validatedInput = ChatRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstIssue = error.issues[0];
        return NextResponse.json<ChatErrorResponse>(
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
      return NextResponse.json<ChatErrorResponse>(
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

    // Create OpenAI client
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build conversation context
    const { message, resumeContext, conversationHistory = [] } = validatedInput;

    // System prompt for AI Coach
    const systemPrompt = `You are ResumeCoachAI, an expert HR resume consultant and career coach.

Your role is to help users improve their resume based on their analysis results.

**Current Resume Analysis:**
- Overall Score: ${resumeContext.overall_score}/100
- Structure: ${resumeContext.sections.structure}/40
- Content: ${resumeContext.sections.content}/60
- Tailoring: ${resumeContext.sections.tailoring}/40

**Summary:** ${resumeContext.summary}

**Key Issues to Address:**
${resumeContext.actionables.slice(0, 5).map((a, i) => `${i + 1}. ${a.title} (${a.points} points)`).join('\n')}

**Your coaching style:**
- Friendly, supportive, and encouraging
- Provide specific, actionable advice
- Keep responses short and concise (max 3-4 sentences)
- When suggesting improvements, provide before→after examples when possible
- Focus on high-impact changes that will improve their score
- Use emojis sparingly to keep tone friendly
- Ask clarifying questions when needed

**Important:**
- Don't overwhelm the user with too much information at once
- Prioritize the most impactful improvements first
- Be honest but constructive about weaknesses
- Celebrate their strengths and progress`;

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    console.log('[Chat AI Coach] 🤖 Calling OpenAI for chat response...');
    const aiStartTime = Date.now();

    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini', // Using mini for faster, cheaper responses
        temperature: 0.7, // Higher temperature for more conversational tone
        max_tokens: 300, // Keep responses concise
        messages,
      });

      const aiProcessingTime = Date.now() - aiStartTime;
      const reply = completion.choices[0].message.content;

      if (!reply) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('[Chat AI Coach] ✓ AI response generated:', {
        processingTime: `${aiProcessingTime}ms`,
        tokens: completion.usage?.total_tokens,
        replyLength: reply.length,
      });

      const totalTime = Date.now() - startTime;
      console.log('[Chat AI Coach] 🎉 Chat request completed:', {
        totalTime: `${totalTime}ms`,
      });

      return NextResponse.json<ChatSuccessResponse>(
        {
          success: true,
          reply,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (aiError) {
      console.error('[Chat AI Coach] ✗ OpenAI API error:', aiError);

      // Check for specific OpenAI errors
      if (aiError instanceof Error) {
        if (aiError.message.includes('API key')) {
          return NextResponse.json<ChatErrorResponse>(
            {
              success: false,
              error: {
                code: 'INVALID_API_KEY',
                message: 'AI service configuration error',
              },
              timestamp: new Date().toISOString(),
            },
            { status: 503 }
          );
        }

        if (aiError.message.includes('rate limit')) {
          return NextResponse.json<ChatErrorResponse>(
            {
              success: false,
              error: {
                code: 'RATE_LIMIT',
                message: 'Too many requests. Please wait a moment and try again.',
              },
              timestamp: new Date().toISOString(),
            },
            { status: 429 }
          );
        }
      }

      return NextResponse.json<ChatErrorResponse>(
        {
          success: false,
          error: {
            code: 'AI_ERROR',
            message: 'Failed to generate AI response. Please try again.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Chat AI Coach] ✗ Unexpected error:', error);
    return NextResponse.json<ChatErrorResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
