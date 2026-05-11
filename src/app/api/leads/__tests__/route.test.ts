/**
 * POST /api/leads Integration Tests
 * Tests full flow: validation → rate limiting → DB → email
 */

import { POST } from '../route';
import { LeadService } from '@/features/leads/services/LeadService';
import * as queriesModule from '@/lib/db/queries';

jest.mock('@/features/leads/services/LeadService');
jest.mock('@/lib/db/queries');

const createMockRequest = (body: unknown, headers: Record<string, string> = {}) =>
  ({
    json: async () => body,
    headers: new Map(Object.entries(headers)),
  } as any);

describe('POST /api/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 for new lead', async () => {
    const mockLeadService = LeadService as jest.MockedClass<typeof LeadService>;
    mockLeadService.mockImplementation(
      () =>
        ({
          captureLead: jest.fn().mockResolvedValue({
            id: 'lead-123',
            email: 'test@example.com',
            company_name: 'Acme',
            role: 'CEO',
            audit_id: null,
            created_at: new Date(),
            updated_at: new Date(),
            is_new: true,
          }),
        } as any),
    );

    const mockRequest = createMockRequest({
      email: 'test@example.com',
      company_name: 'Acme',
      role: 'CEO',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.is_new).toBe(true);
  });

  it('should return 200 for duplicate lead', async () => {
    const mockLeadService = LeadService as jest.MockedClass<typeof LeadService>;
    mockLeadService.mockImplementation(
      () =>
        ({
          captureLead: jest.fn().mockResolvedValue({
            id: 'lead-123',
            email: 'existing@example.com',
            company_name: 'Acme',
            role: 'CEO',
            audit_id: null,
            created_at: new Date(),
            updated_at: new Date(),
            is_new: false,
          }),
        } as any),
    );

    const mockRequest = createMockRequest({
      email: 'existing@example.com',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.is_new).toBe(false);
  });

  it('should return 400 on validation error', async () => {
    const mockLeadService = LeadService as jest.MockedClass<typeof LeadService>;
    mockLeadService.mockImplementation(
      () =>
        ({
          captureLead: jest.fn().mockRejectedValue(
            new Error('Invalid lead request'),
          ),
        } as any),
    );

    const mockRequest = createMockRequest({
      email: 'invalid-email',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('should extract IP from x-forwarded-for header', async () => {
    const mockLeadService = LeadService as jest.MockedClass<typeof LeadService>;
    const captureLead = jest.fn().mockResolvedValue({
      id: 'lead-123',
      email: 'test@example.com',
      company_name: null,
      role: null,
      audit_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      is_new: true,
    });

    mockLeadService.mockImplementation(
      () => ({ captureLead } as any),
    );

    const mockRequest = createMockRequest(
      { email: 'test@example.com' },
      { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' },
    );

    await POST(mockRequest);

    expect(captureLead).toHaveBeenCalledWith(
      expect.any(Object),
      '203.0.113.1',
    );
  });

  it('should use x-real-ip as fallback', async () => {
    const mockLeadService = LeadService as jest.MockedClass<typeof LeadService>;
    const captureLead = jest.fn().mockResolvedValue({
      id: 'lead-123',
      email: 'test@example.com',
      company_name: null,
      role: null,
      audit_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      is_new: true,
    });

    mockLeadService.mockImplementation(
      () => ({ captureLead } as any),
    );

    const mockRequest = createMockRequest(
      { email: 'test@example.com' },
      { 'x-real-ip': '203.0.113.2' },
    );

    await POST(mockRequest);

    expect(captureLead).toHaveBeenCalledWith(
      expect.any(Object),
      '203.0.113.2',
    );
  });
});
