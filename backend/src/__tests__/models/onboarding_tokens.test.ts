import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createToken, consumeToken, findByTokenIdHash } from '../../models/onboarding_tokens';

// Mock the database pool
vi.mock('../../config/database', () => ({
  pool: vi.fn(() => ({
    query: vi.fn()
  }))
}));

// Mock the HMAC utilities
vi.mock('../../utils/hmac_token', () => ({
  generateTokenId: vi.fn(() => 'test-token-id'),
  hashTokenId: vi.fn((id: string) => `hash-${id}`)
}));

describe('Onboarding Tokens Model', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: vi.fn()
    };
  });

  describe('createToken', () => {
    it('should create a new token with default 7-day expiry', async () => {
      // This test will FAIL because the function doesn't exist yet
      const mockToken = {
        id: 'token-uuid',
        token_id_hash: 'hash-test-token-id',
        practice_id: 'practice-123',
        issued_at: new Date(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        used_at: null,
        created_at: new Date()
      };

      // Mock the client query method
      mockClient.query.mockResolvedValue({
        rows: [mockToken]
      });

      const result = await createToken({
        practice_id: 'practice-123'
      }, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO onboarding_tokens'),
        expect.arrayContaining(['hash-test-token-id', 'practice-123', expect.any(Date)])
      );

      expect(result.token).toEqual(mockToken);
      expect(result.tokenId).toBe('test-token-id');
    });
  });
});