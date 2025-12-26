/**
 * Layer 8 - AI Coach Interface
 * Error Handling
 *
 * Provides error codes, user-friendly messages, and error utilities
 * for the AI Coach Interface.
 */

// ==================== Error Codes ====================

/**
 * All possible Coach error codes
 */
export enum CoachErrorCode {
  // Template errors
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_RENDER_FAILED = 'TEMPLATE_RENDER_FAILED',
  MISSING_VARIABLE = 'MISSING_VARIABLE',
  INVALID_VARIABLE_TYPE = 'INVALID_VARIABLE_TYPE',

  // Configuration errors
  CONFIG_LOAD_FAILED = 'CONFIG_LOAD_FAILED',
  CONFIG_INVALID = 'CONFIG_INVALID',
  INVALID_TONE = 'INVALID_TONE',

  // Context errors
  MISSING_CONTEXT = 'MISSING_CONTEXT',
  INVALID_CONTEXT = 'INVALID_CONTEXT',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',

  // Tone errors
  TONE_DETECTION_FAILED = 'TONE_DETECTION_FAILED',
  TONE_ADAPTATION_FAILED = 'TONE_ADAPTATION_FAILED',

  // Format errors
  INVALID_FORMAT = 'INVALID_FORMAT',
  FORMAT_CONVERSION_FAILED = 'FORMAT_CONVERSION_FAILED',

  // Explanation errors
  EXPLANATION_GENERATION_FAILED = 'EXPLANATION_GENERATION_FAILED',
  UNSUPPORTED_EXPLANATION_TYPE = 'UNSUPPORTED_EXPLANATION_TYPE',

  // General errors
  INVALID_INPUT = 'INVALID_INPUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// ==================== Error Messages ====================

/**
 * User-friendly error messages for each error code
 */
export const ERROR_MESSAGES: Record<
  CoachErrorCode,
  {
    title: string;
    message: string;
    suggestion: string;
  }
> = {
  [CoachErrorCode.TEMPLATE_NOT_FOUND]: {
    title: 'Template Not Found',
    message: 'The requested message template could not be found.',
    suggestion: 'This is a system error. Please try again or contact support.',
  },

  [CoachErrorCode.TEMPLATE_RENDER_FAILED]: {
    title: 'Message Generation Failed',
    message: 'We encountered an issue while generating your message.',
    suggestion: 'Please try again. If the problem persists, contact support.',
  },

  [CoachErrorCode.MISSING_VARIABLE]: {
    title: 'Missing Information',
    message: 'Some required information is missing to generate the message.',
    suggestion: 'Please ensure all required data is provided.',
  },

  [CoachErrorCode.INVALID_VARIABLE_TYPE]: {
    title: 'Invalid Data Type',
    message: 'The provided data has an incorrect type.',
    suggestion: 'Please check the data format and try again.',
  },

  [CoachErrorCode.CONFIG_LOAD_FAILED]: {
    title: 'Configuration Error',
    message: 'Failed to load Coach configuration.',
    suggestion: 'This is a system error. Please try again later.',
  },

  [CoachErrorCode.CONFIG_INVALID]: {
    title: 'Invalid Configuration',
    message: 'The Coach configuration is invalid or corrupted.',
    suggestion: 'This is a system error. Please contact support.',
  },

  [CoachErrorCode.INVALID_TONE]: {
    title: 'Invalid Tone',
    message: 'The specified tone is not supported.',
    suggestion: 'Use one of: professional, empathetic, encouraging, or direct.',
  },

  [CoachErrorCode.MISSING_CONTEXT]: {
    title: 'Missing Context',
    message: 'Required context information is missing.',
    suggestion: 'Please provide the necessary context data.',
  },

  [CoachErrorCode.INVALID_CONTEXT]: {
    title: 'Invalid Context',
    message: 'The provided context data is invalid.',
    suggestion: 'Please check the context data format and try again.',
  },

  [CoachErrorCode.INSUFFICIENT_DATA]: {
    title: 'Insufficient Data',
    message: 'Not enough data is available to generate a meaningful response.',
    suggestion: 'Please provide more context or data points.',
  },

  [CoachErrorCode.TONE_DETECTION_FAILED]: {
    title: 'Tone Detection Failed',
    message: 'Could not determine the appropriate tone for the response.',
    suggestion: 'You can specify a tone manually or try again.',
  },

  [CoachErrorCode.TONE_ADAPTATION_FAILED]: {
    title: 'Tone Adaptation Failed',
    message: 'Could not adapt the message to the requested tone.',
    suggestion: 'Try using a different tone or the default professional tone.',
  },

  [CoachErrorCode.INVALID_FORMAT]: {
    title: 'Invalid Format',
    message: 'The specified output format is not supported.',
    suggestion: 'Use one of: text, markdown, or html.',
  },

  [CoachErrorCode.FORMAT_CONVERSION_FAILED]: {
    title: 'Format Conversion Failed',
    message: 'Could not convert the message to the requested format.',
    suggestion: 'Try using a different format or the default text format.',
  },

  [CoachErrorCode.EXPLANATION_GENERATION_FAILED]: {
    title: 'Explanation Generation Failed',
    message: 'Could not generate the explanation.',
    suggestion: 'Please ensure all required data is provided and try again.',
  },

  [CoachErrorCode.UNSUPPORTED_EXPLANATION_TYPE]: {
    title: 'Unsupported Explanation Type',
    message: 'This type of explanation is not yet supported.',
    suggestion: 'Check the documentation for supported explanation types.',
  },

  [CoachErrorCode.INVALID_INPUT]: {
    title: 'Invalid Input',
    message: 'The provided input data is invalid.',
    suggestion: 'Please check the input format and required fields.',
  },

  [CoachErrorCode.INTERNAL_ERROR]: {
    title: 'Internal Error',
    message: 'An unexpected error occurred in the Coach interface.',
    suggestion: 'Please try again. If the problem persists, contact support.',
  },
};

// ==================== Error Class ====================

/**
 * Custom error class for Coach errors
 */
export class CoachError extends Error {
  /** Error code */
  readonly code: CoachErrorCode;
  /** User-friendly title */
  readonly title: string;
  /** User-friendly suggestion */
  readonly suggestion: string;
  /** Additional details for debugging */
  readonly details?: unknown;
  /** Original error (if wrapping) */
  readonly cause?: Error;

  constructor(code: CoachErrorCode, details?: unknown, cause?: Error) {
    const errorInfo = ERROR_MESSAGES[code];
    super(errorInfo.message);

    this.name = 'CoachError';
    this.code = code;
    this.title = errorInfo.title;
    this.suggestion = errorInfo.suggestion;
    this.details = details;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CoachError);
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
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack,
      } : undefined,
      stack: this.stack,
    };
  }
}

// ==================== Error Factory Functions ====================

/**
 * Create a template not found error
 */
export function createTemplateNotFoundError(templateId: string): CoachError {
  return new CoachError(CoachErrorCode.TEMPLATE_NOT_FOUND, { templateId });
}

/**
 * Create a template render failed error
 */
export function createTemplateRenderError(
  templateId: string,
  cause?: Error
): CoachError {
  return new CoachError(
    CoachErrorCode.TEMPLATE_RENDER_FAILED,
    { templateId },
    cause
  );
}

/**
 * Create a missing variable error
 */
export function createMissingVariableError(
  templateId: string,
  variableName: string
): CoachError {
  return new CoachError(CoachErrorCode.MISSING_VARIABLE, {
    templateId,
    variableName,
  });
}

/**
 * Create a missing context error
 */
export function createMissingContextError(
  requiredFields: string[]
): CoachError {
  return new CoachError(CoachErrorCode.MISSING_CONTEXT, {
    requiredFields,
    message: `Missing required context fields: ${requiredFields.join(', ')}`,
  });
}

/**
 * Create an invalid tone error
 */
export function createInvalidToneError(tone: string): CoachError {
  return new CoachError(CoachErrorCode.INVALID_TONE, {
    providedTone: tone,
    validTones: ['professional', 'empathetic', 'encouraging', 'direct'],
  });
}

/**
 * Create an explanation generation failed error
 */
export function createExplanationError(
  explanationType: string,
  cause?: Error
): CoachError {
  return new CoachError(
    CoachErrorCode.EXPLANATION_GENERATION_FAILED,
    { explanationType },
    cause
  );
}

/**
 * Create an internal error (wrapping unexpected errors)
 */
export function createInternalError(cause?: Error): CoachError {
  return new CoachError(
    CoachErrorCode.INTERNAL_ERROR,
    { message: cause?.message ?? 'An unexpected error occurred' },
    cause
  );
}

// ==================== Type Guards ====================

/**
 * Check if an error is a CoachError
 */
export function isCoachError(error: unknown): error is CoachError {
  return error instanceof CoachError;
}

// ==================== Error Utilities ====================

/**
 * Get user-friendly error information from any error
 */
export function getUserFriendlyError(
  error: unknown
): { code: string; title: string; message: string; suggestion: string } {
  if (isCoachError(error)) {
    return error.toUserFriendly();
  }

  if (error instanceof Error) {
    const { title, suggestion } = ERROR_MESSAGES[CoachErrorCode.INTERNAL_ERROR];
    return {
      code: CoachErrorCode.INTERNAL_ERROR,
      title,
      message: error.message || 'An unexpected error occurred',
      suggestion,
    };
  }

  const { title, message, suggestion } = ERROR_MESSAGES[CoachErrorCode.INTERNAL_ERROR];
  return {
    code: CoachErrorCode.INTERNAL_ERROR,
    title,
    message,
    suggestion,
  };
}

/**
 * Wrap an error in a CoachError if it isn't one already
 */
export function wrapError(
  error: unknown,
  defaultCode: CoachErrorCode = CoachErrorCode.INTERNAL_ERROR
): CoachError {
  if (isCoachError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new CoachError(defaultCode, { message: error.message }, error);
  }

  return new CoachError(defaultCode, { message: String(error) });
}

/**
 * Safe error handler that ensures consistent error output
 */
export function handleError(
  error: unknown,
  context?: string
): CoachError {
  const wrapped = wrapError(error);

  if (context) {
    console.error(`[Layer 8 - ${context}]`, wrapped.toJSON());
  }

  return wrapped;
}
