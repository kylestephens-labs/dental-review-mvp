import crypto from 'crypto';

// Refactored implementation with proper expiry handling and HMAC verification
export function generateMagicLinkToken(
  tokenId: string,
  practiceId: string,
  expiryDays: number = 7
): string {
  // Calculate expiry timestamp
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);
  const exp = Math.floor(expiresAt.getTime() / 1000);
  
  // Create payload and generate HMAC
  const payload = `${tokenId}.${exp}.${practiceId}`;
  const secret = process.env.HMAC_SECRET;
  if (!secret) {
    throw new Error('HMAC_SECRET environment variable is required');
  }
  const mac = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  
  return `${payload}.${mac}`;
}

export function verifyMagicLinkToken(
  token: string,
  expectedPracticeId: string
): { valid: boolean; tokenId?: string; practiceId?: string; error?: string } {
  const parts = token.split('.');
  if (parts.length !== 4) {
    return { valid: false };
  }
  
  const [tokenId, expStr, practiceId, mac] = parts;
  
  // Check practice ID scope
  if (practiceId !== expectedPracticeId) {
    return { valid: false };
  }
  
  // Check expiry
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || exp < Math.floor(Date.now() / 1000)) {
    return { valid: false, error: 'expired' };
  }
  
  // Verify HMAC signature
  const payload = `${tokenId}.${expStr}.${practiceId}`;
  const secret = process.env.HMAC_SECRET;
  if (!secret) {
    return { valid: false };
  }
  const expectedMac = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  
  // Use timing-safe comparison to prevent timing attacks
  // First ensure both buffers are the same length to avoid RangeError
  const macBuffer = Buffer.from(mac, 'base64url');
  const expectedMacBuffer = Buffer.from(expectedMac, 'base64url');
  
  if (macBuffer.length !== expectedMacBuffer.length) {
    return { valid: false, error: 'invalid' };
  }
  
  if (!crypto.timingSafeEqual(macBuffer, expectedMacBuffer)) {
    return { valid: false, error: 'invalid' };
  }
  
  return {
    valid: true,
    tokenId,
    practiceId
  };
}

/**
 * Generate a random token ID
 */
export function generateTokenId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Parse a token to extract its components without verification
 */
export function parseToken(token: string): { tokenId: string; practiceId: string; expiresAt: Date; mac: string } | null {
  const parts = token.split('.');
  if (parts.length !== 4) {
    return null;
  }
  
  const [tokenId, expStr, practiceId, mac] = parts;
  const exp = parseInt(expStr, 10);
  if (isNaN(exp)) {
    return null;
  }
  
  return {
    tokenId,
    practiceId,
    expiresAt: new Date(exp * 1000),
    mac
  };
}

/**
 * Hash a token ID for database storage
 */
export function hashTokenId(tokenId: string): string {
  return crypto.createHash('sha256').update(tokenId).digest('hex');
}