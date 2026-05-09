/**
 * Type I Defect Rules: Over-Provisioning and Seat Minimum Violations
 * Single Responsibility: Each rule detects one overspend pattern
 */

import { BaseAuditRule } from './BaseAuditRule';
import { AuditFinding, AuditRequest } from '../types/audit.types';

/**
 * Rule 1.1: Claude Team Minimum Ghost Seat Trap
 * Anthropic enforces a 5-seat minimum on all Team plans
 */
export class ClaudeTeamMinimumRule extends BaseAuditRule {
  readonly ruleId = 'RULE_1_1_CLAUDE_TEAM_MINIMUM';

  execute(request: AuditRequest): AuditFinding[] {
    const claude = request.current_stack.claude_gui;

    if (!claude.is_active) {
      return [];
    }

    const isTeamPlan = claude.current_plan === 'team_standard' || claude.current_plan === 'team_premium';
    const hasMinimumViolation = claude.number_of_seats < 5;

    if (!isTeamPlan || !hasMinimumViolation) {
      return [];
    }

    // Calculate cost of ghost seats (minimum 5 enforced)
    const seatPrice = claude.current_plan === 'team_standard' ? 25 : 125;
    const ghostSeats = 5 - claude.number_of_seats;
    const monthlySavings = ghostSeats * seatPrice;

    if (monthlySavings <= 0) {
      return [];
    }

    const recommendation = request.global_context.security_requirements.saml_sso_required
      ? `Keep Team plan but negotiate with Anthropic for waived minimum on ${claude.number_of_seats} seats`
      : `Downgrade to Claude Pro ($20/mo) individual licenses for better cost`;

    return [
      this.generateFinding(
        'Claude GUI',
        'Claude Team Plan 5-Seat Minimum Violation',
        `You have ${claude.number_of_seats} seats but Team plan enforces 5-seat minimum. You're paying for ${ghostSeats} unused ghost seats.`,
        recommendation,
        monthlySavings,
      ),
    ];
  }
}

/**
 * Rule 1.2: ChatGPT Business Minimum Trap
 * OpenAI enforces a 2-seat minimum on ChatGPT Business tier
 */
export class ChatGPTBusinessMinimumRule extends BaseAuditRule {
  readonly ruleId = 'RULE_1_2_CHATGPT_BUSINESS_MINIMUM';

  execute(request: AuditRequest): AuditFinding[] {
    const chatgpt = request.current_stack.chatgpt_gui;

    if (!chatgpt.is_active || chatgpt.current_plan !== 'business') {
      return [];
    }

    const hasMinimumViolation = chatgpt.number_of_seats < 2;

    if (!hasMinimumViolation) {
      return [];
    }

    // ChatGPT Business is $25/user, so 1 user should pay $25 not $50
    const monthlySavings = 25; // Save 1 seat worth

    const recommendation = request.global_context.security_requirements.strict_data_privacy_no_training_required
      ? `Keep Business plan for privacy guarantees`
      : `Downgrade to ChatGPT Plus ($20/mo)`;

    return [
      this.generateFinding(
        'ChatGPT GUI',
        'ChatGPT Business 2-Seat Minimum Violation',
        `Solo user on ChatGPT Business tier. Business plan enforces 2-seat minimum ($50/mo total), wasting budget on ghost seat.`,
        recommendation,
        monthlySavings,
      ),
    ];
  }
}

/**
 * Rule 1.3: Annual Billing Arbitrage Failure
 * Most vendors offer ~20% discount for annual commitment
 */
export class AnnualBillingArbitrageRule extends BaseAuditRule {
  readonly ruleId = 'RULE_1_3_ANNUAL_BILLING_ARBITRAGE';

  private toolsWithAnnualDiscount = ['cursor', 'claude_gui', 'chatgpt_gui', 'v0_vercel'];

  execute(request: AuditRequest): AuditFinding[] {
    const findings: AuditFinding[] = [];

    for (const toolName of this.toolsWithAnnualDiscount) {
      const tool = (request.current_stack as Record<string, any>)[toolName];

      if (!tool?.is_active || tool.billing_cycle !== 'monthly') {
        continue;
      }

      // 20% annual discount opportunity
      const annualSavings = (tool.current_monthly_spend_usd * 12) * 0.20;

      findings.push(
        this.generateFinding(
          this.formatToolName(toolName),
          `${this.formatToolName(toolName)} Annual Billing Discount Opportunity`,
          `Currently on monthly billing. Annual commitment saves ~20% on all subscriptions.`,
          `Switch to annual billing for ${this.formatToolName(toolName)} to unlock 20% discount`,
          annualSavings / 12, // Convert to monthly for consistency
        ),
      );
    }

    return findings;
  }

  private formatToolName(toolName: string): string {
    return toolName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
