import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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

export async function analyzeResumeWithAI(
  resumeText: string
): Promise<ResumeAnalysis> {
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
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
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
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    const analysis = JSON.parse(responseContent) as ResumeAnalysis;

    // Validate the response structure
    if (
      typeof analysis.score !== 'number' ||
      !analysis.summary ||
      !Array.isArray(analysis.strengths) ||
      !Array.isArray(analysis.suggestions)
    ) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return analysis;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
    throw new Error('OpenAI analysis failed: Unknown error');
  }
}
