'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ArrowDownRight, DollarSign, Sparkles } from 'lucide-react';
import type { AuditFinding } from '@/features/audit/types/audit.types';

interface AuditDashboardProps {
  results: {
    total_annual_savings_usd: number;
    total_monthly_savings_usd: number;
    findings: AuditFinding[];
    ai_summary: string;
    audit_id?: string;
  };
}

export function AuditDashboard({ results }: AuditDashboardProps) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-muted-foreground uppercase tracking-wider">Potential Annual Savings</h2>
        <div className="text-6xl md:text-8xl font-extrabold text-brand-DEFAULT flex items-center justify-center">
          <DollarSign className="w-16 h-16 md:w-24 md:h-24" />
          {formatCurrency(results.total_annual_savings_usd).replace('$', '')}
        </div>
        <p className="text-xl text-deep-navy font-medium">
          That&apos;s {formatCurrency(results.total_monthly_savings_usd)} per month you could be keeping.
        </p>
      </div>

      <Card className="border-sky-blue/20 shadow-lg">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>Line-by-line analysis of your AI spend.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tool</th>
                  <th className="px-6 py-4 font-semibold">Severity</th>
                  <th className="px-6 py-4 font-semibold">Recommendation</th>
                  <th className="px-6 py-4 font-semibold text-brand-DEFAULT">Savings/yr</th>
                </tr>
              </thead>
              <tbody>
                {results.findings.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-deep-navy capitalize">{f.tool_name.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        f.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        f.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {f.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-deep-navy">{f.title}</span>
                        <span className="text-xs text-muted-foreground mt-1">{f.recommendation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      <span className="flex items-center">
                        {f.annual_savings_usd > 0 && <ArrowDownRight className="w-4 h-4 mr-1" />}
                        {formatCurrency(f.annual_savings_usd)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-deep-navy text-white border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-brand-DEFAULT rounded-full opacity-20 blur-3xl"></div>
        <CardHeader>
          <CardTitle className="flex items-center text-sky-blue">
            <Sparkles className="w-5 h-5 mr-2" /> Expert AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-slate-300">
            {results.ai_summary}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
