'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Zap,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ShareAudit } from './ShareAudit';
import {
  computeAuditDiff,
  formatUSD,
  formatDelta,
  type DiffRow,
} from '../utils/diffUtils';
import type { AuditResult } from '../types/audit.types';

// ============================================================
// Types
// ============================================================

interface AuditDiffViewProps {
  oldResult: AuditResult;
  newResult: AuditResult;
  /** The old audit id — shown in the "old" column header */
  oldAuditId: string;
  /** The new audit id — used for "View full new report" CTA and share button */
  newAuditId: string;
  oldEngineVersion: string;
  newEngineVersion: string;
}

// ============================================================
// Row status styling config
// ============================================================

type StatusConfig = {
  border: string;
  bg: string;
  badge: string;
  badgeBg: string;
  icon: React.ReactNode;
  label: string;
};

function getStatusConfig(status: DiffRow['status']): StatusConfig {
  switch (status) {
    case 'changed':
      return {
        border: 'border-l-amber-400',
        bg: 'bg-amber-50/60',
        badge: 'text-amber-700',
        badgeBg: 'bg-amber-100',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        label: 'Changed',
      };
    case 'new':
      return {
        border: 'border-l-emerald-400',
        bg: 'bg-emerald-50/60',
        badge: 'text-emerald-700',
        badgeBg: 'bg-emerald-100',
        icon: <Plus className="w-3.5 h-3.5" />,
        label: 'New',
      };
    case 'removed':
      return {
        border: 'border-l-red-400',
        bg: 'bg-red-50/40',
        badge: 'text-red-600',
        badgeBg: 'bg-red-100',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        label: 'Removed',
      };
    case 'unchanged':
      return {
        border: 'border-l-slate-200',
        bg: 'bg-slate-50/40',
        badge: 'text-slate-400',
        badgeBg: 'bg-slate-100',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: 'Unchanged',
      };
  }
}

// ============================================================
// Sub-components
// ============================================================

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta === 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
        <Minus className="w-3 h-3" /> No change
      </span>
    );

  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold ${
        positive ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {positive ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {formatDelta(delta)}/yr
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === 'critical'
      ? 'bg-red-100 text-red-700'
      : severity === 'warning'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-blue-100 text-blue-700';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {severity}
    </span>
  );
}

function DiffTableRow({ row }: { row: DiffRow }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getStatusConfig(row.status);
  const isUnchanged = row.status === 'unchanged';
  const isRemoved = row.status === 'removed';

  return (
    <tr
      className={`border-b last:border-0 transition-colors border-l-4 ${cfg.border} ${
        isUnchanged && !expanded ? 'opacity-50' : ''
      } ${cfg.bg}`}
    >
      {/* Tool name + status badge */}
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col gap-1.5">
          <span
            className={`font-semibold text-sm capitalize ${isRemoved ? 'line-through text-slate-400' : 'text-deep-navy'}`}
          >
            {row.toolName.replace(/_/g, ' ')}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-fit ${cfg.badgeBg} ${cfg.badge}`}
          >
            {cfg.icon}
            {cfg.label}
          </span>
        </div>
      </td>

      {/* Old recommendation */}
      <td className="px-4 py-3 align-top text-sm">
        {row.oldFinding ? (
          <div className="flex flex-col gap-1">
            <span
              className={`font-medium ${isRemoved ? 'text-slate-400' : 'text-deep-navy'}`}
            >
              {row.oldFinding.title}
            </span>
            <span className="text-xs text-muted-foreground leading-snug">
              {row.oldFinding.recommendation}
            </span>
            {row.oldFinding.severity && (
              <SeverityBadge severity={row.oldFinding.severity} />
            )}
          </div>
        ) : (
          <span className="text-slate-300 italic text-xs">No finding</span>
        )}
      </td>

      {/* New recommendation */}
      <td className="px-4 py-3 align-top text-sm">
        {row.newFinding ? (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-deep-navy">
              {row.newFinding.title}
            </span>
            <span className="text-xs text-muted-foreground leading-snug">
              {row.newFinding.recommendation}
            </span>
            {row.newFinding.severity && (
              <SeverityBadge severity={row.newFinding.severity} />
            )}
          </div>
        ) : (
          <span className="text-slate-300 italic text-xs">Removed</span>
        )}
      </td>

      {/* Old savings */}
      <td className="px-4 py-3 align-top text-sm font-medium text-right">
        {row.oldFinding ? (
          <span
            className={
              isRemoved ? 'line-through text-slate-400' : 'text-slate-600'
            }
          >
            {formatUSD(row.oldFinding.annual_savings_usd)}/yr
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      {/* New savings */}
      <td className="px-4 py-3 align-top text-sm font-bold text-right">
        {row.newFinding ? (
          <span className="text-emerald-600">
            {formatUSD(row.newFinding.annual_savings_usd)}/yr
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      {/* Delta */}
      <td className="px-4 py-3 align-top text-right">
        {isUnchanged ? (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 ml-auto transition-colors"
            aria-label={expanded ? 'Collapse row' : 'Expand row'}
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <DeltaBadge delta={row.annualDelta} />
        )}
      </td>
    </tr>
  );
}

// ============================================================
// Summary card component
// ============================================================

function SummaryCard({
  label,
  oldVal,
  newVal,
  isCurrency,
}: {
  label: string;
  oldVal: string | number;
  newVal: string | number;
  isCurrency?: boolean;
}) {
  const fmtOld =
    isCurrency && typeof oldVal === 'number' ? formatUSD(oldVal) : String(oldVal);
  const fmtNew =
    isCurrency && typeof newVal === 'number' ? formatUSD(newVal) : String(newVal);
  const changed = fmtOld !== fmtNew;

  return (
    <div
      className={`rounded-xl p-4 border ${changed ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-slate-50/60'}`}
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm line-through">{fmtOld}</span>
        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
        <span
          className={`text-base font-bold ${changed ? 'text-emerald-600' : 'text-deep-navy'}`}
        >
          {fmtNew}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function AuditDiffView({
  oldResult,
  newResult,
  oldAuditId,
  newAuditId,
  oldEngineVersion,
  newEngineVersion,
}: AuditDiffViewProps) {
  const diff = computeAuditDiff(
    oldResult,
    newResult,
    oldEngineVersion,
    newEngineVersion,
  );

  const changedCount = diff.rows.filter(
    (r) => r.status === 'changed' || r.status === 'new',
  ).length;
  const removedCount = diff.rows.filter((r) => r.status === 'removed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Header Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-deep-navy via-slate-800 to-deep-navy p-6 text-white shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-brand-DEFAULT rounded-full opacity-20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-brand-DEFAULT" />
              <span className="text-sm font-semibold text-sky-300 uppercase tracking-wider">
                Pricing Updated
              </span>
            </div>
            <h1 className="text-2xl font-bold">
              Here&apos;s What Changed in Your Audit
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Engine{' '}
              <span className="font-mono text-slate-400 line-through">
                v{oldEngineVersion}
              </span>{' '}
              <ArrowRight className="inline w-3.5 h-3.5 mx-1 text-slate-400" />
              <span className="font-mono text-brand-DEFAULT font-bold">
                v{newEngineVersion}
              </span>
            </p>
          </div>

          {/* Delta headline */}
          <div className="shrink-0 rounded-xl bg-white/10 border border-white/20 px-6 py-4 text-center backdrop-blur-sm">
            {diff.totalAnnualDelta === 0 ? (
              <>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  Savings
                </p>
                <p className="text-xl font-bold text-slate-300">Unchanged</p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                  {diff.totalAnnualDelta > 0 ? 'Additional Savings' : 'Change'}
                </p>
                <p
                  className={`text-3xl font-extrabold ${
                    diff.totalAnnualDelta > 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {formatDelta(diff.totalAnnualDelta)}
                </p>
                <p className="text-xs text-slate-400 mt-1">per year</p>
              </>
            )}
          </div>
        </div>

        {/* Change summary pills */}
        {(changedCount > 0 || removedCount > 0) && (
          <div className="relative flex flex-wrap gap-2 mt-4">
            {changedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" />
                {changedCount} finding{changedCount !== 1 ? 's' : ''} changed
              </span>
            )}
            {removedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/30">
                <Trash2 className="w-3 h-3" />
                {removedCount} finding{removedCount !== 1 ? 's' : ''} removed
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Summary Comparison Cards ── */}
      <div>
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Summary Comparison
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Monthly Savings"
            oldVal={oldResult.total_monthly_savings_usd}
            newVal={newResult.total_monthly_savings_usd}
            isCurrency
          />
          <SummaryCard
            label="Annual Savings"
            oldVal={oldResult.total_annual_savings_usd}
            newVal={newResult.total_annual_savings_usd}
            isCurrency
          />
          <SummaryCard
            label="Audit Rating"
            oldVal={oldResult.audit_tag}
            newVal={newResult.audit_tag}
          />
        </div>
      </div>

      {/* ── Per-Tool Diff Table ── */}
      <Card className="border-slate-200 shadow-md overflow-hidden">
        <CardHeader className="bg-slate-50 border-b px-6 py-4">
          <CardTitle className="text-base">
            Per-Tool Findings — Detailed Diff
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unchanged rows are collapsed by default. Click the chevron to
            expand them.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tool</th>
                  <th className="px-4 py-3 font-semibold">
                    Previous Recommendation
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Updated Recommendation
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Old Savings
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    New Savings
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Δ</th>
                </tr>
              </thead>
              <tbody>
                {diff.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-400 italic"
                    >
                      No findings in either audit.
                    </td>
                  </tr>
                ) : (
                  diff.rows.map((row) => (
                    <DiffTableRow key={row.key} row={row} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Updated AI Summary ── */}
      <Card className="bg-deep-navy text-white border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-brand-DEFAULT rounded-full opacity-20 blur-3xl pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center text-sky-blue">
            <Zap className="w-5 h-5 mr-2" /> Updated AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-slate-300">
            {newResult.ai_summary}
          </p>
        </CardContent>
      </Card>

      {/* ── CTA Bar ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 rounded-xl border border-slate-200 bg-slate-50/60">
        <div>
          <p className="font-semibold text-deep-navy text-sm">
            Ready to act on the updated findings?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            View your full updated report or share the new results.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <a
            href={`/audit/${newAuditId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-deep-navy text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Full New Report
          </a>
          <ShareAudit auditId={newAuditId} />
        </div>
      </div>

      {/* ── Old audit reference ── */}
      <p className="text-xs text-slate-400 text-center">
        Comparing audit{' '}
        <span className="font-mono">
          {oldAuditId.slice(0, 8)}...
        </span>{' '}
        (v{oldEngineVersion}) →{' '}
        <span className="font-mono">{newAuditId.slice(0, 8)}...</span> (v
        {newEngineVersion})
      </p>
    </div>
  );
}
