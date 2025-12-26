/**
 * Layer 6 - Job Discovery & Matching Module
 * Error Handling
 *
 * Provides error codes, user-friendly messages, and error utilities
 * for the job discovery module.
 */

// ==================== Error Codes ====================

/**
 * All possible job discovery error codes
 */
export enum JobDiscoveryErrorCode {
  // Parsing errors
  PARSING_FAILED = 'PARSING_FAILED',
  JD_TOO_SHORT = 'JD_TOO_SHORT',
  JD_TOO_LONG = 'JD_TOO_LONG',
  NO_CONTENT_EXTRACTED = 'NO_CONTENT_EXTRACTED',
  INCOMPLETE_JD = 'INCOMPLETE_JD',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_USER_ID = 'MISSING_USER_ID',
  MISSING_RESUME_ID = 'MISSING_RESUME_ID',
  MISSING_JOB_DESCRIPTION = 'MISSING_JOB_DESCRIPTION',

  // Analysis errors
  FIT_ANALYSIS_FAILED = 'FIT_ANALYSIS_FAILED',
  RANKING_FAILED = 'RANKING_FAILED',
  CATEGORIZATION_FAILED = 'CATEGORIZATION_FAILED',
  COMPARISON_FAILED = 'COMPARISON_FAILED',

  // Storage errors
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  STORAGE_FAILED = 'STORAGE_FAILED',
  DUPLICATE_JOB = 'DUPLICATE_JOB',

  // Integration errors
  LAYER1_UNAVAILABLE = 'LAYER1_UNAVAILABLE',
  LAYER4_UNAVAILABLE = 'LAYER4_UNAVAILABLE',
  RESUME_NOT_FOUND = 'RESUME_NOT_FOUND',

  // Scam detection
  SCAM_DETECTED = 'SCAM_DETECTED',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONFIG_ERROR = 'CONFIG_ERROR',
}

// ==================== Error Messages ====================

/**
 * User-friendly error messages for each error code
 */
export const ERROR_MESSAGES: Record<
  JobDiscoveryErrorCode,
  {
    title: string;
    message: string;
    suggestion: string;
  }
> = {
  [JobDiscoveryErrorCode.PARSING_FAILED]: {
    title: 'Unable to Parse Job Description',
    message:
      'We encountered an issue while trying to parse the job description. The format may be unusual or corrupted.',
    suggestion:
      'Try pasting the job description in plain text format. Remove any special formatting or characters.',
  },

  [JobDiscoveryErrorCode.JD_TOO_SHORT]: {
    title: 'Job Description Too Short',
    message:
      'The job description you provided is too short to analyze effectively. We need at least 50 characters.',
    suggestion:
      'Paste the full job description including requirements, responsibilities, and qualifications.',
  },

  [JobDiscoveryErrorCode.JD_TOO_LONG]: {
    title: 'Job Description Too Long',
    message:
      'The job description exceeds our maximum length of 50,000 characters.',
    suggestion:
      'Trim any unnecessary sections like company boilerplate or benefits that are not relevant to the role.',
  },

  [JobDiscoveryErrorCode.NO_CONTENT_EXTRACTED]: {
    title: 'No Content Found',
    message:
      'We could not extract any meaningful content from the job description.',
    suggestion:
      'Ensure the job description contains actual text and is not just images or links.',
  },

  [JobDiscoveryErrorCode.INCOMPLETE_JD]: {
    title: 'Incomplete Job Description',
    message:
      'The job description appears to be missing key sections like requirements or responsibilities.',
    suggestion:
      'Include the full job posting with requirements, responsibilities, and qualifications sections.',
  },

  [JobDiscoveryErrorCode.VALIDATION_ERROR]: {
    title: 'Invalid Input',
    message:
      'Some of the information provided did not meet our requirements.',
    suggestion:
      'Check that all required fields are filled in correctly.',
  },

  [JobDiscoveryErrorCode.INVALID_INPUT]: {
    title: 'Invalid Input Data',
    message: 'The provided input data is invalid or malformed.',
    suggestion:
      'Please check your inputs and ensure all required information is provided correctly.',
  },

  [JobDiscoveryErrorCode.MISSING_USER_ID]: {
    title: 'User ID Required',
    message: 'A user ID is required to process this request.',
    suggestion: 'Please ensure you are logged in and try again.',
  },

  [JobDiscoveryErrorCode.MISSING_RESUME_ID]: {
    title: 'Resume Selection Required',
    message: 'Please select a resume to compare against the job.',
    suggestion:
      'Upload or select an existing resume before analyzing job fit.',
  },

  [JobDiscoveryErrorCode.MISSING_JOB_DESCRIPTION]: {
    title: 'Job Description Required',
    message: 'Please provide a job description to analyze.',
    suggestion:
      'Copy and paste the full job description from the job posting.',
  },

  [JobDiscoveryErrorCode.FIT_ANALYSIS_FAILED]: {
    title: 'Fit Analysis Error',
    message:
      'We encountered an issue while analyzing how well you fit this role.',
    suggestion: 'Please try again. If the problem persists, try a different job.',
  },

  [JobDiscoveryErrorCode.RANKING_FAILED]: {
    title: 'Ranking Error',
    message: 'We were unable to rank the jobs properly.',
    suggestion: 'Please try again. If the problem continues, contact support.',
  },

  [JobDiscoveryErrorCode.CATEGORIZATION_FAILED]: {
    title: 'Categorization Error',
    message: 'We could not categorize this job (reach/target/safety).',
    suggestion: 'Try providing more complete job information.',
  },

  [JobDiscoveryErrorCode.COMPARISON_FAILED]: {
    title: 'Comparison Error',
    message: 'We were unable to compare the selected jobs.',
    suggestion:
      'Ensure you have selected at least 2 jobs and try again.',
  },

  [JobDiscoveryErrorCode.JOB_NOT_FOUND]: {
    title: 'Job Not Found',
    message: 'The requested job could not be found in your saved jobs.',
    suggestion: 'The job may have been deleted or expired.',
  },

  [JobDiscoveryErrorCode.STORAGE_FAILED]: {
    title: 'Storage Error',
    message: 'We were unable to save the job to your account.',
    suggestion: 'Please try again. If the problem persists, contact support.',
  },

  [JobDiscoveryErrorCode.DUPLICATE_JOB]: {
    title: 'Duplicate Job',
    message: 'This job has already been added to your list.',
    suggestion: 'You can find the existing job in your saved jobs.',
  },

  [JobDiscoveryErrorCode.LAYER1_UNAVAILABLE]: {
    title: 'Analysis Service Unavailable',
    message:
      'The resume analysis service is temporarily unavailable.',
    suggestion:
      'Please try again in a few minutes. The service should be back shortly.',
  },

  [JobDiscoveryErrorCode.LAYER4_UNAVAILABLE]: {
    title: 'Storage Service Unavailable',
    message: 'The storage service is temporarily unavailable.',
    suggestion: 'Please try again in a few minutes.',
  },

  [JobDiscoveryErrorCode.RESUME_NOT_FOUND]: {
    title: 'Resume Not Found',
    message: 'The selected resume could not be found.',
    suggestion:
      'Select a different resume or upload a new one.',
  },

  [JobDiscoveryErrorCode.SCAM_DETECTED]: {
    title: 'Potential Scam Detected',
    message:
      'This job posting shows multiple red flags that indicate it may be a scam.',
    suggestion:
      'We recommend being cautious. Verify the company through official channels before applying.',
  },

  [JobDiscoveryErrorCode.INTERNAL_ERROR]: {
    title: 'Unexpected Error',
    message:
      'Something went wrong on our end. Our team has been notified.',
    suggestion: 'Please try again in a few minutes.',
  },

  [JobDiscoveryErrorCode.TIMEOUT]: {
    title: 'Request Timed Out',
    message:
      'The request took longer than expected. This can happen with very long job descriptions.',
    suggestion: 'Try again with a shorter job description.',
  },

  [JobDiscoveryErrorCode.CONFIG_ERROR]: {
    title: 'Configuration Error',
    message: 'There was an issue with the system configuration.',
    suggestion: 'Please contact support if this issue persists.',
  },
};

// ==================== Error Class ====================

/**
 * Custom error class for job discovery errors
 */
export class JobDiscoveryError extends Error {
  /** Error code */
  readonly code: JobDiscoveryErrorCode;
  /** User-friendly title */
  readonly title: string;
  /** User-friendly suggestion */
  readonly suggestion: string;
  /** Additional details for debugging */
  readonly details?: unknown;

  constructor(code: JobDiscoveryErrorCode, details?: unknown) {
    const errorInfo = ERROR_MESSAGES[code];
    super(errorInfo.message);

    this.name = 'JobDiscoveryError';
    this.code = code;
    this.title = errorInfo.title;
    this.suggestion = errorInfo.suggestion;
    this.details = details;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JobDiscoveryError);
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
 * Create a new JobDiscoveryError
 */
export function createError(
  code: JobDiscoveryErrorCode,
  details?: unknown
): JobDiscoveryError {
  return new JobDiscoveryError(code, details);
}

/**
 * Check if an error is a JobDiscoveryError
 */
export function isJobDiscoveryError(error: unknown): error is JobDiscoveryError {
  return error instanceof JobDiscoveryError;
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
  if (isJobDiscoveryError(error)) {
    return error.toUserFriendly();
  }

  // Handle unknown errors gracefully
  return {
    code: JobDiscoveryErrorCode.INTERNAL_ERROR,
    title: ERROR_MESSAGES[JobDiscoveryErrorCode.INTERNAL_ERROR].title,
    message: ERROR_MESSAGES[JobDiscoveryErrorCode.INTERNAL_ERROR].message,
    suggestion: ERROR_MESSAGES[JobDiscoveryErrorCode.INTERNAL_ERROR].suggestion,
  };
}

/**
 * Wrap an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  fallbackCode: JobDiscoveryErrorCode = JobDiscoveryErrorCode.INTERNAL_ERROR
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isJobDiscoveryError(error)) {
      throw error;
    }
    throw new JobDiscoveryError(fallbackCode, error);
  }
}

/**
 * Log error with structured data
 */
export function logError(error: JobDiscoveryError, context?: string): void {
  console.error(`[Layer6][${context || 'Error'}]`, {
    code: error.code,
    title: error.title,
    message: error.message,
    details: error.details,
    stack: error.stack,
  });
}
