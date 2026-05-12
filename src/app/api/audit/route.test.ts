/** @jest-environment node */
// POST /api/audit integration tests
// Validates request handling, service execution, and persistence.

import { POST } from './route';
import { AuditService } from '@/features/audit/services/AuditService';
import * as queriesModule from '@/lib/db/queries';
import { AuditResult, AuditRequest } from '@/features/audit/types/audit.types';

// Mock modules
jest.mock('@/features/audit/services/AuditService');
jest.mock('@/lib/db/queries');

// Mock NextRequest
const createMockRequest = (body: unknown) => ({
  json: async () => body,
  url: 'http://localhost:3000/api/audit',
});

describe('POST /api/audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should execute audit and persist to database on valid request', async () => {
      // Arrange
      const mockAuditRequest: AuditRequest = {
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
            number_of_seats: 10,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 200,
          },
          github_copilot: {
            is_active: false,
            current_plan: 'business',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          claude_gui: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          chatgpt_gui: {
            is_active: true,
            current_plan: 'plus',
            number_of_seats: 10,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 200,
          },
          gemini: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          v0_vercel: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            has_vercel_pro_infrastructure_active: false,
            current_monthly_spend_usd: 0,
          },
          anthropic_api: {
            is_active: false,
            primary_model_used: 'sonnet',
            average_monthly_token_volume_millions: 0,
            is_workload_asynchronous: false,
            requires_us_data_residency: false,
            current_monthly_spend_usd: 0,
          },
          openai_api: {
            is_active: false,
            primary_model_used: 'gpt_5_4',
            average_monthly_token_volume_millions: 0,
            is_workload_asynchronous: false,
            requires_us_data_residency: false,
            current_monthly_spend_usd: 0,
          },
        },
      };

      const mockAuditResult: AuditResult = {
        audit_id: 'temp-id',
        findings: [
          {
            id: '1',
            tool_name: 'cursor',
            rule_id: 'rule-1',
            severity: 'info',
            title: 'Test Finding',
            description: 'Test description',
            recommendation: 'Test recommendation',
            monthly_savings_usd: 100,
            annual_savings_usd: 1200,
          },
        ],
        total_monthly_savings_usd: 100,
        total_annual_savings_usd: 1200,
        audit_tag: 'medium',
        ai_summary: 'Mock AI summary for all audits',
        created_at: new Date(),
      };

      const mockPersistedAudit = {
        id: 'test-audit-id-123',
        tools_json: mockAuditRequest,
        results_json: mockAuditResult,
        summary: 'Mock AI summary for all audits',
        tag: 'medium',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock AuditService
      (AuditService as jest.MockedClass<typeof AuditService>).mockImplementation(
        () => ({
          executeAudit: jest.fn().mockResolvedValue(mockAuditResult),
        } as any),
      );

      // Mock database query
      (queriesModule.createAudit as jest.Mock).mockResolvedValue(
        mockPersistedAudit,
      );

      // Act
      const mockRequest = createMockRequest(mockAuditRequest) as any;
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.audit_id).toBe('test-audit-id-123');
      expect(data.data.total_monthly_savings_usd).toBe(100);
      expect(queriesModule.createAudit).toHaveBeenCalledWith(
        mockAuditRequest,
        mockAuditResult,
      );
    });
  });

  describe('Validation Error Cases', () => {
    it('should return 400 on invalid JSON', async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
        url: 'http://localhost:3000/api/audit',
      } as any;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 on missing required fields', async () => {
      // Arrange
      const invalidRequest = {
        global_context: {
          total_team_size: 10,
          // Missing primary_use_case and security_requirements
        },
        current_stack: {},
      };

      const mockRequest = createMockRequest(invalidRequest) as any;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Service Error Cases', () => {
    it('should return 500 on audit execution failure', async () => {
      // Arrange
      const mockAuditRequest: AuditRequest = {
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
            number_of_seats: 10,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 200,
          },
          github_copilot: {
            is_active: false,
            current_plan: 'business',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          claude_gui: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          chatgpt_gui: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          gemini: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          v0_vercel: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            has_vercel_pro_infrastructure_active: false,
            current_monthly_spend_usd: 0,
          },
          anthropic_api: {
            is_active: false,
            primary_model_used: 'sonnet',
            average_monthly_token_volume_millions: 0,
            is_workload_asynchronous: false,
            requires_us_data_residency: false,
            current_monthly_spend_usd: 0,
          },
          openai_api: {
            is_active: false,
            primary_model_used: 'gpt_5_4',
            average_monthly_token_volume_millions: 0,
            is_workload_asynchronous: false,
            requires_us_data_residency: false,
            current_monthly_spend_usd: 0,
          },
        },
      };

      // Mock AuditService to throw error
      (AuditService as jest.MockedClass<typeof AuditService>).mockImplementation(
        () => ({
          executeAudit: jest
            .fn()
            .mockRejectedValue(new Error('Audit execution failed')),
        } as any),
      );

      const mockRequest = createMockRequest(mockAuditRequest) as any;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SERVICE_ERROR');
    });

    it('should return 500 on database persistence failure', async () => {
      // Arrange
      const mockAuditRequest: AuditRequest = {
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
            number_of_seats: 10,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 200,
          },
          github_copilot: {
            is_active: false,
            current_plan: 'business',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          claude_gui: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          chatgpt_gui: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          gemini: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            billing_cycle: 'monthly',
            current_monthly_spend_usd: 0,
          },
          v0_vercel: {
            is_active: false,
            current_plan: 'free',
            number_of_seats: 1,
            has_vercel_pro_infrastructure_active: false,
            current_monthly_spend_usd: 0,
          },
          anthropic_api: {
            is_active: false,
            primary_model_used: 'sonnet',
            average_monthly_token_volume_millions: 0,
            is_workload_asynchronous: false,
            requires_us_data_residency: false,
            current_monthly_spend_usd: 0,
          },
          openai_api: {
            is_active: false,
            primary_model_used: 'gpt_5_4',
            average_monthly_token_volume_millions: 0,
            is_workload_asynchronous: false,
            requires_us_data_residency: false,
            current_monthly_spend_usd: 0,
          },
        },
      };

      const mockAuditResult: AuditResult = {
        audit_id: 'temp-id',
        findings: [],
        total_monthly_savings_usd: 0,
        total_annual_savings_usd: 0,
        audit_tag: 'optimal',
        ai_summary: 'Mock AI summary for all audits',
        created_at: new Date(),
      };

      // Mock AuditService to succeed
      (AuditService as jest.MockedClass<typeof AuditService>).mockImplementation(
        () => ({
          executeAudit: jest.fn().mockResolvedValue(mockAuditResult),
        } as any),
      );

      // Mock database to fail
      (queriesModule.createAudit as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      const mockRequest = createMockRequest(mockAuditRequest) as any;

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SERVICE_ERROR');
    });
  });
});
