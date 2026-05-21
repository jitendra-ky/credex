/**
 * Lead Service
 * Single Responsibility: Orchestrate lead capture workflow
 * Facade pattern: coordinates validation, rate limiting, DB upsert, and email
 */

import { leadRequestSchema } from '@/lib/validators';
import { upsertLead, getLeadByEmail, createLeadAudit, getLatestAuditIdForLead } from '@/lib/db/queries';
import { ValidationError, ServiceError } from '@/lib/api/errors';
import { RateLimitService } from './RateLimitService';
import { EmailService } from './EmailService';
import type { LeadResponse } from '../types';
import { AUDIT_ENGINE_VERSION } from '@/features/audit/engine/version';

export class LeadService {
  private rateLimitService: RateLimitService;
  private emailService: EmailService;

  constructor() {
    this.rateLimitService = new RateLimitService();
    this.emailService = new EmailService();
  }

  /**
   * Capture a lead with validation, rate limiting, and email confirmation
   * @param request - Raw lead request data
   * @param ipAddress - Client IP for rate limiting
   * @returns LeadResponse with is_new flag
   * @throws ValidationError | RateLimitError | ServiceError
   */
  async captureLead(
    request: unknown,
    ipAddress: string,
  ): Promise<LeadResponse> {
    // Step 1: Validate request
    let validated;
    try {
      validated = leadRequestSchema.parse(request);
    } catch (error) {
      const details =
        error instanceof Error ? error.message : 'Validation failed';
      throw new ValidationError('Invalid lead request', { details });
    }

    // Step 2: Check rate limit
    await this.rateLimitService.checkRateLimit(ipAddress);

    // Step 3: Check if lead already exists
    const existingLead = await getLeadByEmail(validated.email);
    const isNew = !existingLead;

    // Step 4: Upsert to database
    let lead;
    try {
      lead = await upsertLead(
        validated.email,
        validated.company_name,
        validated.role,
        ipAddress,
      );
    } catch (error) {
      throw new ServiceError('Failed to save lead', {
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Step 5: Link lead to audit in lead_audits (Round 2)
    // onConflictDoNothing: same email re-submitting same engine version is a safe no-op
    if (validated.audit_id) {
      await createLeadAudit({
        lead_id: lead.id,
        audit_id: validated.audit_id,
        engine_version: AUDIT_ENGINE_VERSION,
        is_stale: false,
        previous_audit_id: null,
      });
    }

    // Step 6: Send confirmation email (fire-and-forget)
    await this.emailService.sendLeadConfirmation(
      validated.email,
      validated.company_name,
    );

    // Derive audit_id from leadAuditsTable instead of the deprecated leadsTable.audit_id
    const latestAuditId = validated.audit_id
      ? validated.audit_id  // We just created/have the lead_audit row with this audit_id
      : await getLatestAuditIdForLead(lead.id);

    return {
      id: lead.id,
      email: lead.email,
      company_name: lead.company_name,
      role: lead.role,
      audit_id: latestAuditId,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      is_new: isNew,
    };
  }
}
