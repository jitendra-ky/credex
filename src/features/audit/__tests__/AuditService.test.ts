/**
 * Audit Service Tests
 * Tests for input validation and service facade
 */

import { AuditService } from '../services/AuditService';
import { AuditRequest } from '../types/audit.types';

describe('AuditService', () => {
  const createValidRequest = (): AuditRequest => ({
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
        current_plan: 'pro',
        number_of_seats: 5,
        billing_cycle: 'monthly',
        current_monthly_spend_usd: 100,
      },
      github_copilot: {
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
        is_active: false,
        current_monthly_spend_usd: 0,
      } as any,
      openai_api: {
        is_active: false,
        current_monthly_spend_usd: 0,
      } as any,
    },
  });

  it('should execute audit with valid request', async () => {
    const service = new AuditService();
    const request = createValidRequest();

    const result = await service.executeAudit(request);

    expect(result).toBeDefined();
    expect(result.audit_id).toBeDefined();
    expect(result.findings).toBeDefined();
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.total_monthly_savings_usd).toBeGreaterThanOrEqual(0);
    expect(result.total_annual_savings_usd).toBeGreaterThanOrEqual(0);
    expect(['high-savings', 'medium', 'optimal']).toContain(result.audit_tag);
  });

  it('should throw on missing global_context', async () => {
    const service = new AuditService();
    const request = createValidRequest();
    delete (request as any).global_context;

    await expect(service.executeAudit(request)).rejects.toThrow('Missing global_context');
  });

  it('should throw on missing security_requirements', async () => {
    const service = new AuditService();
    const request = createValidRequest();
    delete (request as any).global_context.security_requirements;

    await expect(service.executeAudit(request)).rejects.toThrow('Missing security_requirements');
  });

  it('should throw on missing current_stack', async () => {
    const service = new AuditService();
    const request = createValidRequest();
    delete (request as any).current_stack;

    await expect(service.executeAudit(request)).rejects.toThrow('Missing current_stack');
  });

  it('should throw if no tools are active', async () => {
    const service = new AuditService();
    const request = createValidRequest();

    // Deactivate all tools
    request.current_stack.cursor.is_active = false;
    request.current_stack.github_copilot.is_active = false;
    request.current_stack.claude_gui.is_active = false;
    request.current_stack.chatgpt_gui.is_active = false;
    request.current_stack.gemini.is_active = false;
    request.current_stack.v0_vercel.is_active = false;
    request.current_stack.anthropic_api.is_active = false;
    request.current_stack.openai_api.is_active = false;

    await expect(service.executeAudit(request)).rejects.toThrow('At least one tool must be active');
  });

  it('should return result with all required fields for DB insertion', async () => {
    const service = new AuditService();
    const request = createValidRequest();

    const result = await service.executeAudit(request);

    // Verify DB-ready structure
    expect(result.audit_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(result.created_at instanceof Date).toBe(true);

    // Should be insertable into DB
    const dbReady = {
      id: result.audit_id,
      tools_json: request,
      results_json: result,
      summary: null,
      tag: result.audit_tag,
      created_at: result.created_at,
      updated_at: new Date(),
    };

    expect(dbReady.id).toBeDefined();
    expect(dbReady.tools_json).toBeDefined();
    expect(dbReady.results_json).toBeDefined();
  });

  it('should handle multiple active tools', async () => {
    const service = new AuditService();
    const request = createValidRequest();

    request.current_stack.claude_gui = {
      is_active: true,
      current_plan: 'pro',
      number_of_seats: 3,
      billing_cycle: 'monthly',
      current_monthly_spend_usd: 60,
    } as any;

    const result = await service.executeAudit(request);

    expect(result).toBeDefined();
    expect(result.audit_id).toBeDefined();
  });

  it('should produce deterministic findings for same input', async () => {
    const service = new AuditService();
    const request = createValidRequest();

    const result1 = await service.executeAudit(request);
    const result2 = await service.executeAudit(request);

    // Same request should produce same findings (but different audit IDs)
    expect(result1.audit_id).not.toBe(result2.audit_id);
    expect(result1.findings.length).toBe(result2.findings.length);
    expect(result1.total_monthly_savings_usd).toBe(result2.total_monthly_savings_usd);
  });

  it('should execute within reasonable time', async () => {
    const service = new AuditService();
    const request = createValidRequest();

    const startTime = Date.now();
    await service.executeAudit(request);
    const endTime = Date.now();

    // Should complete in <1 second
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
