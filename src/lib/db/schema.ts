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
 * - tag: Categorization of audit result
 * - created_at: Timestamp when audit was created
 * - updated_at: Timestamp of last modification
 */
export const auditsTable = pgTable('audits', {
  id: uuid('id').primaryKey().defaultRandom(),
  tools_json: jsonb('tools_json').notNull(),
  results_json: jsonb('results_json').notNull(),
  summary: text('summary'),
  tag: auditTagEnum('tag').notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Type definitions for table rows
 * Exported for use in API routes and services
 */
export type Audit = typeof auditsTable.$inferSelect;
export type NewAudit = typeof auditsTable.$inferInsert;
