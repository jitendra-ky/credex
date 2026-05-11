/**
 * Lead Types
 * Single Responsibility: Define lead-related type interfaces
 */

import type { Lead } from '@/lib/db/schema';

export type { Lead } from '@/lib/db/schema';

export interface LeadRequest {
  email: string;
  company_name: string | null;
  role: string | null;
  audit_id?: string | null;
}

export interface LeadResponse {
  id: string;
  email: string;
  company_name: string | null;
  role: string | null;
  audit_id: string | null;
  created_at: Date;
  updated_at: Date;
  is_new: boolean;
}
