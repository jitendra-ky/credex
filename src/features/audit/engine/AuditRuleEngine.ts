/**
 * Audit Rule Engine
 * Single Responsibility: Execute all rules and aggregate findings
 * Orchestrates rule evaluation in optimal order
 */

import { IAuditRule } from '../rules/BaseAuditRule';
import { AuditFinding, AuditRequest, AuditResult, AuditTag } from '../types/audit.types';

export class AuditRuleEngine {
  private rules: IAuditRule[];

  constructor(rules: IAuditRule[]) {
    this.rules = rules;
  }

  /**
   * Execute all rules against the audit request
   * Returns aggregated findings and calculates final audit tag
   */
  execute(request: AuditRequest): AuditResult {
    const findings: AuditFinding[] = [];

    // Execute each rule and collect findings
    for (const rule of this.rules) {
      try {
        const ruleFindings = rule.execute(request);
        findings.push(...ruleFindings);
      } catch (error) {
        // Log rule execution error but continue with other rules
        console.error(`Rule ${(rule as any).ruleId} execution failed:`, error);
      }
    }

    // Sort findings by severity and savings (highest impact first)
    findings.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.monthly_savings_usd - a.monthly_savings_usd;
    });

    // Calculate aggregates
    const totalMonthlySavings = findings.reduce((sum, f) => sum + f.monthly_savings_usd, 0);
    const totalAnnualSavings = findings.reduce((sum, f) => sum + f.annual_savings_usd, 0);

    // Determine audit tag based on total savings
    const auditTag = this.determineAuditTag(totalMonthlySavings);

    // Generate mock AI summary
    const aiSummary = this.generateMockSummary();

    return {
      audit_id: this.generateAuditId(),
      findings,
      total_monthly_savings_usd: Math.round(totalMonthlySavings * 100) / 100,
      total_annual_savings_usd: Math.round(totalAnnualSavings * 100) / 100,
      audit_tag: auditTag,
      ai_summary: aiSummary,
      created_at: new Date(),
    };
  }

  /**
   * Determine audit severity tag based on total savings potential
   */
  private determineAuditTag(monthlySavings: number): AuditTag {
    if (monthlySavings > 500) {
      return 'high-savings';
    }
    if (monthlySavings > 100) {
      return 'medium';
    }
    return 'optimal';
  }

  /**
   * Generate unique audit ID (UUID v4)
   */
  private generateAuditId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate mock AI summary (placeholder for future AI integration)
   * Currently returns the same mock summary for all audits
   */
  private generateMockSummary(): string {
    return 'Based on the comprehensive audit of your current AI tool stack, we identified significant optimization opportunities across multiple categories. The analysis reveals inefficiencies in your current plan selections and potential cost redundancies. By implementing the recommended changes, your organization can achieve substantial monthly savings while maintaining or improving security posture and feature coverage. The audit flagged critical areas where plan downgrades, consolidation, or alternative solutions could provide immediate relief without compromising productivity.';
  }
}
