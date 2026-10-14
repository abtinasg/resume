import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, rateLimitExceededResponse } from '@/lib/rateLimit';
import OpenAI from 'openai';
import { verifyAuth } from '@/lib/verifyAuth';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_ANALYSIS_LENGTH = 50000;

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const auth = await verifyAuth(req);
    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await rateLimiters.ai(req, String(auth.userId));
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { message, analysis } = await req.json();

    // Validate inputs
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis context is required' },
        { status: 400 }
      );
    }

    const analysisJson = JSON.stringify(analysis, null, 2);
    if (analysisJson.length > MAX_ANALYSIS_LENGTH) {
      return NextResponse.json(
        { error: 'Analysis context is too large' },
        { status: 413 }
      );
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 503 }
      );
    }

    // Initialize OpenAI client only when needed
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Instructions and analysis context go in the system message; the user's
    // text is sent as its own message instead of being spliced into the prompt.
    const systemPrompt = `
You are Resume Coach AI — an expert resume mentor that helps users understand and improve their resumes.

Here's the resume analysis summary:
${analysisJson}

Give a helpful, specific, and motivational answer that references their AI score, strengths, weaknesses, and missing elements. Use conversational tone, 2–3 short paragraphs.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    const answer = response.choices[0].message?.content || 'Sorry, I could not process that.';
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('[Chat Coach] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}
