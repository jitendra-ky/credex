/**
 * API Error Classes
 * Single Responsibility: Define custom error types for API layer
 * Enables structured error handling and consistent HTTP responses
 */

/**
 * Base API error class
 * All API errors should extend this class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Validation error
 * HTTP 400: Invalid request format or missing required fields
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 * HTTP 404: Requested resource does not exist
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID "${id}" not found`
      : `${resource} not found`;
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Service error
 * HTTP 500: Internal service failure (e.g., audit engine failure, DB error)
 */
export class ServiceError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(500, message, 'SERVICE_ERROR', details);
    this.name = 'ServiceError';
  }
}

/**
 * Conflict error
 * HTTP 409: Request conflicts with current state
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error
 * HTTP 429: Too many requests from this IP/user
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests', details?: unknown) {
    super(429, message, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
  }
}

/**
 * OTP not found error
 * HTTP 404: No pending (unverified) OTP exists for this email
 */
export class OtpNotFoundError extends ApiError {
  constructor(message: string = 'No active verification code found for this email') {
    super(404, message, 'OTP_NOT_FOUND');
    this.name = 'OtpNotFoundError';
  }
}

/**
 * OTP expired error
 * HTTP 400: The OTP exists but its 10-minute window has passed
 */
export class OtpExpiredError extends ApiError {
  constructor(message: string = 'Verification code has expired. Please request a new one') {
    super(400, message, 'OTP_EXPIRED');
    this.name = 'OtpExpiredError';
  }
}

/**
 * OTP invalid error
 * HTTP 400: The submitted code does not match; includes attempts_remaining in details
 */
export class OtpInvalidError extends ApiError {
  constructor(attemptsRemaining: number) {
    super(
      400,
      `Incorrect code. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining`,
      'OTP_INVALID',
      { attempts_remaining: attemptsRemaining },
    );
    this.name = 'OtpInvalidError';
  }
}

/**
 * OTP locked error
 * HTTP 429: Max wrong attempts reached; user must request a fresh OTP
 */
export class OtpLockedError extends ApiError {
  constructor(message: string = 'Too many wrong attempts. Please request a new code') {
    super(429, message, 'OTP_LOCKED');
    this.name = 'OtpLockedError';
  }
}

/**
 * OTP cooldown error
 * HTTP 429: A code was already sent within the last 5 minutes
 */
export class OtpCooldownError extends ApiError {
  constructor(retryAfterSeconds: number) {
    super(
      429,
      `A code was already sent. Please wait ${Math.ceil(retryAfterSeconds / 60)} minute(s) before requesting another`,
      'OTP_COOLDOWN',
      { retry_after_seconds: retryAfterSeconds },
    );
    this.name = 'OtpCooldownError';
  }
}


/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if error is a native Error
 */
export function isNativeError(error: unknown): error is Error {
  return error instanceof Error;
}
