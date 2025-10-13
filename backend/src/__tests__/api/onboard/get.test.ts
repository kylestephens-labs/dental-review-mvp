import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { GET } from '../../../api/onboard/get';

// Mock dependencies
vi.mock('../../../utils/hmac_token', () => ({
  verifyMagicLinkToken: vi.fn(),
  hashTokenId: vi.fn(),
  parseToken: vi.fn()
}));
vi.mock('../../../models/onboarding_tokens', () => ({
  consumeToken: vi.fn()
}));
vi.mock('../../../models/practices', () => ({
  getPracticeById: vi.fn()
}));
vi.mock('../../../models/settings', () => ({
  getSettingsByPracticeId: vi.fn()
}));
vi.mock('../../../models/events', () => ({
  insertEvent: vi.fn()
}));

describe('GET /onboard/:token', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: any;
  let mockRedirect: any;
  let mockStatus: any;

  beforeEach(() => {
    mockJson = vi.fn();
    mockRedirect = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    
    mockReq = {
      params: { token: 'test-token' },
      headers: {}
    };
    
    mockRes = {
      json: mockJson,
      redirect: mockRedirect,
      status: mockStatus
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Happy path - valid token', () => {
    it('should verify token and return practice data for JSON request', async () => {
      const mockPractice = {
        id: 'practice-123',
        name: 'Test Practice',
        email: 'test@example.com',
        phone: '+1234567890',
        city: 'Test City',
        tz: 'America/Los_Angeles'
      };

      const mockSettings = {
        quiet_hours_start: 8,
        quiet_hours_end: 20,
        daily_cap: 50,
        default_locale: 'en',
        review_link: 'https://g.page/test'
      };

      // Mock the dependencies
      const { parseToken } = await import('../../../utils/hmac_token');
      const { verifyMagicLinkToken, hashTokenId } = await import('../../../utils/hmac_token');
      const { consumeToken } = await import('../../../models/onboarding_tokens');
      const { getPracticeById } = await import('../../../models/practices');
      const { getSettingsByPracticeId } = await import('../../../models/settings');
      const { insertEvent } = await import('../../../models/events');

      vi.mocked(parseToken).mockReturnValue({
        tokenId: 'token-123',
        practiceId: 'practice-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        mac: 'mock-mac'
      });

      vi.mocked(verifyMagicLinkToken).mockReturnValue({
        valid: true,
        tokenId: 'token-123',
        practiceId: 'practice-123'
      });

      vi.mocked(hashTokenId).mockReturnValue('hashed-token-id');
      vi.mocked(consumeToken).mockResolvedValue({ success: true, token: {} as any });
      vi.mocked(getPracticeById).mockResolvedValue(mockPractice);
      vi.mocked(getSettingsByPracticeId).mockResolvedValue(mockSettings);
      vi.mocked(insertEvent).mockResolvedValue({} as any);

      mockReq.headers = { accept: 'application/json' };

      await GET(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        practice: mockPractice,
        settings: mockSettings,
        redirect_url: expect.any(String)
      });
    });
  });

  describe('Error cases', () => {
    it('should return 400 for missing token', async () => {
      mockReq.params = {};

      await GET(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Token is required',
        success: false
      });
    });

    it('should return 401 for invalid token', async () => {
      // Mock parseToken to return null for invalid token
      const { parseToken } = await import('../../../utils/hmac_token');
      const { insertEvent } = await import('../../../models/events');
      
      vi.mocked(parseToken).mockReturnValue(null);
      vi.mocked(insertEvent).mockResolvedValue({} as any);

      mockReq.params = { token: 'invalid-token' };

      await GET(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid token',
        success: false
      });
    });
  });
});