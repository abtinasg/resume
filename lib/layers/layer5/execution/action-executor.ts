/**
 * Layer 5 - Orchestrator
 * Action Executor
 *
 * Coordinates action execution by routing to appropriate handlers.
 * Handles retry logic and error handling.
 *
 * KEY: Actions may call Layer 1 (evaluation), Layer 3 (rewriting), and Layer 4 (state).
 */

import { ActionType, LayerEventType } from '../types';
import type {
  Task,
  ActionExecution,
  ActionExecutionResult,
  Layer4StateForLayer5,
} from '../types';
import { getActionExecutionConfig } from '../config';
import {
  OrchestratorError,
  OrchestratorErrorCode,
  createExecutionFailedError,
  createMaxRetriesError,
} from '../errors';
import { executeImproveResume, executeImproveSummary, executeImproveSection } from './resume-actions';
import { executeApplyToJob, trackApplicationStatus } from './application-actions';
import { executeFollowUp } from './followup-actions';

// ==================== Execution Tracking ====================

/**
 * Create an execution tracking object
 */
function createExecution(task: Task): ActionExecution {
  return {
    task_id: task.task_id,
    action_type: task.action_type,
    started_at: new Date().toISOString(),
    retry_count: 0,
  };
}

/**
 * Complete an execution with result
 */
function completeExecution(
  execution: ActionExecution,
  result: ActionExecutionResult
): ActionExecution {
  return {
    ...execution,
    completed_at: new Date().toISOString(),
    result,
  };
}

// ==================== Delay Utility ====================

/**
 * Sleep for a specified number of seconds
 */
function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// ==================== Action Routing ====================

/**
 * Route action to appropriate handler
 */
async function routeAction(
  task: Task,
  state: Layer4StateForLayer5
): Promise<ActionExecutionResult> {
  switch (task.action_type) {
    case ActionType.IMPROVE_RESUME: {
      // Check for specific rewrite type
      const rewriteType = task.payload.rewrite_type ?? 'bullet';
      if (rewriteType === 'summary') {
        return executeImproveSummary(task, state);
      }
      if (rewriteType === 'section') {
        return executeImproveSection(task, state);
      }
      return executeImproveResume(task, state);
    }
    
    case ActionType.APPLY_TO_JOB:
      return executeApplyToJob(task, state);
    
    case ActionType.FOLLOW_UP:
      return executeFollowUp(task, state);
    
    case ActionType.UPDATE_TARGETS:
      // User-only action
      return {
        success: true,
        suggestion: 'Please review and update your target roles in your profile.',
      };
    
    case ActionType.COLLECT_MISSING_INFO:
      // User-only action
      return {
        success: true,
        suggestion: 'Please complete your profile with the missing information.',
      };
    
    case ActionType.REFRESH_STATE:
      // User-only action
      return {
        success: true,
        suggestion: 'Please update your resume and application status.',
      };
    
    default:
      return {
        success: false,
        error: `Unknown action type: ${task.action_type}`,
      };
  }
}

// ==================== Main Executor ====================

/**
 * Execute an action with retry logic
 */
export async function executeAction(
  task: Task,
  state: Layer4StateForLayer5
): Promise<ActionExecution> {
  const config = getActionExecutionConfig();
  let execution = createExecution(task);
  
  // User-only actions don't need execution
  if (task.execution === 'user_only') {
    const result: ActionExecutionResult = {
      success: true,
      suggestion: `This is a user-only task. ${task.description}`,
    };
    return completeExecution(execution, result);
  }
  
  // Try execution with retries
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= config.max_retries; attempt++) {
    try {
      // Delay before retry (not on first attempt)
      if (attempt > 0) {
        await sleep(config.retry_delay_seconds);
        execution.retry_count = attempt;
      }
      
      // Execute the action
      const result = await routeAction(task, state);
      
      if (result.success) {
        return completeExecution(execution, result);
      }
      
      // If action failed but is recoverable, retry
      if (result.error && attempt < config.max_retries) {
        lastError = new Error(result.error);
        continue;
      }
      
      // Failed, no more retries
      return completeExecution(execution, result);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log error
      console.error(
        `[Layer5] Action execution failed (attempt ${attempt + 1}/${config.max_retries + 1}):`,
        error
      );
      
      // If this was the last attempt, return failure
      if (attempt >= config.max_retries) {
        const result: ActionExecutionResult = {
          success: false,
          error: lastError.message,
          fallback: 'user_only',
          suggestion: 'The automatic execution failed. Please try manually.',
        };
        return completeExecution(execution, result);
      }
    }
  }
  
  // Should not reach here, but handle just in case
  const result: ActionExecutionResult = {
    success: false,
    error: lastError?.message ?? 'Unknown error',
    fallback: 'user_only',
  };
  return completeExecution(execution, result);
}

/**
 * Execute multiple actions in sequence
 */
export async function executeActions(
  tasks: Task[],
  state: Layer4StateForLayer5
): Promise<ActionExecution[]> {
  const executions: ActionExecution[] = [];
  
  for (const task of tasks) {
    const execution = await executeAction(task, state);
    executions.push(execution);
    
    // Stop on critical failure
    if (!execution.result?.success && task.priority >= 90) {
      console.warn(
        `[Layer5] Stopping execution: high-priority task ${task.task_id} failed`
      );
      break;
    }
  }
  
  return executions;
}

/**
 * Get execution summary
 */
export function getExecutionSummary(
  executions: ActionExecution[]
): {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  totalRetries: number;
} {
  return {
    total: executions.length,
    successful: executions.filter(e => e.result?.success).length,
    failed: executions.filter(e => e.result && !e.result.success).length,
    skipped: executions.filter(e => !e.result).length,
    totalRetries: executions.reduce((sum, e) => sum + e.retry_count, 0),
  };
}
