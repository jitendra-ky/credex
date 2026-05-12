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
  const monthlySavings = auditResult?.total_monthly_savings_usd || 0;
  const annualSavings = auditResult?.total_annual_savings_usd || 0;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://credex.rocks';

  const shareUrl = `${baseUrl}/share/${params.id}`;
  // Pass savings data as query params so the /api/og edge route
  // doesn't need a DB call (pg is incompatible with edge runtime).
  const ogImageUrl = `${baseUrl}/api/og?monthly=${monthlySavings}&annual=${annualSavings}`;

  const title = `I found $${annualSavings.toLocaleString()}/yr in AI savings — audit yours free`;
  const description = `This team could save $${monthlySavings.toLocaleString()}/mo ($${annualSavings.toLocaleString()}/yr) by optimising their AI tool stack. Run your own free audit on Credex.`;

  return {
    title,
    description,
    alternates: { canonical: shareUrl },
    openGraph: {
      type: 'article',
      url: shareUrl,
      title,
      description,
      siteName: 'Credex — AI Spend Audit',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `AI spend audit — $${annualSavings.toLocaleString()} in annual savings discovered`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
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
