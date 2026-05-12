import React from 'react';
import { notFound } from 'next/navigation';
import { getAuditById } from '@/lib/db/queries';
import { AuditDashboard } from '@/features/audit/components/AuditDashboard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { AuditResult } from '@/features/audit/types/audit.types';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const auditRecord = await getAuditById(params.id).catch(() => null);
  if (!auditRecord || !auditRecord.is_shared) return { title: 'Audit Not Found' };

  const auditResult = auditRecord.results_json as unknown as AuditResult;
  const savings = auditResult?.total_annual_savings_usd || 0;
  
  return {
    title: `AI Spend Audit — $${savings} in potential savings`,
    description: "I just audited my team's AI spend and found massive savings. Check it out.",
    openGraph: {
      title: "I'm overspending on AI. Check your stack here.",
      description: `Potential savings: $${savings}/year. Audit your AI tools for free.`,
    },
  };
}

export default async function PublicSharePage({ params }: { params: { id: string } }) {
  try {
    const auditRecord = await getAuditById(params.id);
    if (!auditRecord || !auditRecord.is_shared) return notFound();

    const auditResult = auditRecord.results_json as unknown as AuditResult;

    const results = {
      total_annual_savings_usd: auditResult.total_annual_savings_usd ?? 0,
      total_monthly_savings_usd: auditResult.total_monthly_savings_usd ?? 0,
      findings: auditResult.findings ?? [],
      ai_summary: auditRecord.summary || 'Summary unavailable.',
    };

    return (
      <main className="min-h-screen bg-[#f8fafc] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-deep-navy">Shared Audit Report</h1>
            <Link href="/">
              <Button variant="outline" className="text-brand-DEFAULT border-brand-DEFAULT">
                Run Your Own Audit
              </Button>
            </Link>
          </header>
          
          <AuditDashboard results={results} />
          
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-deep-navy mb-4">Stop overpaying for AI</h2>
            <Link href="/">
              <Button size="lg" className="bg-brand-DEFAULT hover:bg-brand-dark text-white px-8">
                Start Free Audit
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error(error);
    return notFound();
  }
}
