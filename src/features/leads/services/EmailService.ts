/**
 * Email Service
 * Single Responsibility: Send email notifications for lead captures and OTP verification
 *
 * Strategy pattern: selects a provider at construction time based on EMAIL_PROVIDER env var.
 *   EMAIL_PROVIDER=mock   → logs to server console (default; safe for development)
 *   EMAIL_PROVIDER=resend → sends real emails via the Resend API (requires RESEND_API_KEY)
 *
 * To switch in production: set EMAIL_PROVIDER=resend in your environment.
 * No code changes required.
 */

// ── Provider interface ────────────────────────────────────────────────────────

interface IEmailProvider {
  /**
   * Send a 6-digit OTP code to the user so they can verify their email.
   */
  sendOtp(email: string, otpCode: string): Promise<void>;

  /**
   * Send a confirmation email after a lead has been successfully captured.
   */
  sendConfirmation(email: string, companyName?: string | null): Promise<void>;
}

// ── Mock provider (development) ───────────────────────────────────────────────

class MockEmailProvider implements IEmailProvider {
  async sendOtp(email: string, otpCode: string): Promise<void> {
    // Visible in Next.js server console during local development
    console.log(
      `\n[MOCK EMAIL] ── OTP Verification ──────────────────\n` +
      `  To:   ${email}\n` +
      `  Code: ${otpCode}\n` +
      `────────────────────────────────────────────────────\n`,
    );
  }

  async sendConfirmation(email: string, companyName?: string | null): Promise<void> {
    console.log(
      `\n[MOCK EMAIL] ── Lead Confirmation ──────────────────\n` +
      `  To:      ${email}\n` +
      `  Company: ${companyName ?? '(not provided)'}\n` +
      `────────────────────────────────────────────────────\n`,
    );
  }
}

// ── Resend provider (production) ──────────────────────────────────────────────

class ResendEmailProvider implements IEmailProvider {
  private apiKey: string;
  private fromAddress: string = 'noreply@credex.ai';

  constructor() {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        'RESEND_API_KEY is not set. Either set it or use EMAIL_PROVIDER=mock.',
      );
    }
    this.apiKey = key;
  }

  async sendOtp(email: string, otpCode: string): Promise<void> {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: email,
        subject: `Your Credex verification code: ${otpCode}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="color:#0f172a;margin-bottom:8px">Your verification code</h2>
            <p style="color:#64748b;margin-bottom:24px">
              Enter this code in Credex to complete your email verification.
              It expires in <strong>10 minutes</strong>.
            </p>
            <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;
                        font-size:36px;font-weight:700;letter-spacing:12px;color:#0f172a">
              ${otpCode}
            </div>
            <p style="color:#94a3b8;font-size:13px;margin-top:24px">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });
  }

  async sendConfirmation(email: string, companyName?: string | null): Promise<void> {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: email,
        subject: "You're on the list — Credex",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="color:#0f172a;margin-bottom:8px">
              Thanks${companyName ? `, ${companyName}` : ''}!
            </h2>
            <p style="color:#64748b">
              Our team will review your AI tool audit and reach out within <strong>24 hours</strong>
              with personalised recommendations to help you secure those savings.
            </p>
            <p style="color:#94a3b8;font-size:13px;margin-top:24px">
              — The Credex team
            </p>
          </div>
        `,
      }),
    });
  }
}

// ── Public EmailService facade ────────────────────────────────────────────────

export class EmailService {
  private provider: IEmailProvider;

  constructor() {
    const useResend = process.env.EMAIL_PROVIDER === 'resend';
    this.provider = useResend ? new ResendEmailProvider() : new MockEmailProvider();
  }

  /**
   * Send a 6-digit OTP to the given email address.
   * Errors are silently swallowed — a failed email must not block the API response.
   */
  async sendOtp(email: string, otpCode: string): Promise<void> {
    try {
      await this.provider.sendOtp(email, otpCode);
    } catch (error) {
      console.error('[EmailService] sendOtp failed:', error);
    }
  }

  /**
   * Send a lead confirmation email (fire-and-forget).
   * Errors are silently swallowed — a failed email must not block the API response.
   */
  async sendLeadConfirmation(
    email: string,
    companyName?: string | null,
  ): Promise<void> {
    try {
      await this.provider.sendConfirmation(email, companyName);
    } catch (error) {
      console.error('[EmailService] sendLeadConfirmation failed:', error);
    }
  }
}
