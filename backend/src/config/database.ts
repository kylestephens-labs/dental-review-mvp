import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function testConnections() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return { status: 'connected', timestamp: result.rows[0].now };
  } catch (error) {
    return { status: 'error', error: (error as Error).message };
  }
}

export { pool };
