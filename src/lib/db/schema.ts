/**
 * Database Schema
 * Single Responsibility: Define all database table structures using Drizzle ORM
 * Follows TypeScript-first approach with type safety
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  boolean,
} from 'drizzle-orm/pg-core';

/**
 * Audit tag enum
 * Categories for audit severity/result classification
 */
export const auditTagEnum = pgEnum('audit_tag', [
  'high-savings',
  'medium',
  'optimal',
]);

/**
 * Audits Table
 * Stores all audit requests and their corresponding results
 * 
 * Columns:
 * - id: Unique identifier (UUID)
 * - tools_json: Serialized AuditRequest (input data)
 * - results_json: Serialized AuditResult (audit engine output)
 * - summary: AI-generated summary of audit findings
 * - tag: Categorization of audit result
 * - is_shared: Boolean flag indicating if audit is publicly accessible via its UUID
 * - shared_at: Timestamp when audit was made shareable
 * - created_at: Timestamp when audit was created
 * - updated_at: Timestamp of last modification
 */
export const auditsTable = pgTable(
  'audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tools_json: jsonb('tools_json').notNull(),
    results_json: jsonb('results_json').notNull(),
    summary: text('summary'),
    tag: auditTagEnum('tag').notNull(),

    is_shared: boolean('is_shared').default(false).notNull(),
    shared_at: timestamp('shared_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    isSharedIdx: index('audits_is_shared_idx').on(table.is_shared),
  }),
);

/**
 * Type definitions for table rows
 * Exported for use in API routes and services
 */
export type Audit = typeof auditsTable.$inferSelect;
export type NewAudit = typeof auditsTable.$inferInsert;

/**
 * Leads Table
 * Stores email capture form submissions from audit results page
 * Used for sales/marketing outreach and lead nurturing
 *
 * Columns:
 * - id: Unique identifier (UUID)
 * - audit_id: Foreign key to audits table (nullable; lead may not be tied to specific audit)
 * - email: User email address (unique constraint for upsert logic)
 * - company_name: Organization name (optional, user-provided)
 * - role: Job title or role (optional, user-provided)
 * - ip_address: Client IP for rate limiting and abuse detection
 * - created_at: Timestamp when lead was first captured
 * - updated_at: Timestamp of last update (for upsert tracking)
 */
export const leadsTable = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    audit_id: uuid('audit_id'),
    email: text('email').notNull(),
    company_name: text('company_name'),
    role: text('role'),
    ip_address: text('ip_address').notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex('leads_email_unique').on(table.email),
    auditIdIdx: index('leads_audit_id_idx').on(table.audit_id),
    createdAtIdx: index('leads_created_at_idx').on(table.created_at),
    ipAddressIdx: index('leads_ip_address_idx').on(table.ip_address),
  }),
);

/**
 * Type definitions for leads table
 * Exported for use in API routes and services
 */
export type Lead = typeof leadsTable.$inferSelect;
export type NewLead = typeof leadsTable.$inferInsert;
