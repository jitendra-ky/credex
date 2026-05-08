/**
 * Auth Service
 *
 * Placeholder file for authentication API calls
 */

import type { AuthUser, LoginPayload } from '../types/auth.types';

export class AuthService {
  async login(_payload: LoginPayload): Promise<AuthUser> {
    // TODO: Implement login
    throw new Error('Not implemented');
  }

  async logout(): Promise<void> {
    // TODO: Implement logout
    throw new Error('Not implemented');
  }

  async getCurrentUser(): Promise<AuthUser> {
    // TODO: Implement get current user
    throw new Error('Not implemented');
  }
}

export const authService = new AuthService();
