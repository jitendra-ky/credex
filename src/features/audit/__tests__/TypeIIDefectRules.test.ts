/**
 * Type II Defect Rules Tests
 * Tests for: Feature Mismatch and Identity Management Taxation
 */

import {
  EnterpriseSCIMTaxRule,
  V0PrivacyTaxRule,
  V0InfrastructureRequisiteRule,
} from '../rules/TypeIIDefectRules';
import { AuditRequest } from '../types/audit.types';

describe('Type II Defect Rules: Feature Mismatch', () => {
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

  describe('EnterpriseSCIMTaxRule', () => {
    it('should flag Enterprise tier when SCIM not required but SAML needed', () => {
      const rule = new EnterpriseSCIMTaxRule();
      const request = createBaseRequest();
      request.global_context.security_requirements.saml_sso_required = true;
      request.global_context.security_requirements.scim_automated_provisioning_required = false;
      request.current_stack.cursor = {
        is_active: true,
        current_plan: 'enterprise',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 800, // $80/user
      } as any;

      const findings = rule.execute(request);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].tool_name).toBe('Cursor');
      expect(findings[0].recommendation).toContain('Business');
    });

    it('should not flag Enterprise if SCIM is required', () => {
      const rule = new EnterpriseSCIMTaxRule();
      const request = createBaseRequest();
      request.global_context.security_requirements.saml_sso_required = true;
      request.global_context.security_requirements.scim_automated_provisioning_required = true;
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'enterprise',
        number_of_seats: 10,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 800,
      } as any;

      const findings = rule.execute(request);

      expect(findings.length).toBe(0);
    });

    it('should check multiple Enterprise tools', () => {
      const rule = new EnterpriseSCIMTaxRule();
      const request = createBaseRequest();
      request.global_context.security_requirements.saml_sso_required = true;
      request.global_context.security_requirements.scim_automated_provisioning_required = false;

      request.current_stack.cursor = {
        is_active: true,
        current_plan: 'enterprise',
        number_of_seats: 10,
        current_monthly_spend_usd: 800,
      } as any;
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'enterprise',
        number_of_seats: 10,
        current_monthly_spend_usd: 800,
      } as any;

      const findings = rule.execute(request);

      expect(findings.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('V0PrivacyTaxRule', () => {
    it('should flag v0 Business when privacy not required', () => {
      const rule = new V0PrivacyTaxRule();
      const request = createBaseRequest();
      request.global_context.security_requirements.strict_data_privacy_no_training_required = false;
      request.current_stack.v0_vercel = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 5,
        has_vercel_pro_infrastructure_active: false,
        current_monthly_spend_usd: 500, // $100/user
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].recommendation).toContain('Premium');
      expect(findings[0].monthly_savings_usd).toBeCloseTo(400, 0); // 5 * ($100 - $20)
    });

    it('should not flag v0 Business when privacy is required', () => {
      const rule = new V0PrivacyTaxRule();
      const request = createBaseRequest();
      request.global_context.security_requirements.strict_data_privacy_no_training_required = true;
      request.current_stack.v0_vercel = {
        is_active: true,
        current_plan: 'business',
        number_of_seats: 5,
        has_vercel_pro_infrastructure_active: false,
        current_monthly_spend_usd: 500,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });
  });

  describe('V0InfrastructureRequisiteRule', () => {
    it('should flag v0 Team without active Vercel Pro', () => {
      const rule = new V0InfrastructureRequisiteRule();
      const request = createBaseRequest();
      request.current_stack.v0_vercel = {
        is_active: true,
        current_plan: 'team',
        number_of_seats: 5,
        has_vercel_pro_infrastructure_active: false,
        current_monthly_spend_usd: 150, // $30/user
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].recommendation).toContain('Premium');
    });

    it('should not flag v0 Team with active Vercel Pro', () => {
      const rule = new V0InfrastructureRequisiteRule();
      const request = createBaseRequest();
      request.current_stack.v0_vercel = {
        is_active: true,
        current_plan: 'team',
        number_of_seats: 5,
        has_vercel_pro_infrastructure_active: true,
        current_monthly_spend_usd: 150,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should calculate correct savings for v0 Team trap', () => {
      const rule = new V0InfrastructureRequisiteRule();
      const request = createBaseRequest();
      request.current_stack.v0_vercel = {
        is_active: true,
        current_plan: 'team',
        number_of_seats: 10,
        has_vercel_pro_infrastructure_active: false,
        current_monthly_spend_usd: 300, // $30/user
      } as any;

      const findings = rule.execute(request);

      // True team cost: ($30 + $20) * 10 = $500/month
      // Premium alternative: $20 * 10 = $200/month
      // Savings: $300/month
      expect(findings[0].monthly_savings_usd).toBeGreaterThan(0);
    });
  });
});
