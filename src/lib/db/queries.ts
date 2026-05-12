/**
 * Database Queries
 * Single Responsibility: Encapsulate all database operations
 * Follows Data Access Object (DAO) pattern
 */

import { getDb } from './client';
import { auditsTable, leadsTable, type NewAudit, type Audit, type NewLead, type Lead } from './schema';
import { eq, and, gte } from 'drizzle-orm';
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
