/**
 * Audit Rule Engine Tests
 * Tests for rule orchestration and result aggregation
 */

import { AuditRuleEngine } from '../engine/AuditRuleEngine';
import { BaseAuditRule } from '../rules/BaseAuditRule';
import { AuditFinding, AuditRequest } from '../types/audit.types';

describe('AuditRuleEngine', () => {
  // Mock rule for testing
  class MockRule extends BaseAuditRule {
    readonly ruleId = 'MOCK_RULE';
    constructor(private findings: AuditFinding[]) {
      super();
    }
    execute(): AuditFinding[] {
      return this.findings;
    }
  }

  const createBaseRequest = (): AuditRequest => ({
    global_context: {
      total_team_size: 10,
      primary_use_case: 'coding',
      security_requirements: {
        saml_sso_required: false,
        scim_automated_provisioning_required: false,
        strict_data_privacy_no_training_required: false,
      },
    },
    current_stack: {
      cursor: { is_active: false, current_monthly_spend_usd: 0 } as any,
      github_copilot: { is_active: false, current_monthly_spend_usd: 0 } as any,
      claude_gui: { is_active: false, current_monthly_spend_usd: 0 } as any,
      chatgpt_gui: { is_active: false, current_monthly_spend_usd: 0 } as any,
      gemini: { is_active: false, current_monthly_spend_usd: 0 } as any,
      v0_vercel: { is_active: false, current_monthly_spend_usd: 0 } as any,
      anthropic_api: { is_active: false, current_monthly_spend_usd: 0 } as any,
      openai_api: { is_active: false, current_monthly_spend_usd: 0 } as any,
    },
  });

  it('should execute all rules and aggregate findings', () => {
    const mockFinding1 = {
      id: '1',
      tool_name: 'Tool A',
      rule_id: 'RULE_1',
      severity: 'critical' as const,
      title: 'Issue 1',
      description: 'Description 1',
      recommendation: 'Recommendation 1',
      monthly_savings_usd: 500,
      annual_savings_usd: 6000,
    };

    const mockFinding2 = {
      id: '2',
      tool_name: 'Tool B',
      rule_id: 'RULE_2',
      severity: 'warning' as const,
      title: 'Issue 2',
      description: 'Description 2',
      recommendation: 'Recommendation 2',
      monthly_savings_usd: 100,
      annual_savings_usd: 1200,
    };

    const rule1 = new MockRule([mockFinding1]);
    const rule2 = new MockRule([mockFinding2]);
    const engine = new AuditRuleEngine([rule1, rule2]);

    const result = engine.execute(createBaseRequest());

    expect(result.findings.length).toBe(2);
    expect(result.total_monthly_savings_usd).toBe(600);
    expect(result.total_annual_savings_usd).toBe(7200);
  });

  it('should sort findings by severity then savings', () => {
    const warningLowSavings = {
      id: '1',
      tool_name: 'Tool A',
      rule_id: 'RULE_1',
      severity: 'warning' as const,
      title: 'Warning',
      description: 'Warning desc',
      recommendation: 'Rec',
      monthly_savings_usd: 50,
      annual_savings_usd: 600,
    };

    const criticalHighSavings = {
      id: '2',
      tool_name: 'Tool B',
      rule_id: 'RULE_2',
      severity: 'critical' as const,
      title: 'Critical',
      description: 'Critical desc',
      recommendation: 'Rec',
      monthly_savings_usd: 600,
      annual_savings_usd: 7200,
    };

    const rule1 = new MockRule([warningLowSavings]);
    const rule2 = new MockRule([criticalHighSavings]);
    const engine = new AuditRuleEngine([rule1, rule2]);

    const result = engine.execute(createBaseRequest());

    // Critical should come first
    expect(result.findings[0].severity).toBe('critical');
    expect(result.findings[1].severity).toBe('warning');
  });

  it('should tag "high-savings" when monthly savings >$500', () => {
    const mockFinding = {
      id: '1',
      tool_name: 'Tool A',
      rule_id: 'RULE_1',
      severity: 'critical' as const,
      title: 'Issue',
      description: 'Desc',
      recommendation: 'Rec',
      monthly_savings_usd: 501,
      annual_savings_usd: 6012,
    };

    const rule = new MockRule([mockFinding]);
    const engine = new AuditRuleEngine([rule]);

    const result = engine.execute(createBaseRequest());

    expect(result.audit_tag).toBe('high-savings');
  });

  it('should tag "medium" when monthly savings $100-$500', () => {
    const mockFinding = {
      id: '1',
      tool_name: 'Tool A',
      rule_id: 'RULE_1',
      severity: 'warning' as const,
      title: 'Issue',
      description: 'Desc',
      recommendation: 'Rec',
      monthly_savings_usd: 250,
      annual_savings_usd: 3000,
    };

    const rule = new MockRule([mockFinding]);
    const engine = new AuditRuleEngine([rule]);

    const result = engine.execute(createBaseRequest());

    expect(result.audit_tag).toBe('medium');
  });

  it('should tag "optimal" when monthly savings <$100', () => {
    const mockFinding = {
      id: '1',
      tool_name: 'Tool A',
      rule_id: 'RULE_1',
      severity: 'info' as const,
      title: 'Issue',
      description: 'Desc',
      recommendation: 'Rec',
      monthly_savings_usd: 50,
      annual_savings_usd: 600,
    };

    const rule = new MockRule([mockFinding]);
    const engine = new AuditRuleEngine([rule]);

    const result = engine.execute(createBaseRequest());

    expect(result.audit_tag).toBe('optimal');
  });

  it('should generate unique audit IDs', () => {
    const engine = new AuditRuleEngine([]);

    const result1 = engine.execute(createBaseRequest());
    const result2 = engine.execute(createBaseRequest());

    expect(result1.audit_id).not.toBe(result2.audit_id);
    // Check UUID format
    expect(result1.audit_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should handle rule execution errors gracefully', () => {
    class FailingRule extends BaseAuditRule {
      readonly ruleId = 'FAILING_RULE';
      execute(): AuditFinding[] {
        throw new Error('Rule execution failed');
      }
    }

    const mockFinding = {
      id: '1',
      tool_name: 'Tool A',
      rule_id: 'RULE_1',
      severity: 'info' as const,
      title: 'Issue',
      description: 'Desc',
      recommendation: 'Rec',
      monthly_savings_usd: 0,
      annual_savings_usd: 0,
    };

    const goodRule = new MockRule([mockFinding]);
    const failingRule = new FailingRule();
    const engine = new AuditRuleEngine([failingRule, goodRule]);

    // Should not throw, should continue with goodRule
    const result = engine.execute(createBaseRequest());

    expect(result.findings.length).toBe(1);
    expect(result.findings[0].rule_id).toBe('RULE_1');
  });

  it('should round aggregate savings to 2 decimal places', () => {
    const mockFinding = {
      id: '1',
      tool_name: 'Tool A',
      rule_id: 'RULE_1',
      severity: 'info' as const,
      title: 'Issue',
      description: 'Desc',
      recommendation: 'Rec',
      monthly_savings_usd: 123.456789,
      annual_savings_usd: 1481.481468,
    };

    const rule = new MockRule([mockFinding]);
    const engine = new AuditRuleEngine([rule]);

    const result = engine.execute(createBaseRequest());

    // Individual findings pass through as-is from rules
    expect(result.findings[0].monthly_savings_usd).toBe(123.456789);
    // Aggregated totals are rounded
    expect(result.total_monthly_savings_usd).toBe(123.46);
    expect(result.total_annual_savings_usd).toBe(1481.48);
  });

  it('should include created_at timestamp', () => {
    const engine = new AuditRuleEngine([]);
    const beforeExecution = new Date();

    const result = engine.execute(createBaseRequest());

    const afterExecution = new Date();

    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterExecution.getTime());
  });
});
