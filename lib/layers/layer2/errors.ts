/**
 * Layer 2 - Strategy Engine
 * Error Handling
 *
 * Provides error types, error codes, and utilities for error handling
 * in the strategy analysis pipeline.
 */

// ==================== Error Codes ====================

/**
 * Error codes for strategy analysis errors
 */
export enum StrategyErrorCode {
  /** Invalid input data */
  INVALID_INPUT = 'INVALID_INPUT',
  /** Validation failed */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Missing required data */
  MISSING_DATA = 'MISSING_DATA',
  /** Configuration error */
  CONFIG_ERROR = 'CONFIG_ERROR',
  /** Analysis computation failed */
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  /** Taxonomy lookup failed */
  TAXONOMY_ERROR = 'TAXONOMY_ERROR',
  /** Gap analysis failed */
  GAP_ANALYSIS_ERROR = 'GAP_ANALYSIS_ERROR',
  /** Mode selection failed */
  MODE_SELECTION_ERROR = 'MODE_SELECTION_ERROR',
  /** Blueprint generation failed */
  BLUEPRINT_ERROR = 'BLUEPRINT_ERROR',
  /** Internal error */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// ==================== Error Messages ====================

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<StrategyErrorCode, { title: string; suggestion: string }> = {
  [StrategyErrorCode.INVALID_INPUT]: {
    title: 'Invalid Input Data',
    suggestion: 'Please ensure all required fields are provided with valid values.',
  },
  [StrategyErrorCode.VALIDATION_ERROR]: {
    title: 'Validation Failed',
    suggestion: 'Check the input data format and ensure all required fields are present.',
  },
  [StrategyErrorCode.MISSING_DATA]: {
    title: 'Missing Required Data',
    suggestion: 'Ensure Layer 1 evaluation and Layer 4 state are provided.',
  },
  [StrategyErrorCode.CONFIG_ERROR]: {
    title: 'Configuration Error',
    suggestion: 'Check the strategy configuration files for errors.',
  },
  [StrategyErrorCode.ANALYSIS_FAILED]: {
    title: 'Analysis Failed',
    suggestion: 'An error occurred during strategy analysis. Please try again.',
  },
  [StrategyErrorCode.TAXONOMY_ERROR]: {
    title: 'Taxonomy Error',
    suggestion: 'Failed to load or process the capability taxonomy.',
  },
  [StrategyErrorCode.GAP_ANALYSIS_ERROR]: {
    title: 'Gap Analysis Failed',
    suggestion: 'An error occurred while analyzing gaps. Please check input data.',
  },
  [StrategyErrorCode.MODE_SELECTION_ERROR]: {
    title: 'Mode Selection Failed',
    suggestion: 'Could not determine the recommended strategy mode.',
  },
  [StrategyErrorCode.BLUEPRINT_ERROR]: {
    title: 'Blueprint Generation Failed',
    suggestion: 'Failed to generate action blueprints.',
  },
  [StrategyErrorCode.INTERNAL_ERROR]: {
    title: 'Internal Error',
    suggestion: 'An unexpected error occurred. Please try again later.',
  },
};

// ==================== Error Class ====================

/**
 * Custom error class for strategy analysis errors
 */
export class StrategyAnalysisError extends Error {
  /** Error code */
  public readonly code: StrategyErrorCode;
  /** User-friendly title */
  public readonly title: string;
  /** Suggested resolution */
  public readonly suggestion: string;
  /** Additional details */
  public readonly details?: Record<string, unknown>;
  /** Original error (if wrapping) */
  public readonly cause?: Error;

  constructor(
    code: StrategyErrorCode,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    const { title, suggestion } = ERROR_MESSAGES[code];
    const message = details?.message 
      ? `${title}: ${details.message}` 
      : title;

    super(message);

    this.name = 'StrategyAnalysisError';
    this.code = code;
    this.title = title;
    this.suggestion = suggestion;
    this.details = details;
    this.cause = cause;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StrategyAnalysisError);
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
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack,
      } : undefined,
    };
  }

  /**
   * Get user-friendly error info
   */
  getUserFriendly(): { code: string; title: string; message: string; suggestion: string } {
    return {
      code: this.code,
      title: this.title,
      message: this.message,
      suggestion: this.suggestion,
    };
  }
}

// ==================== Error Factory Functions ====================

/**
 * Create an invalid input error
 */
export function createInvalidInputError(
  message: string,
  field?: string
): StrategyAnalysisError {
  return new StrategyAnalysisError(StrategyErrorCode.INVALID_INPUT, {
    message,
    field,
  });
}

/**
 * Create a validation error
 */
export function createValidationError(
  message: string,
  errors?: unknown[]
): StrategyAnalysisError {
  return new StrategyAnalysisError(StrategyErrorCode.VALIDATION_ERROR, {
    message,
    errors,
  });
}

/**
 * Create a missing data error
 */
export function createMissingDataError(
  missingFields: string[]
): StrategyAnalysisError {
  return new StrategyAnalysisError(StrategyErrorCode.MISSING_DATA, {
    message: `Missing required fields: ${missingFields.join(', ')}`,
    missingFields,
  });
}

/**
 * Create a gap analysis error
 */
export function createGapAnalysisError(
  gapType: string,
  cause?: Error
): StrategyAnalysisError {
  return new StrategyAnalysisError(
    StrategyErrorCode.GAP_ANALYSIS_ERROR,
    { message: `Failed to analyze ${gapType} gap`, gapType },
    cause
  );
}

/**
 * Create a mode selection error
 */
export function createModeSelectionError(
  cause?: Error
): StrategyAnalysisError {
  return new StrategyAnalysisError(
    StrategyErrorCode.MODE_SELECTION_ERROR,
    { message: 'Failed to select strategy mode' },
    cause
  );
}

/**
 * Create a blueprint error
 */
export function createBlueprintError(
  cause?: Error
): StrategyAnalysisError {
  return new StrategyAnalysisError(
    StrategyErrorCode.BLUEPRINT_ERROR,
    { message: 'Failed to generate action blueprints' },
    cause
  );
}

/**
 * Create an internal error (wrapping unexpected errors)
 */
export function createInternalError(
  cause?: Error
): StrategyAnalysisError {
  return new StrategyAnalysisError(
    StrategyErrorCode.INTERNAL_ERROR,
    { message: cause?.message ?? 'An unexpected error occurred' },
    cause
  );
}

// ==================== Type Guards ====================

/**
 * Check if an error is a StrategyAnalysisError
 */
export function isStrategyAnalysisError(error: unknown): error is StrategyAnalysisError {
  return error instanceof StrategyAnalysisError;
}

// ==================== Error Utilities ====================

/**
 * Get user-friendly error information from any error
 */
export function getUserFriendlyError(
  error: unknown
): { code: string; title: string; message: string; suggestion: string } {
  if (isStrategyAnalysisError(error)) {
    return error.getUserFriendly();
  }

  if (error instanceof Error) {
    const { title, suggestion } = ERROR_MESSAGES[StrategyErrorCode.INTERNAL_ERROR];
    return {
      code: StrategyErrorCode.INTERNAL_ERROR,
      title,
      message: error.message || 'An unexpected error occurred',
      suggestion,
    };
  }

  const { title, suggestion } = ERROR_MESSAGES[StrategyErrorCode.INTERNAL_ERROR];
  return {
    code: StrategyErrorCode.INTERNAL_ERROR,
    title,
    message: 'An unexpected error occurred',
    suggestion,
  };
}

/**
 * Wrap an error in a StrategyAnalysisError if it isn't one already
 */
export function wrapError(
  error: unknown,
  defaultCode: StrategyErrorCode = StrategyErrorCode.INTERNAL_ERROR
): StrategyAnalysisError {
  if (isStrategyAnalysisError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new StrategyAnalysisError(defaultCode, { message: error.message }, error);
  }

  return new StrategyAnalysisError(defaultCode, { message: String(error) });
}

/**
 * Safe error handler that ensures consistent error output
 */
export function handleError(
  error: unknown,
  context?: string
): StrategyAnalysisError {
  const wrapped = wrapError(error);
  
  if (context) {
    console.error(`[Layer 2 - ${context}]`, wrapped.toJSON());
  }

  return wrapped;
}
