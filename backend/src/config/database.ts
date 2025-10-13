import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function testConnections() {
  try {
    const dbPool = getPool();
    const client = await dbPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return { status: 'connected', timestamp: result.rows[0].now };
  } catch (error) {
    return { status: 'error', error: (error as Error).message };
  }
}

export { getPool as pool };
export type { PoolClient };
