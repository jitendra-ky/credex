/**
 * Audit Integration Tests
 * End-to-end tests with realistic scenarios
 */

import { AuditService } from '../services/AuditService';
import { AuditRequest } from '../types/audit.types';

describe('Audit Integration Tests', () => {
  /**
   * Scenario from ai-spend-audio-app-design.md Section 3.3 Example
   * Organization has:
   * - Cursor Business: 10 users, monthly billing
   * - Claude Team Standard: 3 users (violates 5-seat minimum)
   * - v0 Team: 10 users without Vercel Pro
   * - Anthropic API: 50M tokens/mo async workload
   */
  it('should identify multiple defects in complex real-world scenario', async () => {
    const service = new AuditService();

    const request: AuditRequest = {
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
        cursor: {
          is_active: true,
          current_plan: 'business',
          number_of_seats: 10,
          billing_cycle: 'monthly',
          current_monthly_spend_usd: 400,
        },
        claude_gui: {
          is_active: true,
          current_plan: 'team_standard',
          number_of_seats: 3,
          billing_cycle: 'monthly',
          current_monthly_spend_usd: 75,
        },
        chatgpt_gui: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        gemini: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        v0_vercel: {
          is_active: true,
          current_plan: 'team',
          number_of_seats: 10,
          has_vercel_pro_infrastructure_active: false,
          current_monthly_spend_usd: 300,
        },
        anthropic_api: {
          is_active: true,
          primary_model_used: 'opus',
          average_monthly_token_volume_millions: 50.0,
          is_workload_asynchronous: true,
          requires_us_data_residency: false,
          current_monthly_spend_usd: 1250,
        },
        openai_api: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
      },
    };

    const result = await service.executeAudit(request);

    // Should identify multiple issues
    expect(result.findings.length).toBeGreaterThan(0);

    // Should find Claude 5-seat minimum violation (2 ghost seats * $25 = $50 savings)
    const claudeFinding = result.findings.find(f => f.rule_id === 'RULE_1_1_CLAUDE_TEAM_MINIMUM');
    expect(claudeFinding).toBeDefined();
    expect(claudeFinding!.monthly_savings_usd).toBe(50);

    // Should find v0 Infrastructure trap
    const v0InfraFinding = result.findings.find(f => f.rule_id === 'RULE_2_3_V0_INFRA_REQUISITE');
    expect(v0InfraFinding).toBeDefined();

    // Should find Anthropic Batch API opportunity (50% of $1250)
    const batchAPIFinding = result.findings.find(f => f.rule_id === 'RULE_3_1_ASYNC_BATCH_ARBITRAGE');
    expect(batchAPIFinding).toBeDefined();
    expect(batchAPIFinding!.monthly_savings_usd).toBeCloseTo(625, 0);

    // Should find Cursor annual billing opportunity
    const cursorBillingFinding = result.findings.find(
      f => f.tool_name === 'Cursor' && f.rule_id === 'RULE_1_3_ANNUAL_BILLING_ARBITRAGE'
    );
    expect(cursorBillingFinding).toBeDefined();

    // Total savings should be substantial
    expect(result.total_monthly_savings_usd).toBeGreaterThan(600);

    // Should be tagged as high-savings due to significant opportunities
    expect(['high-savings', 'medium']).toContain(result.audit_tag);
  });

  /**
   * Scenario: Well-optimized stack (should find minimal issues)
   */
  it('should find minimal issues in optimized stack', async () => {
    const service = new AuditService();

    const request: AuditRequest = {
      global_context: {
        total_team_size: 5,
        primary_use_case: 'coding',
        security_requirements: {
          saml_sso_required: false,
          scim_automated_provisioning_required: false,
          strict_data_privacy_no_training_required: false,
        },
      },
      current_stack: {
        cursor: {
          is_active: true,
          current_plan: 'pro',
          number_of_seats: 5,
          billing_cycle: 'annual', // Optimized
          current_monthly_spend_usd: 80, // Already discounted annual rate
        },
        claude_gui: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        chatgpt_gui: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        gemini: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        v0_vercel: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        anthropic_api: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        openai_api: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
      },
    };

    const result = await service.executeAudit(request);

    // Should have minimal findings for optimized stack
    expect(result.findings.length).toBeLessThan(3);

    // Should be tagged as optimal
    expect(result.audit_tag).toBe('optimal');
  });

  /**
   * Scenario: Massive redundancy (multiple general-purpose models)
   */
  it('should detect significant stack redundancy', async () => {
    const service = new AuditService();

    const request: AuditRequest = {
      global_context: {
        total_team_size: 20,
        primary_use_case: 'mixed_general',
        security_requirements: {
          saml_sso_required: false,
          scim_automated_provisioning_required: false,
          strict_data_privacy_no_training_required: false,
        },
      },
      current_stack: {
        cursor: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        claude_gui: {
          is_active: true,
          current_plan: 'pro',
          number_of_seats: 20,
          billing_cycle: 'monthly',
          current_monthly_spend_usd: 400, // $20/user
        },
        chatgpt_gui: {
          is_active: true,
          current_plan: 'plus',
          number_of_seats: 20,
          billing_cycle: 'monthly',
          current_monthly_spend_usd: 400, // $20/user
        },
        gemini: {
          is_active: true,
          current_plan: 'pro',
          number_of_seats: 20,
          billing_cycle: 'monthly',
          current_monthly_spend_usd: 400, // ~$20/user
        },
        v0_vercel: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        anthropic_api: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        openai_api: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
      },
    };

    const result = await service.executeAudit(request);

    // Should find chatbot redundancy
    const redundancyFinding = result.findings.find(f => f.rule_id === 'RULE_4_1_CHATBOT_REDUNDANCY');
    expect(redundancyFinding).toBeDefined();

    // Should indicate significant savings from consolidation
    expect(result.total_monthly_savings_usd).toBeGreaterThan(400);

    // High-savings tag
    expect(result.audit_tag).toBe('high-savings');
  });

  /**
   * Scenario: Enterprise over-licensing without SCIM requirement
   */
  it('should flag unnecessary Enterprise SCIM tax', async () => {
    const service = new AuditService();

    const request: AuditRequest = {
      global_context: {
        total_team_size: 50,
        primary_use_case: 'coding',
        security_requirements: {
          saml_sso_required: true, // Has SAML requirement
          scim_automated_provisioning_required: false, // But NO SCIM required
          strict_data_privacy_no_training_required: false,
        },
      },
      current_stack: {
        cursor: {
          is_active: true,
          current_plan: 'enterprise',
          number_of_seats: 50,
          billing_cycle: 'monthly',
          current_monthly_spend_usd: 4000, // $80/user for enterprise
        },
        claude_gui: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        chatgpt_gui: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        gemini: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        v0_vercel: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        anthropic_api: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        openai_api: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
      },
    };

    const result = await service.executeAudit(request);

    // Should find SCIM tax
    const scimTaxFinding = result.findings.find(f => f.rule_id === 'RULE_2_1_ENTERPRISE_SCIM_TAX');
    expect(scimTaxFinding).toBeDefined();
    expect(scimTaxFinding!.monthly_savings_usd).toBeGreaterThan(1000);

    // Should recommend downgrade to Business
    expect(scimTaxFinding!.recommendation).toContain('Business');

    expect(result.audit_tag).toBe('high-savings');
  });

  /**
   * Scenario: API-first consumption with batch optimization opportunity
   */
  it('should recommend API batch optimization for async workloads', async () => {
    const service = new AuditService();

    const request: AuditRequest = {
      global_context: {
        total_team_size: 2,
        primary_use_case: 'data_analysis',
        security_requirements: {
          saml_sso_required: false,
          scim_automated_provisioning_required: false,
          strict_data_privacy_no_training_required: false,
        },
      },
      current_stack: {
        cursor: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        claude_gui: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        chatgpt_gui: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        gemini: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        v0_vercel: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
        anthropic_api: {
          is_active: true,
          primary_model_used: 'sonnet',
          average_monthly_token_volume_millions: 100.0,
          is_workload_asynchronous: true,
          requires_us_data_residency: false,
          current_monthly_spend_usd: 1200,
        },
        openai_api: {
          is_active: false,
          current_monthly_spend_usd: 0,
        } as any,
      },
    };

    const result = await service.executeAudit(request);

    // Should find batch API optimization
    const batchFinding = result.findings.find(f => f.rule_id === 'RULE_3_1_ASYNC_BATCH_ARBITRAGE');
    expect(batchFinding).toBeDefined();
    expect(batchFinding!.monthly_savings_usd).toBeCloseTo(600, 0); // 50% of $1200

    expect(result.audit_tag).toBe('high-savings');
  });

  /**
   * Verify audit result is ready for DB insertion
   */
  it('should produce DB-ready audit result structure', async () => {
    const service = new AuditService();

    const request: AuditRequest = {
      global_context: {
        total_team_size: 5,
        primary_use_case: 'coding',
        security_requirements: {
          saml_sso_required: false,
          scim_automated_provisioning_required: false,
          strict_data_privacy_no_training_required: false,
        },
      },
      current_stack: {
        cursor: {
          is_active: true,
          current_plan: 'pro',
          number_of_seats: 5,
          billing_cycle: 'monthly',
          current_monthly_spend_usd: 100,
        },
        claude_gui: { is_active: false, current_monthly_spend_usd: 0 } as any,
        chatgpt_gui: { is_active: false, current_monthly_spend_usd: 0 } as any,
        gemini: { is_active: false, current_monthly_spend_usd: 0 } as any,
        v0_vercel: { is_active: false, current_monthly_spend_usd: 0 } as any,
        anthropic_api: { is_active: false, current_monthly_spend_usd: 0 } as any,
        openai_api: { is_active: false, current_monthly_spend_usd: 0 } as any,
      },
    };

    const result = await service.executeAudit(request);

    // Verify structure matches AuditRecord requirements
    const auditRecord = {
      id: result.audit_id,
      tools_json: request,
      results_json: result,
      summary: null,
      tag: result.audit_tag,
      created_at: result.created_at,
      updated_at: new Date(),
    };

    // All required fields exist
    expect(auditRecord.id).toBeTruthy();
    expect(auditRecord.tools_json).toBeTruthy();
    expect(auditRecord.results_json).toBeTruthy();
    expect(auditRecord.tag).toMatch(/^(high-savings|medium|optimal)$/);
    expect(auditRecord.created_at instanceof Date).toBe(true);
  });
});
