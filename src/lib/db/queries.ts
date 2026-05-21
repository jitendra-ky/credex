/**
 * Database Queries
 * Single Responsibility: Encapsulate all database operations
 * Follows Data Access Object (DAO) pattern
 */

import { getDb } from './client';
import {
  auditsTable,
  leadsTable,
  leadAuditsTable,
  reauditNotificationsTable,
  emailVerificationsTable,
  type NewAudit,
  type Audit,
  type NewLead,
  type Lead,
  type NewLeadAudit,
  type LeadAudit,
  type NewReauditNotification,
  type NewEmailVerification,
  type EmailVerification,
} from './schema';
import { eq, and, gte, isNull, ne, sql, desc } from 'drizzle-orm';
import { AuditRequest, AuditResult, AuditTag } from '@/features/audit/types/audit.types';

/**
 * Create a new audit record in the database
 * @param auditRequest - The original audit request (input)
 * @param auditResult - The audit engine result (output)
 * @returns The created audit record with generated ID
 * @throws Error if database insert fails
 */
export async function createAudit(
  auditRequest: AuditRequest,
  auditResult: AuditResult,
): Promise<Audit> {
  const db = getDb();

  const newAudit: NewAudit = {
    tools_json: auditRequest as unknown as Record<string, unknown>,
    results_json: auditResult as unknown as Record<string, unknown>,
    summary: auditResult.ai_summary,
    tag: auditResult.audit_tag as AuditTag,
  };

  const [created] = await db
    .insert(auditsTable)
    .values(newAudit)
    .returning();

  if (!created) {
    throw new Error('Failed to create audit record');
  }

  return created;
}

/**
 * Fetch an audit record by ID
 * @param auditId - The UUID of the audit to fetch
 * @returns The audit record if found, undefined otherwise
 * @throws Error if database query fails
 */
export async function getAuditById(auditId: string): Promise<Audit | undefined> {
  const db = getDb();

  const [audit] = await db
    .select()
    .from(auditsTable)
    .where(eq(auditsTable.id, auditId));

  return audit;
}

/**
 * Fetch all audits (with optional limit and offset for pagination)
 * @param limit - Maximum number of records to return
 * @param offset - Number of records to skip
 * @returns Array of audit records
 * @throws Error if database query fails
 */
export async function listAudits(
  limit: number = 10,
  offset: number = 0,
): Promise<Audit[]> {
  const db = getDb();

  const audits = await db
    .select()
    .from(auditsTable)
    .orderBy(auditsTable.created_at)
    .limit(limit)
    .offset(offset);

  return audits;
}

/**
 * Upsert a lead record (insert or update if email already exists)
 * @param email - The lead's email address (unique key for upsert)
 * @param company_name - The lead's company name (optional)
 * @param role - The lead's job role (optional)
 * @param ip_address - The client IP address for rate limiting
 * @param audit_id - Optional reference to an audit record
 * @returns The upserted lead record
 * @throws Error if database operation fails
 */
export async function upsertLead(
  email: string,
  company_name: string | null | undefined,
  role: string | null | undefined,
  ip_address: string,
  audit_id?: string | null,
): Promise<Lead> {
  const db = getDb();

  const newLead: NewLead = {
    email,
    company_name,
    role,
    ip_address,
    audit_id: audit_id || null,
    updated_at: new Date(),
  };

  const [upserted] = await db
    .insert(leadsTable)
    .values(newLead)
    .onConflictDoUpdate({
      target: leadsTable.email,
      set: {
        company_name,
        role,
        audit_id: audit_id || null,
        updated_at: new Date(),
      },
    })
    .returning();

  if (!upserted) {
    throw new Error('Failed to upsert lead record');
  }

  return upserted;
}

/**
 * Fetch a lead record by email
 * @param email - The email address to search for
 * @returns The lead record if found, undefined otherwise
 * @throws Error if database query fails
 */
export async function getLeadByEmail(email: string): Promise<Lead | undefined> {
  const db = getDb();

  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.email, email));

  return lead;
}

/**
 * Fetch all leads from a specific IP within a time window
 * Used for rate limiting abuse detection
 * @param ip_address - The IP address to query
 * @param minutes - Time window in minutes (default: 15)
 * @returns Array of leads from this IP within the time window
 * @throws Error if database query fails
 */
export async function getLeadsByIpInWindow(
  ip_address: string,
  minutes: number = 15,
): Promise<Lead[]> {
  const db = getDb();

  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

  const leads = await db
    .select()
    .from(leadsTable)
    .where(
      and(
        eq(leadsTable.ip_address, ip_address),
        gte(leadsTable.created_at, cutoffTime),
      ),
    )
    .orderBy(leadsTable.created_at);

  return leads;
}

/**
 * Share an audit by marking it as publicly accessible
 * Makes an audit viewable via its UUID at /share/{id}
 *
 * @param auditId - The UUID of the audit to share
 * @returns The updated audit record with is_shared=true
 * @throws Error if audit not found or database update fails
 */
export async function shareAudit(auditId: string): Promise<Audit> {
  const db = getDb();

  const [updated] = await db
    .update(auditsTable)
    .set({
      is_shared: true,
      shared_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(auditsTable.id, auditId))
    .returning();

  if (!updated) {
    throw new Error('Failed to share audit: audit not found');
  }

  return updated;
}

// ============================================================
// OTP / Email Verification Queries
// ============================================================

/**
 * Delete all verification rows for an email (verified or not).
 * Called before creating a fresh OTP — ensures one active row per email.
 * @param email - The email address to clear
 */
export async function deleteVerificationsForEmail(email: string): Promise<void> {
  const db = getDb();
  await db
    .delete(emailVerificationsTable)
    .where(eq(emailVerificationsTable.email, email));
}

/**
 * Insert a new OTP verification row.
 * @param email - Recipient email address
 * @param otpCode - 6-digit numeric string
 * @param expiresAt - When the OTP becomes invalid
 * @returns The created EmailVerification record
 */
export async function createEmailVerification(
  email: string,
  otpCode: string,
  expiresAt: Date,
): Promise<EmailVerification> {
  const db = getDb();
  const now = new Date();

  const newVerification: NewEmailVerification = {
    email,
    otp_code: otpCode,
    expires_at: expiresAt,
    last_sent_at: now,
  };

  const [created] = await db
    .insert(emailVerificationsTable)
    .values(newVerification)
    .returning();

  if (!created) {
    throw new Error('Failed to create email verification record');
  }

  return created;
}

/**
 * Fetch the latest unverified OTP row for an email.
 * Returns undefined if no pending verification exists.
 * @param email - The email address to look up
 */
export async function getLatestVerificationByEmail(
  email: string,
): Promise<EmailVerification | undefined> {
  const db = getDb();

  const [verification] = await db
    .select()
    .from(emailVerificationsTable)
    .where(
      and(
        eq(emailVerificationsTable.email, email),
        isNull(emailVerificationsTable.verified_at),
      ),
    )
    .orderBy(emailVerificationsTable.created_at)
    .limit(1);

  return verification;
}

/**
 * Increment the wrong-attempt counter on a verification row.
 * @param id - UUID of the email_verifications row
 */
export async function incrementVerificationAttempts(id: string): Promise<void> {
  const db = getDb();
  await db
    .update(emailVerificationsTable)
    .set({ attempts: sql`${emailVerificationsTable.attempts} + 1` })
    .where(eq(emailVerificationsTable.id, id));
}

/**
 * Mark a verification row as successfully completed.
 * @param id - UUID of the email_verifications row
 */
export async function markVerificationComplete(id: string): Promise<void> {
  const db = getDb();
  await db
    .update(emailVerificationsTable)
    .set({ verified_at: new Date() })
    .where(eq(emailVerificationsTable.id, id));
}

// ============================================================
// ROUND 2 — Re-audit on Engine Version Change
// ============================================================

/**
 * Insert a new lead_audits row linking a lead to an audit result.
 * Uses onConflictDoNothing so re-submitting the same email+version is a safe no-op.
 * The unique index (lead_id, engine_version) enforces one row per lead per version.
 *
 * @param data - lead_id, audit_id, engine_version, is_stale, previous_audit_id
 * @returns The inserted row, or undefined if the row already exists
 */
export async function createLeadAudit(
  data: NewLeadAudit,
): Promise<LeadAudit | undefined> {
  const db = getDb();

  const [created] = await db
    .insert(leadAuditsTable)
    .values(data)
    .onConflictDoNothing()
    .returning();

  return created;
}

/**
 * Stale audit detection — per-lead latest row strategy.
 *
 * For every lead that has at least one lead_audits row, find the row with
 * the highest created_at (= their most recent audit). Return only leads
 * where that latest row was produced by an older engine version.
 *
 * Returns a joined result that includes everything the re-audit script needs:
 * lead_audits columns + lead.email + audit.tools_json + audit.results_json
 *
 * @param currentEngineVersion - The AUDIT_ENGINE_VERSION constant
 */
export async function getLatestLeadAuditPerLead(currentEngineVersion: string) {
  const db = getDb();

  // Subquery: for each lead_id, the timestamp of their most recent lead_audits row
  const latestPerLead = db
    .select({
      lead_id: leadAuditsTable.lead_id,
      max_created_at: sql<Date>`MAX(${leadAuditsTable.created_at})`.as('max_created_at'),
    })
    .from(leadAuditsTable)
    .groupBy(leadAuditsTable.lead_id)
    .as('latest_per_lead');

  // Main query: join to get full row, then join audits + leads for email and JSON
  const rows = await db
    .select({
      // lead_audits columns
      leadAuditId: leadAuditsTable.id,
      leadId: leadAuditsTable.lead_id,
      oldAuditId: leadAuditsTable.audit_id,
      engineVersion: leadAuditsTable.engine_version,
      // lead email (for notification)
      email: leadsTable.email,
      // audit data needed for re-run and comparison
      toolsJson: auditsTable.tools_json,
      oldResultsJson: auditsTable.results_json,
    })
    .from(leadAuditsTable)
    .innerJoin(
      latestPerLead,
      and(
        eq(leadAuditsTable.lead_id, latestPerLead.lead_id),
        eq(leadAuditsTable.created_at, latestPerLead.max_created_at),
      ),
    )
    .innerJoin(leadsTable, eq(leadAuditsTable.lead_id, leadsTable.id))
    .innerJoin(auditsTable, eq(leadAuditsTable.audit_id, auditsTable.id))
    .where(ne(leadAuditsTable.engine_version, currentEngineVersion));

  return rows;
}

/**
 * Mark a lead_audits row as stale.
 * Called after a newer version's row has been successfully inserted.
 *
 * @param leadAuditId - UUID of the lead_audits row to mark stale
 */
export async function markLeadAuditStale(leadAuditId: string): Promise<void> {
  const db = getDb();

  await db
    .update(leadAuditsTable)
    .set({ is_stale: true })
    .where(eq(leadAuditsTable.id, leadAuditId));
}

/**
 * Insert a reaudit_notifications row for dedup tracking.
 * Uses onConflictDoNothing — the unique index (lead_id, engine_version) ensures
 * we never create duplicate notification records even if the script runs twice.
 *
 * @param leadId - UUID of the lead to notify
 * @param engineVersion - The new engine version that triggered the change
 * @returns The inserted row, or undefined if already exists
 */
export async function createReauditNotification(
  leadId: string,
  engineVersion: string,
): Promise<void> {
  const db = getDb();

  const newNotification: NewReauditNotification = {
    lead_id: leadId,
    engine_version: engineVersion,
    status: 'pending',
  };

  await db
    .insert(reauditNotificationsTable)
    .values(newNotification)
    .onConflictDoNothing();
}

/**
 * Update the status of a reaudit_notifications row after email dispatch.
 *
 * @param leadId - UUID of the lead
 * @param engineVersion - The engine version that triggered the notification
 * @param status - 'sent' | 'failed'
 */
export async function updateNotificationStatus(
  leadId: string,
  engineVersion: string,
  status: 'sent' | 'failed',
): Promise<void> {
  const db = getDb();

  await db
    .update(reauditNotificationsTable)
    .set({
      status,
      sent_at: status === 'sent' ? new Date() : null,
    })
    .where(
      and(
        eq(reauditNotificationsTable.lead_id, leadId),
        eq(reauditNotificationsTable.engine_version, engineVersion),
      ),
    );
}

