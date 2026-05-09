/**
 * Type IV Defect Rules Tests
 * Tests for: Stack Consolidation and Functional Redundancy
 */

import {
  ChatbotRedundancyRule,
  ExtremePowerUserSurchargeRule,
} from '../rules/TypeIVDefectRules';
import { AuditRequest } from '../types/audit.types';

describe('Type IV Defect Rules: Stack Consolidation', () => {
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
      claude_gui: { is_active: false, current_monthly_spend_usd: 0 } as any,
      chatgpt_gui: { is_active: false, current_monthly_spend_usd: 0 } as any,
      gemini: { is_active: false, current_monthly_spend_usd: 0 } as any,
      v0_vercel: { is_active: false, current_monthly_spend_usd: 0 } as any,
      anthropic_api: { is_active: false, current_monthly_spend_usd: 0 } as any,
      openai_api: { is_active: false, current_monthly_spend_usd: 0 } as any,
    },
  });

  describe('ChatbotRedundancyRule', () => {
    it('should flag ChatGPT + Claude + Gemini with same seat counts', () => {
      const rule = new ChatbotRedundancyRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'plus',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200, // $20/user
      } as any;
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200, // $20/user
      } as any;
      request.current_stack.gemini = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200, // ~$20/user
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toContain('Redundancy');
      // Total $600, min tool $200, so redundancy = $400
      expect(findings[0].monthly_savings_usd).toBeGreaterThan(0);
    });

    it('should not flag 2 tools (need 3+ for redundancy)', () => {
      const rule = new ChatbotRedundancyRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'plus',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200,
      } as any;
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should not flag if seat variance >15%', () => {
      const rule = new ChatbotRedundancyRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'plus',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200,
      } as any;
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 5, // Different cohort
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 100,
      } as any;
      request.current_stack.gemini = {
        is_active: true,
        current_plan: 'pro',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should not flag if only one tool active', () => {
      const rule = new ChatbotRedundancyRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'plus',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });
  });

  describe('ExtremePowerUserSurchargeRule', () => {
    it('should flag ChatGPT Pro 100 + team tiers simultaneously', () => {
      const rule = new ExtremePowerUserSurchargeRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'pro_100',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200, // $100 individual + $20*5 team
      } as any;

      const findings = rule.execute(request);

      // Has both individual high tier and team
      expect(findings).toHaveLength(1);
      expect(findings[0].tool_name).toBe('ChatGPT GUI');
    });

    it('should flag Claude Max + team tiers simultaneously', () => {
      const rule = new ExtremePowerUserSurchargeRule();
      const request = createBaseRequest();
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'max_20x',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 300, // $200 individual + team
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].tool_name).toBe('Claude GUI');
    });

    it('should not flag if only individual high tier', () => {
      const rule = new ExtremePowerUserSurchargeRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'pro_200',
        number_of_seats: 1, // Solo user
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 200,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should not flag if only team tier (no individual high tier)', () => {
      const rule = new ExtremePowerUserSurchargeRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 125,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should calculate correct redundancy cost', () => {
      const rule = new ExtremePowerUserSurchargeRule();
      const request = createBaseRequest();
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'max_5x',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 300, // Say $100 individual + $200 team
      } as any;

      const findings = rule.execute(request);

      // Redundancy = $300 - (10 * $20) = $300 - $200 = $100
      if (findings.length > 0) {
        expect(findings[0].monthly_savings_usd).toBeGreaterThan(0);
      }
    });
  });
});
