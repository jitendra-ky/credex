/**
 * POST /api/leads/verify-otp Integration Tests
 * Tests the route handler: validation → OTP verify → lead capture → response
 */

import { POST } from '../route';
import { OtpService } from '@/features/leads/services/OtpService';
import { LeadService } from '@/features/leads/services/LeadService';
import {
  OtpInvalidError,
  OtpExpiredError,
  OtpLockedError,
  OtpNotFoundError,
} from '@/lib/api/errors';

jest.mock('@/features/leads/services/OtpService');
jest.mock('@/features/leads/services/LeadService');
jest.mock('@/lib/db/queries');

const mockLeadResult = {
  id: 'lead-123',
  email: 'test@example.com',
  company_name: 'Acme',
  role: 'CTO',
  audit_id: null,
  created_at: new Date(),
  updated_at: new Date(),
  is_new: true,
};

const createMockRequest = (body: unknown, headers: Record<string, string> = {}) =>
  ({
    json: async () => body,
    headers: new Map(Object.entries(headers)),
  } as any);

const validBody = {
  email: 'test@example.com',
  otp_code: '123456',
  company_name: 'Acme',
  role: 'CTO',
};

describe('POST /api/leads/verify-otp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 for new lead after successful OTP verification', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          verifyOtp: jest.fn().mockResolvedValue(undefined),
        } as any),
    );

    const mockLeadService = LeadService as jest.MockedClass<typeof LeadService>;
    mockLeadService.mockImplementation(
      () =>
        ({
          captureLead: jest.fn().mockResolvedValue({ ...mockLeadResult, is_new: true }),
        } as any),
    );

    const req = createMockRequest(validBody);
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.is_new).toBe(true);
    expect(data.data.email).toBe('test@example.com');
  });

  it('should return 200 for returning lead', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          verifyOtp: jest.fn().mockResolvedValue(undefined),
        } as any),
    );

    const mockLeadService = LeadService as jest.MockedClass<typeof LeadService>;
    mockLeadService.mockImplementation(
      () =>
        ({
          captureLead: jest.fn().mockResolvedValue({ ...mockLeadResult, is_new: false }),
        } as any),
    );

    const req = createMockRequest(validBody);
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.is_new).toBe(false);
  });

  it('should return 400 for invalid OTP code', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          verifyOtp: jest.fn().mockRejectedValue(new OtpInvalidError(2)),
        } as any),
    );

    const req = createMockRequest(validBody);
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('OTP_INVALID');
    expect(data.error.details.attempts_remaining).toBe(2);
  });

  it('should return 400 for expired OTP', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          verifyOtp: jest.fn().mockRejectedValue(new OtpExpiredError()),
        } as any),
    );

    const req = createMockRequest(validBody);
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('OTP_EXPIRED');
  });

  it('should return 429 for locked OTP (max attempts)', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          verifyOtp: jest.fn().mockRejectedValue(new OtpLockedError()),
        } as any),
    );

    const req = createMockRequest(validBody);
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error.code).toBe('OTP_LOCKED');
  });

  it('should return 404 when no OTP exists', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          verifyOtp: jest.fn().mockRejectedValue(new OtpNotFoundError()),
        } as any),
    );

    const req = createMockRequest(validBody);
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('OTP_NOT_FOUND');
  });

  it('should return 400 for invalid request body (non-6-digit code)', async () => {
    const req = createMockRequest({ ...validBody, otp_code: '12' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for missing email', async () => {
    const req = createMockRequest({ otp_code: '123456' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 500 on unexpected errors', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          verifyOtp: jest.fn().mockRejectedValue(new Error('Unexpected')),
        } as any),
    );

    const req = createMockRequest(validBody);
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });
});
