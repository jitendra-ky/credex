/**
 * Email Service
 * Single Responsibility: Send email notifications for lead captures
 * Fires asynchronously; errors logged but don't block form submission
 */

export class EmailService {
  /**
   * Send lead confirmation email via Resend
   * Fire-and-forget: errors are logged but not thrown
   * @param email - Recipient email
   * @param companyName - Company name (optional, for personalization)
   */
  async sendLeadConfirmation(
    email: string,
    companyName?: string | null,
  ): Promise<void> {
    try {
      // TODO: Integrate with Resend API
      // For now, just log the intent (will be implemented when Resend key available)
      console.log(`[EmailService] Lead confirmation queued for ${email}`);

      // Placeholder: actual implementation will use Resend client
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // await resend.emails.send({
      //   from: 'leads@credex.ai',
      //   to: email,
      //   subject: 'Thank you for your audit!',
      //   html: `<p>Thanks ${companyName || 'there'}!</p>`,
      // });
    } catch (error) {
      // Silently fail: log but don't re-throw (don't block lead capture)
      console.error(`[EmailService] Failed to send to ${email}:`, error);
    }
  }
}
