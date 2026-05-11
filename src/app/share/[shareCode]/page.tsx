'use client';

import { useEffect, useState } from 'react';
import { clientApi } from '@/lib/client/api';
import { Button, Card, Alert, Spinner, SectionTitle, PageHeader } from '@/components/ui';
import type { AuditResult } from '@/features/audit/types/audit.types';

interface SharePageProps {
  params: {
    shareCode: string;
  };
}

export default function SharePage({ params }: SharePageProps) {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedAudit = async () => {
      try {
        const data = await clientApi.getSharedAudit(params.shareCode);
        setAudit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit');
      } finally {
        setLoading(false);
      }
    };
    loadSharedAudit();
  }, [params.shareCode]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        </section>
      </main>
    );
  }

  if (error || !audit) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
          <PageHeader title="Audit not found" backLink="/" />
          <Alert type="error">
            This shared audit may have expired or the link is invalid.
          </Alert>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
        <PageHeader title="Shared audit" backLink="/" />

        {/* Savings Header */}
        <Card className="mb-12 bg-gradient-to-br from-sky-500/20 to-sky-500/5 border-sky-400/30">
          <div>
            <p className="text-sm font-medium text-sky-200">Annual savings found</p>
            <h2 className="mt-2 text-5xl font-bold text-white">
              ${audit.total_annual_savings_usd.toLocaleString()}
            </h2>
            <p className="mt-2 text-slate-300">
              Monthly: ${audit.total_monthly_savings_usd.toLocaleString()}
            </p>
          </div>
        </Card>

        {/* Findings Table */}
        <Card className="mb-12">
          <SectionTitle>Findings</SectionTitle>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Tool</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Recommendation</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">Annual savings</th>
                </tr>
              </thead>
              <tbody>
                {audit.findings.map((finding) => (
                  <tr key={finding.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white capitalize">{finding.tool_name}</p>
                        <p className="text-xs text-slate-500">{finding.rule_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300">{finding.recommendation}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-sky-400">
                      ${finding.annual_savings_usd.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Summary */}
        <Card className="mb-12">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Expert analysis</h3>
          <p className="mt-3 leading-7 text-slate-200">{audit.ai_summary}</p>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-sky-500/20 to-sky-500/5 border-sky-400/30 text-center">
          <SectionTitle>Want to audit your own stack?</SectionTitle>
          <p className="mt-2 text-slate-300 mb-4">Get your personalized savings report in 60 seconds.</p>
          <a
            href="/"
            className="inline-block rounded-full bg-sky-400 hover:bg-sky-300 px-6 py-3 text-sm font-semibold text-slate-950 transition"
          >
            Start free audit
          </a>
        </Card>
      </section>
    </main>
  );
}
