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
