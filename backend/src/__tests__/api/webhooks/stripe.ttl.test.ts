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
  getEventByStripeId: vi.fn(),
  getTTLStartEventByStripeId: vi.fn()
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

describe('POST /webhooks/stripe - TTL Instrumentation', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: vi.Mock;
  let mockJson: vi.Mock;
  let mockClient: any;

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

    // Mock database client with proper transaction handling
    mockClient = {
      query: vi.fn().mockResolvedValue({}),
      connect: vi.fn(),
      release: vi.fn()
    };
    mockClient.connect.mockResolvedValue(mockClient);

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('TTL Start Event Recording', () => {
    it('should record stripe_checkout_at event on successful checkout', async () => {
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
      vi.mocked(pool).mockReturnValue(mockClient as any);

      await POST(mockReq as Request, mockRes as Response);

      // Verify TTL start event was recorded
      expect(insertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          practice_id: 'practice-123',
          type: 'stripe_checkout_at',
          actor: 'system',
          payload_json: expect.objectContaining({
            stripe_event_id: 'evt_test_123',
            stripe_session_id: 'cs_test_123',
            customer_email: 'test@example.com'
          })
        }),
        mockClient
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ received: true });
    });

    it('should not create duplicate stripe_checkout_at events for same session', async () => {
      const mockSession = {
        id: 'cs_test_123',
        customer_details: {
          name: 'Test Practice',
          email: 'test@example.com'
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

      // Mock existing event to simulate duplicate
      const { getEventByStripeId } = await import('../../../models/events');
      vi.mocked(getEventByStripeId).mockResolvedValue({
        id: 'existing-event-123',
        practice_id: 'practice-123',
        type: 'stripe_checkout',
        actor: 'system',
        payload_json: { stripe_event_id: 'evt_test_123' },
        occurred_at: new Date(),
        ip_hash: null,
        ua_hash: null
      });

      const { pool } = await import('../../../config/database');
      vi.mocked(pool).mockReturnValue(mockClient as any);

      await POST(mockReq as Request, mockRes as Response);

      // Verify no new events were created
      const { insertEvent } = await import('../../../models/events');
      expect(insertEvent).not.toHaveBeenCalled();

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ received: true });
    });

    it('should not create duplicate events when TTL start event already exists', async () => {
      const mockSession = {
        id: 'cs_test_456',
        customer_details: {
          name: 'Test Practice 2',
          email: 'test2@example.com'
        }
      };

      const mockStripeEvent = {
        id: 'evt_test_456',
        type: 'checkout.session.completed',
        data: { object: mockSession }
      };

      // Mock Stripe signature verification
      const { verifyWebhookSignature } = await import('../../../utils/stripe');
      vi.mocked(verifyWebhookSignature).mockReturnValue(mockStripeEvent);

      // Mock no existing stripe_checkout event but existing TTL event
      const { getEventByStripeId, getTTLStartEventByStripeId } = await import('../../../models/events');
      vi.mocked(getEventByStripeId).mockResolvedValue(null);
      vi.mocked(getTTLStartEventByStripeId).mockResolvedValue({
        id: 'existing-ttl-event-456',
        practice_id: 'practice-456',
        type: 'stripe_checkout_at',
        actor: 'system',
        payload_json: { stripe_event_id: 'evt_test_456' },
        occurred_at: new Date(),
        ip_hash: null,
        ua_hash: null
      });

      const { pool } = await import('../../../config/database');
      vi.mocked(pool).mockReturnValue(mockClient as any);

      await POST(mockReq as Request, mockRes as Response);

      // Verify no new events were created
      const { insertEvent } = await import('../../../models/events');
      expect(insertEvent).not.toHaveBeenCalled();

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ received: true });
    });

    it('should include correct payload structure in stripe_checkout_at event', async () => {
      const mockSession = {
        id: 'cs_test_456',
        customer_details: {
          name: 'Another Practice',
          email: 'another@example.com',
          phone: '+1987654321'
        }
      };

      const mockStripeEvent = {
        id: 'evt_test_456',
        type: 'checkout.session.completed',
        data: { object: mockSession }
      };

      // Mock Stripe signature verification
      const { verifyWebhookSignature } = await import('../../../utils/stripe');
      vi.mocked(verifyWebhookSignature).mockReturnValue(mockStripeEvent);

      // Mock database operations
      const mockPractice = { id: 'practice-456', name: 'Another Practice' };
      const { createPractice } = await import('../../../models/practices');
      const { createDefaultSettings } = await import('../../../models/settings');
      const { createToken } = await import('../../../models/onboarding_tokens');
      const { sesClient } = await import('../../../client/ses');
      const { insertEvent, getEventByStripeId, getTTLStartEventByStripeId } = await import('../../../models/events');
      const { generateMagicLinkToken } = await import('../../../utils/hmac_token');
      const { pool } = await import('../../../config/database');

      vi.mocked(createPractice).mockResolvedValue(mockPractice);
      vi.mocked(createDefaultSettings).mockResolvedValue({});
      vi.mocked(createToken).mockResolvedValue({ token: {}, tokenId: 'token-456' });
      vi.mocked(sesClient.sendMagicLinkEmail).mockResolvedValue({ success: true, messageId: 'msg-456' });
      vi.mocked(insertEvent).mockResolvedValue({});
      vi.mocked(getEventByStripeId).mockResolvedValue(null);
      vi.mocked(getTTLStartEventByStripeId).mockResolvedValue(null);
      vi.mocked(generateMagicLinkToken).mockReturnValue('magic-link-token-456');
      vi.mocked(pool).mockReturnValue(mockClient as any);

      await POST(mockReq as Request, mockRes as Response);

      // Verify TTL start event payload structure
      expect(insertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          practice_id: 'practice-456',
          type: 'stripe_checkout_at',
          actor: 'system',
          payload_json: {
            stripe_event_id: 'evt_test_456',
            stripe_session_id: 'cs_test_456',
            customer_email: 'another@example.com',
            customer_id: undefined, // Should be included if available
            practice_name: 'Another Practice'
          }
        }),
        mockClient
      );
    });

    it('should handle missing customer details gracefully', async () => {
      const mockSession = {
        id: 'cs_test_789',
        customer_details: null
      };

      const mockStripeEvent = {
        id: 'evt_test_789',
        type: 'checkout.session.completed',
        data: { object: mockSession }
      };

      // Mock Stripe signature verification
      const { verifyWebhookSignature } = await import('../../../utils/stripe');
      vi.mocked(verifyWebhookSignature).mockReturnValue(mockStripeEvent);

      // Mock database operations
      const mockPractice = { id: 'practice-789', name: 'Unknown Practice' };
      const { createPractice } = await import('../../../models/practices');
      const { createDefaultSettings } = await import('../../../models/settings');
      const { createToken } = await import('../../../models/onboarding_tokens');
      const { sesClient } = await import('../../../client/ses');
      const { insertEvent, getEventByStripeId, getTTLStartEventByStripeId } = await import('../../../models/events');
      const { generateMagicLinkToken } = await import('../../../utils/hmac_token');
      const { pool } = await import('../../../config/database');

      vi.mocked(createPractice).mockResolvedValue(mockPractice);
      vi.mocked(createDefaultSettings).mockResolvedValue({});
      vi.mocked(createToken).mockResolvedValue({ token: {}, tokenId: 'token-789' });
      vi.mocked(sesClient.sendMagicLinkEmail).mockResolvedValue({ success: true, messageId: 'msg-789' });
      vi.mocked(insertEvent).mockResolvedValue({});
      vi.mocked(getEventByStripeId).mockResolvedValue(null);
      vi.mocked(getTTLStartEventByStripeId).mockResolvedValue(null);
      vi.mocked(generateMagicLinkToken).mockReturnValue('magic-link-token-789');
      vi.mocked(pool).mockReturnValue(mockClient as any);

      await POST(mockReq as Request, mockRes as Response);

      // Verify TTL start event with minimal payload
      expect(insertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          practice_id: 'practice-789',
          type: 'stripe_checkout_at',
          actor: 'system',
          payload_json: {
            stripe_event_id: 'evt_test_789',
            stripe_session_id: 'cs_test_789',
            customer_email: undefined,
            customer_id: undefined,
            practice_name: 'Unknown Practice'
          }
        }),
        mockClient
      );
    });
  });

  describe('Error Handling', () => {
    it('should not record TTL event on invalid signature', async () => {
      const { verifyWebhookSignature } = await import('../../../utils/stripe');
      vi.mocked(verifyWebhookSignature).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await POST(mockReq as Request, mockRes as Response);

      const { insertEvent } = await import('../../../models/events');
      expect(insertEvent).not.toHaveBeenCalled();

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });

    it('should not record TTL event on non-checkout events', async () => {
      const mockStripeEvent = {
        id: 'evt_test_999',
        type: 'payment_intent.succeeded',
        data: { object: {} }
      };

      const { verifyWebhookSignature } = await import('../../../utils/stripe');
      vi.mocked(verifyWebhookSignature).mockReturnValue(mockStripeEvent);

      await POST(mockReq as Request, mockRes as Response);

      const { insertEvent } = await import('../../../models/events');
      expect(insertEvent).not.toHaveBeenCalled();

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ received: true });
    });
  });
});
