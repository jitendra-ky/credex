/**
 * Type III Defect Rules Tests
 * Tests for: Usage Inefficiency and Consumption Arbitrage
 */

import {
  AsyncBatchAPIArbitrageRule,
  ClaudeEnterpriseAPITrapRule,
  ChatGPTGoTierProductivityLossRule,
  RegionalDataResidencyTaxRule,
} from '../rules/TypeIIIDefectRules';
import { AuditRequest } from '../types/audit.types';

describe('Type III Defect Rules: Usage Inefficiency', () => {
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

  describe('AsyncBatchAPIArbitrageRule', () => {
    it('should flag Anthropic async workload >10M tokens', () => {
      const rule = new AsyncBatchAPIArbitrageRule();
      const request = createBaseRequest();
      request.current_stack.anthropic_api = {
        is_active: true,
        primary_model_used: 'opus',
        average_monthly_token_volume_millions: 50,
        is_workload_asynchronous: true,
        requires_us_data_residency: false,
        current_monthly_spend_usd: 1000,
      } as any;

      const findings = rule.execute(request);

      expect(findings.length).toBeGreaterThan(0);
      const anthropicFinding = findings.find(f => f.tool_name === 'Anthropic API');
      expect(anthropicFinding).toBeDefined();
      // 50% savings on $1000
      expect(anthropicFinding!.monthly_savings_usd).toBeCloseTo(500, 0);
    });

    it('should not flag Anthropic sync workload', () => {
      const rule = new AsyncBatchAPIArbitrageRule();
      const request = createBaseRequest();
      request.current_stack.anthropic_api = {
        is_active: true,
        primary_model_used: 'opus',
        average_monthly_token_volume_millions: 50,
        is_workload_asynchronous: false,
        requires_us_data_residency: false,
        current_monthly_spend_usd: 1000,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should not flag small workloads <10M tokens', () => {
      const rule = new AsyncBatchAPIArbitrageRule();
      const request = createBaseRequest();
      request.current_stack.anthropic_api = {
        is_active: true,
        primary_model_used: 'opus',
        average_monthly_token_volume_millions: 5,
        is_workload_asynchronous: true,
        requires_us_data_residency: false,
        current_monthly_spend_usd: 100,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });

    it('should flag both OpenAI and Anthropic async if both active', () => {
      const rule = new AsyncBatchAPIArbitrageRule();
      const request = createBaseRequest();
      request.current_stack.anthropic_api = {
        is_active: true,
        primary_model_used: 'opus',
        average_monthly_token_volume_millions: 50,
        is_workload_asynchronous: true,
        requires_us_data_residency: false,
        current_monthly_spend_usd: 1000,
      } as any;
      request.current_stack.openai_api = {
        is_active: true,
        primary_model_used: 'gpt_5_5',
        average_monthly_token_volume_millions: 30,
        is_workload_asynchronous: true,
        requires_us_data_residency: false,
        current_monthly_spend_usd: 600,
      } as any;

      const findings = rule.execute(request);

      expect(findings.length).toBe(2);
    });
  });

  describe('ClaudeEnterpriseAPITrapRule', () => {
    it('should flag Claude Enterprise >150 seats (informational)', () => {
      const rule = new ClaudeEnterpriseAPITrapRule();
      const request = createBaseRequest();
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'enterprise',
        number_of_seats: 200,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 5000,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toContain('Variable Cost');
    });

    it('should not flag Claude Enterprise ≤150 seats', () => {
      const rule = new ClaudeEnterpriseAPITrapRule();
      const request = createBaseRequest();
      request.current_stack.claude_gui = {
        is_active: true,
        current_plan: 'enterprise',
        number_of_seats: 150,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 3000,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });
  });

  describe('ChatGPTGoTierProductivityLossRule', () => {
    it('should flag Go tier for coding use case', () => {
      const rule = new ChatGPTGoTierProductivityLossRule();
      const request = createBaseRequest();
      request.global_context.primary_use_case = 'coding';
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'go',
        number_of_seats: 1,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 8,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].recommendation).toContain('Plus');
      expect(findings[0].monthly_savings_usd).toBe(12); // $20 - $8
    });

    it('should not flag if Go tier not active', () => {
      const rule = new ChatGPTGoTierProductivityLossRule();
      const request = createBaseRequest();
      request.current_stack.chatgpt_gui = {
        is_active: true,
        current_plan: 'plus',
        number_of_seats: 1,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 20,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });
  });

  describe('RegionalDataResidencyTaxRule', () => {
    it('should acknowledge Anthropic US residency compliance cost', () => {
      const rule = new RegionalDataResidencyTaxRule();
      const request = createBaseRequest();
      request.current_stack.anthropic_api = {
        is_active: true,
        primary_model_used: 'opus',
        average_monthly_token_volume_millions: 50,
        is_workload_asynchronous: false,
        requires_us_data_residency: true,
        current_monthly_spend_usd: 1100,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toContain('Compliance Tax');
      // Informational finding - zero savings since it's mandatory
      expect(findings[0].monthly_savings_usd).toBe(0);
    });

    it('should flag both APIs if both require US residency', () => {
      const rule = new RegionalDataResidencyTaxRule();
      const request = createBaseRequest();
      request.current_stack.anthropic_api = {
        is_active: true,
        primary_model_used: 'opus',
        average_monthly_token_volume_millions: 50,
        is_workload_asynchronous: false,
        requires_us_data_residency: true,
        current_monthly_spend_usd: 1100,
      } as any;
      request.current_stack.openai_api = {
        is_active: true,
        primary_model_used: 'gpt_5_5',
        average_monthly_token_volume_millions: 30,
        is_workload_asynchronous: false,
        requires_us_data_residency: true,
        current_monthly_spend_usd: 600,
      } as any;

      const findings = rule.execute(request);

      expect(findings.length).toBe(2);
    });

    it('should not flag if residency not required', () => {
      const rule = new RegionalDataResidencyTaxRule();
      const request = createBaseRequest();
      request.current_stack.anthropic_api = {
        is_active: true,
        primary_model_used: 'opus',
        average_monthly_token_volume_millions: 50,
        is_workload_asynchronous: false,
        requires_us_data_residency: false,
        current_monthly_spend_usd: 1000,
      } as any;

      const findings = rule.execute(request);

      expect(findings).toHaveLength(0);
    });
  });
});
