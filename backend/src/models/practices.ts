import { pool, PoolClient } from '../config/database';

export interface Practice {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  tz: string;
  status: string;
  created_at: Date;
  stripe_checkout_at: Date | null;
  first_review_request_sent_at: Date | null;
}

export interface CreatePracticeData {
  name: string | null;
  phone: string | null;
  email: string | null;
  city?: string | null;
  tz?: string;
  status?: string;
}

export async function createPractice(data: CreatePracticeData, client?: PoolClient): Promise<Practice> {
  const query = `
    INSERT INTO practices (name, phone, email, city, tz, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const values = [
    data.name,
    data.phone,
    data.email,
    data.city || null,
    data.tz || 'America/Los_Angeles',
    data.status || 'provisioning'
  ];

  const dbClient = client || pool();
  const result = await dbClient.query(query, values);
  return result.rows[0];
}

export async function getPracticeById(id: string): Promise<Practice | null> {
  const query = 'SELECT * FROM practices WHERE id = $1';
  const result = await pool().query(query, [id]);
  return result.rows[0] || null;
}
