/**
 * Audit Diff Utilities
 * Single Responsibility: Pure functions for computing the diff between two AuditResults.
 * No React/DOM imports — safe to unit-test in Node environment.
 */

import type { AuditFinding, AuditResult } from '../types/audit.types';

// ============================================================
// Types
// ============================================================

export type DiffRowStatus = 'changed' | 'new' | 'removed' | 'unchanged';

export interface DiffRow {
  /** Stable key for React rendering */
  key: string;
  status: DiffRowStatus;
  toolName: string;
  oldFinding: AuditFinding | null;
  newFinding: AuditFinding | null;
  /**
   * Annual savings delta (new - old). Positive = more savings, negative = less.
   * null when old or new finding is absent (new/removed rows).
   */
  annualDelta: number | null;
}

export interface AuditDiff {
  rows: DiffRow[];
  /** New total_annual_savings_usd - Old total_annual_savings_usd */
  totalAnnualDelta: number;
  /** New total_monthly_savings_usd - Old total_monthly_savings_usd */
  totalMonthlyDelta: number;
  oldEngineVersion: string;
  newEngineVersion: string;
  tagChanged: boolean;
}

// ============================================================
// Main diff function
// ============================================================

/**
 * Compute a structured diff between two AuditResults.
 *
 * Matching strategy: findings are matched by `tool_name` (case-insensitive).
 * IDs differ across audits so we cannot use them.
 *
 * @param oldResult  - The earlier audit result (stored in auditsTable)
 * @param newResult  - The newer audit result produced by the re-audit script
 * @param oldVersion - Engine version string for the old result (e.g. "1.0.0")
 * @param newVersion - Engine version string for the new result (e.g. "1.1.0")
 */
export function computeAuditDiff(
  oldResult: AuditResult,
  newResult: AuditResult,
  oldVersion: string,
  newVersion: string,
): AuditDiff {
  // Index old findings by normalised tool_name
  const oldByTool = new Map<string, AuditFinding>();
  for (const f of oldResult.findings) {
    oldByTool.set(normalise(f.tool_name), f);
  }

  // Index new findings by normalised tool_name
  const newByTool = new Map<string, AuditFinding>();
  for (const f of newResult.findings) {
    newByTool.set(normalise(f.tool_name), f);
  }

  // Union of all tool names, preserving order (old first, then new-only)
  const allTools = new Set<string>([
    ...Array.from(oldByTool.keys()),
    ...Array.from(newByTool.keys()),
  ]);

  const rows: DiffRow[] = [];

  for (const tool of allTools) {
    const oldF = oldByTool.get(tool) ?? null;
    const newF = newByTool.get(tool) ?? null;

    const status = classifyStatus(oldF, newF);
    const annualDelta =
      oldF !== null && newF !== null
        ? newF.annual_savings_usd - oldF.annual_savings_usd
        : null;

    rows.push({
      key: tool,
      status,
      toolName: (newF ?? oldF)!.tool_name,
      oldFinding: oldF,
      newFinding: newF,
      annualDelta,
    });
  }

  return {
    rows,
    totalAnnualDelta:
      newResult.total_annual_savings_usd - oldResult.total_annual_savings_usd,
    totalMonthlyDelta:
      newResult.total_monthly_savings_usd - oldResult.total_monthly_savings_usd,
    oldEngineVersion: oldVersion,
    newEngineVersion: newVersion,
    tagChanged: oldResult.audit_tag !== newResult.audit_tag,
  };
}

// ============================================================
// Helpers
// ============================================================

function normalise(toolName: string): string {
  return toolName.toLowerCase().trim();
}

function classifyStatus(
  oldF: AuditFinding | null,
  newF: AuditFinding | null,
): DiffRowStatus {
  if (oldF === null) return 'new';
  if (newF === null) return 'removed';

  const savingsChanged =
    oldF.annual_savings_usd !== newF.annual_savings_usd ||
    oldF.monthly_savings_usd !== newF.monthly_savings_usd;
  const recChanged = oldF.recommendation !== newF.recommendation;
  const titleChanged = oldF.title !== newF.title;
  const severityChanged = oldF.severity !== newF.severity;

  return savingsChanged || recChanged || titleChanged || severityChanged
    ? 'changed'
    : 'unchanged';
}

// ============================================================
// Formatting helpers (safe to use in tests too)
// ============================================================

/** Format a USD amount: $1,234 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a delta with explicit sign: +$1,234 or -$567 */
export function formatDelta(delta: number): string {
  const abs = formatUSD(Math.abs(delta));
  return delta >= 0 ? `+${abs}` : `-${abs.replace('-', '')}`;
}
