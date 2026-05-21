/**
 * LeadService Tests
 * Unit tests for lead capture service
 */

import { LeadService } from '../LeadService';
import {
  ValidationError,
  RateLimitError,
  ServiceError,
} from '@/lib/api/errors';

// Mock modules - define mocks inside factory function
jest.mock('@/lib/db/queries');

// Import mocks after jest.mock() call
const mockQueries = require('@/lib/db/queries');

describe('LeadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('captureLead', () => {
    it('should capture lead successfully with valid request', async () => {
      const service = new LeadService();
      const validRequest = {
        email: 'test@example.com',
        company_name: 'Acme Corp',
        role: 'CEO',
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      mockQueries.getLeadByEmail.mockResolvedValue(undefined);
      mockQueries.getLeadsByIpInWindow.mockResolvedValue([]);
      mockQueries.createLeadAudit.mockResolvedValue({});
      mockQueries.upsertLead.mockResolvedValue({
        id: 'lead-123',
        email: 'test@example.com',
        company_name: 'Acme Corp',
        role: 'CEO',
        ip_address: '192.168.1.1',
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.captureLead(validRequest, '192.168.1.1');

      expect(result.email).toBe('test@example.com');
      expect(result.company_name).toBe('Acme Corp');
      expect(result.is_new).toBe(true);
      expect(mockQueries.upsertLead).toHaveBeenCalled();
    });

    it('should throw ValidationError on invalid email', async () => {
      const service = new LeadService();
      const invalidRequest = {
        email: 'invalid-email',
        company_name: 'Acme',
      };

      await expect(
        service.captureLead(invalidRequest, '192.168.1.1'),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw RateLimitError when rate limit exceeded', async () => {
      const service = new LeadService();
      const validRequest = {
        email: 'test@example.com',
        company_name: 'Acme',
      };

      // Mock 5 recent leads to exceed limit
      mockQueries.getLeadsByIpInWindow.mockResolvedValue(
        Array(5).fill({
          id: 'lead',
          email: 'other@example.com',
          company_name: null,
          role: null,
          ip_address: '192.168.1.1',
          audit_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        }),
      );

      await expect(
        service.captureLead(validRequest, '192.168.1.1'),
      ).rejects.toThrow(RateLimitError);
    });

    it('should throw ServiceError on database failure', async () => {
      const service = new LeadService();
      const validRequest = {
        email: 'test@example.com',
      };

      mockQueries.getLeadByEmail.mockResolvedValue(undefined);
      mockQueries.getLeadsByIpInWindow.mockResolvedValue([]);
      mockQueries.upsertLead.mockRejectedValue(new Error('DB error'));

      await expect(
        service.captureLead(validRequest, '192.168.1.1'),
      ).rejects.toThrow(ServiceError);
    });

    it('should trim email and company name', async () => {
      const service = new LeadService();
      const requestWithWhitespace = {
        email: '  test@example.com  ',
        company_name: '  Acme Corp  ',
        role: '  CEO  ',
      };

      mockQueries.getLeadByEmail.mockResolvedValue(undefined);
      mockQueries.getLeadsByIpInWindow.mockResolvedValue([]);
      mockQueries.getLatestAuditIdForLead.mockResolvedValue(null);
      mockQueries.upsertLead.mockResolvedValue({
        id: 'lead-123',
        email: 'test@example.com',
        company_name: 'Acme Corp',
        role: 'CEO',
        ip_address: '192.168.1.1',
        audit_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.captureLead(
        requestWithWhitespace,
        '192.168.1.1',
      );

      expect(result.email).toBe('test@example.com');
      expect(result.company_name).toBe('Acme Corp');
      expect(mockQueries.upsertLead).toHaveBeenCalledWith(
        'test@example.com',
        'Acme Corp',
        'CEO',
        '192.168.1.1',
      );
    });

    it('should send email with audit context when audit_id provided', async () => {
      const service = new LeadService();
      const requestWithAudit = {
        email: 'test@example.com',
        company_name: 'Acme',
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      mockQueries.getLeadByEmail.mockResolvedValue(undefined);
      mockQueries.getLeadsByIpInWindow.mockResolvedValue([]);
      mockQueries.createLeadAudit.mockResolvedValue({});
      mockQueries.upsertLead.mockResolvedValue({
        id: 'lead-123',
        email: 'test@example.com',
        company_name: 'Acme',
        role: null,
        ip_address: '192.168.1.1',
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.captureLead(requestWithAudit, '192.168.1.1');

      expect(result.email).toBe('test@example.com');
      expect(result.audit_id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should handle email sending errors gracefully', async () => {
      const service = new LeadService();
      const validRequest = {
        email: 'test@example.com',
      };

      mockQueries.getLeadByEmail.mockResolvedValue(undefined);
      mockQueries.getLeadsByIpInWindow.mockResolvedValue([]);
      mockQueries.getLatestAuditIdForLead.mockResolvedValue(null);
      mockQueries.upsertLead.mockResolvedValue({
        id: 'lead-123',
        email: 'test@example.com',
        company_name: null,
        role: null,
        ip_address: '192.168.1.1',
        audit_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Should not throw even though email might fail
      const result = await service.captureLead(validRequest, '192.168.1.1');
      expect(result.email).toBe('test@example.com');
    });

    it('should handle null/undefined values in request', async () => {
      const service = new LeadService();
      const minimalRequest = {
        email: 'test@example.com',
        company_name: null,
        role: undefined,
      };

      mockQueries.getLeadByEmail.mockResolvedValue(undefined);
      mockQueries.getLeadsByIpInWindow.mockResolvedValue([]);
      mockQueries.getLatestAuditIdForLead.mockResolvedValue(null);
      mockQueries.upsertLead.mockResolvedValue({
        id: 'lead-123',
        email: 'test@example.com',
        company_name: null,
        role: null,
        ip_address: '192.168.1.1',
        audit_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.captureLead(minimalRequest, '192.168.1.1');

      expect(result.company_name).toBeNull();
      expect(result.role).toBeNull();
      expect(result.audit_id).toBeNull();
    });

    it('should set is_new to false for duplicate email', async () => {
      const service = new LeadService();
      const request = {
        email: 'existing@example.com',
      };

      const existingLead = {
        id: 'existing-id',
        email: 'existing@example.com',
        company_name: 'Old Corp',
        role: null,
        ip_address: '192.168.1.1',
        audit_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQueries.getLeadByEmail.mockResolvedValue(existingLead);
      mockQueries.getLeadsByIpInWindow.mockResolvedValue([]);
      mockQueries.getLatestAuditIdForLead.mockResolvedValue(null);
      mockQueries.upsertLead.mockResolvedValue(existingLead);

      const result = await service.captureLead(request, '192.168.1.1');

      expect(result.is_new).toBe(false);
    });
  });
});
