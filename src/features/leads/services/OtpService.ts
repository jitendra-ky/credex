/**
 * OTP Service
 * Single Responsibility: Generate, send, and verify one-time passwords for email verification
 *
 * MVP rate limits:
 *   - Per-email cooldown: one OTP per email per 5 minutes (prevents inbox flooding)
 *   - Per-verify:         max 3 wrong attempts before lockout (must resend)
 *
 * OTP lifetime: 10 minutes from creation.
 */

import crypto from 'crypto';
import {
  createEmailVerification,
  deleteVerificationsForEmail,
  getLatestVerificationByEmail,
  incrementVerificationAttempts,
  markVerificationComplete,
} from '@/lib/db/queries';
import {
  OtpCooldownError,
  OtpExpiredError,
  OtpInvalidError,
  OtpLockedError,
  OtpNotFoundError,
} from '@/lib/api/errors';
import { EmailService } from './EmailService';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minutes an OTP remains valid after it is issued */
const OTP_TTL_MINUTES = 10;

/** Minimum minutes that must pass before another OTP can be sent to the same email */
const EMAIL_COOLDOWN_MINUTES = 5;

/** Maximum wrong verification attempts before the OTP is locked */
const MAX_VERIFY_ATTEMPTS = 3;

// ── OtpService ────────────────────────────────────────────────────────────────

export class OtpService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Generate a cryptographically random 6-digit numeric string.
   * Using crypto.randomInt to avoid modulo bias.
   */
  private generateCode(): string {
    return crypto.randomInt(100_000, 999_999).toString();
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Generate a fresh OTP, persist it, and send it to the email address.
   *
   * Guards:
   *  1. Per-email cooldown — rejects if a code was sent within the last 5 min
   *
   * On success, any previous OTP rows for this email are deleted first
   * so there is never more than one active code at a time.
   *
   * @param email - Target email address (must already be normalised / lowercased)
   * @throws OtpCooldownError
   */
  async sendOtp(email: string): Promise<void> {
    // Guard: per-email cooldown
    const existing = await getLatestVerificationByEmail(email);
    if (existing) {
      const secondsSinceSent =
        (Date.now() - existing.last_sent_at.getTime()) / 1000;
      const cooldownSeconds = EMAIL_COOLDOWN_MINUTES * 60;

      if (secondsSinceSent < cooldownSeconds) {
        throw new OtpCooldownError(Math.ceil(cooldownSeconds - secondsSinceSent));
      }
    }

    // Clean up any stale / previous OTP rows for this email
    await deleteVerificationsForEmail(email);

    // Generate and persist the new OTP
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await createEmailVerification(email, code, expiresAt);

    // Send the email (fire-and-forget — EmailService never throws)
    await this.emailService.sendOtp(email, code);
  }

  /**
   * Verify a submitted OTP code against the stored record.
   *
   * Side effects:
   *  - Increments the `attempts` counter on every wrong guess
   *  - Sets `verified_at` on a correct guess
   *  - Throws on expired / locked / not-found states
   *
   * @param email   - Email address the OTP was sent to
   * @param code    - 6-digit code submitted by the user
   * @throws OtpNotFoundError | OtpExpiredError | OtpLockedError | OtpInvalidError
   */
  async verifyOtp(email: string, code: string): Promise<void> {
    const verification = await getLatestVerificationByEmail(email);

    // No pending verification row
    if (!verification) {
      throw new OtpNotFoundError();
    }

    // OTP has expired
    if (verification.expires_at < new Date()) {
      throw new OtpExpiredError();
    }

    // Already hit the max wrong attempts — must request a new OTP
    if (verification.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new OtpLockedError();
    }

    // Wrong code — increment attempts, then throw with remaining count
    if (verification.otp_code !== code) {
      await incrementVerificationAttempts(verification.id);
      const attemptsRemaining = MAX_VERIFY_ATTEMPTS - (verification.attempts + 1);
      throw new OtpInvalidError(attemptsRemaining);
    }

    // Correct code — mark as verified
    await markVerificationComplete(verification.id);
  }
}
