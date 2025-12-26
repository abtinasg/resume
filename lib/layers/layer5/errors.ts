/**
 * Layer 5 - Orchestrator
 * Error Handling
 *
 * Centralized error definitions for the orchestrator layer.
 * Provides user-friendly error messages and error classification.
 */

// ==================== Error Codes ====================

/**
 * Error codes for orchestrator operations
 */
export enum OrchestratorErrorCode {
  // Input errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_STATE = 'MISSING_STATE',
  MISSING_ANALYSIS = 'MISSING_ANALYSIS',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // State errors
  STATE_UNAVAILABLE = 'STATE_UNAVAILABLE',
  STALE_STATE = 'STALE_STATE',
  STATE_VALIDATION_FAILED = 'STATE_VALIDATION_FAILED',

  // Planning errors
  PLAN_GENERATION_FAILED = 'PLAN_GENERATION_FAILED',
  WEEKLY_PLAN_FAILED = 'WEEKLY_PLAN_FAILED',
  DAILY_PLAN_FAILED = 'DAILY_PLAN_FAILED',
  EMPTY_PLAN = 'EMPTY_PLAN',
  INVALID_PLAN = 'INVALID_PLAN',

  // Execution errors
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  ACTION_NOT_FOUND = 'ACTION_NOT_FOUND',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',
  EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT',

  // Layer integration errors
  LAYER1_ERROR = 'LAYER1_ERROR',
  LAYER2_ERROR = 'LAYER2_ERROR',
  LAYER3_ERROR = 'LAYER3_ERROR',
  LAYER4_ERROR = 'LAYER4_ERROR',

  // Progress tracking errors
  PROGRESS_TRACKING_FAILED = 'PROGRESS_TRACKING_FAILED',
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',

  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

// ==================== Error Messages ====================

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<OrchestratorErrorCode, string> = {
  [OrchestratorErrorCode.INVALID_INPUT]: 'The provided input is invalid.',
  [OrchestratorErrorCode.MISSING_STATE]: 'User state is required but was not provided.',
  [OrchestratorErrorCode.MISSING_ANALYSIS]:
    'Strategy analysis is required but was not provided.',
  [OrchestratorErrorCode.INVALID_CONFIG]: 'Configuration is invalid or corrupted.',

  [OrchestratorErrorCode.STATE_UNAVAILABLE]:
    'Unable to load your current state. Please try again.',
  [OrchestratorErrorCode.STALE_STATE]:
    'Your data is outdated. Please update your information first.',
  [OrchestratorErrorCode.STATE_VALIDATION_FAILED]:
    'Your state data has validation issues.',

  [OrchestratorErrorCode.PLAN_GENERATION_FAILED]: 'Failed to generate your plan.',
  [OrchestratorErrorCode.WEEKLY_PLAN_FAILED]:
    'Failed to generate your weekly plan.',
  [OrchestratorErrorCode.DAILY_PLAN_FAILED]: 'Failed to generate your daily plan.',
  [OrchestratorErrorCode.EMPTY_PLAN]:
    'Unable to create any tasks. Please update your profile.',
  [OrchestratorErrorCode.INVALID_PLAN]: 'Generated plan has validation errors.',

  [OrchestratorErrorCode.EXECUTION_FAILED]: 'Failed to execute the action.',
  [OrchestratorErrorCode.ACTION_NOT_FOUND]: 'The requested action was not found.',
  [OrchestratorErrorCode.TASK_NOT_FOUND]: 'The requested task was not found.',
  [OrchestratorErrorCode.MAX_RETRIES_EXCEEDED]:
    'Action failed after multiple attempts.',
  [OrchestratorErrorCode.EXECUTION_TIMEOUT]: 'Action timed out. Please try again.',

  [OrchestratorErrorCode.LAYER1_ERROR]:
    'Resume evaluation service is unavailable.',
  [OrchestratorErrorCode.LAYER2_ERROR]: 'Strategy analysis service is unavailable.',
  [OrchestratorErrorCode.LAYER3_ERROR]: 'Resume improvement service is unavailable.',
  [OrchestratorErrorCode.LAYER4_ERROR]: 'State management service is unavailable.',

  [OrchestratorErrorCode.PROGRESS_TRACKING_FAILED]:
    'Failed to track progress.',
  [OrchestratorErrorCode.PLAN_NOT_FOUND]:
    'The requested plan was not found.',

  [OrchestratorErrorCode.INTERNAL_ERROR]:
    'An unexpected error occurred. Please try again.',
  [OrchestratorErrorCode.NOT_IMPLEMENTED]:
    'This feature is not yet implemented.',
};

// ==================== Error Class ====================

/**
 * Custom error class for orchestrator errors
 */
export class OrchestratorError extends Error {
  /** Error code */
  readonly code: OrchestratorErrorCode;

  /** User-friendly message */
  readonly userMessage: string;

  /** Additional details */
  readonly details?: unknown;

  /** Retry after (seconds) */
  readonly retryAfter?: number;

  /** Whether this error is recoverable */
  readonly recoverable: boolean;

  /** Timestamp when error occurred */
  readonly timestamp: string;

  constructor(options: {
    code: OrchestratorErrorCode;
    message?: string;
    details?: unknown;
    retryAfter?: number;
    recoverable?: boolean;
    cause?: Error;
  }) {
    const userMessage =
      options.message || ERROR_MESSAGES[options.code] || 'An error occurred.';
    super(userMessage);

    this.name = 'OrchestratorError';
    this.code = options.code;
    this.userMessage = userMessage;
    this.details = options.details;
    this.retryAfter = options.retryAfter;
    this.recoverable = options.recoverable ?? false;
    this.timestamp = new Date().toISOString();

    // Store cause as additional details if provided
    if (options.cause) {
      // Note: Error.cause is ES2022, so we handle it manually
      (this as Error & { cause?: Error }).cause = options.cause;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OrchestratorError);
    }
  }

  /**
   * Convert to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      retryAfter: this.retryAfter,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// ==================== Type Guards ====================

/**
 * Check if an error is an OrchestratorError
 */
export function isOrchestratorError(error: unknown): error is OrchestratorError {
  return error instanceof OrchestratorError;
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (isOrchestratorError(error)) {
    return error.recoverable;
  }
  return false;
}

// ==================== Error Factory Functions ====================

/**
 * Create an invalid input error
 */
export function createInvalidInputError(
  details?: unknown,
  message?: string
): OrchestratorError {
  return new OrchestratorError({
    code: OrchestratorErrorCode.INVALID_INPUT,
    message,
    details,
    recoverable: false,
  });
}

/**
 * Create a missing state error
 */
export function createMissingStateError(details?: unknown): OrchestratorError {
  return new OrchestratorError({
    code: OrchestratorErrorCode.MISSING_STATE,
    details,
    recoverable: false,
  });
}

/**
 * Create a state unavailable error
 */
export function createStateUnavailableError(
  retryAfter?: number
): OrchestratorError {
  return new OrchestratorError({
    code: OrchestratorErrorCode.STATE_UNAVAILABLE,
    retryAfter: retryAfter ?? 60,
    recoverable: true,
  });
}

/**
 * Create a stale state error
 */
export function createStaleStateError(
  reason?: string,
  details?: unknown
): OrchestratorError {
  return new OrchestratorError({
    code: OrchestratorErrorCode.STALE_STATE,
    message: reason
      ? `Your data is outdated: ${reason}`
      : ERROR_MESSAGES[OrchestratorErrorCode.STALE_STATE],
    details,
    recoverable: true,
  });
}

/**
 * Create a plan generation error
 */
export function createPlanGenerationError(
  type: 'weekly' | 'daily',
  cause?: Error,
  details?: unknown
): OrchestratorError {
  const code =
    type === 'weekly'
      ? OrchestratorErrorCode.WEEKLY_PLAN_FAILED
      : OrchestratorErrorCode.DAILY_PLAN_FAILED;

  return new OrchestratorError({
    code,
    details,
    cause,
    recoverable: true,
  });
}

/**
 * Create an empty plan error
 */
export function createEmptyPlanError(details?: unknown): OrchestratorError {
  return new OrchestratorError({
    code: OrchestratorErrorCode.EMPTY_PLAN,
    details,
    recoverable: true,
  });
}

/**
 * Create an execution failed error
 */
export function createExecutionFailedError(
  actionType: string,
  cause?: Error,
  details?: unknown
): OrchestratorError {
  return new OrchestratorError({
    code: OrchestratorErrorCode.EXECUTION_FAILED,
    message: `Failed to execute ${actionType} action.`,
    details,
    cause,
    recoverable: true,
  });
}

/**
 * Create a max retries exceeded error
 */
export function createMaxRetriesError(
  retries: number,
  details?: unknown
): OrchestratorError {
  return new OrchestratorError({
    code: OrchestratorErrorCode.MAX_RETRIES_EXCEEDED,
    message: `Action failed after ${retries} attempts.`,
    details,
    recoverable: false,
  });
}

/**
 * Create a layer error
 */
export function createLayerError(
  layer: 1 | 2 | 3 | 4,
  cause?: Error,
  details?: unknown
): OrchestratorError {
  const codeMap: Record<number, OrchestratorErrorCode> = {
    1: OrchestratorErrorCode.LAYER1_ERROR,
    2: OrchestratorErrorCode.LAYER2_ERROR,
    3: OrchestratorErrorCode.LAYER3_ERROR,
    4: OrchestratorErrorCode.LAYER4_ERROR,
  };

  return new OrchestratorError({
    code: codeMap[layer],
    details,
    cause,
    recoverable: true,
    retryAfter: 30,
  });
}

/**
 * Create an internal error
 */
export function createInternalError(
  message?: string,
  cause?: Error
): OrchestratorError {
  return new OrchestratorError({
    code: OrchestratorErrorCode.INTERNAL_ERROR,
    message,
    cause,
    recoverable: false,
  });
}

/**
 * Create a not implemented error
 */
export function createNotImplementedError(feature: string): OrchestratorError {
  return new OrchestratorError({
    code: OrchestratorErrorCode.NOT_IMPLEMENTED,
    message: `${feature} is not yet implemented.`,
    recoverable: false,
  });
}

// ==================== Error Utilities ====================

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (isOrchestratorError(error)) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

/**
 * Wrap an unknown error as OrchestratorError
 */
export function wrapError(
  error: unknown,
  defaultCode: OrchestratorErrorCode = OrchestratorErrorCode.INTERNAL_ERROR
): OrchestratorError {
  if (isOrchestratorError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new OrchestratorError({
      code: defaultCode,
      message: error.message,
      cause: error,
      recoverable: false,
    });
  }

  return new OrchestratorError({
    code: defaultCode,
    message: String(error),
    recoverable: false,
  });
}

/**
 * Log error with context
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorInfo = isOrchestratorError(error) ? error.toJSON() : { error };

  console.error('[Layer5 Orchestrator Error]', {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString(),
  });
}
