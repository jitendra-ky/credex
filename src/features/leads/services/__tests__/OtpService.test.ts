/**
 * OtpService Unit Tests
 * Tests: generate, send with cooldown, verify correct/wrong/expired/locked
 */

import { OtpService } from '../OtpService';
import {
  OtpCooldownError,
  OtpExpiredError,
  OtpInvalidError,
  OtpLockedError,
  OtpNotFoundError,
} from '@/lib/api/errors';

// Mock the DB queries and EmailService
jest.mock('@/lib/db/queries');
const mockQueries = require('@/lib/db/queries');

jest.mock('../EmailService', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendOtp: jest.fn().mockResolvedValue(undefined),
    sendLeadConfirmation: jest.fn().mockResolvedValue(undefined),
  })),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeVerification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ver-001',
    email: 'test@example.com',
    otp_code: '123456',
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
    last_sent_at: new Date(Date.now() - 6 * 60 * 1000), // 6 min ago (past cooldown)
    attempts: 0,
    verified_at: null,
    created_at: new Date(),
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OtpService();
  });

  // ── sendOtp ────────────────────────────────────────────────────────────

  describe('sendOtp', () => {
    it('should generate a 6-digit OTP, persist it, and send an email', async () => {
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(undefined);
      mockQueries.deleteVerificationsForEmail.mockResolvedValue(undefined);
      mockQueries.createEmailVerification.mockResolvedValue(makeVerification());

      await service.sendOtp('test@example.com');

      expect(mockQueries.deleteVerificationsForEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockQueries.createEmailVerification).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringMatching(/^\d{6}$/), // 6-digit code
        expect.any(Date),                 // expires_at
      );
    });

    it('should allow sending when previous OTP is past cooldown', async () => {
      // Previous OTP was sent 6 minutes ago — past the 5-min cooldown
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(
        makeVerification({ last_sent_at: new Date(Date.now() - 6 * 60 * 1000) }),
      );
      mockQueries.deleteVerificationsForEmail.mockResolvedValue(undefined);
      mockQueries.createEmailVerification.mockResolvedValue(makeVerification());

      await expect(service.sendOtp('test@example.com')).resolves.toBeUndefined();
    });

    it('should throw OtpCooldownError when within 5-min cooldown', async () => {
      // Previous OTP was sent 2 minutes ago — still within cooldown
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(
        makeVerification({ last_sent_at: new Date(Date.now() - 2 * 60 * 1000) }),
      );

      await expect(service.sendOtp('test@example.com')).rejects.toThrow(
        OtpCooldownError,
      );

      // Should NOT have tried to create a new OTP
      expect(mockQueries.createEmailVerification).not.toHaveBeenCalled();
    });

    it('should delete old verifications before creating a new one', async () => {
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(undefined);
      mockQueries.deleteVerificationsForEmail.mockResolvedValue(undefined);
      mockQueries.createEmailVerification.mockResolvedValue(makeVerification());

      await service.sendOtp('test@example.com');

      // delete must be called BEFORE create
      const deleteOrder = mockQueries.deleteVerificationsForEmail.mock.invocationCallOrder[0];
      const createOrder = mockQueries.createEmailVerification.mock.invocationCallOrder[0];
      expect(deleteOrder).toBeLessThan(createOrder);
    });
  });

  // ── verifyOtp ──────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('should succeed with correct code', async () => {
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(
        makeVerification({ otp_code: '999888' }),
      );
      mockQueries.markVerificationComplete.mockResolvedValue(undefined);

      await expect(
        service.verifyOtp('test@example.com', '999888'),
      ).resolves.toBeUndefined();

      expect(mockQueries.markVerificationComplete).toHaveBeenCalledWith('ver-001');
    });

    it('should throw OtpNotFoundError when no pending verification exists', async () => {
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(undefined);

      await expect(
        service.verifyOtp('test@example.com', '123456'),
      ).rejects.toThrow(OtpNotFoundError);
    });

    it('should throw OtpExpiredError when OTP has expired', async () => {
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(
        makeVerification({
          expires_at: new Date(Date.now() - 1000), // 1 second ago
        }),
      );

      await expect(
        service.verifyOtp('test@example.com', '123456'),
      ).rejects.toThrow(OtpExpiredError);
    });

    it('should throw OtpLockedError after 3 wrong attempts', async () => {
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(
        makeVerification({ attempts: 3 }),
      );

      await expect(
        service.verifyOtp('test@example.com', '000000'),
      ).rejects.toThrow(OtpLockedError);

      // Should NOT have incremented attempts further
      expect(mockQueries.incrementVerificationAttempts).not.toHaveBeenCalled();
    });

    it('should increment attempts and throw OtpInvalidError on wrong code', async () => {
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(
        makeVerification({ otp_code: '999888', attempts: 1 }),
      );
      mockQueries.incrementVerificationAttempts.mockResolvedValue(undefined);

      await expect(
        service.verifyOtp('test@example.com', '000000'),
      ).rejects.toThrow(OtpInvalidError);

      expect(mockQueries.incrementVerificationAttempts).toHaveBeenCalledWith('ver-001');
    });

    it('should report correct attempts remaining on wrong code', async () => {
      // Already 1 attempt, so after this wrong one it'll be 2 used → 1 remaining
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(
        makeVerification({ otp_code: '999888', attempts: 1 }),
      );
      mockQueries.incrementVerificationAttempts.mockResolvedValue(undefined);

      try {
        await service.verifyOtp('test@example.com', '000000');
        fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(OtpInvalidError);
        expect(error.details).toEqual({ attempts_remaining: 1 });
      }
    });

    it('should not mark as complete on wrong code', async () => {
      mockQueries.getLatestVerificationByEmail.mockResolvedValue(
        makeVerification({ otp_code: '999888' }),
      );
      mockQueries.incrementVerificationAttempts.mockResolvedValue(undefined);

      await expect(
        service.verifyOtp('test@example.com', '000000'),
      ).rejects.toThrow();

      expect(mockQueries.markVerificationComplete).not.toHaveBeenCalled();
    });
  });
});
