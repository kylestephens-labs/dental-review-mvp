import { describe, it, expect, beforeEach } from 'vitest';
import { generateMagicLinkToken, verifyMagicLinkToken } from '../../utils/hmac_token';

describe('HMAC Token Utility', () => {
  const mockSecret = 'test-secret-key-32-chars-long';
  const mockPracticeId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTokenId = 'token-123';

  beforeEach(() => {
    process.env.HMAC_SECRET = mockSecret;
  });

  describe('generateMagicLinkToken', () => {
    it('should generate a valid token with correct structure', () => {
      const token = generateMagicLinkToken(mockTokenId, mockPracticeId, 7);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[A-Za-z0-9_.-]+$/);
    });

    it('should generate different tokens for different token IDs', () => {
      const token1 = generateMagicLinkToken('token-1', mockPracticeId, 7);
      const token2 = generateMagicLinkToken('token-2', mockPracticeId, 7);
      
      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens for different practice IDs', () => {
      const token1 = generateMagicLinkToken(mockTokenId, 'practice-1', 7);
      const token2 = generateMagicLinkToken(mockTokenId, 'practice-2', 7);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyMagicLinkToken', () => {
    it('should verify a valid token', () => {
      const token = generateMagicLinkToken(mockTokenId, mockPracticeId, 7);
      const result = verifyMagicLinkToken(token, mockPracticeId);
      
      expect(result.valid).toBe(true);
      expect(result.tokenId).toBe(mockTokenId);
      expect(result.practiceId).toBe(mockPracticeId);
    });

    it('should reject token with wrong practice ID', () => {
      const token = generateMagicLinkToken(mockTokenId, mockPracticeId, 7);
      const result = verifyMagicLinkToken(token, 'wrong-practice-id');
      
      expect(result.valid).toBe(false);
    });

    it('should reject malformed token', () => {
      const result = verifyMagicLinkToken('invalid-token', mockPracticeId);
      
      expect(result.valid).toBe(false);
    });

    it('should reject expired token', () => {
      // Create a token with past expiry
      const expiredToken = `${mockTokenId}.1234567890.${mockPracticeId}.mac-signature`;
      const result = verifyMagicLinkToken(expiredToken, mockPracticeId);
      
      expect(result.valid).toBe(false);
    });

    it('should reject tampered token', () => {
      const token = generateMagicLinkToken(mockTokenId, mockPracticeId, 7);
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      const result = verifyMagicLinkToken(tamperedToken, mockPracticeId);
      
      expect(result.valid).toBe(false);
    });
  });
});