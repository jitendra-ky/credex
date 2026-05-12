/**
 * Type I Defect Rules Tests
 * Tests for: Over-provisioning and Seat Minimum Violations
 */

import {
  ClaudeTeamMinimumRule,
  ChatGPTBusinessMinimumRule,
  AnnualBillingArbitrageRule,
} from '../rules/TypeIDefectRules';
import { AuditRequest } from '../types/audit.types';

describe('Type I Defect Rules: Over-Provisioning', () => {
  // Helper to create minimal audit request
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

  describe('ClaudeTeamMinimumRule', () => {
    it('should flag Claude Team with <5 seats', () => {
      const rule = new ClaudeTeamMinimumRule();
      const request = createBaseRequest();
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'team_standard',
        number_of_seats: 3,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 75, // $25 * 3
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].tool_name).toBe('Claude GUI');
      expect(findings[0].monthly_savings_usd).toBeGreaterThan(0);
    });

    it('should not flag Claude Team with ≥5 seats', () => {
      const rule = new ClaudeTeamMinimumRule();
      const request = createBaseRequest();
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'team_standard',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 125, // $25 * 5
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should not flag if Claude not active', () => {
      const rule = new ClaudeTeamMinimumRule();
      const request = createBaseRequest();
      request.current_stack.claude_gui = {
        is_active: false,
        current_monthly_spend_usd: 0,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should recommend Pro downgrade when SAML not required', () => {
      const rule = new ClaudeTeamMinimumRule();
      const request = createBaseRequest();
      request.global_context.security_requirements.saml_sso_required = false;
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'team_standard',
        number_of_seats: 3,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 75,
      } as any;

      const findings = rule.execute(request);

      expect(findings[0].recommendation).toContain('Pro');
    });
  });

  describe('ChatGPTBusinessMinimumRule', () => {
    it('should flag ChatGPT Business with 1 seat', () => {
      const rule = new ChatGPTBusinessMinimumRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 1,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 25,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].monthly_savings_usd).toBe(25);
    });

    it('should not flag ChatGPT Business with ≥2 seats', () => {
      const rule = new ChatGPTBusinessMinimumRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 2,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 50,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });
  });

  describe('AnnualBillingArbitrageRule', () => {
    it('should flag monthly billing for Cursor Pro', () => {
      const rule = new AnnualBillingArbitrageRule();
      const request = createBaseRequest();
      request.current_stack.cursor = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 100,
      } as any;

      const findings = rule.execute(request);

      const cursorFinding = findings.find(f => f.tool_name.includes('Cursor'));
      expect(cursorFinding).toBeDefined();
      // 20% discount on $100/mo = ~$20/mo annual savings
      expect(cursorFinding!.monthly_savings_usd).toBeCloseTo(20, 0);
    });

    it('should not flag annual billing', () => {
      const rule = new AnnualBillingArbitrageRule();
      const request = createBaseRequest();
      request.current_stack.cursor = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 5,
        billing_cycle: 'annual',
        current_monthly_spend_usd: 100,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should flag multiple tools on monthly billing', () => {
      const rule = new AnnualBillingArbitrageRule();
      const request = createBaseRequest();
      request.current_stack.cursor = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 100,
      } as any;
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 100,
      } as any;

      const findings = rule.execute(request);

      expect(findings.length).toBeGreaterThanOrEqual(2);
    });
  });
});
