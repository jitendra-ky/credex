'use client';

import { useEffect, useState } from 'react';
import { clientApi } from '@/lib/client/api';
import { Button, Input, Card, Alert, Spinner, SectionTitle, PageHeader } from '@/components/ui';
import type { AuditResult } from '@/features/audit/types/audit.types';
import type { LeadRequest } from '@/features/leads/types';

interface ResultsPageProps {
  params: {
    id: string;
  };
}

export default function AuditResultsPage({ params }: ResultsPageProps) {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadRole, setLeadRole] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSuccess, setLeadSuccess] = useState(false);

  useEffect(() => {
    const loadAudit = async () => {
      try {
        const stored = localStorage.getItem(`audit_${params.id}`);
        if (stored) {
          setAudit(JSON.parse(stored));
          return;
        }
        setError('Audit not found');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit');
      } finally {
        setLoading(false);
      }
    };
    loadAudit();
  }, [params.id]);

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const code = await clientApi.generateShareCode(params.id);
      setShareCode(code);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate share code');
    } finally {
      setShareLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSubmitting(true);
    setLeadError(null);

    try {
      const leadData: LeadRequest = {
        email: leadEmail,
        company_name: leadCompany || null,
        role: leadRole || null,
        audit_id: params.id,
      };
      await clientApi.captureLead(leadData);
      setLeadSuccess(true);
      setLeadEmail('');
      setLeadCompany('');
      setLeadRole('');
      setTimeout(() => setLeadSuccess(false), 5000);
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setLeadSubmitting(false);
    }
  };

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
          <PageHeader title="Audit results" backLink="/audit" />
          <Alert type="error">{error || 'Audit not found'}</Alert>
        </section>
      </main>
    );
  }

  const shareUrl = shareCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareCode}` : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
        <PageHeader title="Audit results" backLink="/audit" />

        {/* Savings Header */}
        <Card className="mb-12 bg-gradient-to-br from-sky-500/20 to-sky-500/5 border-sky-400/30">
          <div>
            <p className="text-sm font-medium text-sky-200">Annual savings</p>
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

        {/* Share Section */}
        <Card className="mb-12">
          <SectionTitle>Share this audit</SectionTitle>
          <div className="mt-4">
            {shareUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">Share this link:</p>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly />
                  <Button
                    variant="secondary"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="flex-shrink-0"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleShare} disabled={shareLoading} variant="primary">
                {shareLoading ? (
                  <>
                    <Spinner /> Generating...
                  </>
                ) : (
                  'Generate share link'
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Lead Capture */}
        <Card>
          <SectionTitle>Want a consultation?</SectionTitle>
          <p className="mt-2 text-sm text-slate-300">
            Share your email to get a personalized savings report and recommendations.
          </p>

          <div className="mt-4">
            {leadSuccess ? (
              <Alert type="success">✓ Thanks! We'll be in touch soon.</Alert>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  label="Email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Company (optional)"
                  label="Company"
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Role (optional)"
                  label="Role"
                  value={leadRole}
                  onChange={(e) => setLeadRole(e.target.value)}
                />
                {leadError && <Alert type="error">{leadError}</Alert>}
                <Button
                  type="submit"
                  disabled={leadSubmitting}
                  variant="primary"
                  className="w-full py-2"
                >
                  {leadSubmitting ? (
                    <>
                      <Spinner /> Sending...
                    </>
                  ) : (
                    'Send my information'
                  )}
                </Button>
              </form>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
