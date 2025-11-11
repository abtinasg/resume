import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const { message, analysis } = await req.json();

    // Validate inputs
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis context is required' },
        { status: 400 }
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

    // Build system prompt with analysis context
    const prompt = `
You are Resume Coach AI — an expert resume mentor that helps users understand and improve their resumes.

Here's the resume analysis summary:
${JSON.stringify(analysis, null, 2)}

The user says: "${message}"

Give a helpful, specific, and motivational answer that references their AI score, strengths, weaknesses, and missing elements. Use conversational tone, 2–3 short paragraphs.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        { role: 'system', content: 'You are Resume Coach AI, a helpful expert resume mentor.' },
        { role: 'user', content: prompt },
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
