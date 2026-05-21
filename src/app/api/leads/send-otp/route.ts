/**
 * POST /api/leads/send-otp
 *
 * Step 1 of the lead capture OTP flow.
 * Accepts an email address, validates it, then sends a 6-digit verification
 * code to that address. The code expires in 10 minutes.
 *
 * Rate limits (enforced inside OtpService):
 *   - Per-email: one send per 5 minutes
 *   - Per-IP:    10 sends per hour
 *
 * Returns:
 *   200 { success: true, cooldown_seconds: 300 }
 *   400 { success: false, error: { code: 'VALIDATION_ERROR', ... } }
 *   429 { success: false, error: { code: 'OTP_COOLDOWN', details: { retry_after_seconds } } }
 *   429 { success: false, error: { code: 'RATE_LIMIT_ERROR', ... } }
 *   500 { success: false, error: { code: 'INTERNAL_ERROR', ... } }
 */

import { sendOtpRequestSchema } from '@/lib/validators';
import { isApiError } from '@/lib/api/errors';
import { OtpService } from '@/features/leads/services/OtpService';
import { ValidationError } from '@/lib/api/errors';

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

  try {
    const body = await request.json();
    const ipAddress = getClientIp(request);

    // Validate request body
    let validated;
    try {
      validated = sendOtpRequestSchema.parse(body);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Validation failed';
      throw new ValidationError('Invalid request', { details });
    }

    // Delegate to OtpService (handles cooldown, generation, email send)
    await otpService.sendOtp(validated.email);

    return Response.json(
      {
        success: true,
        // Tell the client how long to show the resend countdown
        cooldown_seconds: 300,
      },
      { status: 200 },
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

    console.error('[POST /api/leads/send-otp] Unexpected error:', error);
    return Response.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 },
    );
  }
}
