import React from 'react';
import { notFound } from 'next/navigation';
import { getAuditById, getNewAuditByPreviousAuditId } from '@/lib/db/queries';
import { AuditDashboard } from '@/features/audit/components/AuditDashboard';
import { AuditDiffView } from '@/features/audit/components/AuditDiffView';
import { ShareAudit } from '@/features/audit/components/ShareAudit';
import { AuditResultsClient } from './client';
import type { AuditResult } from '@/features/audit/types/audit.types';
import { AUDIT_ENGINE_VERSION } from '@/features/audit/engine/version';

// ─────────────────────────────────────────────
// Page props — Next.js 14 App Router
// searchParams is provided by the framework for dynamic routes
// ─────────────────────────────────────────────
interface PageProps {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function AuditResultPage({
  params,
  searchParams,
}: PageProps) {
  try {
    const oldAuditRecord = await getAuditById(params.id);
    if (!oldAuditRecord) return notFound();

    const oldResult = oldAuditRecord.results_json as unknown as AuditResult;

    // ── Diff view branch ────────────────────────────────────
    // Activated when the user clicks the re-run link in the notification email:
    //   /audit/[old-audit-id]?rerun=true
    const isRerun = searchParams?.rerun === 'true';

    if (isRerun) {
      // Look for the lead_audits row whose previous_audit_id = this audit id.
      // That row was written by scripts/run-reaudit.ts and contains the new audit_id.
      const newLeadAudit = await getNewAuditByPreviousAuditId(params.id);

      if (!newLeadAudit) {
        // Re-audit hasn't run yet for this lead (engine version may not have been
        // bumped yet, or the script is still in progress).
        return (
          <main className="min-h-screen bg-[#f8fafc] py-12 px-4">
            <div className="max-w-7xl mx-auto">
              {/* Processing banner */}
              <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-6 flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-amber-800 text-base">
                    Pricing Update Being Processed
                  </h2>
                  <p className="text-amber-700 text-sm mt-1">
                    We&apos;re re-running your audit with the latest pricing
                    data. This usually takes a few minutes. Check back shortly
                    and the updated comparison will appear here automatically.
                  </p>
                </div>
              </div>

              {/* Show the original audit in the meantime */}
              <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-deep-navy">
                  Your Original Audit Results
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  Updated results will appear on this page once processing is
                  complete.
                </p>
              </header>

              <AuditDashboard
                results={{
                  audit_id: oldAuditRecord.id,
                  total_annual_savings_usd:
                    oldResult.total_annual_savings_usd ?? 0,
                  total_monthly_savings_usd:
                    oldResult.total_monthly_savings_usd ?? 0,
                  findings: oldResult.findings ?? [],
                  ai_summary:
                    oldAuditRecord.summary || 'Summary unavailable.',
                }}
              />
            </div>
          </main>
        );
      }

      // Fetch the new audit record
      const newAuditRecord = await getAuditById(newLeadAudit.audit_id);

      if (!newAuditRecord) {
        // Data integrity issue — new audit_id in lead_audits but no audits row.
        // Degrade gracefully.
        return notFound();
      }

      const newResult = newAuditRecord.results_json as unknown as AuditResult;

      // Derive engine versions:
      // - oldEngineVersion: stored in the lead_audits row that references this old audit
      //   We can read it from the new row's previous info, but we don't store the old
      //   version directly. Fall back to newLeadAudit.engine_version - 1 isn't reliable,
      //   so we use the constant for the new version and mark old as "previous".
      //   The new lead_audits row has engine_version = current version.
      const newEngineVersion = newLeadAudit.engine_version;
      // We don't store the old version in the new row, so we derive it from the
      // AUDIT_ENGINE_VERSION constant for display. For the true old version we'd need
      // to look up the old lead_audits row — keep it simple: label it "previous".
      const oldEngineVersion =
        newEngineVersion === AUDIT_ENGINE_VERSION ? 'previous' : newEngineVersion;

      return (
        <main className="min-h-screen bg-[#f8fafc] py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <AuditDiffView
              oldResult={oldResult}
              newResult={newResult}
              oldAuditId={params.id}
              newAuditId={newLeadAudit.audit_id}
              oldEngineVersion={oldEngineVersion}
              newEngineVersion={newEngineVersion}
            />
          </div>
        </main>
      );
    }

    // ── Standard audit view (unchanged from Round 1) ──────────
    const results = {
      audit_id: oldAuditRecord.id,
      total_annual_savings_usd: oldResult.total_annual_savings_usd ?? 0,
      total_monthly_savings_usd: oldResult.total_monthly_savings_usd ?? 0,
      findings: oldResult.findings ?? [],
      ai_summary: oldAuditRecord.summary || 'Summary unavailable.',
    };

    return (
      <main className="min-h-screen bg-[#f8fafc] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-3xl font-bold text-deep-navy">
              Your Audit Results
            </h1>
          </header>

          <AuditDashboard results={results} />
          <ShareAudit auditId={params.id} />

          {/* Lead modal — shown after delay, no email field on audit record */}
          <AuditResultsClient auditId={params.id} />
        </div>
      </main>
    );
  } catch (error) {
    console.error(error);
    return notFound();
  }
}
