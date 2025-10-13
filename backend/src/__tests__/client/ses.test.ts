import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock AWS SDK before importing sesClient
vi.mock('@aws-sdk/client-ses', () => {
  const mockSend = vi.fn();
  return {
    SESClient: vi.fn(() => ({
      send: mockSend
    })),
    SendEmailCommand: vi.fn(),
    getMockSend: () => mockSend
  };
});

// Import after mocking
import { sesClient } from '../../client/ses';

describe('SES Client', () => {
  let mockSend: any;

  beforeEach(async () => {
    // Get the mocked send function
    const sesModule = await import('@aws-sdk/client-ses');
    mockSend = (sesModule as any).getMockSend();

    // Reset mocks
    vi.clearAllMocks();

    // Set environment variables for SES client
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.SES_FROM_EMAIL = 'test@example.com';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.SES_FROM_EMAIL;
  });

  describe('sendMagicLinkEmail', () => {
    it('should send magic link email successfully', async () => {
      mockSend.mockResolvedValueOnce({ MessageId: 'mock-message-id' });

      const result = await sesClient.sendMagicLinkEmail(
        'test@example.com',
        'Test Practice',
        'https://app.example.com/onboard/token123'
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id');
    });

    it('should handle email send failures', async () => {
      mockSend.mockRejectedValueOnce(new Error('SES send failed'));

      const result = await sesClient.sendMagicLinkEmail(
        'test@example.com',
        'Test Practice',
        'https://app.example.com/onboard/token123'
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      expect(result.error).toBe('SES send failed');
      expect(result.retryable).toBe(false);
    });

    it('should return error for invalid email address', async () => {
      const result = await sesClient.sendMagicLinkEmail(
        'invalid-email',
        'Test Practice',
        'https://app.example.com/onboard/token123'
      );

      expect(mockSend).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
      expect(result.retryable).toBe(false);
    });

    it('should handle AWS throttling errors as retryable', async () => {
      const throttlingError = new Error('Rate limit exceeded');
      throttlingError.name = 'ThrottlingException';
      mockSend.mockRejectedValueOnce(throttlingError);

      const result = await sesClient.sendMagicLinkEmail(
        'test@example.com',
        'Test Practice',
        'https://app.example.com/onboard/token123'
      );

      expect(result.success).toBe(false);
      expect(result.retryable).toBe(true);
      expect(result.error).toBe('Rate limit exceeded, please retry later');
    });
  });
});