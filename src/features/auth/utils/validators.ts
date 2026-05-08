/**
 * Auth Validators
 *
 * Placeholder file for auth-related validation utilities
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // TODO: Implement password validation rules
  return password.length >= 8;
}
