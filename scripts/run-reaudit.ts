/**
 * scripts/run-reaudit.ts
 *
 * Standalone re-audit script. Run by GitHub Actions when AUDIT_ENGINE_VERSION changes.
 * Usage: npx tsx scripts/run-reaudit.ts
 *
 * Required env vars:
 *   DATABASE_URL       — Postgres connection string
 *   RESEND_API_KEY     — Resend API key (if EMAIL_PROVIDER=resend)
 *   EMAIL_PROVIDER     — 'resend' | 'mock' (default: 'mock')
 *   NEXT_PUBLIC_BASE_URL — e.g. https://credex.rocks (used in email links)
 *
 * What it does:
 *   1. For each lead, finds their latest lead_audits row.
 *   2. If that row's engine_version differs from AUDIT_ENGINE_VERSION → stale.
 *   3. Re-runs AuditService.executeAudit(tools_json) with the new engine.
 *   4. If total_monthly_savings_usd or audit_tag changed:
 *      a. Creates a new auditsTable row.
 *      b. Creates a new lead_audits row (previous_audit_id = old).
 *      c. Marks the old lead_audits row is_stale = true.
 *      d. Creates a reaudit_notifications row (deduped, onConflictDoNothing).
 *   5. Sends one re-audit notification email per affected lead.
 *   6. Prints a summary.
 */

import 'dotenv/config';

// ── Relative imports (no @/ alias outside Next.js bundler) ───────────────────
import { AUDIT_ENGINE_VERSION } from '../src/features/audit/engine/version';
import { AuditService } from '../src/features/audit/services/AuditService';
import { EmailService } from '../src/features/leads/services/EmailService';
import {
  createAudit,
  getLatestLeadAuditPerLead,
  createLeadAudit,
  markLeadAuditStale,
  createReauditNotification,
  updateNotificationStatus,
} from '../src/lib/db/queries';
import type { AuditRequest, AuditResult } from '../src/features/audit/types/audit.types';

// ── Setup ─────────────────────────────────────────────────────────────────────

const auditService = new AuditService();
const emailService = new EmailService();

// ── Helpers ──────────────────────────────────────────────────────────────────

function hasResultChanged(oldResult: AuditResult, newResult: AuditResult): boolean {
  return (
    oldResult.total_monthly_savings_usd !== newResult.total_monthly_savings_usd ||
    oldResult.audit_tag !== newResult.audit_tag
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n[run-reaudit] Starting re-audit for engine version ${AUDIT_ENGINE_VERSION}`);

  // 1. Find all leads whose latest lead_audits row is on an older engine version
  const staleRows = await getLatestLeadAuditPerLead(AUDIT_ENGINE_VERSION);
  console.log(`[run-reaudit] Checked ${staleRows.length} leads with stale audits`);

  if (staleRows.length === 0) {
    console.log('[run-reaudit] Nothing to do. All leads are on the current engine version.');
    process.exit(0);
  }

  let changed = 0;
  let emailsSent = 0;

  for (const row of staleRows) {
    const toolsJson = row.toolsJson as unknown as AuditRequest;
    const oldResult = row.oldResultsJson as unknown as AuditResult;

    // 2. Re-run the audit with the new engine (pure in-memory)
    let newResult: AuditResult;
    try {
      newResult = await auditService.executeAudit(toolsJson);
    } catch (err) {
      console.error(`[run-reaudit] Failed to re-run audit for lead ${row.leadId}:`, err);
      continue;
    }

    // 3. Compare — skip if no meaningful change
    if (!hasResultChanged(oldResult, newResult)) {
      console.log(`[run-reaudit] No change for lead ${row.leadId} — skipping`);
      continue;
    }

    changed++;
    console.log(`[run-reaudit] Change detected for lead ${row.leadId}`);

    // 4a. Persist the new audit result
    let newAudit;
    try {
      newAudit = await createAudit(toolsJson, newResult);
    } catch (err) {
      console.error(`[run-reaudit] Failed to create new audit for lead ${row.leadId}:`, err);
      continue;
    }

    // 4b. Create new lead_audits row linking this lead to the new audit
    try {
      await createLeadAudit({
        lead_id: row.leadId,
        audit_id: newAudit.id,
        previous_audit_id: row.oldAuditId,   // ← enables diff view
        engine_version: AUDIT_ENGINE_VERSION,
        is_stale: false,
      });
    } catch (err) {
      console.error(`[run-reaudit] Failed to create lead_audits row for lead ${row.leadId}:`, err);
      continue;
    }

    // 4c. Mark the old lead_audits row as stale
    try {
      await markLeadAuditStale(row.leadAuditId);
    } catch (err) {
      console.error(`[run-reaudit] Failed to mark stale for lead_audit ${row.leadAuditId}:`, err);
      // Non-fatal — continue to notification
    }

    // 4d. Create a deduped notification record (onConflictDoNothing)
    try {
      await createReauditNotification(row.leadId, AUDIT_ENGINE_VERSION);
    } catch (err) {
      console.error(`[run-reaudit] Failed to create notification for lead ${row.leadId}:`, err);
      continue;
    }

    // 5. Send the re-audit email
    const savingsDelta =
      newResult.total_monthly_savings_usd - oldResult.total_monthly_savings_usd;

    try {
      await emailService.sendReauditNotification(
        row.email,
        savingsDelta,
        newResult.audit_tag,
        row.oldAuditId,  // ← re-run link uses old audit ID for diff view
      );
      await updateNotificationStatus(row.leadId, AUDIT_ENGINE_VERSION, 'sent');
      emailsSent++;
      console.log(`[run-reaudit] Email sent to ${row.email}`);
    } catch (err) {
      console.error(`[run-reaudit] Failed to send email to ${row.email}:`, err);
      await updateNotificationStatus(row.leadId, AUDIT_ENGINE_VERSION, 'failed');
    }
  }

  console.log(
    `\n[run-reaudit] Done.\n` +
    `  Leads checked : ${staleRows.length}\n` +
    `  Result changed: ${changed}\n` +
    `  Emails sent   : ${emailsSent}\n`,
  );
}

main().catch((err) => {
  console.error('[run-reaudit] Fatal error:', err);
  process.exit(1);
});
