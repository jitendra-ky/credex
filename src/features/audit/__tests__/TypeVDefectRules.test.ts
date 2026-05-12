/**
 * Type V Defect Rules Tests
 * Tests for: GitHub Copilot-Specific Overspend Patterns
 */

import {
  CopilotEnterpriseUpsellRule,
  IDEAIRedundancyRule,
  CopilotProPlusMultiSeatRule,
} from '../rules/TypeVDefectRules';
import { AuditRequest } from '../types/audit.types';

describe('Type V Defect Rules: GitHub Copilot Specific', () => {
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

  // ─── CopilotEnterpriseUpsellRule ───────────────────────────────────────────

  describe('CopilotEnterpriseUpsellRule', () => {
    it('should flag Enterprise when SCIM not required ($39 vs $19 = $20/seat savings)', () => {
      const rule = new CopilotEnterpriseUpsellRule();
      const request = createBaseRequest();
      request.current_stack.github_copilot = {
        is_active: true,
        current_plan: 'enterprise',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 390, // $39 * 10
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].tool_name).toBe('GitHub Copilot');
      // 10 seats * ($39 - $19) = $200/month savings
      expect(findings[0].monthly_savings_usd).toBe(200);
      expect(findings[0].recommendation).toContain('Business');
    });

    it('should NOT flag Enterprise when SCIM is required', () => {
      const rule = new CopilotEnterpriseUpsellRule();
      const request = createBaseRequest();
      request.global_context.security_requirements.scim_automated_provisioning_required = true;
      request.current_stack.github_copilot = {
        is_active: true,
        current_plan: 'enterprise',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 390,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should NOT flag when not on Enterprise plan', () => {
      const rule = new CopilotEnterpriseUpsellRule();
      const request = createBaseRequest();
      request.current_stack.github_copilot = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 190,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should NOT flag when Copilot is inactive', () => {
      const rule = new CopilotEnterpriseUpsellRule();
      const request = createBaseRequest();
      // github_copilot stays inactive from base

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });
  });

  // ─── IDEAIRedundancyRule ───────────────────────────────────────────────────

  describe('IDEAIRedundancyRule', () => {
    it('should flag Cursor + Copilot with similar seat counts', () => {
      const rule = new IDEAIRedundancyRule();
      const request = createBaseRequest();
      request.current_stack.cursor = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 400,
      } as any;
      request.current_stack.github_copilot = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 190,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toContain('Redundancy');
      // Cheaper tool (Copilot at $190) is the redundancy cost
      expect(findings[0].monthly_savings_usd).toBe(190);
    });

    it('should NOT flag when seat counts differ by >20%', () => {
      const rule = new IDEAIRedundancyRule();
      const request = createBaseRequest();
      request.current_stack.cursor = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 400,
      } as any;
      request.current_stack.github_copilot = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 3, // Very different cohort size
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 57,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should NOT flag when only one IDE tool is active', () => {
      const rule = new IDEAIRedundancyRule();
      const request = createBaseRequest();
      request.current_stack.cursor = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 100,
      } as any;
      // github_copilot stays inactive from base

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });
  });

  // ─── CopilotProPlusMultiSeatRule ───────────────────────────────────────────

  describe('CopilotProPlusMultiSeatRule', () => {
    it('should flag Pro+ plan with multiple seats ($39 vs $19 = $20/seat)', () => {
      const rule = new CopilotProPlusMultiSeatRule();
      const request = createBaseRequest();
      request.current_stack.github_copilot = {
        is_active: true,
        current_plan: 'pro_plus',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 195, // $39 * 5
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].tool_name).toBe('GitHub Copilot');
      // 5 seats * ($39 - $19) = $100/month savings
      expect(findings[0].monthly_savings_usd).toBe(100);
      expect(findings[0].recommendation).toContain('Business');
    });

    it('should NOT flag Pro+ plan with only 1 seat (legitimate power user)', () => {
      const rule = new CopilotProPlusMultiSeatRule();
      const request = createBaseRequest();
      request.current_stack.github_copilot = {
        is_active: true,
        current_plan: 'pro_plus',
        number_of_seats: 1,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 39,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should NOT flag Business plan (correct multi-seat option)', () => {
      const rule = new CopilotProPlusMultiSeatRule();
      const request = createBaseRequest();
      request.current_stack.github_copilot = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 190,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });
  });
});
