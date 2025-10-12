import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
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

describe('POST /webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

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
      const mockSignature = 't=1234567890,v1=valid_signature';

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);
      vi.mocked(practiceModel.createPractice).mockResolvedValue({ id: 'practice_123' });
      vi.mocked(settingsModel.createDefaultSettings).mockResolvedValue({ id: 'settings_123' });
      vi.mocked(eventsModel.insertEvent).mockResolvedValue({ id: 'event_123' });
      vi.mocked(eventsModel.getEventByStripeId).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'content-type': 'application/json'
        },
        body: mockRawBody
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
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
              // name and phone missing
            }
          }
        }
      };

      const mockRawBody = JSON.stringify(mockStripeEvent);
      const mockSignature = 't=1234567890,v1=valid_signature';

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);
      vi.mocked(practiceModel.createPractice).mockResolvedValue({ id: 'practice_123' });
      vi.mocked(settingsModel.createDefaultSettings).mockResolvedValue({ id: 'settings_123' });
      vi.mocked(eventsModel.insertEvent).mockResolvedValue({ id: 'event_123' });
      vi.mocked(eventsModel.getEventByStripeId).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'content-type': 'application/json'
        },
        body: mockRawBody
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
      expect(practiceModel.createPractice).toHaveBeenCalledWith({
        name: null,
        email: 'john@dentalclinic.com',
        phone: null,
        status: 'provisioning'
      });
    });
  });

  describe('Invalid signature is rejected', () => {
    it('should return 400 for invalid signature', async () => {
      // Arrange
      const mockRawBody = JSON.stringify({});
      const mockSignature = 't=1234567890,v1=invalid_signature';

      vi.mocked(stripeUtils.verifyWebhookSignature).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost:3000/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'content-type': 'application/json'
        },
        body: mockRawBody
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      expect(practiceModel.createPractice).not.toHaveBeenCalled();
      expect(settingsModel.createDefaultSettings).not.toHaveBeenCalled();
      expect(eventsModel.insertEvent).not.toHaveBeenCalled();
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
      const mockSignature = 't=1234567890,v1=valid_signature';

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);
      vi.mocked(eventsModel.getEventByStripeId).mockResolvedValue({ id: 'existing_event' });

      const request = new NextRequest('http://localhost:3000/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'content-type': 'application/json'
        },
        body: mockRawBody
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
      expect(practiceModel.createPractice).not.toHaveBeenCalled();
      expect(settingsModel.createDefaultSettings).not.toHaveBeenCalled();
      expect(eventsModel.insertEvent).not.toHaveBeenCalled();
    });
  });

  describe('Unhandled event type is safely ignored', () => {
    it('should return 200 for non-checkout events without creating practice', async () => {
      // Arrange
      const mockStripeEvent = {
        id: 'evt_1234567890',
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_1234567890'
          }
        }
      };

      const mockRawBody = JSON.stringify(mockStripeEvent);
      const mockSignature = 't=1234567890,v1=valid_signature';

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);

      const request = new NextRequest('http://localhost:3000/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'content-type': 'application/json'
        },
        body: mockRawBody
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
      expect(practiceModel.createPractice).not.toHaveBeenCalled();
      expect(settingsModel.createDefaultSettings).not.toHaveBeenCalled();
      expect(eventsModel.insertEvent).not.toHaveBeenCalled();
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
      const mockSignature = 't=1234567890,v1=valid_signature';

      vi.mocked(stripeUtils.verifyWebhookSignature).mockReturnValue(mockStripeEvent);
      vi.mocked(eventsModel.getEventByStripeId).mockResolvedValue(null);
      vi.mocked(practiceModel.createPractice).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': mockSignature,
          'content-type': 'application/json'
        },
        body: mockRawBody
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(500);
    });
  });
});