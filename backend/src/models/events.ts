import { pool } from '../config/database';

export interface Event {
  id: string;
  practice_id: string | null;
  type: string;
  actor: string;
  payload_json: Record<string, any>;
  occurred_at: Date;
  ip_hash: string | null;
  ua_hash: string | null;
}

export interface CreateEventData {
  practice_id?: string | null;
  type: string;
  actor?: string;
  payload_json?: Record<string, any>;
  ip_hash?: string | null;
  ua_hash?: string | null;
}

export async function insertEvent(data: CreateEventData): Promise<Event> {
  const query = `
    INSERT INTO events (practice_id, type, actor, payload_json, ip_hash, ua_hash)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const values = [
    data.practice_id || null,
    data.type,
    data.actor || 'system',
    JSON.stringify(data.payload_json || {}),
    data.ip_hash || null,
    data.ua_hash || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getEventByStripeId(stripeEventId: string): Promise<Event | null> {
  const query = `
    SELECT * FROM events 
    WHERE type = 'stripe_checkout' 
    AND payload_json->>'stripe_event_id' = $1
  `;
  
  const result = await pool.query(query, [stripeEventId]);
  return result.rows[0] || null;
}

export async function getEventsByPracticeId(practiceId: string, limit = 100): Promise<Event[]> {
  const query = `
    SELECT * FROM events 
    WHERE practice_id = $1 
    ORDER BY occurred_at DESC 
    LIMIT $2
  `;
  
  const result = await pool.query(query, [practiceId, limit]);
  return result.rows;
}
