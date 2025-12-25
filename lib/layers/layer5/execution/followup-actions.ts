/**
 * Layer 5 - Orchestrator
 * Follow-up Actions
 *
 * Handles application follow-up actions.
 * These are user-only actions that provide guidance and track status.
 */

import type {
  Task,
  ActionExecutionResult,
  Layer4StateForLayer5,
  FollowUpApplication,
} from '../types';

// ==================== Layer Integration Stubs ====================

/**
 * Get application from Layer 4
 */
async function callLayer4GetApplication(applicationId: string): Promise<{
  id: string;
  job_title: string;
  company: string;
  applied_at: string;
  follow_up_count: number;
  status: string;
} | null> {
  // TODO: Integrate with actual Layer 4
  console.log('[Layer5] Would call Layer 4 getApplication:', applicationId);
  
  // Mock response
  return {
    id: applicationId,
    job_title: 'Software Engineer',
    company: 'Example Corp',
    applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    follow_up_count: 0,
    status: 'submitted',
  };
}

/**
 * Record follow-up via Layer 4
 */
async function callLayer4RecordFollowUp(
  applicationId: string,
  message?: string
): Promise<{ success: boolean; follow_up_count: number }> {
  // TODO: Integrate with actual Layer 4
  console.log('[Layer5] Would call Layer 4 recordFollowUp:', applicationId);
  
  return {
    success: true,
    follow_up_count: 1,
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

// ==================== Follow-up Guidance ====================

/**
 * Generate follow-up guidance based on timing
 */
function generateFollowUpGuidance(
  daysSinceApplication: number,
  followUpCount: number,
  company: string
): { template: string; tips: string[] } {
  const tips: string[] = [];
  let template: string;
  
  if (followUpCount === 0) {
    // First follow-up
    if (daysSinceApplication >= 7 && daysSinceApplication <= 10) {
      template = `Hi [Recruiter/Hiring Manager],

I hope this message finds you well. I wanted to follow up on my application for the [Position] role at ${company} that I submitted about a week ago.

I remain very interested in this opportunity and would welcome the chance to discuss how my experience in [relevant skill/area] could contribute to your team.

Is there any additional information I can provide to support my application?

Best regards,
[Your Name]`;
      
      tips.push('This is the optimal time for a first follow-up');
      tips.push('Keep it brief and professional');
      tips.push('Mention a specific skill or achievement relevant to the role');
    } else if (daysSinceApplication > 10) {
      template = `Hi [Recruiter/Hiring Manager],

I'm following up on my application for the [Position] role at ${company}. I submitted my application about ${daysSinceApplication} days ago and wanted to express my continued interest.

I would be grateful for any update on the status of my application or timeline for next steps.

Thank you for your time and consideration.

Best regards,
[Your Name]`;
      
      tips.push('It\'s been a while - be polite but direct');
      tips.push('Ask specifically about timeline');
    } else {
      template = `Note: It may be too early for a follow-up. Consider waiting until 7-10 days after applying.`;
      tips.push('Typically, wait 7-10 days before first follow-up');
      tips.push('Following up too early can seem overeager');
    }
  } else {
    // Second follow-up
    template = `Hi [Recruiter/Hiring Manager],

I wanted to briefly follow up once more on my application for the [Position] role at ${company}. 

I understand you're likely reviewing many candidates. If the position has been filled or you've moved forward with other candidates, I would appreciate knowing so I can update my records.

If there's still an opportunity to be considered, I remain very interested and happy to provide any additional information.

Thank you for your time.

Best regards,
[Your Name]`;
    
    tips.push('This is likely your final follow-up for this application');
    tips.push('Give them an easy out while expressing continued interest');
    tips.push('Consider moving on after this follow-up');
  }
  
  return { template, tips };
}

// ==================== Follow-up Actions ====================

/**
 * Execute a follow-up action
 * This is a user-only action that provides guidance
 */
export async function executeFollowUp(
  task: Task,
  state: Layer4StateForLayer5
): Promise<ActionExecutionResult> {
  const { payload } = task;
  const applicationId = payload.application_id;
  
  if (!applicationId) {
    return {
      success: false,
      error: 'No application ID provided',
    };
  }
  
  try {
    // Step 1: Get application details
    const app = await callLayer4GetApplication(applicationId);
    
    if (!app) {
      return {
        success: false,
        error: 'Application not found',
      };
    }
    
    // Step 2: Check if follow-up is appropriate
    if (app.follow_up_count >= 2) {
      return {
        success: false,
        error: 'Maximum follow-ups reached (2)',
        suggestion: 'Consider focusing on other applications. Too many follow-ups can be counterproductive.',
      };
    }
    
    const daysSince = payload.days_since_application ?? 
      Math.floor((Date.now() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24));
    
    // Step 3: Generate guidance
    const guidance = generateFollowUpGuidance(
      daysSince,
      app.follow_up_count,
      app.company
    );
    
    // Step 4: Return guidance (user will send follow-up manually)
    return {
      success: true,
      suggestion: 'Here\'s a follow-up template you can customize and send:',
      details: {
        company: app.company,
        job_title: app.job_title,
        days_since_application: daysSince,
        follow_up_count: app.follow_up_count,
        template: guidance.template,
        tips: guidance.tips,
      },
    };
    
  } catch (error) {
    console.error('[Layer5] Follow-up action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Record that a follow-up was sent
 * Called after user sends the follow-up
 */
export async function recordFollowUpSent(
  task: Task,
  state: Layer4StateForLayer5,
  message?: string
): Promise<ActionExecutionResult> {
  const applicationId = task.payload.application_id;
  
  if (!applicationId) {
    return {
      success: false,
      error: 'No application ID provided',
    };
  }
  
  try {
    // Record the follow-up
    const result = await callLayer4RecordFollowUp(applicationId, message);
    
    if (!result.success) {
      return {
        success: false,
        error: 'Failed to record follow-up',
      };
    }
    
    // Log event
    const userId = 'current_user';
    await callLayer4LogEvent({
      userId,
      eventType: 'follow_up_sent',
      context: {
        task_id: task.task_id,
        application_id: applicationId,
        follow_up_count: result.follow_up_count,
      },
    });
    
    return {
      success: true,
      details: {
        application_id: applicationId,
        follow_up_count: result.follow_up_count,
      },
    };
    
  } catch (error) {
    console.error('[Layer5] Record follow-up failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get follow-up recommendations summary
 */
export function getFollowUpSummary(
  state: Layer4StateForLayer5
): {
  total: number;
  ready: number;
  upcoming: number;
  maxedOut: number;
} {
  const followUps = state.followups.applications_needing_followup;
  
  return {
    total: followUps.length,
    ready: followUps.filter(f => 
      f.suggested_action === 'FOLLOW_UP' && 
      f.days_since_application >= 7
    ).length,
    upcoming: followUps.filter(f => 
      f.suggested_action === 'FOLLOW_UP' && 
      f.days_since_application < 7
    ).length,
    maxedOut: followUps.filter(f => 
      f.follow_up_count >= 2
    ).length,
  };
}
