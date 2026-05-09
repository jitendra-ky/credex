/**
 * Type IV Defect Rules: Stack Consolidation and Functional Redundancy
 * Single Responsibility: Detect duplicate tooling across vendors
 */

import { BaseAuditRule } from './BaseAuditRule';
import { AuditFinding, AuditRequest } from '../types/audit.types';

/**
 * Rule 4.1: General Purpose Chatbot Redundancy
 * Running ChatGPT + Claude + Gemini simultaneously for same use case
 */
export class ChatbotRedundancyRule extends BaseAuditRule {
  readonly ruleId = 'RULE_4_1_CHATBOT_REDUNDANCY';

  execute(request: AuditRequest): AuditFinding[] {
    const chatgpt = request.current_stack.chatgpt_gui;
    const claude = request.current_stack.claude_gui;
    const gemini = request.current_stack.gemini;

    // Count how many are active
    const activeModels = [
      { name: 'ChatGPT', tool: chatgpt, active: chatgpt.is_active },
      { name: 'Claude', tool: claude, active: claude.is_active },
      { name: 'Gemini', tool: gemini, active: gemini.is_active },
    ].filter(m => m.active);

    // Only flag if 3+ general-purpose models are active (massive redundancy)
    if (activeModels.length < 3) {
      return [];
    }

    // Estimate user overlap - if seat counts are similar, assume same user cohort
    const seatCounts = activeModels.map(m => m.tool.number_of_seats);
    const maxSeats = Math.max(...seatCounts);
    const minSeats = Math.min(...seatCounts);
    const seatVariance = ((maxSeats - minSeats) / maxSeats) * 100;

    // If variance < 15%, likely same user cohort
    if (seatVariance > 15) {
      return [];
    }

    // Calculate redundancy cost
    const totalCost = activeModels.reduce((sum, m) => sum + m.tool.current_monthly_spend_usd, 0);
    const minToolCost = Math.min(...activeModels.map(m => m.tool.current_monthly_spend_usd));
    const redundancyCost = totalCost - minToolCost;

    if (redundancyCost <= 0) {
      return [];
    }

    const modelNames = activeModels.map(m => m.name).join(' + ');

    return [
      this.generateFinding(
        'Multiple General-Purpose AI Platforms',
        `${modelNames} Redundancy Detected`,
        `You're paying for ${modelNames} across similar user cohorts ($${totalCost}/mo total). These provide overlapping general-purpose LLM capabilities.`,
        `Consolidate to single platform: use Claude for coding (terminal integration), ChatGPT for reasoning, or Gemini if heavily Google Workspace integrated`,
        redundancyCost,
      ),
    ];
  }
}

/**
 * Rule 4.2: Extreme Power User Surcharge
 * Running both Max/Pro individual tiers + Business/Premium team tiers simultaneously
 */
export class ExtremePowerUserSurchargeRule extends BaseAuditRule {
  readonly ruleId = 'RULE_4_2_EXTREME_POWER_USER_SURCHARGE';

  execute(request: AuditRequest): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Check ChatGPT: Pro tiers ($100, $200) + Business/Team tiers simultaneously
    const chatgpt = request.current_stack.chatgpt_gui;
    if (chatgpt.is_active) {
      const hasHighIndividualTier = chatgpt.current_plan === 'pro_100' || chatgpt.current_plan === 'pro_200';
      const hasTeamTier = chatgpt.number_of_seats > 1;

      if (hasHighIndividualTier && hasTeamTier) {
        const redundancyCost = chatgpt.current_monthly_spend_usd - (chatgpt.number_of_seats * 20);

        if (redundancyCost > 0) {
          findings.push(
            this.generateFinding(
              'ChatGPT GUI',
              'ChatGPT Extreme Power User Tier Redundancy',
              `Running both high-tier individual ($${chatgpt.current_plan === 'pro_100' ? 100 : 200}/mo) and team tiers. Unlikely a single human saturates all usage simultaneously.`,
              `Choose either: (1) Individual Max tier for extreme user, OR (2) Team Plus for collaborative needs - not both`,
              redundancyCost,
            ),
          );
        }
      }
    }

    // Check Claude: Max tiers (5x, 20x) + Team tiers simultaneously
    const claude = request.current_stack.claude_gui;
    if (claude.is_active) {
      const hasHighIndividualTier = claude.current_plan === 'max_5x' || claude.current_plan === 'max_20x';
      const hasTeamTier = claude.number_of_seats > 1;

      if (hasHighIndividualTier && hasTeamTier) {
        const redundancyCost = claude.current_monthly_spend_usd - (claude.number_of_seats * 20);

        if (redundancyCost > 0) {
          findings.push(
            this.generateFinding(
              'Claude GUI',
              'Claude Extreme Power User Tier Redundancy',
              `Running both high-tier individual (Max ${claude.current_plan === 'max_5x' ? '5x' : '20x'}) and team tiers. Single human unlikely to saturate both.`,
              `Choose either: (1) Individual Max tier for extreme user, OR (2) Team Standard for collaboration - not both`,
              redundancyCost,
            ),
          );
        }
      }
    }

    return findings;
  }
}
