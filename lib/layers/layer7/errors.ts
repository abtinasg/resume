/**
 * Layer 7 - Learning Engine Foundation
 * Error Handling
 *
 * Provides error codes, user-friendly messages, and error utilities
 * for the analytics engine.
 */

// ==================== Error Codes ====================

/**
 * All possible analytics error codes
 */
export enum AnalyticsErrorCode {
  // Query errors
  QUERY_FAILED = 'QUERY_FAILED',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_USER_ID = 'INVALID_USER_ID',
  NO_DATA_FOUND = 'NO_DATA_FOUND',

  // Metrics errors
  METRICS_CALCULATION_FAILED = 'METRICS_CALCULATION_FAILED',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',

  // Export errors
  EXPORT_FAILED = 'EXPORT_FAILED',
  EXPORT_TOO_LARGE = 'EXPORT_TOO_LARGE',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Report errors
  REPORT_GENERATION_FAILED = 'REPORT_GENERATION_FAILED',

  // Configuration errors
  CONFIG_LOAD_FAILED = 'CONFIG_LOAD_FAILED',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// ==================== Error Messages ====================

/**
 * User-friendly error messages for each error code
 */
export const ERROR_MESSAGES: Record<
  AnalyticsErrorCode,
  {
    title: string;
    message: string;
    suggestion: string;
  }
> = {
  [AnalyticsErrorCode.QUERY_FAILED]: {
    title: 'Query Failed',
    message: 'Unable to retrieve analytics data from the database.',
    suggestion: 'Please try again. If the problem persists, contact support.',
  },

  [AnalyticsErrorCode.INVALID_DATE_RANGE]: {
    title: 'Invalid Date Range',
    message: 'The specified date range is invalid or the end date is before the start date.',
    suggestion: 'Check that your date range has a valid start and end date.',
  },

  [AnalyticsErrorCode.INVALID_USER_ID]: {
    title: 'Invalid User ID',
    message: 'The provided user ID is invalid or missing.',
    suggestion: 'Ensure a valid user ID is provided.',
  },

  [AnalyticsErrorCode.NO_DATA_FOUND]: {
    title: 'No Data Found',
    message: 'No analytics data was found for the specified criteria.',
    suggestion: 'Try expanding your date range or check if there is activity to analyze.',
  },

  [AnalyticsErrorCode.METRICS_CALCULATION_FAILED]: {
    title: 'Metrics Calculation Failed',
    message: 'An error occurred while calculating metrics.',
    suggestion: 'Please try again. If the issue persists, contact support.',
  },

  [AnalyticsErrorCode.INSUFFICIENT_DATA]: {
    title: 'Insufficient Data',
    message: 'Not enough data available to calculate meaningful metrics.',
    suggestion: 'Continue using the system to generate more activity data.',
  },

  [AnalyticsErrorCode.EXPORT_FAILED]: {
    title: 'Export Failed',
    message: 'Unable to export data in the requested format.',
    suggestion: 'Try a different format or reduce the date range.',
  },

  [AnalyticsErrorCode.EXPORT_TOO_LARGE]: {
    title: 'Export Too Large',
    message: 'The requested export exceeds the maximum allowed size.',
    suggestion: 'Reduce the date range or export in smaller batches.',
  },

  [AnalyticsErrorCode.INVALID_FORMAT]: {
    title: 'Invalid Format',
    message: 'The specified export format is not supported.',
    suggestion: 'Use a supported format: json or csv.',
  },

  [AnalyticsErrorCode.REPORT_GENERATION_FAILED]: {
    title: 'Report Generation Failed',
    message: 'Unable to generate the requested report.',
    suggestion: 'Please try again. Ensure there is sufficient activity data.',
  },

  [AnalyticsErrorCode.CONFIG_LOAD_FAILED]: {
    title: 'Configuration Error',
    message: 'Failed to load analytics configuration.',
    suggestion: 'Contact support if this error persists.',
  },

  [AnalyticsErrorCode.INVALID_CONFIG]: {
    title: 'Invalid Configuration',
    message: 'The analytics configuration is invalid.',
    suggestion: 'Check the configuration file format.',
  },

  [AnalyticsErrorCode.INTERNAL_ERROR]: {
    title: 'Internal Error',
    message: 'An unexpected error occurred in the analytics engine.',
    suggestion: 'Please try again. If the problem persists, contact support.',
  },

  [AnalyticsErrorCode.DATABASE_ERROR]: {
    title: 'Database Error',
    message: 'A database error occurred while processing your request.',
    suggestion: 'Please try again in a few moments.',
  },
};

// ==================== Error Class ====================

/**
 * Custom error class for analytics errors
 */
export class AnalyticsError extends Error {
  /** Error code */
  readonly code: AnalyticsErrorCode;
  /** User-friendly title */
  readonly title: string;
  /** User-friendly suggestion */
  readonly suggestion: string;
  /** Additional details for debugging */
  readonly details?: unknown;

  constructor(code: AnalyticsErrorCode, details?: unknown) {
    const errorInfo = ERROR_MESSAGES[code];
    super(errorInfo.message);

    this.name = 'AnalyticsError';
    this.code = code;
    this.title = errorInfo.title;
    this.suggestion = errorInfo.suggestion;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AnalyticsError);
    }
  }

  /**
   * Convert error to user-friendly object
   */
  toUserFriendly(): {
    code: string;
    title: string;
    message: string;
    suggestion: string;
  } {
    return {
      code: this.code,
      title: this.title,
      message: this.message,
      suggestion: this.suggestion,
    };
  }

  /**
   * Convert error to JSON for logging
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
    };
  }
}

// ==================== Helper Functions ====================

/**
 * Create a new AnalyticsError
 */
export function createError(
  code: AnalyticsErrorCode,
  details?: unknown
): AnalyticsError {
  return new AnalyticsError(code, details);
}

/**
 * Check if an error is an AnalyticsError
 */
export function isAnalyticsError(error: unknown): error is AnalyticsError {
  return error instanceof AnalyticsError;
}

/**
 * Get user-friendly message for any error
 */
export function getUserFriendlyError(error: unknown): {
  code: string;
  title: string;
  message: string;
  suggestion: string;
} {
  if (isAnalyticsError(error)) {
    return error.toUserFriendly();
  }

  // Handle unknown errors gracefully
  return {
    code: AnalyticsErrorCode.INTERNAL_ERROR,
    title: ERROR_MESSAGES[AnalyticsErrorCode.INTERNAL_ERROR].title,
    message: ERROR_MESSAGES[AnalyticsErrorCode.INTERNAL_ERROR].message,
    suggestion: ERROR_MESSAGES[AnalyticsErrorCode.INTERNAL_ERROR].suggestion,
  };
}

/**
 * Wrap an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  fallbackCode: AnalyticsErrorCode = AnalyticsErrorCode.INTERNAL_ERROR
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isAnalyticsError(error)) {
      throw error;
    }
    throw new AnalyticsError(fallbackCode, error);
  }
}

/**
 * Log error with structured data (for debugging)
 */
export function logError(error: AnalyticsError, context?: string): void {
  console.error(`[Layer7][${context || 'Error'}]`, {
    code: error.code,
    title: error.title,
    message: error.message,
    details: error.details,
    stack: error.stack,
  });
}
