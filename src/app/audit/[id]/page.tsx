import React from 'react';
import { notFound } from 'next/navigation';
import { getAuditById } from '@/lib/db/queries';
import { AuditDashboard } from '@/features/audit/components/AuditDashboard';
import { ShareAudit } from '@/features/audit/components/ShareAudit';
import { AuditResultsClient } from './client';
import type { AuditResult } from '@/features/audit/types/audit.types';

export default async function AuditResultPage({ params }: { params: { id: string } }) {
  try {
    const auditRecord = await getAuditById(params.id);
    if (!auditRecord) return notFound();

    // results_json is stored as jsonb — cast to the known shape
    const auditResult = auditRecord.results_json as unknown as AuditResult;

    const results = {
      audit_id: auditRecord.id,
      total_annual_savings_usd: auditResult.total_annual_savings_usd ?? 0,
      total_monthly_savings_usd: auditResult.total_monthly_savings_usd ?? 0,
      findings: auditResult.findings ?? [],
      ai_summary: auditRecord.summary || 'Summary unavailable.',
    };

    return (
      <main className="min-h-screen bg-[#f8fafc] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-3xl font-bold text-deep-navy">Your Audit Results</h1>
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
