import { pool, PoolClient } from '../config/database';
import { generateTokenId, hashTokenId } from '../utils/hmac_token';

export interface OnboardingToken {
  id: string;
  token_id_hash: string;
  practice_id: string;
  issued_at: Date;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export interface CreateTokenData {
  practice_id: string;
  expiry_days?: number;
}

// Minimal implementation to make the test pass
export async function createToken(
  data: CreateTokenData,
  client?: PoolClient
): Promise<{ token: OnboardingToken; tokenId: string }> {
  const tokenId = generateTokenId();
  const tokenIdHash = hashTokenId(tokenId);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiry_days || 7));

  const query = `
    INSERT INTO onboarding_tokens (token_id_hash, practice_id, expires_at)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const values = [tokenIdHash, data.practice_id, expiresAt];
  const dbClient = client || pool();
  const result = await dbClient.query(query, values);

  return {
    token: result.rows[0],
    tokenId
  };
}

export async function findByTokenIdHash(
  tokenIdHash: string,
  client?: PoolClient
): Promise<OnboardingToken | null> {
  const query = `
    SELECT * FROM onboarding_tokens 
    WHERE token_id_hash = $1 AND expires_at > now() AND used_at IS NULL
  `;

  const dbClient = client || pool();
  const result = await dbClient.query(query, [tokenIdHash]);

  return result.rows[0] || null;
}

export async function consumeToken(
  tokenIdHash: string,
  client?: PoolClient
): Promise<{ success: boolean; token?: OnboardingToken; error?: string }> {
  // If no client provided, get a dedicated connection for the transaction
  const shouldReleaseClient = !client;
  const dbClient = client || await pool().connect();
  
  try {
    await dbClient.query('BEGIN');

    // First, check if token exists and is valid using the same client
    const existingToken = await findByTokenIdHash(tokenIdHash, dbClient);
    if (!existingToken) {
      await dbClient.query('ROLLBACK');
      return { success: false, error: 'Token not found or already used' };
    }

    // Mark token as used
    const updateQuery = `
      UPDATE onboarding_tokens 
      SET used_at = now() 
      WHERE token_id_hash = $1 AND used_at IS NULL
      RETURNING *
    `;

    const result = await dbClient.query(updateQuery, [tokenIdHash]);
    
    if (result.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return { success: false, error: 'Token already used' };
    }

    await dbClient.query('COMMIT');
    return { success: true, token: result.rows[0] };
  } catch (error) {
    await dbClient.query('ROLLBACK');
    throw error;
  } finally {
    // Only release the client if we created it
    if (shouldReleaseClient && 'release' in dbClient) {
      dbClient.release();
    }
  }
}
