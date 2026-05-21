/**
 * EmailService Unit Tests
 * Tests: mock provider logs to console, strategy selection via env var
 */

describe('EmailService', () => {
  const originalEnv = process.env.EMAIL_PROVIDER;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Default to mock provider
    process.env.EMAIL_PROVIDER = 'mock';
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.EMAIL_PROVIDER = originalEnv;
    consoleSpy.mockRestore();
  });

  describe('mock provider (EMAIL_PROVIDER=mock)', () => {
    it('should log OTP to console on sendOtp', async () => {
      const { EmailService } = require('../EmailService');
      const service = new EmailService();

      await service.sendOtp('test@example.com', '123456');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('123456'),
      );
    });

    it('should log confirmation to console on sendLeadConfirmation', async () => {
      const { EmailService } = require('../EmailService');
      const service = new EmailService();

      await service.sendLeadConfirmation('test@example.com', 'Acme Corp');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Acme Corp'),
      );
    });

    it('should not throw on sendOtp', async () => {
      const { EmailService } = require('../EmailService');
      const service = new EmailService();

      await expect(
        service.sendOtp('test@example.com', '999999'),
      ).resolves.toBeUndefined();
    });

    it('should not throw on sendLeadConfirmation', async () => {
      const { EmailService } = require('../EmailService');
      const service = new EmailService();

      await expect(
        service.sendLeadConfirmation('test@example.com'),
      ).resolves.toBeUndefined();
    });
  });

  describe('resend provider (EMAIL_PROVIDER=resend)', () => {
    it('should throw if RESEND_API_KEY is not set', () => {
      process.env.EMAIL_PROVIDER = 'resend';
      delete process.env.RESEND_API_KEY;

      const { EmailService } = require('../EmailService');

      // The constructor internally creates the provider which should throw
      // But EmailService wraps errors — the service itself won't throw on construction
      // if the provider constructor throws, it will error on send.
      // Actually, per the implementation, ResendEmailProvider's constructor throws.
      expect(() => new EmailService()).toThrow('RESEND_API_KEY is not set');
    });
  });

  describe('strategy selection', () => {
    it('should default to mock provider when EMAIL_PROVIDER is unset', () => {
      delete process.env.EMAIL_PROVIDER;
      const { EmailService } = require('../EmailService');
      const service = new EmailService();

      // Should work without throwing — mock provider doesn't need API keys
      expect(service).toBeDefined();
    });

    it('should use mock provider when EMAIL_PROVIDER=mock', async () => {
      process.env.EMAIL_PROVIDER = 'mock';
      const { EmailService } = require('../EmailService');
      const service = new EmailService();

      await service.sendOtp('x@test.com', '111111');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL]'),
      );
    });
  });
});
