/**
 * Auth Types
 *
 * Placeholder file for authentication-related type definitions
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
