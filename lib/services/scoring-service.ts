import { calculatePROScore } from '@/lib/scoring';
import { ScoringResult } from '@/lib/scoring/types';
import { resumeService } from '@/lib/db/resume';
import { userService } from '@/lib/db/user';
import { eventLogger, EventType } from '@/lib/services/event-logger';

// ==================== Type Definitions ====================

export interface ResumeContent {
  text?: string;
  sections?: {
    summary?: string;
    experience?: any[];
    skills?: string[];
    education?: any[];
  };
}

export interface ImprovementAction {
  action: string;
  impact: number;
  timeEstimate: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ScoringServiceResult {
  resumeId: string;
  scoring: ScoringResult;
  updatedAt: Date;
}

export interface JobMatchResult {
  score: number;
  recommendation: 'APPLY' | 'CONSIDER' | 'SKIP';
  strengths: string[];
  gaps: string[];
  reasoning: string;
}

export interface ScoreHistoryItem {
  resumeId: string;
  versionNumber: number;
  name: string | null;
  overallScore: number;
  componentScores: {
    contentQuality: number;
    atsCompatibility: number;
    formatStructure: number;
    impactMetrics: number;
  };
  improvementAreas: ImprovementAction[];
  scoredAt: Date;
}

// ==================== Service Class ====================

export class ScoringService {
  private readonly MAX_RESUME_LENGTH = 20_000;
  private readonly MATCH_WEIGHT = 0.6;
  private readonly QUALITY_WEIGHT = 0.4;

  /**
   * Score a resume and persist results to database
   */
  async scoreAndPersistResume(params: {
    userId: string;
    resumeId: string;
    targetRole?: string;
  }): Promise<ScoringServiceResult> {
    const startTime = Date.now();

    // 1. Fetch resume
    const resume = await resumeService.findById(params.resumeId);

    if (!resume) {
      throw new Error('Resume not found');
    }

    if (resume.userId !== params.userId) {
      throw new Error('Unauthorized: Resume does not belong to user');
    }

    if (!resume.content) {
      await eventLogger.log({
        userId: params.userId,
        eventType: EventType.RESUME_SCORED,
        context: {
          resumeId: params.resumeId,
          outcome: 'REJECTED',
        },
        metadata: { reason: 'EMPTY_CONTENT' },
      });
      throw new Error('Resume content is empty or invalid');
    }

    // 2. Extract text
    const resumeText = this.extractTextFromContent(resume.content);

    if (!resumeText.trim()) {
      await eventLogger.log({
        userId: params.userId,
        eventType: EventType.RESUME_SCORED,
        context: {
          resumeId: params.resumeId,
          outcome: 'REJECTED',
        },
        metadata: { reason: 'EMPTY_EXTRACTED_TEXT' },
      });
      throw new Error('Resume has no extractable text content');
    }

    // 3. Apply length limit
    const limitedText = resumeText.slice(0, this.MAX_RESUME_LENGTH);
    const wasTruncated = resumeText.length > this.MAX_RESUME_LENGTH;

    // 4. Get target role from profile if not provided
    let targetRole = params.targetRole;
    if (!targetRole) {
      const user = await userService.findById(params.userId);
      const profileRoles = (user?.profile?.targetRoles as string[] | undefined) ?? [];
      targetRole = profileRoles[0] || 'Software Engineer';
    }

    // 5. Call scoring engine
    let scoringResult: ScoringResult;
    try {
      scoringResult = await calculatePROScore(limitedText, targetRole);
    } catch (err) {
      await eventLogger.log({
        userId: params.userId,
        eventType: EventType.RESUME_SCORED,
        context: {
          resumeId: params.resumeId,
          outcome: 'ERROR',
        },
        metadata: {
          reason: 'SCORING_ENGINE_ERROR',
          errorMessage: (err as Error).message,
        },
      });
      throw err;
    }

    const scoringDurationMs = Date.now() - startTime;

    // 6. Persist scores
    await resumeService.updateScores(params.resumeId, {
      overallScore: scoringResult.overallScore,
      componentScores: {
        contentQuality: scoringResult.componentScores.contentQuality.score,
        atsCompatibility: scoringResult.componentScores.atsCompatibility.score,
        formatStructure: scoringResult.componentScores.formatStructure.score,
        impactMetrics: scoringResult.componentScores.impactMetrics.score,
      },
      improvementAreas: this.extractImprovementActions(scoringResult) as any,
    });

    // 7. Log success
    await eventLogger.log({
      userId: params.userId,
      eventType: EventType.RESUME_SCORED,
      context: {
        resumeId: params.resumeId,
        overallScore: scoringResult.overallScore,
        targetRole,
        atsPassProbability: scoringResult.atsPassProbability,
        outcome: 'SUCCESS',
      },
      metadata: {
        componentScores: {
          contentQuality: scoringResult.componentScores.contentQuality.score,
          atsCompatibility: scoringResult.componentScores.atsCompatibility.score,
          formatStructure: scoringResult.componentScores.formatStructure.score,
          impactMetrics: scoringResult.componentScores.impactMetrics.score,
        },
        truncated: wasTruncated,
        scoringDurationMs,
      },
    });

    return {
      resumeId: params.resumeId,
      scoring: scoringResult,
      updatedAt: new Date(),
    };
  }

  /**
   * Score resume without persisting (for preview)
   */
  async scoreTransientResume(params: {
    resumeContent: ResumeContent;
    targetRole?: string;
  }): Promise<ScoringResult> {
    const resumeText = this.extractTextFromContent(params.resumeContent);

    if (!resumeText.trim()) {
      throw new Error('Resume content is empty');
    }

    const limitedText = resumeText.slice(0, this.MAX_RESUME_LENGTH);

    return await calculatePROScore(
      limitedText,
      params.targetRole || 'Software Engineer'
    );
  }

  /**
   * Score resume for specific job
   */
  async scoreResumeForJob(params: {
    userId: string;
    resumeId: string;
    jobDescription: string;
    jobTitle: string;
  }): Promise<JobMatchResult> {
    const resume = await resumeService.findById(params.resumeId);

    if (!resume || resume.userId !== params.userId) {
      throw new Error('Resume not found or unauthorized');
    }

    if (!resume.content) {
      throw new Error('Resume has no content');
    }

    const resumeText = this.extractTextFromContent(resume.content);
    const limitedText = resumeText.slice(0, this.MAX_RESUME_LENGTH);

    const scoringResult = await calculatePROScore(limitedText, params.jobTitle);
    const jobKeywords = this.extractJobKeywords(params.jobDescription);
    const matchScore = this.calculateMatchScore(scoringResult, jobKeywords, params.jobDescription);

    await eventLogger.log({
      userId: params.userId,
      eventType: EventType.JOB_SCORED,
      context: {
        resumeId: params.resumeId,
        jobTitle: params.jobTitle,
        matchScore: matchScore.score,
        recommendation: matchScore.recommendation,
      },
    });

    return matchScore;
  }

  /**
   * Get score history for user
   */
  async getScoreHistory(userId: string): Promise<ScoreHistoryItem[]> {
    const resumes = await resumeService.findAllByUser(userId);

    return resumes
      .filter((r: any) => r.overallScore !== null)
      .map((r: any) => ({
        resumeId: r.id,
        versionNumber: r.versionNumber,
        name: r.name,
        overallScore: r.overallScore!,
        componentScores: (r.componentScores ?? {
          contentQuality: 0,
          atsCompatibility: 0,
          formatStructure: 0,
          impactMetrics: 0,
        }) as any,
        improvementAreas: (r.improvementAreas ?? []) as ImprovementAction[],
        scoredAt: r.updatedAt,
      }))
      .sort((a: ScoreHistoryItem, b: ScoreHistoryItem) => b.versionNumber - a.versionNumber);
  }

  // ==================== Private Helpers ====================

  private extractTextFromContent(content: any): string {
    if (typeof content === 'string') return content;
    if (content.text) return content.text;

    let text = '';
    if (content.sections) {
      const sections = content.sections;

      if (sections.summary) {
        text += sections.summary + '\n\n';
      }

      if (sections.experience && Array.isArray(sections.experience)) {
        sections.experience.forEach((exp: any) => {
          text += `${exp.role || ''} at ${exp.company || ''}\n`;
          if (exp.bullets && Array.isArray(exp.bullets)) {
            exp.bullets.forEach((bullet: string) => {
              text += `• ${bullet}\n`;
            });
          }
          text += '\n';
        });
      }

      if (sections.skills && Array.isArray(sections.skills)) {
        text += '\nSkills: ' + sections.skills.join(', ') + '\n';
      }
    }

    return text;
  }

  private extractImprovementActions(scoringResult: ScoringResult): ImprovementAction[] {
    const roadmap = scoringResult.improvementRoadmap?.toReach80 ?? [];
    return roadmap.slice(0, 5).map(action => ({
      action: action.action,
      impact: action.pointsGain,
      timeEstimate: action.time,
      priority: action.priority || 'medium',
    }));
  }

  private extractJobKeywords(jobDescription: string): string[] {
    const words = jobDescription.toLowerCase().split(/\W+/);
    const techKeywords = words.filter(w =>
      w.length > 3 &&
      !['the', 'and', 'for', 'with', 'from', 'that', 'this', 'will', 'have'].includes(w)
    );
    return [...new Set(techKeywords)].slice(0, 20);
  }

  private calculateMatchScore(
    scoringResult: ScoringResult,
    jobKeywords: string[],
    jobDescription: string
  ): JobMatchResult {
    const keywordGap = scoringResult.atsDetailedReport?.keywordGapAnalysis;

    if (!keywordGap) {
      return {
        score: Math.round(scoringResult.overallScore * 0.7),
        recommendation: 'CONSIDER',
        strengths: [],
        gaps: ['Unable to perform detailed keyword analysis'],
        reasoning: 'Analysis incomplete - recommend manual review',
      };
    }

    const totalRequired = (keywordGap.mustHave?.total ?? 0) + (keywordGap.important?.total ?? 0);
    const totalFound = (keywordGap.mustHave?.found ?? 0) + (keywordGap.important?.found ?? 0);

    const matchPercentage = totalRequired > 0 ? (totalFound / totalRequired) * 100 : 50;

    // 60/40 weight: match/quality
    const finalScore = Math.round(
      (matchPercentage * this.MATCH_WEIGHT) +
      (scoringResult.overallScore * this.QUALITY_WEIGHT)
    );

    let recommendation: 'APPLY' | 'CONSIDER' | 'SKIP';
    if (finalScore >= 75) recommendation = 'APPLY';
    else if (finalScore >= 60) recommendation = 'CONSIDER';
    else recommendation = 'SKIP';

    return {
      score: finalScore,
      recommendation,
      strengths: keywordGap.mustHave?.foundKeywords?.slice(0, 5) ?? [],
      gaps: keywordGap.mustHave?.missing?.slice(0, 5) ?? [],
      reasoning: `Match score based on ${totalFound}/${totalRequired} key requirements met (60% match, 40% quality)`,
    };
  }
}

export const scoringService = new ScoringService();
