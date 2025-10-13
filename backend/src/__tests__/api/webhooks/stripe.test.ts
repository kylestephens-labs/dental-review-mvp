import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { POST } from '../../../api/webhooks/stripe';

// Mock dependencies
vi.mock('../../../utils/stripe', () => ({
  verifyWebhookSignature: vi.fn()
}));
vi.mock('../../../models/practices', () => ({
  createPractice: vi.fn()
}));
vi.mock('../../../models/settings', () => ({
  createDefaultSettings: vi.fn()
}));
vi.mock('../../../models/events', () => ({
  insertEvent: vi.fn(),
  getEventByStripeId: vi.fn()
}));
vi.mock('../../../models/onboarding_tokens', () => ({
  createToken: vi.fn()
}));
vi.mock('../../../utils/hmac_token', () => ({
  generateMagicLinkToken: vi.fn()
}));
vi.mock('../../../client/ses', () => ({
  sesClient: {
    sendMagicLinkEmail: vi.fn()
  }
}));
vi.mock('../../../config/database', () => ({
  pool: vi.fn()
}));

describe('POST /webhooks/stripe', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: vi.Mock;
  let mockJson: vi.Mock;

  beforeEach(() => {
    mockReq = {
      body: Buffer.from('test-body'),
      headers: {
        'stripe-signature': 'test-signature'
      }
    };
    mockJson = vi.fn();
    mockStatus = vi.fn(() => mockRes);
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Error cases', () => {
    it('should return 400 for missing signature', async () => {
      mockReq.headers = {};

      await POST(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Missing Stripe signature' });
    });

    it('should return 400 for invalid signature', async () => {
      const { verifyWebhookSignature } = await import('../../../utils/stripe');
      vi.mocked(verifyWebhookSignature).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await POST(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });

    it('should return 200 for non-checkout events', async () => {
      const mockStripeEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: { object: {} }
      };

      const { verifyWebhookSignature } = await import('../../../utils/stripe');
      vi.mocked(verifyWebhookSignature).mockReturnValue(mockStripeEvent);

      await POST(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('Successful checkout processing', () => {
    it('should create practice, settings, and onboarding token on successful checkout', async () => {
      const mockSession = {
        id: 'cs_test_123',
        customer_details: {
          name: 'Test Practice',
          email: 'test@example.com',
          phone: '+1234567890'
        }
      };

      const mockStripeEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: mockSession }
      };

      // Mock Stripe signature verification
      const { verifyWebhookSignature } = await import('../../../utils/stripe');
      vi.mocked(verifyWebhookSignature).mockReturnValue(mockStripeEvent);

      // Mock database operations
      const mockPractice = { id: 'practice-123', name: 'Test Practice' };
      const mockSettings = { id: 'settings-123', practice_id: 'practice-123' };
      const mockToken = { id: 'token-123', token_id_hash: 'hash-123' };

      const { createPractice } = await import('../../../models/practices');
      const { createDefaultSettings } = await import('../../../models/settings');
      const { createToken } = await import('../../../models/onboarding_tokens');
      const { sesClient } = await import('../../../client/ses');
      const { insertEvent, getEventByStripeId } = await import('../../../models/events');
      const { generateMagicLinkToken } = await import('../../../utils/hmac_token');
      const { pool } = await import('../../../config/database');

      vi.mocked(createPractice).mockResolvedValue(mockPractice);
      vi.mocked(createDefaultSettings).mockResolvedValue(mockSettings);
      vi.mocked(createToken).mockResolvedValue({ token: mockToken, tokenId: 'token-123' });
      vi.mocked(sesClient.sendMagicLinkEmail).mockResolvedValue({ success: true, messageId: 'msg-123' });
      vi.mocked(insertEvent).mockResolvedValue({});
      vi.mocked(getEventByStripeId).mockResolvedValue(null);
      vi.mocked(generateMagicLinkToken).mockReturnValue('magic-link-token');

      // Mock database client with proper transaction handling
      const mockClient = {
        query: vi.fn().mockResolvedValue({}),
        connect: vi.fn(),
        release: vi.fn()
      };
      mockClient.connect.mockResolvedValue(mockClient);
      vi.mocked(pool).mockReturnValue(mockClient as any);

      const result = await POST(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ received: true });
      expect(createPractice).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Practice',
        email: 'test@example.com',
        phone: '+1234567890',
        status: 'provisioning'
      }), mockClient);
      expect(createDefaultSettings).toHaveBeenCalledWith('practice-123', expect.objectContaining({
        billing_json: mockSession
      }), mockClient);
      expect(createToken).toHaveBeenCalledWith({
        practice_id: 'practice-123',
        expiry_days: 7
      }, mockClient);
      expect(sesClient.sendMagicLinkEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test Practice',
        expect.stringContaining('/onboard/')
      );
    });
  });
});
