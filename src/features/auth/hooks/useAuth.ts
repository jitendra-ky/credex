/**
 * useAuth Hook
 *
 * Placeholder hook for authentication state management
 */

import { useState } from 'react';
import type { AuthUser } from '../types/auth.types';

export function useAuth(): { user: AuthUser | null; isLoading: boolean } {
  const [user] = useState<AuthUser | null>(null);
  const [isLoading] = useState(false);

  // TODO: Implement auth logic

  return { user, isLoading };
}
