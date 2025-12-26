/**
 * Layer 6 - Job Discovery & Matching Module
 * Job Comparator
 *
 * Compares multiple jobs side-by-side.
 */

import type { 
  RankedJob, 
  JobComparisonResult, 
  ComparisonDetails, 
  SkillsOverlap,
  SalaryRange,
  JobCategory,
} from '../types';
import type { SeniorityLevel } from '../../shared/types';
import { generateComparisonInsights } from '../ranking/insights-generator';

// ==================== Skills Analysis ====================

/**
 * Analyze skills overlap across jobs
 */
export function analyzeSkillsOverlap(
  jobs: RankedJob[],
  userSkills: string[] = []
): SkillsOverlap {
  // Collect all required skills per job
  const skillsPerJob: Record<string, Set<string>> = {};
  const allSkills = new Set<string>();
  
  for (const job of jobs) {
    const jobId = job.job.job_id;
    skillsPerJob[jobId] = new Set();
    
    // Add required skills
    for (const skill of job.job.requirements.required_skills) {
      const skillLower = skill.value.toLowerCase();
      skillsPerJob[jobId].add(skillLower);
      allSkills.add(skillLower);
    }
    
    // Add required tools
    for (const tool of job.job.requirements.required_tools) {
      const toolLower = tool.value.toLowerCase();
      skillsPerJob[jobId].add(toolLower);
      allSkills.add(toolLower);
    }
  }
  
  // Find common requirements (skills that appear in all jobs)
  const common_requirements: string[] = [];
  const jobIds = Object.keys(skillsPerJob);
  
  for (const skill of allSkills) {
    const appearsInAll = jobIds.every(jobId => skillsPerJob[jobId].has(skill));
    if (appearsInAll) {
      common_requirements.push(skill);
    }
  }
  
  // Find unique requirements per job
  const unique_per_job: Record<string, string[]> = {};
  
  for (const jobId of jobIds) {
    unique_per_job[jobId] = [];
    for (const skill of skillsPerJob[jobId]) {
      // Check if this skill is unique to this job
      const isUnique = jobIds.filter(
        otherId => otherId !== jobId && skillsPerJob[otherId].has(skill)
      ).length === 0;
      
      if (isUnique) {
        unique_per_job[jobId].push(skill);
      }
    }
  }
  
  // Calculate user's coverage
  const userSkillsLower = new Set(userSkills.map(s => s.toLowerCase()));
  const matchedSkills = Array.from(allSkills).filter(s => userSkillsLower.has(s));
  const your_coverage = allSkills.size > 0
    ? Math.round((matchedSkills.length / allSkills.size) * 100)
    : 100;
  
  return {
    common_requirements,
    unique_per_job,
    your_coverage,
  };
}

// ==================== Main Comparison ====================

/**
 * Compare multiple jobs
 */
export function compareJobs(
  jobs: RankedJob[],
  userSkills: string[] = [],
  userSeniorityLevel?: SeniorityLevel
): JobComparisonResult {
  if (jobs.length < 2) {
    throw new Error('Need at least 2 jobs to compare');
  }
  
  if (jobs.length > 5) {
    // Limit to top 5 by priority score
    jobs = jobs.slice(0, 5);
  }
  
  // Analyze skills overlap
  const skills_overlap = analyzeSkillsOverlap(jobs, userSkills);
  
  // Build comparison details
  const comparison: ComparisonDetails = {
    fit_scores: jobs.map(j => j.fit_score),
    categories: jobs.map(j => j.category),
    skills_overlap,
    seniority_levels: jobs.map(j => j.job.requirements.seniority_expected),
    your_level: userSeniorityLevel,
    locations: jobs.map(j => j.job.location),
    remote_friendly: jobs.map(j => j.job.work_arrangement === 'remote'),
    salary_ranges: jobs
      .filter(j => j.job.salary_range)
      .map(j => j.job.salary_range as SalaryRange),
  };
  
  // Find best fit
  const sortedByFit = [...jobs].sort((a, b) => b.fit_score - a.fit_score);
  const best_fit = sortedByFit[0].job.job_id;
  
  // Find easiest to get (safety job or highest fit among safeties)
  const safetyJobs = jobs.filter(j => j.category === 'safety');
  const easiest_to_get = safetyJobs.length > 0
    ? safetyJobs.sort((a, b) => b.fit_score - a.fit_score)[0].job.job_id
    : sortedByFit[0].job.job_id;
  
  // Find best for growth (highest career capital)
  const sortedByCareerCapital = [...jobs].sort(
    (a, b) => b.career_capital.score - a.career_capital.score
  );
  const best_for_growth = sortedByCareerCapital[0].job.job_id;
  
  // Find best for brand
  const sortedByBrand = [...jobs].sort(
    (a, b) => b.career_capital.brand_score - a.career_capital.brand_score
  );
  const best_for_brand = sortedByBrand[0].job.job_id;
  
  // Find best for compensation
  const jobsWithSalary = jobs.filter(j => j.job.salary_range?.max);
  const best_for_compensation = jobsWithSalary.length > 0
    ? jobsWithSalary.sort((a, b) => 
        (b.job.salary_range?.max || 0) - (a.job.salary_range?.max || 0)
      )[0].job.job_id
    : undefined;
  
  // Generate insights
  const insightsInput = jobs.map(j => ({
    job_id: j.job.job_id,
    job_title: j.job.job_title,
    company: j.job.company,
    fit_score: j.fit_score,
    category: j.category,
    required_skills: j.job.requirements.required_skills.map(s => s.value),
    career_capital_score: j.career_capital.score,
  }));
  const insights = generateComparisonInsights(insightsInput);
  
  return {
    jobs,
    comparison,
    best_fit,
    easiest_to_get,
    best_for_growth,
    best_for_brand,
    best_for_compensation,
    insights,
  };
}

/**
 * Get comparison summary as text
 */
export function getComparisonSummary(result: JobComparisonResult): string {
  const { jobs, best_fit, easiest_to_get, best_for_growth } = result;
  
  const bestFitJob = jobs.find(j => j.job.job_id === best_fit);
  const easiestJob = jobs.find(j => j.job.job_id === easiest_to_get);
  const growthJob = jobs.find(j => j.job.job_id === best_for_growth);
  
  let summary = `Comparing ${jobs.length} jobs:\n\n`;
  
  if (bestFitJob) {
    summary += `Best Fit: ${bestFitJob.job.job_title} at ${bestFitJob.job.company} (${bestFitJob.fit_score}/100)\n`;
  }
  
  if (easiestJob && easiestJob.job.job_id !== best_fit) {
    summary += `Easiest to Get: ${easiestJob.job.job_title} at ${easiestJob.job.company}\n`;
  }
  
  if (growthJob && growthJob.job.job_id !== best_fit) {
    summary += `Best for Growth: ${growthJob.job.job_title} at ${growthJob.job.company} (${growthJob.career_capital.score}/100 career capital)\n`;
  }
  
  summary += `\nCommon requirements: ${result.comparison.skills_overlap.common_requirements.join(', ') || 'None'}\n`;
  summary += `Your skills coverage: ${result.comparison.skills_overlap.your_coverage}%\n`;
  
  return summary;
}
