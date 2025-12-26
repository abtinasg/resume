/**
 * Layer 6 - Job Discovery & Matching Module
 * Insights Generator
 *
 * Generates human-readable insights for jobs.
 */

import type { FitScore } from '../../layer1/types';
import type { ParsedJob, JobCategory, CareerCapital } from '../types';

// ==================== Job Insights ====================

/**
 * Generate insights for a single job
 */
export function generateJobInsights(
  job: ParsedJob,
  fitAnalysis: FitScore | null,
  category: JobCategory,
  careerCapital: CareerCapital
): {
  quickInsights: string[];
  redFlags: string[];
  greenFlags: string[];
} {
  const quickInsights: string[] = [];
  const redFlags: string[] = [];
  const greenFlags: string[] = [];
  
  const fitScore = fitAnalysis?.fit_score ?? 50;
  
  // Insight 1: Fit summary
  if (fitScore >= 80) {
    quickInsights.push(`Excellent match (${fitScore}/100) - strong alignment with your background`);
    greenFlags.push('Excellent fit score');
  } else if (fitScore >= 65) {
    quickInsights.push(`Good fit (${fitScore}/100) - meets most requirements`);
    greenFlags.push('Good fit score');
  } else if (fitScore >= 50) {
    quickInsights.push(`Moderate fit (${fitScore}/100) - some gaps but viable`);
  } else {
    quickInsights.push(`Weak fit (${fitScore}/100) - significant gaps present`);
    redFlags.push('Low fit score');
  }
  
  // Insight 2: Key strengths (matched skills)
  if (fitAnalysis?.gaps?.skills?.matched && fitAnalysis.gaps.skills.matched.length > 0) {
    const topMatched = fitAnalysis.gaps.skills.matched.slice(0, 3);
    greenFlags.push(`Strong on: ${topMatched.join(', ')}`);
  }
  
  // Insight 3: Key gaps (missing skills)
  if (fitAnalysis?.gaps?.skills?.critical_missing && fitAnalysis.gaps.skills.critical_missing.length > 0) {
    const topMissing = fitAnalysis.gaps.skills.critical_missing.slice(0, 3);
    quickInsights.push(`Key gaps: ${topMissing.join(', ')}`);
    if (topMissing.length >= 3) {
      redFlags.push(`Missing ${topMissing.length}+ critical skills`);
    }
  }
  
  // Insight 4: Transferable skills
  if (fitAnalysis?.gaps?.skills?.transferable && fitAnalysis.gaps.skills.transferable.length > 0) {
    quickInsights.push(`Transferable: ${fitAnalysis.gaps.skills.transferable[0]} experience applies`);
    greenFlags.push('Has transferable skills');
  }
  
  // Insight 5: Seniority alignment
  if (fitAnalysis?.gaps?.seniority) {
    const seniority = fitAnalysis.gaps.seniority;
    if (seniority.alignment === 'underqualified') {
      const gapYears = seniority.gap_years || 0;
      quickInsights.push(`Stretch role: ${gapYears}+ years experience gap`);
      if (gapYears > 2) {
        redFlags.push(`${gapYears}+ year seniority gap`);
      }
    } else if (seniority.alignment === 'overqualified') {
      quickInsights.push('May be overqualified for this level');
    } else {
      greenFlags.push('Seniority well-aligned');
    }
  }
  
  // Insight 6: Career capital
  if (careerCapital.brand_score >= 80) {
    quickInsights.push('High-value brand for career growth');
    greenFlags.push('Top-tier company');
  }
  
  if (careerCapital.skill_growth_score >= 75) {
    quickInsights.push('Strong opportunity for skill development');
    greenFlags.push('High growth potential');
  }
  
  // Insight 7: Category context
  if (category === 'reach') {
    quickInsights.push('Ambitious target - worth the effort if excited');
  } else if (category === 'safety') {
    quickInsights.push('Solid backup option with high acceptance probability');
    greenFlags.push('Safety option');
  } else if (category === 'avoid') {
    redFlags.push('Categorized as avoid - significant mismatches');
  }
  
  // Insight 8: Work arrangement
  if (job.work_arrangement === 'remote') {
    greenFlags.push('Remote position');
  }
  
  // Insight 9: Salary
  if (job.salary_range?.min && job.salary_range?.max) {
    quickInsights.push(`Salary: $${formatSalary(job.salary_range.min)} - $${formatSalary(job.salary_range.max)}`);
  }
  
  // Insight 10: Parse quality warning
  if (job.metadata.parse_quality === 'low') {
    redFlags.push('Low parse quality - job details may be incomplete');
  }
  
  return {
    quickInsights: quickInsights.slice(0, 7), // Max 7 insights
    redFlags,
    greenFlags,
  };
}

/**
 * Format salary for display
 */
function formatSalary(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}K`;
  }
  return amount.toString();
}

// ==================== Comparison Insights ====================

/**
 * Generate comparative insights for multiple jobs
 */
export function generateComparisonInsights(
  jobs: Array<{
    job_id: string;
    job_title: string;
    company: string;
    fit_score: number;
    category: string;
    required_skills: string[];
    career_capital_score: number;
  }>
): string[] {
  const insights: string[] = [];
  
  if (jobs.length < 2) {
    return ['Need at least 2 jobs to compare'];
  }
  
  // Insight 1: Best fit
  const sortedByFit = [...jobs].sort((a, b) => b.fit_score - a.fit_score);
  insights.push(
    `Best fit: ${sortedByFit[0].job_title} at ${sortedByFit[0].company} (${sortedByFit[0].fit_score}/100)`
  );
  
  // Insight 2: Fit spread
  const fitSpread = sortedByFit[0].fit_score - sortedByFit[sortedByFit.length - 1].fit_score;
  if (fitSpread > 20) {
    insights.push(`Significant fit variation (${fitSpread} point spread) - choose carefully`);
  } else {
    insights.push('Similar fit scores across jobs - consider other factors');
  }
  
  // Insight 3: Common skills
  const allSkills = jobs.flatMap(j => j.required_skills);
  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const commonSkills = Object.entries(skillCounts)
    .filter(([_, count]) => count >= Math.ceil(jobs.length / 2))
    .map(([skill]) => skill)
    .slice(0, 3);
  
  if (commonSkills.length > 0) {
    insights.push(`Common requirements: ${commonSkills.join(', ')}`);
  }
  
  // Insight 4: Unique requirements
  for (const job of jobs.slice(0, 3)) {
    const uniqueSkills = job.required_skills.filter(
      skill => skillCounts[skill] === 1
    ).slice(0, 2);
    
    if (uniqueSkills.length > 0) {
      insights.push(`${job.company} uniquely needs: ${uniqueSkills.join(', ')}`);
    }
  }
  
  // Insight 5: Career capital comparison
  const sortedByCapital = [...jobs].sort((a, b) => b.career_capital_score - a.career_capital_score);
  if (sortedByCapital[0].career_capital_score > sortedByCapital[sortedByCapital.length - 1].career_capital_score + 20) {
    insights.push(
      `Best for career growth: ${sortedByCapital[0].company} (${sortedByCapital[0].career_capital_score}/100)`
    );
  }
  
  // Insight 6: Category distribution
  const categories = jobs.map(j => j.category);
  const hasReach = categories.includes('reach');
  const hasSafety = categories.includes('safety');
  
  if (hasReach && hasSafety) {
    insights.push('Good mix of ambitious and safe options');
  } else if (categories.every(c => c === 'reach')) {
    insights.push('All reach positions - consider adding safety options');
  }
  
  return insights.slice(0, 8); // Max 8 insights
}
