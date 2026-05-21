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
  integer,
} from 'drizzle-orm/pg-core';

/**
 * Notification status enum
 * Tracks the delivery state of a re-audit notification email
 */
export const notificationStatusEnum = pgEnum('notification_status', [
  'pending',
  'sent',
  'failed',
]);

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

// ============================================================
// ROUND 2 — Re-audit on Pricing Change
// ============================================================

/**
 * Lead Audits Table
 * One-to-many relationship between leads and audits.
 * Solves the limitation that leadsTable.email is UNIQUE (one row per email),
 * which means a single lead can only reference one audit_id there.
 * This table tracks every audit ever run for a lead, across all engine versions.
 *
 * Columns:
 * - id: Unique identifier (UUID)
 * - lead_id: Reference to leadsTable.id (the owner of this audit)
 * - audit_id: Reference to auditsTable.id (this version's audit result)
 * - previous_audit_id: Reference to auditsTable.id of the prior version (for diff view; null on first audit)
 * - engine_version: The version string of the audit rule engine that produced this audit (e.g. "1.0.0")
 * - is_stale: True when a newer engine version exists and this audit has not been re-run yet
 * - created_at: Timestamp when this audit version was stored
 */
export const leadAuditsTable = pgTable(
  'lead_audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lead_id: uuid('lead_id').notNull(),
    audit_id: uuid('audit_id').notNull(),
    previous_audit_id: uuid('previous_audit_id'),
    engine_version: text('engine_version').notNull(),
    is_stale: boolean('is_stale').default(false).notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    leadIdIdx: index('lead_audits_lead_id_idx').on(table.lead_id),
    auditIdIdx: index('lead_audits_audit_id_idx').on(table.audit_id),
    isStaleIdx: index('lead_audits_is_stale_idx').on(table.is_stale),
    // One entry per lead per engine version — prevents duplicate rows on re-run
    leadVersionUnique: uniqueIndex('lead_audits_lead_version_unique').on(
      table.lead_id,
      table.engine_version,
    ),
  }),
);

/**
 * Type definitions for lead_audits table
 */
export type LeadAudit = typeof leadAuditsTable.$inferSelect;
export type NewLeadAudit = typeof leadAuditsTable.$inferInsert;

/**
 * Reaudit Notifications Table
 * Tracks which re-audit notification emails have been sent, to whom, and for which engine version.
 * Ensures one consolidated email per lead per engine version change (no spam).
 *
 * Columns:
 * - id: Unique identifier (UUID)
 * - lead_id: Reference to leadsTable.id (recipient)
 * - engine_version: The new engine version that triggered this notification
 * - status: Delivery state — pending / sent / failed
 * - sent_at: Timestamp when the email was successfully dispatched (null until sent)
 * - created_at: Timestamp when this notification record was created
 */
export const reauditNotificationsTable = pgTable(
  'reaudit_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lead_id: uuid('lead_id').notNull(),
    engine_version: text('engine_version').notNull(),
    status: notificationStatusEnum('status').default('pending').notNull(),
    sent_at: timestamp('sent_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    leadIdIdx: index('reaudit_notifications_lead_id_idx').on(table.lead_id),
    statusIdx: index('reaudit_notifications_status_idx').on(table.status),
    // One notification per lead per engine version — dedup guard
    leadVersionUnique: uniqueIndex('reaudit_notifications_lead_version_unique').on(
      table.lead_id,
      table.engine_version,
    ),
  }),
);

/**
 * Type definitions for reaudit_notifications table
 */
export type ReauditNotification = typeof reauditNotificationsTable.$inferSelect;
export type NewReauditNotification = typeof reauditNotificationsTable.$inferInsert;

// ============================================================
// LEAD CAPTURE — OTP Email Verification
// ============================================================

/**
 * Email Verifications Table
 * Stores short-lived OTP codes sent to users during lead capture.
 * One active row per email at a time — previous rows are deleted before a new
 * OTP is issued so there is never any ambiguity on verify.
 *
 * Columns:
 * - id:           Unique identifier (UUID)
 * - email:        The email address the OTP was sent to
 * - otp_code:     6-digit numeric OTP (stored as text)
 * - expires_at:   Timestamp when the OTP becomes invalid (created_at + 10 min)
 * - last_sent_at: Timestamp of the most recent send — enforces 5-min per-email cooldown
 * - attempts:     Number of wrong verification attempts (max 3 before lockout)
 * - verified_at:  Set when the user enters the correct code; null until then
 * - created_at:   Timestamp when this row was created
 */
export const emailVerificationsTable = pgTable(
  'email_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    otp_code: text('otp_code').notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    last_sent_at: timestamp('last_sent_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').default(0).notNull(),
    verified_at: timestamp('verified_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: index('email_verifications_email_idx').on(table.email),
    emailPendingIdx: index('email_verifications_email_pending_idx').on(
      table.email,
      table.verified_at,
    ),
  }),
);

/**
 * Type definitions for email_verifications table
 */
export type EmailVerification = typeof emailVerificationsTable.$inferSelect;
export type NewEmailVerification = typeof emailVerificationsTable.$inferInsert;
