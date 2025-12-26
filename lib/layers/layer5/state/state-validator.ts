/**
 * Layer 5 - Orchestrator
 * State Validator
 *
 * Validates state from Layer 4 for planning purposes.
 * Checks freshness, required fields, and consistency.
 */

import type {
  Layer4StateForLayer5,
  StateValidationResult,
  ValidationIssue,
  StalenessSeverity,
} from '../types';
import { getStateFreshnessConfig } from '../config';

// ==================== Validation Rules ====================

/**
 * Check if state has required fields for planning
 */
function validateRequiredFields(state: Layer4StateForLayer5): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Pipeline state is required
  if (!state.pipeline_state) {
    issues.push({
      code: 'MISSING_PIPELINE_STATE',
      severity: 'critical',
      message: 'Pipeline state is missing',
      field: 'pipeline_state',
    });
  }
  
  // User profile is required
  if (!state.user_profile) {
    issues.push({
      code: 'MISSING_USER_PROFILE',
      severity: 'critical',
      message: 'User profile is missing',
      field: 'user_profile',
    });
  }
  
  // Target roles should be present
  if (!state.user_profile?.target_roles?.length) {
    issues.push({
      code: 'NO_TARGET_ROLES',
      severity: 'warning',
      message: 'No target roles defined - recommendations will be generic',
      field: 'user_profile.target_roles',
    });
  }
  
  // Resume state should exist
  if (!state.resume) {
    issues.push({
      code: 'MISSING_RESUME_STATE',
      severity: 'warning',
      message: 'Resume state is missing',
      field: 'resume',
    });
  }
  
  // Freshness state should exist
  if (!state.freshness) {
    issues.push({
      code: 'MISSING_FRESHNESS',
      severity: 'warning',
      message: 'Freshness state is missing',
      field: 'freshness',
    });
  }
  
  // State version should be present
  if (state.state_version === undefined || state.state_version < 0) {
    issues.push({
      code: 'INVALID_STATE_VERSION',
      severity: 'warning',
      message: 'State version is invalid or missing',
      field: 'state_version',
    });
  }
  
  return issues;
}

/**
 * Check state consistency
 */
function validateConsistency(state: Layer4StateForLayer5): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Applications should be consistent
  if (state.pipeline_state) {
    const { total_applications, applications_last_7_days, applications_last_30_days } = state.pipeline_state;
    
    if (applications_last_7_days > applications_last_30_days) {
      issues.push({
        code: 'INCONSISTENT_APP_COUNTS',
        severity: 'warning',
        message: 'Weekly applications exceed monthly (inconsistent)',
        field: 'pipeline_state.applications_last_7_days',
      });
    }
    
    if (applications_last_30_days > total_applications) {
      issues.push({
        code: 'INCONSISTENT_APP_COUNTS',
        severity: 'warning',
        message: 'Monthly applications exceed total (inconsistent)',
        field: 'pipeline_state.applications_last_30_days',
      });
    }
    
    // Interview rate should be reasonable
    if (state.pipeline_state.interview_rate < 0 || state.pipeline_state.interview_rate > 1) {
      issues.push({
        code: 'INVALID_INTERVIEW_RATE',
        severity: 'warning',
        message: 'Interview rate should be between 0 and 1',
        field: 'pipeline_state.interview_rate',
      });
    }
  }
  
  // Resume score should be in range
  if (state.resume?.resume_score !== undefined) {
    if (state.resume.resume_score < 0 || state.resume.resume_score > 100) {
      issues.push({
        code: 'INVALID_RESUME_SCORE',
        severity: 'warning',
        message: 'Resume score should be between 0 and 100',
        field: 'resume.resume_score',
      });
    }
  }
  
  // Weekly target should be in range
  if (state.user_profile?.weeklyAppTarget !== undefined) {
    if (state.user_profile.weeklyAppTarget < 0 || state.user_profile.weeklyAppTarget > 50) {
      issues.push({
        code: 'INVALID_WEEKLY_TARGET',
        severity: 'warning',
        message: 'Weekly target should be between 0 and 50',
        field: 'user_profile.weeklyAppTarget',
      });
    }
  }
  
  return issues;
}

/**
 * Check state freshness
 */
function validateFreshness(state: Layer4StateForLayer5): {
  isFresh: boolean;
  severity: StalenessSeverity;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const config = getStateFreshnessConfig();
  
  // Check if explicitly marked stale
  if (state.freshness?.is_stale) {
    const severity = state.freshness.staleness_severity || 'warning';
    
    issues.push({
      code: 'STATE_IS_STALE',
      severity: severity === 'critical' ? 'critical' : 'warning',
      message: state.freshness.staleness_reason || 'State is marked as stale',
      field: 'freshness.is_stale',
    });
    
    return {
      isFresh: false,
      severity,
      issues,
    };
  }
  
  // Check computed_at timestamp
  if (state.computed_at) {
    const computedAt = new Date(state.computed_at);
    const now = new Date();
    const daysSinceComputed = Math.floor(
      (now.getTime() - computedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceComputed > config.max_stale_days) {
      issues.push({
        code: 'STATE_TOO_OLD',
        severity: 'warning',
        message: `State is ${daysSinceComputed} days old (max: ${config.max_stale_days})`,
        field: 'computed_at',
      });
      
      return {
        isFresh: false,
        severity: daysSinceComputed > config.max_stale_days * 2 ? 'critical' : 'warning',
        issues,
      };
    }
  }
  
  return {
    isFresh: true,
    severity: 'none',
    issues,
  };
}

// ==================== Main Validation ====================

/**
 * Validate Layer 4 state for Layer 5 use
 */
export function validateState(state: Layer4StateForLayer5): StateValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Validate required fields
  issues.push(...validateRequiredFields(state));
  
  // Validate consistency
  issues.push(...validateConsistency(state));
  
  // Validate freshness
  const freshness = validateFreshness(state);
  issues.push(...freshness.issues);
  
  // Determine overall pass/fail
  const hasCritical = issues.some(i => i.severity === 'critical');
  const passed = !hasCritical;
  
  // Determine recommended action
  let recommendedAction: string | undefined;
  if (hasCritical) {
    recommendedAction = 'Critical issues must be resolved before planning';
  } else if (!freshness.isFresh) {
    recommendedAction = 'Update your information for better recommendations';
  } else if (issues.length > 0) {
    recommendedAction = 'Consider addressing warnings for optimal planning';
  }
  
  return {
    passed,
    issues,
    is_fresh: freshness.isFresh,
    staleness_severity: freshness.severity,
    recommended_action: recommendedAction,
  };
}

/**
 * Quick check if state is valid for planning
 */
export function isStateValidForPlanning(state: Layer4StateForLayer5): boolean {
  const validation = validateState(state);
  return validation.passed;
}

/**
 * Get validation summary
 */
export function getValidationSummary(
  result: StateValidationResult
): { status: string; details: string[] } {
  const details: string[] = [];
  
  if (result.passed && result.issues.length === 0) {
    return {
      status: '✅ State is valid and fresh',
      details: ['Ready for planning'],
    };
  }
  
  if (result.passed && result.issues.length > 0) {
    const warningCount = result.issues.filter(i => i.severity === 'warning').length;
    details.push(`${warningCount} warning(s) - planning will proceed`);
    for (const issue of result.issues) {
      details.push(`⚠️ ${issue.message}`);
    }
    return {
      status: '⚠️ State is valid with warnings',
      details,
    };
  }
  
  const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
  details.push(`${criticalCount} critical issue(s) - planning blocked`);
  for (const issue of result.issues) {
    const icon = issue.severity === 'critical' ? '❌' : '⚠️';
    details.push(`${icon} ${issue.message}`);
  }
  
  return {
    status: '❌ State validation failed',
    details,
  };
}
