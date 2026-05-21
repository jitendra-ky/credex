/**
 * Lead Types
 * Single Responsibility: Define lead-related type interfaces
 */

import type { Lead, EmailVerification } from '@/lib/db/schema';

export type { Lead } from '@/lib/db/schema';
export type { EmailVerification } from '@/lib/db/schema';

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

/** Returned from POST /api/leads/send-otp on success */
export interface SendOtpResponse {
  success: true;
  cooldown_seconds: number;
}

/** Returned from POST /api/leads/verify-otp on success */
export interface VerifyOtpResponse {
  success: true;
  data: LeadResponse;
}

/** Shape of error details for OTP_INVALID responses */
export interface OtpInvalidDetails {
  attempts_remaining: number;
}

/** Shape of error details for OTP_COOLDOWN responses */
export interface OtpCooldownDetails {
  retry_after_seconds: number;
}
