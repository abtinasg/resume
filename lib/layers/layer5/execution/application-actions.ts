/**
 * Layer 5 - Orchestrator
 * Application Actions
 *
 * Handles job application actions.
 * These are primarily user-confirmed actions that track status via Layer 4.
 */

import type {
  Task,
  ActionExecutionResult,
  Layer4StateForLayer5,
} from '../types';
import { isResumeReadyForApplications } from './resume-actions';

// ==================== Layer Integration Stubs ====================

/**
 * Get job posting from Layer 4
 */
async function callLayer4GetJobPosting(jobId: string): Promise<{
  id: string;
  title: string;
  company: string;
  url?: string;
} | null> {
  // TODO: Integrate with actual Layer 4
  console.log('[Layer5] Would call Layer 4 getJobPosting:', jobId);
  
  // Mock response
  return {
    id: jobId,
    title: 'Software Engineer',
    company: 'Example Corp',
    url: 'https://example.com/jobs/123',
  };
}

/**
 * Create application via Layer 4
 */
async function callLayer4CreateApplication(data: {
  userId: string;
  jobId: string;
  resumeVersionId?: string;
  status: string;
  strategyModeAtApply: string;
}): Promise<{ id: string; success: boolean }> {
  // TODO: Integrate with actual Layer 4
  console.log('[Layer5] Would call Layer 4 createApplication:', data);
  
  return {
    id: `app_${Date.now().toString(36)}`,
    success: true,
  };
}

/**
 * Log event via Layer 4
 */
async function callLayer4LogEvent(data: {
  userId: string;
  eventType: string;
  context: Record<string, unknown>;
}): Promise<void> {
  // TODO: Integrate with actual Layer 4
  console.log('[Layer5] Would call Layer 4 logEvent:', data);
}

// ==================== Application Actions ====================

/**
 * Execute an apply-to-job action
 * This is a user-confirmed action - we create a draft application
 * that the user then confirms when they actually apply.
 */
export async function executeApplyToJob(
  task: Task,
  state: Layer4StateForLayer5
): Promise<ActionExecutionResult> {
  const { payload } = task;
  
  // Step 1: Check pre-conditions
  const resumeReady = isResumeReadyForApplications(state);
  if (!resumeReady.ready) {
    return {
      success: false,
      error: resumeReady.reason,
      suggestion: 'Improve your resume score before applying to jobs.',
    };
  }
  
  // Step 2: Verify job exists
  const jobId = payload.job_id;
  if (!jobId) {
    return {
      success: false,
      error: 'No job ID provided',
    };
  }
  
  const job = await callLayer4GetJobPosting(jobId);
  if (!job) {
    return {
      success: false,
      error: 'Job not found',
    };
  }
  
  // Step 3: Create draft application
  const userId = 'current_user'; // Would come from context
  try {
    const application = await callLayer4CreateApplication({
      userId,
      jobId: job.id,
      resumeVersionId: state.resume.master_resume_id,
      status: 'draft',
      strategyModeAtApply: state.current_strategy_mode ?? 'APPLY_MODE',
    });
    
    if (!application.success) {
      return {
        success: false,
        error: 'Failed to create application',
      };
    }
    
    // Step 4: Log event
    await callLayer4LogEvent({
      userId,
      eventType: 'application_created',
      context: {
        task_id: task.task_id,
        application_id: application.id,
        job_id: jobId,
        job_title: job.title,
        company: job.company,
      },
    });
    
    // Step 5: Return success with guidance
    return {
      success: true,
      application_id: application.id,
      suggestion: `Ready to apply! Click "Mark as Applied" after submitting your application to ${job.company}.`,
      details: {
        job_title: job.title,
        company: job.company,
        url: job.url,
      },
    };
    
  } catch (error) {
    console.error('[Layer5] Apply action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track application status
 * Called when user updates their application status (e.g., marked as applied)
 */
export async function trackApplicationStatus(
  task: Task,
  state: Layer4StateForLayer5,
  newStatus: 'submitted' | 'interview_scheduled' | 'rejected' | 'offer'
): Promise<ActionExecutionResult> {
  const applicationId = task.payload.application_id;
  
  if (!applicationId) {
    return {
      success: false,
      error: 'No application ID provided',
    };
  }
  
  try {
    const userId = 'current_user';
    
    // Log the status change
    await callLayer4LogEvent({
      userId,
      eventType: 'application_status_changed',
      context: {
        application_id: applicationId,
        old_status: 'draft',
        new_status: newStatus,
        task_id: task.task_id,
      },
    });
    
    return {
      success: true,
      details: {
        application_id: applicationId,
        new_status: newStatus,
      },
    };
    
  } catch (error) {
    console.error('[Layer5] Track status failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get application status summary
 */
export function getApplicationStatusSummary(
  state: Layer4StateForLayer5
): {
  total: number;
  thisWeek: number;
  target: number;
  progress: number;
  interviewRate: number;
} {
  const { pipeline_state, user_profile } = state;
  const target = user_profile.weeklyAppTarget ?? 10;
  
  return {
    total: pipeline_state.total_applications,
    thisWeek: pipeline_state.applications_last_7_days,
    target,
    progress: target > 0 ? (pipeline_state.applications_last_7_days / target) * 100 : 0,
    interviewRate: pipeline_state.interview_rate,
  };
}
