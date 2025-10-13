import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { POST } from '../../api/webhooks/stripe';
import * as stripeUtils from '../../utils/stripe';
import * as practiceModel from '../../models/practices';
import * as settingsModel from '../../models/settings';
import * as eventsModel from '../../models/events';

// Mock dependencies
vi.mock('../../utils/stripe');
vi.mock('../../models/practices');
vi.mock('../../models/settings');
vi.mock('../../models/events');

// Mock the database pool to prevent real connections
vi.mock('../../config/database', () => ({
  pool: vi.fn().mockReturnValue({
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn()
    })
  })
}));

describe('POST /webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Helper function to create mock Express request/response
  const createMockReqRes = (body: any, headers: Record<string, string> = {}) => {
    const req = {
      body,
      headers: {
        'stripe-signature': 't=1234567890,v1=valid_signature',
        ...headers
      }
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    } as unknown as Response;

    return { req, res };
  };

  describe('Happy path - verified payload creates practice and logs event', () => {
    it('should create practice and settings on valid checkout.session.completed event', async () => {
      // Arrange
      const mockStripeEvent = {
        id: 'evt_1234567890',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_1234567890',
            customer_details: {
              name: 'Dr. John Smith',
              email: 'john@dentalclinic.com',
              phone: '+1234567890'
            },
            metadata: {
              guarantee_live_48h: 'true',
              guarantee_plus10_reviews_30d: 'true'
            }
          }
        }
      };

      const mockRawBody = JSON.stringify(mockStripeEvent);
      const { req, res } = createMockReqRes(mockRawBody);

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);
      vi.mocked(practiceModel.createPractice).mockResolvedValue({ id: 'practice_123' });
      vi.mocked(settingsModel.createDefaultSettings).mockResolvedValue({ practice_id: 'practice_123' });
      vi.mocked(eventsModel.insertEvent).mockResolvedValue({ id: 'event_123' });
      vi.mocked(eventsModel.getEventByStripeId).mockResolvedValue(null);

      // Act
      await POST(req, res);

      // Assert
      expect(stripeUtils.verifyWebhookSignature).toHaveBeenCalledWith(mockRawBody, 't=1234567890,v1=valid_signature');
      expect(practiceModel.createPractice).toHaveBeenCalledWith({
        name: 'Dr. John Smith',
        email: 'john@dentalclinic.com',
        phone: '+1234567890',
        status: 'provisioning'
      });
      expect(settingsModel.createDefaultSettings).toHaveBeenCalledWith('practice_123', {
        billing_json: mockStripeEvent.data.object
      });
      expect(eventsModel.insertEvent).toHaveBeenCalledWith({
        practice_id: 'practice_123',
        type: 'stripe_checkout',
        actor: 'system',
        payload_json: {
          stripe_event_id: 'evt_1234567890',
          session_id: 'cs_1234567890',
          customer_email: 'john@dentalclinic.com'
        }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle missing optional fields gracefully', async () => {
      // Arrange
      const mockStripeEvent = {
        id: 'evt_1234567890',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_1234567890',
            customer_details: {
              email: 'john@dentalclinic.com'
              // name and phone are missing
            }
          }
        }
      };

      const mockRawBody = JSON.stringify(mockStripeEvent);
      const { req, res } = createMockReqRes(mockRawBody);

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);
      vi.mocked(practiceModel.createPractice).mockResolvedValue({ id: 'practice_123' });
      vi.mocked(settingsModel.createDefaultSettings).mockResolvedValue({ practice_id: 'practice_123' });
      vi.mocked(eventsModel.insertEvent).mockResolvedValue({ id: 'event_123' });
      vi.mocked(eventsModel.getEventByStripeId).mockResolvedValue(null);

      // Act
      await POST(req, res);

      // Assert
      expect(practiceModel.createPractice).toHaveBeenCalledWith({
        name: 'john@dentalclinic.com', // Should use email as fallback
        email: 'john@dentalclinic.com',
        phone: null,
        status: 'provisioning'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('Invalid signature is rejected', () => {
    it('should return 400 for invalid signature', async () => {
      // Arrange
      const { req, res } = createMockReqRes('{}', { 'stripe-signature': 'invalid' });

      vi.mocked(stripeUtils.verifyWebhookSignature).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act
      await POST(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });

    it('should return 400 for missing signature', async () => {
      // Arrange
      const { req, res } = createMockReqRes('{}', {}); // No stripe-signature header

      // Act
      await POST(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid webhook payload' });
    });
  });

  describe('Idempotent handling of duplicate delivery', () => {
    it('should not create duplicate practice for same Stripe event ID', async () => {
      // Arrange
      const mockStripeEvent = {
        id: 'evt_1234567890',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_1234567890',
            customer_details: {
              name: 'Dr. John Smith',
              email: 'john@dentalclinic.com'
            }
          }
        }
      };

      const mockRawBody = JSON.stringify(mockStripeEvent);
      const { req, res } = createMockReqRes(mockRawBody);

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);
      vi.mocked(eventsModel.getEventByStripeId).mockResolvedValue({ id: 'existing_event' });

      // Act
      await POST(req, res);

      // Assert
      expect(practiceModel.createPractice).not.toHaveBeenCalled();
      expect(settingsModel.createDefaultSettings).not.toHaveBeenCalled();
      expect(eventsModel.insertEvent).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('Unhandled event type is safely ignored', () => {
    it('should return 200 for non-checkout events without creating practice', async () => {
      // Arrange
      const mockStripeEvent = {
        id: 'evt_1234567890',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_1234567890'
          }
        }
      };

      const mockRawBody = JSON.stringify(mockStripeEvent);
      const { req, res } = createMockReqRes(mockRawBody);

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);
      vi.mocked(eventsModel.getEventByStripeId).mockResolvedValue(null);

      // Act
      await POST(req, res);

      // Assert
      expect(practiceModel.createPractice).not.toHaveBeenCalled();
      expect(settingsModel.createDefaultSettings).not.toHaveBeenCalled();
      expect(eventsModel.insertEvent).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('Error handling', () => {
    it('should return 500 and log error when database operation fails', async () => {
      // Arrange
      const mockStripeEvent = {
        id: 'evt_1234567890',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_1234567890',
            customer_details: {
              name: 'Dr. John Smith',
              email: 'john@dentalclinic.com'
            }
          }
        }
      };

      const mockRawBody = JSON.stringify(mockStripeEvent);
      const { req, res } = createMockReqRes(mockRawBody);

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);
      vi.mocked(eventsModel.getEventByStripeId).mockResolvedValue(null);
      vi.mocked(practiceModel.createPractice).mockRejectedValue(new Error('Database connection failed'));

      // Act
      await POST(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});