/**
 * API Response Utilities
 * Single Responsibility: Format and serialize API responses
 * Provides consistent response structure across all endpoints
 */

import { NextResponse } from 'next/server';
import { isApiError, isNativeError } from './errors';

/**
 * Standard success response structure
 */
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Standard error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Create a success response
 * @param data - Response payload
 * @param statusCode - HTTP status code (default: 200)
 * @returns NextResponse with formatted success payload
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}

/**
 * Create an error response
 * Handles ApiError, native Error, and unknown error types
 * @param error - The error to respond with
 * @returns NextResponse with formatted error payload
 */
export function errorResponse(error: unknown): NextResponse<ErrorResponse> {
  const timestamp = new Date().toISOString();

  // Handle ApiError instances
  if (isApiError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
        timestamp,
      },
      { status: error.statusCode },
    );
  }

  // Handle native Error instances
  if (isNativeError(error)) {
    console.error('[API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp,
      },
      { status: 500 },
    );
  }

  // Handle unknown error types
  console.error('[API Unknown Error]', error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp,
    },
    { status: 500 },
  );
}

/**
 * Safely parse JSON and handle parsing errors
 * @param text - Raw JSON string
 * @returns Parsed object or throws ValidationError
 */
export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON: ${isNativeError(error) ? error.message : 'Unknown parsing error'}`);
  }
}
