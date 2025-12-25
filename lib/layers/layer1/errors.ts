/**
 * Layer 1 - Evaluation Engine
 * Error Handling
 *
 * Provides error codes, user-friendly messages, and error utilities
 * for the evaluation engine.
 */

// ==================== Error Codes ====================

/**
 * All possible evaluation error codes
 */
export enum EvaluationErrorCode {
  // Parsing errors
  PARSING_FAILED = 'PARSING_FAILED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  CORRUPT_FILE = 'CORRUPT_FILE',
  NO_CONTENT = 'NO_CONTENT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_RESUME = 'MISSING_RESUME',
  MISSING_JOB_DESCRIPTION = 'MISSING_JOB_DESCRIPTION',
  INVALID_INPUT = 'INVALID_INPUT',

  // Content errors
  CONTENT_TOO_SHORT = 'CONTENT_TOO_SHORT',
  NO_TEXT_EXTRACTED = 'NO_TEXT_EXTRACTED',
  IMAGE_ONLY_PDF = 'IMAGE_ONLY_PDF',
  ENCRYPTED_PDF = 'ENCRYPTED_PDF',

  // Scoring errors
  SCORING_FAILED = 'SCORING_FAILED',
  DIMENSION_CALCULATION_FAILED = 'DIMENSION_CALCULATION_FAILED',

  // Gap analysis errors
  GAP_ANALYSIS_FAILED = 'GAP_ANALYSIS_FAILED',
  JOB_PARSING_FAILED = 'JOB_PARSING_FAILED',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT = 'TIMEOUT',
  CACHE_ERROR = 'CACHE_ERROR',
}

// ==================== Error Messages ====================

/**
 * User-friendly error messages for each error code
 */
export const ERROR_MESSAGES: Record<
  EvaluationErrorCode,
  {
    title: string;
    message: string;
    suggestion: string;
  }
> = {
  [EvaluationErrorCode.PARSING_FAILED]: {
    title: 'Unable to Read Resume',
    message:
      'We encountered an issue while trying to read your resume file. This can happen with certain PDF formats or file types.',
    suggestion:
      'Try saving your resume as a different PDF or convert it to a plain text (.txt) file and upload again.',
  },

  [EvaluationErrorCode.INVALID_FORMAT]: {
    title: 'Invalid File Format',
    message:
      'The file you uploaded is not in a supported format. We currently support PDF, Word (.docx), and plain text files.',
    suggestion:
      'Please upload your resume as a PDF, Word document (.docx), or plain text file (.txt).',
  },

  [EvaluationErrorCode.UNSUPPORTED_FORMAT]: {
    title: 'Unsupported File Type',
    message:
      'This file type is not supported. Common formats like .doc (older Word), .odt, or image files cannot be processed.',
    suggestion:
      'Convert your resume to PDF or .docx format using Microsoft Word, Google Docs, or a free online converter.',
  },

  [EvaluationErrorCode.CORRUPT_FILE]: {
    title: 'File Appears Damaged',
    message:
      'The uploaded file appears to be corrupted or damaged. This can happen during file transfers or if the original file has issues.',
    suggestion:
      'Try re-exporting your resume from its original source (Word, Google Docs, etc.) and upload the new file.',
  },

  [EvaluationErrorCode.NO_CONTENT]: {
    title: 'No Content Found',
    message:
      'We could not find any readable content in your file. The file may be empty or contain only images.',
    suggestion:
      'Ensure your resume has selectable text (not just images). If using a design tool, export with embedded text.',
  },

  [EvaluationErrorCode.FILE_TOO_LARGE]: {
    title: 'File Too Large',
    message:
      'Your resume file exceeds our 5MB size limit. Large files typically contain high-resolution images or complex formatting.',
    suggestion:
      'Compress your PDF using a tool like Adobe Acrobat or an online PDF compressor, or simplify the formatting.',
  },

  [EvaluationErrorCode.VALIDATION_ERROR]: {
    title: 'Invalid Input',
    message:
      'Some of the information provided did not meet our requirements. Please check your input and try again.',
    suggestion:
      'Ensure all required fields are filled in correctly and the file is a valid resume document.',
  },

  [EvaluationErrorCode.MISSING_RESUME]: {
    title: 'No Resume Provided',
    message: 'No resume file was included in the request.',
    suggestion:
      'Please select and upload your resume file before requesting an evaluation.',
  },

  [EvaluationErrorCode.MISSING_JOB_DESCRIPTION]: {
    title: 'No Job Description Provided',
    message:
      'Job-specific fit analysis requires a job description, but none was provided.',
    suggestion:
      'Copy and paste the full job description text to get personalized fit analysis.',
  },

  [EvaluationErrorCode.INVALID_INPUT]: {
    title: 'Invalid Input Data',
    message: 'The provided input data is invalid or malformed.',
    suggestion:
      'Please check your inputs and ensure all required information is provided correctly.',
  },

  [EvaluationErrorCode.CONTENT_TOO_SHORT]: {
    title: 'Resume Too Short',
    message:
      'Your resume appears to have very little content. Effective resumes typically have at least 200-300 words.',
    suggestion:
      'Add more detail to your experience, skills, and achievements. Include specific accomplishments and quantified results.',
  },

  [EvaluationErrorCode.NO_TEXT_EXTRACTED]: {
    title: 'No Text Could Be Extracted',
    message:
      'We were unable to extract any text from your resume. This often happens with scanned documents or image-based PDFs.',
    suggestion:
      'Use a resume created with a word processor rather than a scanned image. If you must use a scanned document, try OCR software first.',
  },

  [EvaluationErrorCode.IMAGE_ONLY_PDF]: {
    title: 'Image-Based PDF Detected',
    message:
      'Your PDF contains only images without selectable text. This is common with scanned resumes or those created from screenshots.',
    suggestion:
      'Create your resume using Word, Google Docs, or a resume builder, then export to PDF. Avoid scanning or screenshotting your resume.',
  },

  [EvaluationErrorCode.ENCRYPTED_PDF]: {
    title: 'Protected PDF',
    message:
      'Your PDF is password-protected or encrypted, which prevents us from reading its contents.',
    suggestion:
      'Remove the password protection from your PDF before uploading, or export a new version without protection.',
  },

  [EvaluationErrorCode.SCORING_FAILED]: {
    title: 'Scoring Error',
    message:
      'An error occurred while calculating your resume score. This is usually a temporary issue.',
    suggestion:
      'Please try again in a few moments. If the problem persists, try re-uploading your resume.',
  },

  [EvaluationErrorCode.DIMENSION_CALCULATION_FAILED]: {
    title: 'Analysis Error',
    message:
      'We encountered an issue while analyzing specific aspects of your resume.',
    suggestion:
      'Try uploading your resume again. If issues persist, try a different file format.',
  },

  [EvaluationErrorCode.GAP_ANALYSIS_FAILED]: {
    title: 'Gap Analysis Error',
    message:
      'We were unable to complete the gap analysis between your resume and the job description.',
    suggestion:
      'Ensure both your resume and the job description have sufficient content for comparison.',
  },

  [EvaluationErrorCode.JOB_PARSING_FAILED]: {
    title: 'Job Description Error',
    message:
      'We had trouble parsing the job description you provided. It may be too short or in an unusual format.',
    suggestion:
      'Paste the full job description text, including requirements and responsibilities sections.',
  },

  [EvaluationErrorCode.INTERNAL_ERROR]: {
    title: 'Unexpected Error',
    message:
      'Something went wrong on our end. Our team has been notified and is working to fix it.',
    suggestion:
      'Please try again in a few minutes. If the problem continues, contact our support team.',
  },

  [EvaluationErrorCode.TIMEOUT]: {
    title: 'Request Timed Out',
    message:
      'The evaluation took longer than expected. This can happen with very large or complex resumes.',
    suggestion:
      'Try simplifying your resume format or breaking it into sections. You can also try again later.',
  },

  [EvaluationErrorCode.CACHE_ERROR]: {
    title: 'System Error',
    message: 'A temporary system issue occurred while processing your request.',
    suggestion:
      'Please try again. This is usually a brief hiccup that resolves on its own.',
  },
};

// ==================== Error Class ====================

/**
 * Custom error class for evaluation errors
 */
export class EvaluationError extends Error {
  /** Error code */
  readonly code: EvaluationErrorCode;
  /** User-friendly title */
  readonly title: string;
  /** User-friendly suggestion */
  readonly suggestion: string;
  /** Additional details for debugging */
  readonly details?: unknown;

  constructor(code: EvaluationErrorCode, details?: unknown) {
    const errorInfo = ERROR_MESSAGES[code];
    super(errorInfo.message);

    this.name = 'EvaluationError';
    this.code = code;
    this.title = errorInfo.title;
    this.suggestion = errorInfo.suggestion;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EvaluationError);
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
 * Create a new EvaluationError
 */
export function createError(
  code: EvaluationErrorCode,
  details?: unknown
): EvaluationError {
  return new EvaluationError(code, details);
}

/**
 * Check if an error is an EvaluationError
 */
export function isEvaluationError(error: unknown): error is EvaluationError {
  return error instanceof EvaluationError;
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
  if (isEvaluationError(error)) {
    return error.toUserFriendly();
  }

  // Handle unknown errors gracefully
  return {
    code: EvaluationErrorCode.INTERNAL_ERROR,
    title: ERROR_MESSAGES[EvaluationErrorCode.INTERNAL_ERROR].title,
    message: ERROR_MESSAGES[EvaluationErrorCode.INTERNAL_ERROR].message,
    suggestion: ERROR_MESSAGES[EvaluationErrorCode.INTERNAL_ERROR].suggestion,
  };
}

/**
 * Wrap an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  fallbackCode: EvaluationErrorCode = EvaluationErrorCode.INTERNAL_ERROR
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isEvaluationError(error)) {
      throw error;
    }
    throw new EvaluationError(fallbackCode, error);
  }
}

/**
 * Log error with structured data (for debugging)
 */
export function logError(error: EvaluationError, context?: string): void {
  console.error(`[Layer1][${context || 'Error'}]`, {
    code: error.code,
    title: error.title,
    message: error.message,
    details: error.details,
    stack: error.stack,
  });
}
