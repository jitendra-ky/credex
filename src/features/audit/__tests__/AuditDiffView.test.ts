/**
 * AuditDiffView Unit Tests
 *
 * Tests the pure diff utility functions in diffUtils.ts.
 * No DOM/React — runs in the Node environment provided by Jest.
 *
 * Coverage targets:
 *  - computeAuditDiff: all four DiffRowStatus states
 *  - formatUSD / formatDelta helpers
 *  - Edge cases: empty findings, identical findings, delta signs
 */

import {
  computeAuditDiff,
  formatUSD,
  formatDelta,
  type DiffRow,
} from '../utils/diffUtils';
import type { AuditResult, AuditFinding } from '../types/audit.types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function makeFinding(overrides: Partial<AuditFinding> = {}): AuditFinding {
  return {
    id: 'f1',
    tool_name: 'Cursor',
    rule_id: 'RULE_1_1',
    severity: 'warning',
    title: 'Switch to annual billing',
    description: 'You can save 20% by switching.',
    recommendation: 'Switch to annual billing to save $240/yr.',
    monthly_savings_usd: 20,
    annual_savings_usd: 240,
    ...overrides,
  };
}

function makeResult(
  findings: AuditFinding[],
  overrides: Partial<AuditResult> = {},
): AuditResult {
  const monthly = findings.reduce((s, f) => s + f.monthly_savings_usd, 0);
  const annual = findings.reduce((s, f) => s + f.annual_savings_usd, 0);
  return {
    audit_id: 'audit-uuid',
    findings,
    total_monthly_savings_usd: monthly,
    total_annual_savings_usd: annual,
    audit_tag: annual > 500 ? 'high-savings' : annual > 0 ? 'medium' : 'optimal',
    ai_summary: 'You can save money.',
    created_at: new Date('2026-01-01'),
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// computeAuditDiff
// ─────────────────────────────────────────────

describe('computeAuditDiff', () => {
  it('returns "unchanged" when both results are identical', () => {
    const finding = makeFinding();
    const old = makeResult([finding]);
    const neu = makeResult([finding]);

    const diff = computeAuditDiff(old, neu, '1.0.0', '1.0.0');

    expect(diff.rows).toHaveLength(1);
    expect(diff.rows[0].status).toBe('unchanged');
    expect(diff.rows[0].annualDelta).toBe(0);
    expect(diff.totalAnnualDelta).toBe(0);
    expect(diff.totalMonthlyDelta).toBe(0);
  });

  it('returns "changed" when annual savings differs', () => {
    const oldFinding = makeFinding({ annual_savings_usd: 240, monthly_savings_usd: 20 });
    const newFinding = makeFinding({ annual_savings_usd: 360, monthly_savings_usd: 30 });

    const old = makeResult([oldFinding]);
    const neu = makeResult([newFinding]);

    const diff = computeAuditDiff(old, neu, '1.0.0', '1.1.0');

    expect(diff.rows).toHaveLength(1);
    expect(diff.rows[0].status).toBe('changed');
    expect(diff.rows[0].annualDelta).toBe(120); // 360 - 240
    expect(diff.totalAnnualDelta).toBe(120);
  });

  it('returns "changed" when only recommendation text differs', () => {
    const oldFinding = makeFinding({
      recommendation: 'Switch to annual.',
      annual_savings_usd: 240,
      monthly_savings_usd: 20,
    });
    const newFinding = makeFinding({
      recommendation: 'Switch to Pro annual billing.',
      annual_savings_usd: 240,
      monthly_savings_usd: 20,
    });

    const diff = computeAuditDiff(
      makeResult([oldFinding]),
      makeResult([newFinding]),
      '1.0.0',
      '1.1.0',
    );

    expect(diff.rows[0].status).toBe('changed');
    // Savings didn't change, so annualDelta is 0
    expect(diff.rows[0].annualDelta).toBe(0);
  });

  it('returns "new" for findings that only exist in the new result', () => {
    const oldResult = makeResult([]);
    const newFinding = makeFinding({ tool_name: 'Claude GUI' });
    const newResult = makeResult([newFinding]);

    const diff = computeAuditDiff(oldResult, newResult, '1.0.0', '1.1.0');

    expect(diff.rows).toHaveLength(1);
    expect(diff.rows[0].status).toBe('new');
    expect(diff.rows[0].oldFinding).toBeNull();
    expect(diff.rows[0].newFinding).toEqual(newFinding);
    // annualDelta is null for new/removed rows (no pair to compare)
    expect(diff.rows[0].annualDelta).toBeNull();
  });

  it('returns "removed" for findings that only exist in the old result', () => {
    const oldFinding = makeFinding({ tool_name: 'GitHub Copilot' });
    const oldResult = makeResult([oldFinding]);
    const newResult = makeResult([]);

    const diff = computeAuditDiff(oldResult, newResult, '1.0.0', '1.1.0');

    expect(diff.rows).toHaveLength(1);
    expect(diff.rows[0].status).toBe('removed');
    expect(diff.rows[0].newFinding).toBeNull();
    expect(diff.rows[0].oldFinding).toEqual(oldFinding);
    expect(diff.rows[0].annualDelta).toBeNull();
  });

  it('handles multiple tools with mixed statuses', () => {
    const cursorOld = makeFinding({ tool_name: 'Cursor', annual_savings_usd: 240 });
    const cursorNew = makeFinding({ tool_name: 'Cursor', annual_savings_usd: 480 }); // changed
    const claudeOld = makeFinding({ tool_name: 'Claude', annual_savings_usd: 120 });
    const claudeNew = makeFinding({ tool_name: 'Claude', annual_savings_usd: 120 }); // unchanged
    const copilotOld = makeFinding({ tool_name: 'GitHub Copilot', annual_savings_usd: 60 }); // removed
    const geminiNew = makeFinding({ tool_name: 'Gemini', annual_savings_usd: 300 }); // new

    const oldResult = makeResult([cursorOld, claudeOld, copilotOld]);
    const newResult = makeResult([cursorNew, claudeNew, geminiNew]);

    const diff = computeAuditDiff(oldResult, newResult, '1.0.0', '1.1.0');

    expect(diff.rows).toHaveLength(4);

    const cursorRow = diff.rows.find((r: DiffRow) => r.toolName === 'Cursor')!;
    expect(cursorRow.status).toBe('changed');
    expect(cursorRow.annualDelta).toBe(240);

    const claudeRow = diff.rows.find((r: DiffRow) => r.toolName === 'Claude')!;
    expect(claudeRow.status).toBe('unchanged');
    expect(claudeRow.annualDelta).toBe(0);

    const copilotRow = diff.rows.find((r: DiffRow) => r.toolName === 'GitHub Copilot')!;
    expect(copilotRow.status).toBe('removed');

    const geminiRow = diff.rows.find((r: DiffRow) => r.toolName === 'Gemini')!;
    expect(geminiRow.status).toBe('new');
  });

  it('computes correct totalAnnualDelta and totalMonthlyDelta', () => {
    const oldResult = makeResult([], {
      total_annual_savings_usd: 1200,
      total_monthly_savings_usd: 100,
    });
    const newResult = makeResult([], {
      total_annual_savings_usd: 1800,
      total_monthly_savings_usd: 150,
    });

    const diff = computeAuditDiff(oldResult, newResult, '1.0.0', '1.1.0');

    expect(diff.totalAnnualDelta).toBe(600);
    expect(diff.totalMonthlyDelta).toBe(50);
  });

  it('detects audit_tag change', () => {
    const oldResult = makeResult([], { audit_tag: 'medium', total_annual_savings_usd: 300 });
    const newResult = makeResult([], {
      audit_tag: 'high-savings',
      total_annual_savings_usd: 800,
    });

    const diff = computeAuditDiff(oldResult, newResult, '1.0.0', '1.1.0');

    expect(diff.tagChanged).toBe(true);
  });

  it('sets tagChanged=false when tag is the same', () => {
    const oldResult = makeResult([], { audit_tag: 'optimal', total_annual_savings_usd: 0 });
    const newResult = makeResult([], { audit_tag: 'optimal', total_annual_savings_usd: 0 });

    const diff = computeAuditDiff(oldResult, newResult, '1.0.0', '1.1.0');

    expect(diff.tagChanged).toBe(false);
  });

  it('handles empty findings on both sides', () => {
    const oldResult = makeResult([]);
    const newResult = makeResult([]);

    const diff = computeAuditDiff(oldResult, newResult, '1.0.0', '1.1.0');

    expect(diff.rows).toHaveLength(0);
    expect(diff.totalAnnualDelta).toBe(0);
  });

  it('matches tool names case-insensitively', () => {
    const oldFinding = makeFinding({ tool_name: 'cursor' });
    const newFinding = makeFinding({
      tool_name: 'Cursor',
      annual_savings_usd: 480,
      monthly_savings_usd: 40,
    });

    const diff = computeAuditDiff(
      makeResult([oldFinding]),
      makeResult([newFinding]),
      '1.0.0',
      '1.1.0',
    );

    // Should match as the same tool (changed), not two separate rows
    expect(diff.rows).toHaveLength(1);
    expect(diff.rows[0].status).toBe('changed');
  });

  it('stores correct version strings in the diff', () => {
    const diff = computeAuditDiff(makeResult([]), makeResult([]), '1.0.0', '2.0.0');
    expect(diff.oldEngineVersion).toBe('1.0.0');
    expect(diff.newEngineVersion).toBe('2.0.0');
  });

  it('returns negative annualDelta when new savings is lower', () => {
    const oldFinding = makeFinding({ annual_savings_usd: 600, monthly_savings_usd: 50 });
    const newFinding = makeFinding({
      annual_savings_usd: 240,
      monthly_savings_usd: 20,
      recommendation: 'Different recommendation triggers changed status',
    });

    const diff = computeAuditDiff(
      makeResult([oldFinding]),
      makeResult([newFinding]),
      '1.0.0',
      '1.1.0',
    );

    expect(diff.rows[0].status).toBe('changed');
    expect(diff.rows[0].annualDelta).toBe(-360);
  });
});

// ─────────────────────────────────────────────
// formatUSD
// ─────────────────────────────────────────────

describe('formatUSD', () => {
  it('formats positive integer', () => {
    expect(formatUSD(1234)).toMatch(/\$1,234/);
  });

  it('formats zero', () => {
    expect(formatUSD(0)).toMatch(/\$0/);
  });

  it('rounds fractional amounts (no decimals)', () => {
    expect(formatUSD(99.9)).toMatch(/\$100/);
  });
});

// ─────────────────────────────────────────────
// formatDelta
// ─────────────────────────────────────────────

describe('formatDelta', () => {
  it('prefixes positive delta with +', () => {
    expect(formatDelta(600)).toMatch(/^\+\$600/);
  });

  it('prefixes negative delta with -', () => {
    expect(formatDelta(-240)).toMatch(/^-\$240/);
  });

  it('formats zero as +$0', () => {
    expect(formatDelta(0)).toMatch(/^\+\$0/);
  });
});
