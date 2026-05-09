/**
 * @jest-environment node
 * GET /api/audits/:id Integration Tests
 * Tests audit retrieval by ID and error handling
 */

import { GET } from './route';
import * as queriesModule from '@/lib/db/queries';
import { Audit } from '@/lib/db/schema';

// Mock modules
jest.mock('@/lib/db/queries');

// Mock NextRequest
const createMockRequest = () => ({
  url: 'http://localhost:3000/api/audits/test-id',
});

describe('GET /api/audits/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should return audit when found', async () => {
      // Arrange
      const mockAudit: Audit = {
        id: 'test-audit-id-123',
        tools_json: {
          global_context: {
            total_team_size: 10,
            primary_use_case: 'coding',
            security_requirements: {
              saml_sso_required: false,
              scim_automated_provisioning_required: false,
              strict_data_privacy_no_training_required: false,
            },
          },
          current_stack: {},
        } as any,
        results_json: {
          audit_id: 'test-audit-id-123',
          findings: [],
          total_monthly_savings_usd: 100,
          total_annual_savings_usd: 1200,
          audit_tag: 'medium',
          created_at: new Date(),
        } as any,
        tag: 'medium',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (queriesModule.getAuditById as jest.Mock).mockResolvedValue(mockAudit);

      const mockRequest = createMockRequest() as any;

      // Act
      const response = await GET(mockRequest, {
        params: { id: 'test-audit-id-123' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('test-audit-id-123');
      expect(data.data.tag).toBe('medium');
      expect(queriesModule.getAuditById).toHaveBeenCalledWith(
        'test-audit-id-123',
      );
    });
  });

  describe('Validation Error Cases', () => {
    it('should return 400 on invalid UUID format', async () => {
      // Arrange
      const mockRequest = createMockRequest() as any;

      // Act
      const response = await GET(mockRequest, {
        params: { id: 'not-a-valid-uuid' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(queriesModule.getAuditById).not.toHaveBeenCalled();
    });
  });

  describe('Not Found Cases', () => {
    it('should return 404 when audit not found', async () => {
      // Arrange
      (queriesModule.getAuditById as jest.Mock).mockResolvedValue(undefined);

      const mockRequest = createMockRequest() as any;

      // Act
      const response = await GET(mockRequest, {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Service Error Cases', () => {
    it('should return 500 on database query failure', async () => {
      // Arrange
      (queriesModule.getAuditById as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      const mockRequest = createMockRequest() as any;

      // Act
      const response = await GET(mockRequest, {
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SERVICE_ERROR');
    });
  });
});
