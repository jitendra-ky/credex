/**
 * POST /api/leads/send-otp Integration Tests
 * Tests the route handler: validation → OtpService delegation → response shape
 */

import { POST } from '../route';
import { OtpService } from '@/features/leads/services/OtpService';
import { OtpCooldownError, ValidationError } from '@/lib/api/errors';

jest.mock('@/features/leads/services/OtpService');

const createMockRequest = (body: unknown) =>
  ({
    json: async () => body,
    headers: new Map(),
  } as any);

describe('POST /api/leads/send-otp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and cooldown_seconds on success', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          sendOtp: jest.fn().mockResolvedValue(undefined),
        } as any),
    );

    const req = createMockRequest({ email: 'test@example.com' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cooldown_seconds).toBe(300);
  });

  it('should return 400 for invalid email', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          sendOtp: jest.fn(),
        } as any),
    );

    const req = createMockRequest({ email: 'not-an-email' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 429 when OTP is on cooldown', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          sendOtp: jest.fn().mockRejectedValue(new OtpCooldownError(180)),
        } as any),
    );

    const req = createMockRequest({ email: 'test@example.com' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('OTP_COOLDOWN');
    expect(data.error.details.retry_after_seconds).toBe(180);
  });

  it('should return 400 when email is missing', async () => {
    const mockOtpService = OtpService as jest.MockedClass<typeof OtpService>;
    mockOtpService.mockImplementation(
      () =>
        ({
          sendOtp: jest.fn(),
        } as any),
    );

    const req = createMockRequest({});
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
          sendOtp: jest.fn().mockRejectedValue(new Error('DB is down')),
        } as any),
    );

    const req = createMockRequest({ email: 'test@example.com' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });
});
