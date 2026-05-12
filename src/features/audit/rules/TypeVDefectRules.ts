/**
 * Type V Defect Rules: GitHub Copilot-Specific Overspend Patterns
 * Single Responsibility: Each rule detects one GitHub Copilot inefficiency
 */

import { BaseAuditRule } from './BaseAuditRule';
import { AuditFinding, AuditRequest } from '../types/audit.types';

/**
 * Rule 5.1: GitHub Copilot Enterprise Upsell Trap
 * Copilot Enterprise ($39/user) vs Business ($19/user) - Enterprise requires
 * GitHub Enterprise Cloud. Many teams pay $39 when $19 Business covers their needs.
 * Prices sourced from github.com/features/copilot (May 2026).
 */
export class CopilotEnterpriseUpsellRule extends BaseAuditRule {
  readonly ruleId = 'RULE_5_1_COPILOT_ENTERPRISE_UPSELL';

  execute(request: AuditRequest): AuditFinding[] {
    const copilot = request.current_stack.github_copilot;

    if (!copilot.is_active || copilot.current_plan !== 'enterprise') {
      return [];
    }

    // Enterprise requires GitHub Enterprise Cloud subscription.
    // If SCIM is not required, Business ($19) delivers the same AI capability.
    if (request.global_context.security_requirements.scim_automated_provisioning_required) {
      return [];
    }

    // Enterprise: $39/user — Business: $19/user
    const ENTERPRISE_PRICE = 39;
    const BUSINESS_PRICE = 19;
    const monthlySavings = (ENTERPRISE_PRICE - BUSINESS_PRICE) * copilot.number_of_seats;

    if (monthlySavings <= 0) {
      return [];
    }

    return [
      this.generateFinding(
        'GitHub Copilot',
        'GitHub Copilot Enterprise Upsell Trap',
        `You pay $${ENTERPRISE_PRICE}/user/mo for Copilot Enterprise but don't require SCIM provisioning. Enterprise tier mandates a GitHub Enterprise Cloud subscription, adding hidden licensing overhead.`,
        `Downgrade to Copilot Business ($${BUSINESS_PRICE}/user/mo) — identical AI coding features, SSO included, no GH Enterprise Cloud dependency`,
        monthlySavings,
      ),
    ];
  }
}

/**
 * Rule 5.2: IDE AI Redundancy — Cursor + GitHub Copilot Overlap
 * Cursor (IDE with built-in AI) and GitHub Copilot (IDE plugin) deliver nearly
 * identical inline code-completion capabilities when used simultaneously.
 * Running both for the same developer cohort is redundant spend.
 */
export class IDEAIRedundancyRule extends BaseAuditRule {
  readonly ruleId = 'RULE_5_2_IDE_AI_REDUNDANCY';

  execute(request: AuditRequest): AuditFinding[] {
    const cursor = request.current_stack.cursor;
    const copilot = request.current_stack.github_copilot;

    // Only flag when both are active
    if (!cursor.is_active || !copilot.is_active) {
      return [];
    }

    // Check if the same user cohort runs both (similar seat counts, ±20% variance)
    const seatVariance =
      Math.abs(cursor.number_of_seats - copilot.number_of_seats) /
      Math.max(cursor.number_of_seats, copilot.number_of_seats, 1);

    if (seatVariance > 0.2) {
      // Different cohort sizes — possibly intentional, don't flag
      return [];
    }

    // The cheaper tool is the one to keep; the other is the redundancy cost
    const cursorCost = cursor.current_monthly_spend_usd;
    const copilotCost = copilot.current_monthly_spend_usd;
    const redundancyCost = Math.min(cursorCost, copilotCost);

    if (redundancyCost <= 0) {
      return [];
    }

    const keepTool = cursorCost >= copilotCost ? 'Cursor' : 'GitHub Copilot';
    const dropTool = cursorCost >= copilotCost ? 'GitHub Copilot' : 'Cursor';

    return [
      this.generateFinding(
        'Cursor + GitHub Copilot',
        'IDE AI Inline Completion Redundancy',
        `Both Cursor and GitHub Copilot provide AI inline code completion for ${cursor.number_of_seats} developers. Running both tools simultaneously for the same cohort duplicates $${redundancyCost}/mo in IDE AI spend.`,
        `Consolidate to ${keepTool} only. ${keepTool} provides equivalent inline AI assistance. Discontinue ${dropTool} licenses to eliminate redundant spend.`,
        redundancyCost,
      ),
    ];
  }
}

/**
 * Rule 5.3: GitHub Copilot Pro+ Individual Overkill
 * Copilot Pro+ ($39/mo) targets individual power users who saturate Pro limits.
 * When purchased for multiple seats simultaneously with Business, it signals
 * a misunderstanding of the plan structure.
 */
export class CopilotProPlusMultiSeatRule extends BaseAuditRule {
  readonly ruleId = 'RULE_5_3_COPILOT_PRO_PLUS_MULTISEAT';

  execute(request: AuditRequest): AuditFinding[] {
    const copilot = request.current_stack.github_copilot;

    if (!copilot.is_active || copilot.current_plan !== 'pro_plus') {
      return [];
    }

    // Pro+ is an individual plan ($39/mo). Using it for >1 seat is a misuse —
    // Business ($19/user) is the correct multi-seat path.
    if (copilot.number_of_seats <= 1) {
      return [];
    }

    // Pro+: $39/seat — Business: $19/seat
    const PRO_PLUS_PRICE = 39;
    const BUSINESS_PRICE = 19;
    const monthlySavings = (PRO_PLUS_PRICE - BUSINESS_PRICE) * copilot.number_of_seats;

    return [
      this.generateFinding(
        'GitHub Copilot',
        'Copilot Pro+ Multi-Seat Misuse',
        `Copilot Pro+ ($${PRO_PLUS_PRICE}/user/mo) is designed for individual power users, not team licensing. You have ${copilot.number_of_seats} seats on Pro+, paying $${PRO_PLUS_PRICE - BUSINESS_PRICE}/user/mo extra vs Business.`,
        `Switch to Copilot Business ($${BUSINESS_PRICE}/user/mo) for team licensing. Reserve Pro+ only for power users who exhaust Business-tier limits.`,
        monthlySavings,
      ),
    ];
  }
}
