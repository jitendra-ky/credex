/**
 * Base Rule Interface and Abstract Class
 * Single Responsibility: Define the contract for all audit rules
 * Follows Strategy Pattern for rule execution
 */

import { AuditFinding, AuditRequest } from '../types/audit.types';

export interface IAuditRule {
  /**
   * Unique identifier for the rule
   */
  readonly ruleId: string;

  /**
   * Execute the rule against the audit request
   * @returns array of findings, empty if no violations
   */
  execute(request: AuditRequest): AuditFinding[];
}

export abstract class BaseAuditRule implements IAuditRule {
  abstract readonly ruleId: string;

  protected generateFinding(
    toolName: string,
    title: string,
    description: string,
    recommendation: string,
    monthlySavings: number,
  ): AuditFinding {
    return {
      id: `${this.ruleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool_name: toolName,
      rule_id: this.ruleId,
      severity: monthlySavings > 500 ? 'critical' : monthlySavings > 100 ? 'warning' : 'info',
      title,
      description,
      recommendation,
      monthly_savings_usd: Math.round(monthlySavings * 100) / 100,
      annual_savings_usd: Math.round(monthlySavings * 12 * 100) / 100,
    };
  }

  abstract execute(request: AuditRequest): AuditFinding[];
}
