/**
 * Type III Defect Rules: Usage Inefficiency and Consumption Arbitrage
 * Single Responsibility: Each rule detects suboptimal API usage patterns
 */

import { BaseAuditRule } from './BaseAuditRule';
import { AuditFinding, AuditRequest } from '../types/audit.types';

/**
 * Rule 3.1: Asynchronous Batch API Arbitrage
 * Both OpenAI and Anthropic offer 50% discount for asynchronous batch processing
 */
export class AsyncBatchAPIArbitrageRule extends BaseAuditRule {
  readonly ruleId = 'RULE_3_1_ASYNC_BATCH_ARBITRAGE';

  execute(request: AuditRequest): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Check Anthropic API
    const anthropic = request.current_stack.anthropic_api;
    if (
      anthropic.is_active
      && anthropic.is_workload_asynchronous
      && anthropic.average_monthly_token_volume_millions > 10
    ) {
      const monthlySavings = anthropic.current_monthly_spend_usd * 0.5;

      findings.push(
        this.generateFinding(
          'Anthropic API',
          'Anthropic Batch API 50% Discount Available',
          `Asynchronous workloads can use Batch API with 50% discount on all tokens. Current spend: $${anthropic.current_monthly_spend_usd}/mo.`,
          `Migrate non-real-time pipelines to Batch API endpoints for automatic 50% savings`,
          monthlySavings,
        ),
      );
    }

    // Check OpenAI API
    const openai = request.current_stack.openai_api;
    if (
      openai.is_active
      && openai.is_workload_asynchronous
      && openai.average_monthly_token_volume_millions > 10
    ) {
      const monthlySavings = openai.current_monthly_spend_usd * 0.5;

      findings.push(
        this.generateFinding(
          'OpenAI API',
          'OpenAI Batch API 50% Discount Available',
          `Asynchronous workloads can use Batch API with 50% discount on all tokens. Current spend: $${openai.current_monthly_spend_usd}/mo.`,
          `Migrate non-real-time pipelines to Batch API endpoints for automatic 50% savings`,
          monthlySavings,
        ),
      );
    }

    return findings;
  }
}

/**
 * Rule 3.2: Claude Enterprise API Usage Trap
 * Enterprise plan has unpredictable variable costs instead of flat-rate
 */
export class ClaudeEnterpriseAPITrapRule extends BaseAuditRule {
  readonly ruleId = 'RULE_3_2_CLAUDE_ENTERPRISE_API_TRAP';

  execute(request: AuditRequest): AuditFinding[] {
    const claude = request.current_stack.claude_gui;

    // Only flag if truly large-scale (>150 seats where bulk pricing might help)
    if (
      !claude.is_active
      || claude.current_plan !== 'enterprise'
      || claude.number_of_seats <= 150
    ) {
      return [];
    }

    // Enterprise charges: ~$20 baseline + direct API rates (not flat-rate)
    // This rule is informational, not always a pure savings play
    return [
      this.generateFinding(
        'Claude GUI',
        'Claude Enterprise Variable Cost Risk',
        `Enterprise plan charges $${20 + (claude.current_monthly_spend_usd / claude.number_of_seats) - 20}/user baseline + direct API rates. Heavy GUI users face unpredictable bills vs Team flat-rate.`,
        `Consider splitting into multiple Claude Team instances (150 seats each) for predictable flat-rate billing, if SCIM not required`,
        0, // No direct savings, informational
      ),
    ];
  }
}

/**
 * Rule 3.3: ChatGPT "Go" Tier Productivity Loss
 * $8/mo tier lacks frontier models and shows ads - false economy for knowledge workers
 */
export class ChatGPTGoTierProductivityLossRule extends BaseAuditRule {
  readonly ruleId = 'RULE_3_3_CHATGPT_GO_TIER_LOSS';

  execute(request: AuditRequest): AuditFinding[] {
    const chatgpt = request.current_stack.chatgpt_gui;
    const useCase = request.global_context.primary_use_case;

    if (!chatgpt.is_active || chatgpt.current_plan !== 'go') {
      return [];
    }

    // Only flag for non-casual use cases
    const isCasualUse = useCase === 'research'; // Weak heuristic
    if (isCasualUse) {
      return [];
    }

    // Upgrade to Plus costs $20/mo instead of $8/mo = $12/user upside
    const monthlySavings = 12;

    return [
      this.generateFinding(
        'ChatGPT GUI',
        'ChatGPT Go Tier Productivity Loss',
        `"Go" tier ($8/mo) lacks GPT-5.5, has ads, and limits Deep Research. Knowledge workers need Plus tier.`,
        `Upgrade to ChatGPT Plus ($20/mo) to unlock frontier model access and remove productivity friction`,
        monthlySavings,
      ),
    ];
  }
}

/**
 * Rule 3.4: Regional Data Residency Compliance Cost
 * US-only data residency incurs 10% pricing uplift on APIs
 */
export class RegionalDataResidencyTaxRule extends BaseAuditRule {
  readonly ruleId = 'RULE_3_4_REGIONAL_RESIDENCY_TAX';

  execute(request: AuditRequest): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Anthropic API
    if (
      request.current_stack.anthropic_api.is_active
      && request.current_stack.anthropic_api.requires_us_data_residency
    ) {
      const tax = request.current_stack.anthropic_api.current_monthly_spend_usd * 0.1;

      findings.push(
        this.generateFinding(
          'Anthropic API',
          'US Data Residency Compliance Tax',
          `US-only data residency enforcement incurs 1.1x multiplier (10% uplift) on all token charges for compliance.`,
          `This is a mandatory compliance cost given your requirements - no cost optimization available`,
          0, // No savings, just acknowledgment
        ),
      );
    }

    // OpenAI API
    if (
      request.current_stack.openai_api.is_active
      && request.current_stack.openai_api.requires_us_data_residency
    ) {
      findings.push(
        this.generateFinding(
          'OpenAI API',
          'US Data Residency Compliance Tax',
          `US-only data residency enforcement incurs 10% uplift on all token charges for compliance.`,
          `This is a mandatory compliance cost given your requirements - no cost optimization available`,
          0, // No savings, just acknowledgment
        ),
      );
    }

    return findings;
  }
}
