/**
 * scripts/backfill-lead-audits.ts
 *
 * One-time migration script.
 * Backfills the lead_audits table for leads that have leadsTable.audit_id set
 * but no corresponding row in leadAuditsTable.
 *
 * This is needed before deploying the code that removes leadsTable.audit_id usage,
 * so that existing lead→audit relationships are preserved in the new table.
 *
 * Usage: npx tsx scripts/backfill-lead-audits.ts
 *
 * Required env vars:
 *   DATABASE_URL — Postgres connection string
 *
 * Safe to run multiple times — uses onConflictDoNothing.
 */

import 'dotenv/config';

import { getDb } from '../src/lib/db/client';
import {
  leadsTable,
  leadAuditsTable,
} from '../src/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { AUDIT_ENGINE_VERSION } from '../src/features/audit/engine/version';

async function main() {
  const db = getDb();

  console.log('[backfill] Finding leads with audit_id but no leadAuditsTable row...');

  // Find all leads that have audit_id set
  const leadsWithAuditId = await db
    .select({
      id: leadsTable.id,
      audit_id: leadsTable.audit_id,
    })
    .from(leadsTable)
    .where(isNotNull(leadsTable.audit_id));

  console.log(`[backfill] Found ${leadsWithAuditId.length} leads with audit_id set`);

  let inserted = 0;
  let skipped = 0;

  for (const lead of leadsWithAuditId) {
    if (!lead.audit_id) continue; // TypeScript narrowing

    // Check if a lead_audits row already exists for this lead+audit combo
    const [existing] = await db
      .select({ id: leadAuditsTable.id })
      .from(leadAuditsTable)
      .where(
        and(
          eq(leadAuditsTable.lead_id, lead.id),
          eq(leadAuditsTable.audit_id, lead.audit_id),
        ),
      )
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    // Insert new lead_audits row
    try {
      await db
        .insert(leadAuditsTable)
        .values({
          lead_id: lead.id,
          audit_id: lead.audit_id,
          engine_version: AUDIT_ENGINE_VERSION,
          is_stale: false,
          previous_audit_id: null,
        })
        .onConflictDoNothing();

      inserted++;
      console.log(`[backfill] ✅ Created lead_audit for lead ${lead.id} → audit ${lead.audit_id}`);
    } catch (err) {
      console.error(`[backfill] ❌ Failed for lead ${lead.id}:`, err);
    }
  }

  console.log(
    `\n[backfill] Done.\n` +
    `  Total leads with audit_id: ${leadsWithAuditId.length}\n` +
    `  Inserted: ${inserted}\n` +
    `  Skipped (already existed): ${skipped}\n`,
  );
}

main().catch((err) => {
  console.error('[backfill] Fatal error:', err);
  process.exit(1);
});
