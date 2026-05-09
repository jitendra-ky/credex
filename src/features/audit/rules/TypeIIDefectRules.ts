/**
 * Type II Defect Rules: Feature Mismatch and Identity Management Taxation
 * Single Responsibility: Each rule detects unnecessary premium tier payments
 */

import { BaseAuditRule } from './BaseAuditRule';
import { AuditFinding, AuditRequest } from '../types/audit.types';

/**
 * Rule 2.1: Enterprise SCIM vs SAML Identity Tax
 * Vendors gate SCIM behind expensive Enterprise tiers when SAML would suffice
 */
export class EnterpriseSCIMTaxRule extends BaseAuditRule {
  readonly ruleId = 'RULE_2_1_ENTERPRISE_SCIM_TAX';

  execute(request: AuditRequest): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const secReqs = request.global_context.security_requirements;

    // Check if SCIM is truly required
    if (secReqs.scim_automated_provisioning_required) {
      return [];
    }

    // Only care if SAML IS required, since they need *some* SSO
    if (!secReqs.saml_sso_required) {
      return [];
    }

    const rules = [
      {
        tool: request.current_stack.cursor,
        toolName: 'Cursor',
        businessPrice: 40,
        enterpriseEstimate: 80,
      },
      {
        tool: request.current_stack.claude_gui,
        toolName: 'Claude GUI',
        businessPrice: 25,
        enterpriseEstimate: 60,
      },
      {
        tool: request.current_stack.chatgpt_gui,
        toolName: 'ChatGPT GUI',
        businessPrice: 25,
        enterpriseEstimate: 60,
      },
    ];

    for (const { tool, toolName, businessPrice, enterpriseEstimate } of rules) {
      if (!tool.is_active || tool.current_plan !== 'enterprise') {
        continue;
      }

      const monthlySavings = tool.current_monthly_spend_usd - (tool.number_of_seats * businessPrice);

      if (monthlySavings <= 0) {
        continue;
      }

      findings.push(
        this.generateFinding(
          toolName,
          `${toolName} Enterprise SCIM Tax Unnecessary`,
          `Enterprise plan ($${enterpriseEstimate}/user) enforces SCIM, but SAML SSO is available on Business tier ($${businessPrice}/user).`,
          `Downgrade to Business tier ($${businessPrice}/user) - SAML SSO meets your requirement`,
          monthlySavings,
        ),
      );
    }

    return findings;
  }
}

/**
 * Rule 2.2: v0 Data Privacy Tax
 * v0 Business tier ($100/mo) required for training opt-out, but not always needed
 */
export class V0PrivacyTaxRule extends BaseAuditRule {
  readonly ruleId = 'RULE_2_2_V0_PRIVACY_TAX';

  execute(request: AuditRequest): AuditFinding[] {
    const v0 = request.current_stack.v0_vercel;

    if (!v0.is_active || v0.current_plan !== 'business') {
      return [];
    }

    // If they actually require strict privacy, this is legitimate cost
    if (request.global_context.security_requirements.strict_data_privacy_no_training_required) {
      return [];
    }

    // Calculate downgrade savings
    const monthlySavings = v0.current_monthly_spend_usd - (v0.number_of_seats * 20);

    if (monthlySavings <= 0) {
      return [];
    }

    return [
      this.generateFinding(
        'v0 Vercel',
        'v0 Business Plan Privacy Tax Unnecessary',
        `You pay $100/user/mo for Business tier solely for training opt-out, but your policy doesn't require it.`,
        `Downgrade to Premium tier ($20/user/mo) - default training behavior acceptable for your use case`,
        monthlySavings,
      ),
    ];
  }
}

/**
 * Rule 2.3: v0 Infrastructure Requisite Trap
 * v0 Team plan requires active Vercel Pro ($20/mo) to function - hidden infrastructure tax
 */
export class V0InfrastructureRequisiteRule extends BaseAuditRule {
  readonly ruleId = 'RULE_2_3_V0_INFRA_REQUISITE';

  execute(request: AuditRequest): AuditFinding[] {
    const v0 = request.current_stack.v0_vercel;

    if (!v0.is_active || v0.current_plan !== 'team') {
      return [];
    }

    // If they actually have Vercel Pro infrastructure active, this cost is justified
    if (v0.has_vercel_pro_infrastructure_active) {
      return [];
    }

    // Team plan is $30/mo but requires Vercel Pro $20/mo = $50/user true cost
    // Compare to individual Premium at $20/mo
    const trueTeamCost = 30 + 20; // v0 team + vercel pro
    const monthlySavings = (trueTeamCost - 20) * v0.number_of_seats;

    if (monthlySavings <= 0) {
      return [];
    }

    return [
      this.generateFinding(
        'v0 Vercel',
        'v0 Team Plan Infrastructure Trap',
        `v0 Team ($30/user) requires active Vercel Pro infrastructure ($20/user) to enable collaboration. True cost is $50/user, but you lack the underlying Vercel Pro infrastructure.`,
        `Downgrade to individual Premium licenses ($20/user) - simpler and cheaper without Vercel Pro dependency`,
        monthlySavings / 12, // Monthly equivalent
      ),
    ];
  }
}
