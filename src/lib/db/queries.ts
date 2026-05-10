/**
 * Database Queries
 * Single Responsibility: Encapsulate all database operations
 * Follows Data Access Object (DAO) pattern
 */

import { getDb } from './client';
import { auditsTable, type NewAudit, type Audit } from './schema';
import { eq } from 'drizzle-orm';
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
