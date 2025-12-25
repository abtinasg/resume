/**
 * Layer 3 - Execution Engine
 * Error Handling
 *
 * Provides error types, error codes, and utilities for error handling
 * in the rewrite pipeline.
 */

// ==================== Error Codes ====================

/**
 * Error codes for execution engine errors
 */
export enum ExecutionErrorCode {
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_EVIDENCE = 'MISSING_EVIDENCE',

  // Evidence errors
  EVIDENCE_BUILD_FAILED = 'EVIDENCE_BUILD_FAILED',
  EVIDENCE_VALIDATION_FAILED = 'EVIDENCE_VALIDATION_FAILED',
  INSUFFICIENT_EVIDENCE = 'INSUFFICIENT_EVIDENCE',

  // Planning errors
  PLANNING_FAILED = 'PLANNING_FAILED',
  NO_ACTIONS_PLANNED = 'NO_ACTIONS_PLANNED',

  // Generation errors
  LLM_ERROR = 'LLM_ERROR',
  LLM_TIMEOUT = 'LLM_TIMEOUT',
  LLM_RATE_LIMIT = 'LLM_RATE_LIMIT',
  LLM_INVALID_RESPONSE = 'LLM_INVALID_RESPONSE',
  GENERATION_FAILED = 'GENERATION_FAILED',

  // Validation failures (after generation)
  FABRICATION_DETECTED = 'FABRICATION_DETECTED',
  NEW_NUMBER_FABRICATED = 'NEW_NUMBER_FABRICATED',
  NEW_TOOL_FABRICATED = 'NEW_TOOL_FABRICATED',
  NEW_COMPANY_FABRICATED = 'NEW_COMPANY_FABRICATED',
  EVIDENCE_MISMATCH = 'EVIDENCE_MISMATCH',

  // Retry errors
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',

  // Coherence errors
  COHERENCE_FAILED = 'COHERENCE_FAILED',
  TENSE_DETECTION_FAILED = 'TENSE_DETECTION_FAILED',

  // Configuration errors
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONFIG_LOAD_FAILED = 'CONFIG_LOAD_FAILED',

  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// ==================== Error Messages ====================

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<
  ExecutionErrorCode,
  {
    title: string;
    suggestion: string;
  }
> = {
  [ExecutionErrorCode.INVALID_INPUT]: {
    title: 'Invalid Input',
    suggestion: 'Please ensure the bullet/summary text is provided correctly.',
  },
  [ExecutionErrorCode.VALIDATION_ERROR]: {
    title: 'Validation Failed',
    suggestion: 'Check the input format and ensure all required fields are present.',
  },
  [ExecutionErrorCode.MISSING_EVIDENCE]: {
    title: 'Missing Evidence',
    suggestion: 'The rewrite requires evidence from the resume. Ensure resume data is available.',
  },

  [ExecutionErrorCode.EVIDENCE_BUILD_FAILED]: {
    title: 'Evidence Build Failed',
    suggestion: 'Could not build evidence ledger. Please try again.',
  },
  [ExecutionErrorCode.EVIDENCE_VALIDATION_FAILED]: {
    title: 'Evidence Validation Failed',
    suggestion: 'The improved text contains claims not supported by evidence.',
  },
  [ExecutionErrorCode.INSUFFICIENT_EVIDENCE]: {
    title: 'Insufficient Evidence',
    suggestion: 'Not enough evidence to make improvements. Consider providing more context.',
  },

  [ExecutionErrorCode.PLANNING_FAILED]: {
    title: 'Planning Failed',
    suggestion: 'Could not plan rewrite actions. Please try again.',
  },
  [ExecutionErrorCode.NO_ACTIONS_PLANNED]: {
    title: 'No Actions Needed',
    suggestion: 'The content is already well-written. No improvements needed.',
  },

  [ExecutionErrorCode.LLM_ERROR]: {
    title: 'AI Service Error',
    suggestion: 'Our AI service encountered an issue. Please try again in a moment.',
  },
  [ExecutionErrorCode.LLM_TIMEOUT]: {
    title: 'AI Service Timeout',
    suggestion: 'The request took too long. Please try again.',
  },
  [ExecutionErrorCode.LLM_RATE_LIMIT]: {
    title: 'Rate Limited',
    suggestion: 'Too many requests. Please wait a moment and try again.',
  },
  [ExecutionErrorCode.LLM_INVALID_RESPONSE]: {
    title: 'Invalid AI Response',
    suggestion: 'The AI returned an unexpected format. Please try again.',
  },
  [ExecutionErrorCode.GENERATION_FAILED]: {
    title: 'Generation Failed',
    suggestion: 'Could not generate an improvement. Please try again.',
  },

  [ExecutionErrorCode.FABRICATION_DETECTED]: {
    title: 'Fabrication Detected',
    suggestion:
      'The improvement included content not in your resume. We returned the original to maintain truthfulness.',
  },
  [ExecutionErrorCode.NEW_NUMBER_FABRICATED]: {
    title: 'Number Not in Resume',
    suggestion:
      'The improvement tried to add a number not in your resume. We cannot add metrics you did not provide.',
  },
  [ExecutionErrorCode.NEW_TOOL_FABRICATED]: {
    title: 'Tool Not in Resume',
    suggestion:
      'The improvement tried to add a tool/skill not in your resume. Please add it to your skills section first.',
  },
  [ExecutionErrorCode.NEW_COMPANY_FABRICATED]: {
    title: 'Company Not in Resume',
    suggestion:
      'The improvement tried to add a company not in your resume. We cannot add companies you did not work for.',
  },
  [ExecutionErrorCode.EVIDENCE_MISMATCH]: {
    title: 'Evidence Mismatch',
    suggestion: 'The improvement could not be verified against your resume content.',
  },

  [ExecutionErrorCode.MAX_RETRIES_EXCEEDED]: {
    title: 'Improvement Failed',
    suggestion:
      'We could not improve this content without fabricating. Consider adding more details to your resume first.',
  },

  [ExecutionErrorCode.COHERENCE_FAILED]: {
    title: 'Coherence Check Failed',
    suggestion: 'Could not ensure section consistency. Please try again.',
  },
  [ExecutionErrorCode.TENSE_DETECTION_FAILED]: {
    title: 'Tense Detection Failed',
    suggestion: 'Could not detect tense. Please try again.',
  },

  [ExecutionErrorCode.CONFIG_ERROR]: {
    title: 'Configuration Error',
    suggestion: 'System configuration issue. Please contact support.',
  },
  [ExecutionErrorCode.CONFIG_LOAD_FAILED]: {
    title: 'Config Load Failed',
    suggestion: 'Could not load configuration. Please contact support.',
  },

  [ExecutionErrorCode.INTERNAL_ERROR]: {
    title: 'Internal Error',
    suggestion: 'An unexpected error occurred. Please try again later.',
  },
};

// ==================== Error Class ====================

/**
 * Custom error class for execution engine errors
 */
export class ExecutionError extends Error {
  /** Error code */
  public readonly code: ExecutionErrorCode;
  /** User-friendly title */
  public readonly title: string;
  /** Suggested resolution */
  public readonly suggestion: string;
  /** Additional details */
  public readonly details?: Record<string, unknown>;
  /** Original error (if wrapping) */
  public readonly cause?: Error;
  /** Whether this error is recoverable */
  public readonly recoverable: boolean;

  constructor(
    code: ExecutionErrorCode,
    details?: Record<string, unknown>,
    cause?: Error,
    recoverable = false
  ) {
    const { title, suggestion } = ERROR_MESSAGES[code];
    const message = details?.message ? `${title}: ${details.message}` : title;

    super(message);

    this.name = 'ExecutionError';
    this.code = code;
    this.title = title;
    this.suggestion = suggestion;
    this.details = details;
    this.cause = cause;
    this.recoverable = recoverable;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExecutionError);
    }
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      title: this.title,
      message: this.message,
      suggestion: this.suggestion,
      details: this.details,
      recoverable: this.recoverable,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }

  /**
   * Get user-friendly error info
   */
  getUserFriendly(): {
    code: string;
    title: string;
    message: string;
    suggestion: string;
    recoverable: boolean;
  } {
    return {
      code: this.code,
      title: this.title,
      message: this.message,
      suggestion: this.suggestion,
      recoverable: this.recoverable,
    };
  }
}

// ==================== Error Factory Functions ====================

/**
 * Create an invalid input error
 */
export function createInvalidInputError(message: string, field?: string): ExecutionError {
  return new ExecutionError(ExecutionErrorCode.INVALID_INPUT, { message, field });
}

/**
 * Create a validation error
 */
export function createValidationError(
  message: string,
  errors?: unknown[]
): ExecutionError {
  return new ExecutionError(ExecutionErrorCode.VALIDATION_ERROR, { message, errors });
}

/**
 * Create an evidence build error
 */
export function createEvidenceBuildError(cause?: Error): ExecutionError {
  return new ExecutionError(
    ExecutionErrorCode.EVIDENCE_BUILD_FAILED,
    { message: 'Failed to build evidence ledger' },
    cause
  );
}

/**
 * Create a fabrication error
 */
export function createFabricationError(
  code:
    | ExecutionErrorCode.NEW_NUMBER_FABRICATED
    | ExecutionErrorCode.NEW_TOOL_FABRICATED
    | ExecutionErrorCode.NEW_COMPANY_FABRICATED
    | ExecutionErrorCode.FABRICATION_DETECTED,
  fabricatedItems: string[]
): ExecutionError {
  return new ExecutionError(code, {
    message: `Fabricated items detected: ${fabricatedItems.join(', ')}`,
    fabricated_items: fabricatedItems,
  });
}

/**
 * Create an LLM error
 */
export function createLLMError(
  code:
    | ExecutionErrorCode.LLM_ERROR
    | ExecutionErrorCode.LLM_TIMEOUT
    | ExecutionErrorCode.LLM_RATE_LIMIT
    | ExecutionErrorCode.LLM_INVALID_RESPONSE,
  cause?: Error
): ExecutionError {
  return new ExecutionError(
    code,
    { message: cause?.message ?? 'LLM request failed' },
    cause,
    code === ExecutionErrorCode.LLM_RATE_LIMIT || code === ExecutionErrorCode.LLM_TIMEOUT
  );
}

/**
 * Create a max retries error
 */
export function createMaxRetriesError(
  attempts: number,
  lastValidationErrors: string[]
): ExecutionError {
  return new ExecutionError(ExecutionErrorCode.MAX_RETRIES_EXCEEDED, {
    message: `Failed after ${attempts} attempts`,
    attempts,
    last_validation_errors: lastValidationErrors,
  });
}

/**
 * Create an internal error
 */
export function createInternalError(cause?: Error): ExecutionError {
  return new ExecutionError(
    ExecutionErrorCode.INTERNAL_ERROR,
    { message: cause?.message ?? 'An unexpected error occurred' },
    cause
  );
}

// ==================== Type Guards ====================

/**
 * Check if an error is an ExecutionError
 */
export function isExecutionError(error: unknown): error is ExecutionError {
  return error instanceof ExecutionError;
}

/**
 * Check if error indicates fabrication was detected
 */
export function isFabricationError(error: unknown): boolean {
  if (!isExecutionError(error)) return false;
  return [
    ExecutionErrorCode.FABRICATION_DETECTED,
    ExecutionErrorCode.NEW_NUMBER_FABRICATED,
    ExecutionErrorCode.NEW_TOOL_FABRICATED,
    ExecutionErrorCode.NEW_COMPANY_FABRICATED,
    ExecutionErrorCode.EVIDENCE_MISMATCH,
  ].includes(error.code);
}

/**
 * Check if error is recoverable (can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  if (!isExecutionError(error)) return false;
  return error.recoverable;
}

// ==================== Error Utilities ====================

/**
 * Get user-friendly error information from any error
 */
export function getUserFriendlyError(error: unknown): {
  code: string;
  title: string;
  message: string;
  suggestion: string;
  recoverable: boolean;
} {
  if (isExecutionError(error)) {
    return error.getUserFriendly();
  }

  if (error instanceof Error) {
    const { title, suggestion } = ERROR_MESSAGES[ExecutionErrorCode.INTERNAL_ERROR];
    return {
      code: ExecutionErrorCode.INTERNAL_ERROR,
      title,
      message: error.message || 'An unexpected error occurred',
      suggestion,
      recoverable: false,
    };
  }

  const { title, suggestion } = ERROR_MESSAGES[ExecutionErrorCode.INTERNAL_ERROR];
  return {
    code: ExecutionErrorCode.INTERNAL_ERROR,
    title,
    message: 'An unexpected error occurred',
    suggestion,
    recoverable: false,
  };
}

/**
 * Wrap an error in an ExecutionError if it isn't one already
 */
export function wrapError(
  error: unknown,
  defaultCode: ExecutionErrorCode = ExecutionErrorCode.INTERNAL_ERROR
): ExecutionError {
  if (isExecutionError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ExecutionError(defaultCode, { message: error.message }, error);
  }

  return new ExecutionError(defaultCode, { message: String(error) });
}

/**
 * Safe error handler that ensures consistent error output
 */
export function handleError(error: unknown, context?: string): ExecutionError {
  const wrapped = wrapError(error);

  if (context) {
    console.error(`[Layer 3 - ${context}]`, wrapped.toJSON());
  }

  return wrapped;
}

/**
 * Log error with context
 */
export function logError(error: ExecutionError, context?: string): void {
  console.error(`[Layer3][${context || 'Error'}]`, {
    code: error.code,
    title: error.title,
    message: error.message,
    details: error.details,
    stack: error.stack,
  });
}
