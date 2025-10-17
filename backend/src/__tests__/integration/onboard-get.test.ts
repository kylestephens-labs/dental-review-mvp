import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { pool } from '../../db';
import { insertEvent } from '../../models/events';

// Mock the database pool
vi.mock('../../db', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn()
  }
}));

// Mock the event insertion
vi.mock('../../models/events', () => ({
  insertEvent: vi.fn()
}));

describe('GET /onboard/:token Integration Tests', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      release: vi.fn()
    };
    
    vi.mocked(pool.connect).mockResolvedValue(mockClient);
    vi.mocked(insertEvent).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform no database writes for valid token', async () => {
    // Mock successful database queries
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'token-123',
          practice_id: 'practice-123',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          used_at: null,
          created_at: new Date()
        }]
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'practice-123',
          name: 'Test Practice',
          email: 'test@example.com',
          phone: '+1234567890',
          city: 'Test City',
          tz: 'America/Los_Angeles',
          status: 'active',
          created_at: new Date()
        }]
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'settings-123',
          practice_id: 'practice-123',
          review_link: 'https://g.page/test',
          quiet_hours_start: 8,
          quiet_hours_end: 20,
          daily_cap: 50,
          sms_sender: '+1234567890',
          email_sender: 'noreply@example.com',
          default_locale: 'en',
          brand_assets_json: null,
          billing_json: null,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

    const response = await request(app)
      .get('/api/onboard/valid-token')
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.practice).toBeDefined();
    expect(response.body.settings).toBeDefined();

    // Verify that insertEvent was called only once for the onboarding_started event
    expect(insertEvent).toHaveBeenCalledTimes(1);
    expect(insertEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        practice_id: 'practice-123',
        type: 'onboarding_started',
        actor: 'system'
      }),
      mockClient
    );

    // Verify no other database writes occurred
    expect(mockClient.query).toHaveBeenCalledTimes(3); // token validation, practice fetch, settings fetch
  });

  it('should perform no database writes for invalid token', async () => {
    // Mock token not found
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get('/api/onboard/invalid-token')
      .set('Accept', 'application/json');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Invalid token');

    // Verify no database writes occurred
    expect(insertEvent).not.toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledTimes(1); // Only token validation query
  });

  it('should perform no database writes for expired token', async () => {
    // Mock expired token
    mockClient.query.mockResolvedValueOnce({
      rows: [{
        id: 'token-123',
        practice_id: 'practice-123',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        used_at: null,
        created_at: new Date()
      }]
    });

    const response = await request(app)
      .get('/api/onboard/expired-token')
      .set('Accept', 'application/json');

    expect(response.status).toBe(410);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('expired');

    // Verify no database writes occurred
    expect(insertEvent).not.toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledTimes(1); // Only token validation query
  });

  it('should perform no database writes for used token', async () => {
    // Mock used token
    mockClient.query.mockResolvedValueOnce({
      rows: [{
        id: 'token-123',
        practice_id: 'practice-123',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        used_at: new Date(), // Already used
        created_at: new Date()
      }]
    });

    const response = await request(app)
      .get('/api/onboard/used-token')
      .set('Accept', 'application/json');

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('already used');

    // Verify no database writes occurred
    expect(insertEvent).not.toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledTimes(1); // Only token validation query
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    mockClient.query.mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await request(app)
      .get('/api/onboard/error-token')
      .set('Accept', 'application/json');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Internal server error');

    // Verify no database writes occurred
    expect(insertEvent).not.toHaveBeenCalled();
  });

  it('should not perform any UPDATE or INSERT operations beyond event logging', async () => {
    // Mock successful queries
    mockClient.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'token-123',
          practice_id: 'practice-123',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          used_at: null,
          created_at: new Date()
        }]
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'practice-123',
          name: 'Test Practice',
          email: 'test@example.com',
          phone: '+1234567890',
          city: 'Test City',
          tz: 'America/Los_Angeles',
          status: 'active',
          created_at: new Date()
        }]
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'settings-123',
          practice_id: 'practice-123',
          review_link: 'https://g.page/test',
          quiet_hours_start: 8,
          quiet_hours_end: 20,
          daily_cap: 50,
          sms_sender: '+1234567890',
          email_sender: 'noreply@example.com',
          default_locale: 'en',
          brand_assets_json: null,
          billing_json: null,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

    await request(app)
      .get('/api/onboard/valid-token')
      .set('Accept', 'application/json');

    // Verify only SELECT queries were executed (no UPDATE/INSERT)
    const queryCalls = mockClient.query.mock.calls;
    queryCalls.forEach((call: any) => {
      const query = call[0].toLowerCase();
      expect(query).toMatch(/^select\s/i);
    });

    // Verify only one event was logged
    expect(insertEvent).toHaveBeenCalledTimes(1);
  });
});
