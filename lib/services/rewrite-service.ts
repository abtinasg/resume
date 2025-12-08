import { resumeService } from '@/lib/db/resume';
import { prisma } from '@/lib/db';
import { scoringService } from '@/lib/services/scoring-service';

// ==================== Type Definitions ====================

export interface RewriteBulletInput {
  bullet: string;
  targetRole?: string;
  context?: {
    company?: string;
    role?: string;
    yearRange?: string;
  };
}

export interface RewriteBulletOutput {
  original: string;
  improved: string;
  changes: string[];
  scoreImprovement: number;
  reasoning: string;
  fabricationWarnings?: string[];
}

export interface RewriteSectionInput {
  bullets: string[];
  sectionTitle: string;
  targetRole?: string;
  context?: {
    company?: string;
    role?: string;
  };
}

export interface RewriteSectionOutput {
  original: string[];
  improved: string[];
  overallChanges: string[];
  scoreImprovement: number;
  reasoning: string;
  fabricationWarnings?: string[];
}

export interface RewriteSummaryInput {
  currentSummary: string;
  targetRole?: string;
  experience?: {
    yearsTotal: number;
    recentRoles: string[];
    keySkills: string[];
  };
}

export interface RewriteSummaryOutput {
  original: string;
  improved: string;
  changes: string[];
  scoreImprovement: number;
  reasoning: string;
  fabricationWarnings?: string[];
}

export interface TailorResumeInput {
  resumeId: string;
  userId: string;
  jobDescription: string;
  jobTitle: string;
}

export interface TailorResumeOutput {
  tailoredResumeId: string;
  changes: {
    summaryChanged: boolean;
    bulletsChanged: number;
    skillsAdded: string[];
  };
  matchScoreBefore: number;
  matchScoreAfter: number;
  improvements: string[];
}

export interface CoverLetterInput {
  resumeId: string;
  userId: string;
  jobDescription: string;
  jobTitle: string;
  company: string;
  maxWords?: number;
}

export interface CoverLetterOutput {
  coverLetter: string;
  wordCount: number;
  keyPoints: string[];
}

export interface OutreachMessageInput {
  resumeId: string;
  userId: string;
  jobTitle: string;
  company: string;
  recruiterName?: string;
  maxWords?: number;
}

export interface OutreachMessageOutput {
  message: string;
  wordCount: number;
  tone: 'professional' | 'casual';
}

// ==================== Service Class ====================

export class RewriteService {
  private readonly MAX_BULLET_LENGTH = 200;
  private readonly MAX_SUMMARY_LENGTH = 500;
  private readonly MIN_SCORE_IMPROVEMENT = 5;

  /**
   * Rewrite a single bullet point
   * Quality gate: Must improve by +5 points minimum
   */
  async rewriteBullet(input: RewriteBulletInput): Promise<RewriteBulletOutput> {
    // 1. Validate input
    if (!input.bullet || input.bullet.trim().length === 0) {
      throw new Error('Bullet cannot be empty');
    }

    if (input.bullet.length > this.MAX_BULLET_LENGTH) {
      throw new Error(`Bullet too long (max ${this.MAX_BULLET_LENGTH} characters)`);
    }

    // 2. Build AI prompt
    const prompt = this.buildBulletRewritePrompt(input);

    // 3. Call AI
    const aiResponse = await this.callAI(prompt);

    // 4. Parse response (must be JSON)
    const improved = this.parseBulletRewrite(aiResponse);

    // 5. Validate for fabrication
    const fabricationWarnings = this.validateNoFabrication(input.bullet, improved);

    // 6. Estimate score improvement
    const scoreImprovement = this.estimateScoreImprovement(input.bullet, improved);

    if (scoreImprovement < this.MIN_SCORE_IMPROVEMENT) {
      return {
        original: input.bullet,
        improved: input.bullet,
        changes: ['No significant improvement possible'],
        scoreImprovement: 0,
        reasoning: 'Original bullet is already strong',
        fabricationWarnings: fabricationWarnings.length ? fabricationWarnings : undefined,
      };
    }

    // 7. Extract changes
    const changes = this.extractChanges(input.bullet, improved);

    return {
      original: input.bullet,
      improved,
      changes,
      scoreImprovement,
      reasoning: aiResponse.reasoning || 'Improved clarity, impact, and specificity',
      fabricationWarnings: fabricationWarnings.length ? fabricationWarnings : undefined,
    };
  }

  /**
   * Rewrite multiple bullets together (maintains consistency)
   */
  async rewriteSection(input: RewriteSectionInput): Promise<RewriteSectionOutput> {
    if (!input.bullets || input.bullets.length === 0) {
      throw new Error('Section must have at least one bullet');
    }

    if (input.bullets.length > 10) {
      throw new Error('Maximum 10 bullets per section');
    }

    const prompt = this.buildSectionRewritePrompt(input);
    const aiResponse = await this.callAI(prompt);
    const improved = this.parseSectionRewrite(aiResponse, input.bullets.length);

    // Validate each bullet
    const allWarnings: string[] = [];
    for (let i = 0; i < input.bullets.length; i++) {
      const warnings = this.validateNoFabrication(input.bullets[i], improved[i]);
      allWarnings.push(...warnings);
    }

    const scoreImprovement = this.estimateSectionImprovement(input.bullets, improved);
    const overallChanges = this.extractSectionChanges(input.bullets, improved);

    return {
      original: input.bullets,
      improved,
      overallChanges,
      scoreImprovement,
      reasoning: aiResponse.reasoning || 'Improved consistency, impact, and clarity across section',
      fabricationWarnings: allWarnings.length ? allWarnings : undefined,
    };
  }

  /**
   * Rewrite professional summary
   */
  async rewriteSummary(input: RewriteSummaryInput): Promise<RewriteSummaryOutput> {
    if (!input.currentSummary || input.currentSummary.trim().length === 0) {
      throw new Error('Summary cannot be empty');
    }

    if (input.currentSummary.length > this.MAX_SUMMARY_LENGTH) {
      throw new Error(`Summary too long (max ${this.MAX_SUMMARY_LENGTH} characters)`);
    }

    const prompt = this.buildSummaryRewritePrompt(input);
    const aiResponse = await this.callAI(prompt);
    const improved = this.parseSummaryRewrite(aiResponse);

    const fabricationWarnings = this.validateNoFabrication(input.currentSummary, improved);
    const scoreImprovement = this.estimateScoreImprovement(input.currentSummary, improved);
    const changes = this.extractChanges(input.currentSummary, improved);

    return {
      original: input.currentSummary,
      improved,
      changes,
      scoreImprovement,
      reasoning: aiResponse.reasoning || 'Improved clarity and impact',
      fabricationWarnings: fabricationWarnings.length ? fabricationWarnings : undefined,
    };
  }

  /**
   * Tailor resume for specific job
   * Uses scoringService for job matching
   */
  async tailorResumeForJob(input: TailorResumeInput): Promise<TailorResumeOutput> {
    // 1. Fetch original resume
    const originalResume = await resumeService.findById(input.resumeId);

    if (!originalResume || originalResume.userId !== input.userId) {
      throw new Error('Resume not found or unauthorized');
    }

    // 2. Score resume against job (before)
    const beforeResult = await scoringService.scoreResumeForJob({
      userId: input.userId,
      resumeId: input.resumeId,
      jobDescription: input.jobDescription,
      jobTitle: input.jobTitle,
    });

    const beforeScore = beforeResult.score;

    // 3. Build tailoring prompt
    const prompt = this.buildTailoringPrompt(originalResume.content, input);
    const aiResponse = await this.callAI(prompt);

    // 4. Apply tailoring to create new version
    const tailoredContent = this.applyTailoring(originalResume.content, aiResponse);

    // 5. Create new resume version
    const nextVersion = await prisma.resumeVersion.findMany({
      where: { userId: input.userId },
      orderBy: { versionNumber: 'desc' },
      take: 1,
    });

    const versionNumber = (nextVersion[0]?.versionNumber || 0) + 1;

    const tailoredResume = await resumeService.create(input.userId, {
      versionNumber,
      name: `Tailored for ${input.jobTitle}`,
      content: tailoredContent,
    });

    // 6. Score tailored resume (after)
    const afterResult = await scoringService.scoreResumeForJob({
      userId: input.userId,
      resumeId: tailoredResume.id,
      jobDescription: input.jobDescription,
      jobTitle: input.jobTitle,
    });

    const afterScore = afterResult.score;

    // 7. Extract changes
    const changes = this.extractTailoringChanges(originalResume.content, tailoredContent);

    return {
      tailoredResumeId: tailoredResume.id,
      changes,
      matchScoreBefore: beforeScore,
      matchScoreAfter: afterScore,
      improvements: aiResponse.improvements || [],
    };
  }

  /**
   * Generate cover letter for job
   */
  async generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterOutput> {
    const resume = await resumeService.findById(input.resumeId);

    if (!resume || resume.userId !== input.userId) {
      throw new Error('Resume not found or unauthorized');
    }

    const prompt = this.buildCoverLetterPrompt(resume.content, input);
    const aiResponse = await this.callAI(prompt);
    const coverLetter = this.parseCoverLetter(aiResponse, input.maxWords || 300);
    const keyPoints = this.extractKeyPoints(coverLetter);

    return {
      coverLetter,
      wordCount: coverLetter.split(/\s+/).length,
      keyPoints,
    };
  }

  /**
   * Generate LinkedIn/email outreach message
   */
  async generateOutreachMessage(input: OutreachMessageInput): Promise<OutreachMessageOutput> {
    const resume = await resumeService.findById(input.resumeId);

    if (!resume || resume.userId !== input.userId) {
      throw new Error('Resume not found or unauthorized');
    }

    const prompt = this.buildOutreachPrompt(resume.content, input);
    const aiResponse = await this.callAI(prompt);
    const message = this.parseOutreachMessage(aiResponse, input.maxWords || 150);

    return {
      message,
      wordCount: message.split(/\s+/).length,
      tone: input.recruiterName ? 'professional' : 'casual',
    };
  }

  // ==================== Private Helpers ====================

  private buildBulletRewritePrompt(input: RewriteBulletInput): string {
    let prompt = `You are a professional resume writer. Rewrite the following resume bullet to make it stronger.

Original bullet:
"${input.bullet}"

Requirements:
1. Add specific metrics if missing (but only if they're plausible given the context)
2. Use strong action verbs (led, drove, implemented, etc)
3. Make impact clear and quantifiable
4. Keep it concise (under ${this.MAX_BULLET_LENGTH} characters)
5. DO NOT fabricate companies, tools, or technologies not mentioned
6. DO NOT change the core responsibility described

`;

    if (input.targetRole) {
      prompt += `Target role: ${input.targetRole}\n`;
      prompt += `Tailor language to match this role's expectations.\n`;
    }

    if (input.context) {
      prompt += `\nContext:\n`;
      if (input.context.company) prompt += `Company: ${input.context.company}\n`;
      if (input.context.role) prompt += `Role: ${input.context.role}\n`;
      if (input.context.yearRange) prompt += `Time period: ${input.context.yearRange}\n`;
    }

    prompt += `\nProvide your response ONLY as valid JSON with this exact structure:
{
  "improved": "the improved bullet text",
  "reasoning": "brief explanation of changes",
  "changes": ["change 1", "change 2"],
  "scoreImprovement": 5
}

Do not include any text before or after the JSON. The response must be valid JSON only.`;

    return prompt;
  }

  private buildSectionRewritePrompt(input: RewriteSectionInput): string {
    let prompt = `You are a professional resume writer. Rewrite the following resume section to make it stronger while maintaining consistency across bullets.

Section: ${input.sectionTitle}
Original bullets:
${input.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Requirements:
1. Maintain consistent tone and style across all bullets
2. Add specific metrics where missing
3. Use strong action verbs
4. Make impact clear
5. DO NOT fabricate experience
6. Each bullet should be under ${this.MAX_BULLET_LENGTH} characters

`;

    if (input.targetRole) {
      prompt += `Target role: ${input.targetRole}\n`;
    }

    prompt += `\nProvide your response ONLY as valid JSON with this exact structure:
{
  "improved": ["bullet 1", "bullet 2", "bullet 3"],
  "reasoning": "brief explanation",
  "changes": ["overall change 1", "overall change 2"],
  "scoreImprovement": 10
}

Do not include any text before or after the JSON. The response must be valid JSON only.`;

    return prompt;
  }

  private buildSummaryRewritePrompt(input: RewriteSummaryInput): string {
    let prompt = `You are a professional resume writer. Rewrite this professional summary to make it more impactful.

Original summary:
"${input.currentSummary}"

Requirements:
1. Keep it concise (3-4 sentences max)
2. Lead with years of experience and role
3. Highlight 2-3 key strengths
4. Make it achievement-oriented
5. DO NOT fabricate experience

`;

    if (input.targetRole) {
      prompt += `Target role: ${input.targetRole}\n`;
    }

    if (input.experience) {
      prompt += `\nExperience context:\n`;
      prompt += `- Years of experience: ${input.experience.yearsTotal}\n`;
      prompt += `- Recent roles: ${input.experience.recentRoles.join(', ')}\n`;
      prompt += `- Key skills: ${input.experience.keySkills.join(', ')}\n`;
    }

    prompt += `\nProvide your response ONLY as valid JSON with this exact structure:
{
  "improved": "the improved summary text",
  "reasoning": "brief explanation",
  "changes": ["change 1", "change 2"],
  "scoreImprovement": 5
}

Do not include any text before or after the JSON. The response must be valid JSON only.`;

    return prompt;
  }

  private buildTailoringPrompt(resumeContent: any, input: TailorResumeInput): string {
    const resumeText = this.extractTextFromContent(resumeContent);

    return `You are a professional resume tailoring expert. Adapt this resume for the specific job.

Current resume:
${resumeText.slice(0, 2000)}

Job Details:
Title: ${input.jobTitle}
Description:
${input.jobDescription.slice(0, 1000)}

Requirements:
1. Adjust summary to emphasize relevant experience
2. Improve bullets that match job requirements
3. DO NOT fabricate experience
4. DO NOT remove important achievements
5. Keep all bullets truthful

Provide your response ONLY as valid JSON with this exact structure:
{
  "summaryChanges": "improved summary or null if no change",
  "bulletChanges": [
    {
      "experienceIndex": 0,
      "bulletIndex": 0,
      "improved": "improved bullet text"
    }
  ],
  "skillsToEmphasize": ["skill1", "skill2"],
  "improvements": ["high-level improvement 1", "improvement 2"]
}

Do not include any text before or after the JSON. The response must be valid JSON only.`;
  }

  private buildCoverLetterPrompt(resumeContent: any, input: CoverLetterInput): string {
    const resumeText = this.extractTextFromContent(resumeContent);

    return `You are a professional cover letter writer. Create a compelling cover letter for this job application.

Resume summary:
${resumeText.slice(0, 1000)}

Job Details:
Company: ${input.company}
Title: ${input.jobTitle}
Description:
${input.jobDescription.slice(0, 1000)}

Requirements:
1. Maximum ${input.maxWords || 300} words
2. Show enthusiasm and fit
3. Highlight 2-3 relevant achievements from resume
4. Explain why interested in this specific role/company
5. Professional but personable tone
6. DO NOT fabricate achievements

Provide your response ONLY as valid JSON with this exact structure:
{
  "coverLetter": "the full cover letter text",
  "keyPoints": ["key point 1", "key point 2", "key point 3"]
}

Do not include any text before or after the JSON. The response must be valid JSON only.`;
  }

  private buildOutreachPrompt(resumeContent: any, input: OutreachMessageInput): string {
    const resumeText = this.extractTextFromContent(resumeContent);

    return `You are writing a professional outreach message. Create a brief, compelling message.

Resume summary:
${resumeText.slice(0, 500)}

Job Details:
Company: ${input.company}
Title: ${input.jobTitle}
${input.recruiterName ? `Recruiter: ${input.recruiterName}` : ''}

Requirements:
1. Maximum ${input.maxWords || 150} words
2. Brief introduction
3. One key achievement
4. Clear call to action
5. ${input.recruiterName ? 'Professional' : 'Casual but professional'} tone

Provide your response ONLY as valid JSON with this exact structure:
{
  "message": "the full outreach message text"
}

Do not include any text before or after the JSON. The response must be valid JSON only.`;
  }

  private async callAI(prompt: string): Promise<any> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = content.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      // Parse as JSON
      try {
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content);
        throw new Error('AI response was not valid JSON');
      }
    } catch (error) {
      console.error('AI call failed:', error);
      throw new Error('Failed to generate rewrite');
    }
  }

  private parseBulletRewrite(aiResponse: any): string {
    if (!aiResponse.improved) {
      throw new Error('AI response missing required field: improved');
    }
    return aiResponse.improved.trim();
  }

  private parseSectionRewrite(aiResponse: any, expectedCount: number): string[] {
    if (!aiResponse.improved || !Array.isArray(aiResponse.improved)) {
      throw new Error('AI response missing required field: improved (array)');
    }
    if (aiResponse.improved.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} bullets, got ${aiResponse.improved.length}`);
    }
    return aiResponse.improved.map((b: string) => b.trim());
  }

  private parseSummaryRewrite(aiResponse: any): string {
    return this.parseBulletRewrite(aiResponse);
  }

  private parseCoverLetter(aiResponse: any, maxWords: number): string {
    const letter = aiResponse.coverLetter || '';
    const words = letter.split(/\s+/);
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...';
    }
    return letter;
  }

  private parseOutreachMessage(aiResponse: any, maxWords: number): string {
    const message = aiResponse.message || '';
    const words = message.split(/\s+/);
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...';
    }
    return message;
  }

  private validateNoFabrication(original: string, improved: string): string[] {
    const warnings: string[] = [];
    const originalLower = original.toLowerCase();
    const improvedLower = improved.toLowerCase();

    // Extract capitalized words (potential company/tech names)
    const improvedCapitalized = improved.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];

    const allowedWords = ['led', 'managed', 'drove', 'implemented', 'created', 'developed', 'built', 'designed'];

    for (const word of improvedCapitalized) {
      const wordLower = word.toLowerCase();
      if (!originalLower.includes(wordLower) && !allowedWords.includes(wordLower)) {
        warnings.push(`Potential fabrication: "${word}" not in original`);
      }
    }

    return warnings;
  }

  private estimateScoreImprovement(original: string, improved: string): number {
    let improvement = 0;

    // Has metrics now?
    const hasMetrics = /\d+[%xkm]/i.test(improved) && !/\d+[%xkm]/i.test(original);
    if (hasMetrics) improvement += 5;

    // Stronger verb?
    const strongVerbs = ['led', 'drove', 'implemented', 'architected', 'optimized', 'increased'];
    const hasStrongVerb = strongVerbs.some(v => improved.toLowerCase().includes(v));
    const hadStrongVerb = strongVerbs.some(v => original.toLowerCase().includes(v));
    if (hasStrongVerb && !hadStrongVerb) improvement += 3;

    // More specific?
    if (improved.length > original.length + 20) improvement += 2;

    // More concise (if was too long)?
    if (original.length > 150 && improved.length < original.length) improvement += 2;

    return Math.min(improvement, 15);
  }

  private estimateSectionImprovement(original: string[], improved: string[]): number {
    let total = 0;
    for (let i = 0; i < original.length; i++) {
      total += this.estimateScoreImprovement(original[i], improved[i]);
    }
    return Math.min(total, 25);
  }

  private extractChanges(original: string, improved: string): string[] {
    const changes: string[] = [];

    if (/\d+[%xkm]/i.test(improved) && !/\d+[%xkm]/i.test(original)) {
      changes.push('Added metrics');
    }

    const strongVerbs = ['led', 'drove', 'implemented', 'architected', 'optimized'];
    if (strongVerbs.some(v => improved.toLowerCase().includes(v))) {
      changes.push('Used stronger action verbs');
    }

    if (improved.length > original.length + 20) {
      changes.push('Added specificity and detail');
    }

    if (original.length > 150 && improved.length < original.length) {
      changes.push('Made more concise');
    }

    return changes.length > 0 ? changes : ['Minor wording improvements'];
  }

  private extractSectionChanges(original: string[], improved: string[]): string[] {
    const allChanges = new Set<string>();

    for (let i = 0; i < original.length; i++) {
      const changes = this.extractChanges(original[i], improved[i]);
      changes.forEach(c => allChanges.add(c));
    }

    allChanges.add('Improved consistency across section');
    return Array.from(allChanges);
  }

  private extractTailoringChanges(originalContent: any, tailoredContent: any): any {
    let bulletsChanged = 0;
    const skillsAdded: string[] = [];

    // Count changed bullets
    const origExp = originalContent.sections?.experience || [];
    const tailExp = tailoredContent.sections?.experience || [];

    for (let i = 0; i < Math.min(origExp.length, tailExp.length); i++) {
      const origBullets = origExp[i].bullets || [];
      const tailBullets = tailExp[i].bullets || [];

      for (let j = 0; j < Math.min(origBullets.length, tailBullets.length); j++) {
        if (origBullets[j] !== tailBullets[j]) {
          bulletsChanged++;
        }
      }
    }

    // Check for skills changes
    const origSkills = originalContent.sections?.skills || [];
    const tailSkills = tailoredContent.sections?.skills || [];

    for (const skill of tailSkills) {
      if (!origSkills.includes(skill)) {
        skillsAdded.push(skill);
      }
    }

    return {
      summaryChanged: originalContent.summary !== tailoredContent.summary,
      bulletsChanged,
      skillsAdded,
    };
  }

  private extractKeyPoints(coverLetter: string): string[] {
    const sentences = coverLetter.split(/[.!?]+/);
    const keyPoints = sentences
      .filter(s => /\d+[%xkm]/i.test(s) || /achiev|led|drove|implement/i.test(s))
      .slice(0, 3);

    return keyPoints.map(s => s.trim()).filter(s => s.length > 0);
  }

  private applyTailoring(originalContent: any, aiResponse: any): any {
    const tailored = JSON.parse(JSON.stringify(originalContent));

    // Apply summary changes
    if (aiResponse.summaryChanges && aiResponse.summaryChanges !== 'null') {
      tailored.summary = aiResponse.summaryChanges;
    }

    // Apply bullet changes
    if (aiResponse.bulletChanges && Array.isArray(aiResponse.bulletChanges)) {
      for (const change of aiResponse.bulletChanges) {
        const expIndex = change.experienceIndex;
        const bulletIndex = change.bulletIndex;

        if (tailored.sections?.experience?.[expIndex]?.bullets?.[bulletIndex]) {
          tailored.sections.experience[expIndex].bullets[bulletIndex] = change.improved;
        }
      }
    }

    // Emphasize skills (move to front of array)
    if (aiResponse.skillsToEmphasize && Array.isArray(aiResponse.skillsToEmphasize)) {
      if (tailored.sections?.skills) {
        const emphasized = aiResponse.skillsToEmphasize;
        const otherSkills = tailored.sections.skills.filter((s: string) => !emphasized.includes(s));
        tailored.sections.skills = [...emphasized, ...otherSkills];
      }
    }

    return tailored;
  }

  private extractTextFromContent(content: any): string {
    if (typeof content === 'string') return content;
    if (content.text) return content.text;

    let text = '';
    if (content.summary) {
      text += content.summary + '\n\n';
    }

    if (content.sections?.experience && Array.isArray(content.sections.experience)) {
      content.sections.experience.forEach((exp: any) => {
        text += `${exp.role || ''} at ${exp.company || ''}\n`;
        if (exp.bullets && Array.isArray(exp.bullets)) {
          exp.bullets.forEach((bullet: string) => {
            text += `• ${bullet}\n`;
          });
        }
        text += '\n';
      });
    }

    if (content.sections?.skills && Array.isArray(content.sections.skills)) {
      text += '\nSkills: ' + content.sections.skills.join(', ') + '\n';
    }

    return text;
  }
}

export const rewriteService = new RewriteService();
