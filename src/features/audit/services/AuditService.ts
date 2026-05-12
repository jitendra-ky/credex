/**
 * Audit Service
 * Single Responsibility: High-level audit orchestration and validation
 * Facade pattern: Simplifies access to complex audit engine
 */

import { AuditRequest, AuditResult } from '../types/audit.types';
import { AuditRuleEngine } from '../engine/AuditRuleEngine';
import {
  // Type I
  ClaudeTeamMinimumRule,
  ChatGPTBusinessMinimumRule,
  AnnualBillingArbitrageRule,
  // Type II
  EnterpriseSCIMTaxRule,
  V0PrivacyTaxRule,
  V0InfrastructureRequisiteRule,
  // Type III
  AsyncBatchAPIArbitrageRule,
  ClaudeEnterpriseAPITrapRule,
  ChatGPTGoTierProductivityLossRule,
  RegionalDataResidencyTaxRule,
  // Type IV
  ChatbotRedundancyRule,
  ExtremePowerUserSurchargeRule,
  // Type V
  CopilotEnterpriseUpsellRule,
  IDEAIRedundancyRule,
  CopilotProPlusMultiSeatRule,
} from '../rules';

export class AuditService {
  private engine: AuditRuleEngine;

  constructor() {
    // Initialize engine with all rules in execution order
    // Type I: Seat minimums and billing arbitrage
    // Type II: Feature mismatches
    // Type III: API inefficiencies
    // Type IV: Stack redundancy
    this.engine = new AuditRuleEngine([
      new ClaudeTeamMinimumRule(),
      new ChatGPTBusinessMinimumRule(),
      new AnnualBillingArbitrageRule(),
      new EnterpriseSCIMTaxRule(),
      new V0PrivacyTaxRule(),
      new V0InfrastructureRequisiteRule(),
      new AsyncBatchAPIArbitrageRule(),
      new ClaudeEnterpriseAPITrapRule(),
      new ChatGPTGoTierProductivityLossRule(),
      new RegionalDataResidencyTaxRule(),
      new ChatbotRedundancyRule(),
      new ExtremePowerUserSurchargeRule(),
      new CopilotEnterpriseUpsellRule(),
      new IDEAIRedundancyRule(),
      new CopilotProPlusMultiSeatRule(),
    ]);
  }

  /**
   * Execute audit against input and return results ready for DB insertion
   * @throws Error if input validation fails
   */
  async executeAudit(request: AuditRequest): Promise<AuditResult> {
    // Validate input structure
    this.validateRequest(request);

    // Run all rules
    const result = this.engine.execute(request);

    return result;
  }

  /**
   * Minimal validation - check required fields exist
   */
  private validateRequest(request: AuditRequest): void {
    if (!request.global_context) {
      throw new Error('Missing global_context in audit request');
    }

    if (!request.global_context.security_requirements) {
      throw new Error('Missing security_requirements in audit request');
    }

    if (!request.current_stack) {
      throw new Error('Missing current_stack in audit request');
    }

    // Ensure at least one tool is active
    const hasActiveTools = [
      request.current_stack.cursor.is_active,
      request.current_stack.github_copilot.is_active,
      request.current_stack.claude_gui.is_active,
      request.current_stack.chatgpt_gui.is_active,
      request.current_stack.gemini.is_active,
      request.current_stack.v0_vercel.is_active,
      request.current_stack.anthropic_api.is_active,
      request.current_stack.openai_api.is_active,
    ].some(active => active);

    if (!hasActiveTools) {
      throw new Error('At least one tool must be active in current_stack');
    }
  }
}
