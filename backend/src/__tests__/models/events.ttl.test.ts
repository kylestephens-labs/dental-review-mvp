import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTTLStartEvent, getTTLStartEventByStripeId, insertEvent } from '../../models/events';

// Mock database
vi.mock('../../config/database', () => ({
  pool: vi.fn(() => ({
    query: vi.fn()
  }))
}));

describe('Events Model - TTL Instrumentation', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: vi.fn()
    };
  });

  describe('getTTLStartEvent', () => {
    it('should retrieve TTL start event for a practice', async () => {
      const mockEvent = {
        id: 'event-123',
        practice_id: 'practice-123',
        type: 'stripe_checkout_at',
        actor: 'system',
        payload_json: {
          stripe_event_id: 'evt_test_123',
          stripe_session_id: 'cs_test_123',
          customer_email: 'test@example.com'
        },
        occurred_at: new Date('2024-01-01T12:00:00Z'),
        ip_hash: null,
        ua_hash: null
      };

      mockClient.query.mockResolvedValue({
        rows: [mockEvent]
      });

      // Mock the pool function to return our mock client
      const { pool } = await import('../../config/database');
      vi.mocked(pool).mockReturnValue(mockClient as any);

      const result = await getTTLStartEvent('practice-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM events'),
        ['practice-123', 'stripe_checkout_at']
      );
      expect(result).toEqual(mockEvent);
    });

    it('should return null when no TTL start event exists', async () => {
      mockClient.query.mockResolvedValue({
        rows: []
      });

      // Mock the pool function to return our mock client
      const { pool } = await import('../../config/database');
      vi.mocked(pool).mockReturnValue(mockClient as any);

      const result = await getTTLStartEvent('practice-456');

      expect(result).toBeNull();
    });

    it('should return the earliest TTL start event when multiple exist', async () => {
      const mockEvents = [
        {
          id: 'event-2',
          practice_id: 'practice-123',
          type: 'stripe_checkout_at',
          occurred_at: new Date('2024-01-02T12:00:00Z')
        },
        {
          id: 'event-1',
          practice_id: 'practice-123',
          type: 'stripe_checkout_at',
          occurred_at: new Date('2024-01-01T12:00:00Z')
        }
      ];

      mockClient.query.mockResolvedValue({
        rows: [mockEvents[1]] // Should return the earliest one
      });

      // Mock the pool function to return our mock client
      const { pool } = await import('../../config/database');
      vi.mocked(pool).mockReturnValue(mockClient as any);

      const result = await getTTLStartEvent('practice-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM events'),
        ['practice-123', 'stripe_checkout_at']
      );
      expect(result).toEqual(mockEvents[1]);
    });
  });

  describe('insertEvent - TTL Event', () => {
    it('should insert TTL start event with correct structure', async () => {
      const mockEvent = {
        id: 'event-123',
        practice_id: 'practice-123',
        type: 'stripe_checkout_at',
        actor: 'system',
        payload_json: {
          stripe_event_id: 'evt_test_123',
          stripe_session_id: 'cs_test_123',
          customer_email: 'test@example.com'
        },
        occurred_at: new Date('2024-01-01T12:00:00Z'),
        ip_hash: null,
        ua_hash: null
      };

      mockClient.query.mockResolvedValue({
        rows: [mockEvent]
      });

      const eventData = {
        practice_id: 'practice-123',
        type: 'stripe_checkout_at',
        actor: 'system',
        payload_json: {
          stripe_event_id: 'evt_test_123',
          stripe_session_id: 'cs_test_123',
          customer_email: 'test@example.com'
        }
      };

      const result = await insertEvent(eventData, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO events'),
        [
          'practice-123',
          'stripe_checkout_at',
          'system',
          JSON.stringify({
            stripe_event_id: 'evt_test_123',
            stripe_session_id: 'cs_test_123',
            customer_email: 'test@example.com'
          }),
          null,
          null
        ]
      );
      expect(result).toEqual(mockEvent);
    });
  });

  describe('getTTLStartEventByStripeId', () => {
    it('should return TTL start event when found by Stripe event ID', async () => {
      const mockEvent = {
        id: 'evt_123',
        practice_id: 'practice_123',
        type: 'stripe_checkout_at',
        actor: 'system',
        payload_json: {
          stripe_event_id: 'evt_test_123',
          stripe_session_id: 'cs_test_123',
          customer_email: 'test@example.com'
        },
        occurred_at: new Date('2023-01-01T00:00:00Z')
      };

      const { pool } = await import('../../config/database');
      vi.mocked(pool).mockReturnValue(mockClient as any);
      mockClient.query.mockResolvedValue({ rows: [mockEvent] });

      const result = await getTTLStartEventByStripeId('evt_test_123');

      expect(result).toEqual(mockEvent);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM events'),
        ['evt_test_123']
      );
    });

    it('should return null when no TTL start event found', async () => {
      const { pool } = await import('../../config/database');
      vi.mocked(pool).mockReturnValue(mockClient as any);
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await getTTLStartEventByStripeId('evt_nonexistent');

      expect(result).toBeNull();
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM events'),
        ['evt_nonexistent']
      );
    });
  });
});
