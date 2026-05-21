/**
 * POST /api/leads/verify-otp
 *
 * Step 2 of the lead capture OTP flow.
 * Verifies the submitted 6-digit code, then — if correct — atomically captures
 * the lead (upsert) and sends a confirmation email.
 *
 * Returns:
 *   201 { success: true, data: LeadResponse }   ← new lead
 *   200 { success: true, data: LeadResponse }   ← returning lead (email already existed)
 *   400 { success: false, error: { code: 'VALIDATION_ERROR' | 'OTP_INVALID' | 'OTP_EXPIRED' } }
 *   404 { success: false, error: { code: 'OTP_NOT_FOUND' } }
 *   429 { success: false, error: { code: 'OTP_LOCKED' } }
 *   500 { success: false, error: { code: 'INTERNAL_ERROR' } }
 */

import { verifyOtpRequestSchema } from '@/lib/validators';
import { isApiError, ValidationError } from '@/lib/api/errors';
import { OtpService } from '@/features/leads/services/OtpService';
import { LeadService } from '@/features/leads/services/LeadService';

/** Extract the real client IP from proxy headers with a localhost fallback */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '0.0.0.0';
}

export async function POST(request: Request) {
  const otpService = new OtpService();
  const leadService = new LeadService();

  try {
    const body = await request.json();
    const ipAddress = getClientIp(request);

    // Validate request body
    let validated;
    try {
      validated = verifyOtpRequestSchema.parse(body);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Validation failed';
      throw new ValidationError('Invalid request', { details });
    }

    // Step 1: Verify the OTP (throws on expired / locked / invalid / not-found)
    await otpService.verifyOtp(validated.email, validated.otp_code);

    // Step 2: OTP is valid — capture the lead
    const result = await leadService.captureLead(
      {
        email: validated.email,
        company_name: validated.company_name,
        role: validated.role,
        audit_id: validated.audit_id,
      },
      ipAddress,
    );

    // 201 for brand-new leads, 200 for returning ones
    const statusCode = result.is_new ? 201 : 200;

    return Response.json(
      { success: true, data: result },
      { status: statusCode },
    );
  } catch (error) {
    if (isApiError(error)) {
      return Response.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.statusCode },
      );
    }

    console.error('[POST /api/leads/verify-otp] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 },
    );
  }
}
