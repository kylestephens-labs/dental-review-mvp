import { pool, PoolClient } from '../config/database.js';

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

export async function insertEvent(data: CreateEventData, client?: PoolClient): Promise<Event> {
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

  const dbClient = client || pool();
  const result = await dbClient.query(query, values);
  return result.rows[0];
}

export async function getEventByStripeId(stripeEventId: string): Promise<Event | null> {
  const query = `
    SELECT * FROM events 
    WHERE type IN ('stripe_checkout', 'stripe_checkout_at') 
    AND payload_json->>'stripe_event_id' = $1
  `;
  
  const result = await pool().query(query, [stripeEventId]);
  return result.rows[0] || null;
}

export async function getEventsByPracticeId(practiceId: string, limit = 100): Promise<Event[]> {
  const query = `
    SELECT * FROM events 
    WHERE practice_id = $1 
    ORDER BY occurred_at DESC 
    LIMIT $2
  `;
  
  const result = await pool().query(query, [practiceId, limit]);
  return result.rows;
}

export async function getTTLStartEvent(practiceId: string): Promise<Event | null> {
  const query = `
    SELECT * FROM events
    WHERE practice_id = $1 AND type = $2
    ORDER BY occurred_at ASC
    LIMIT 1
  `;

  const result = await pool().query(query, [practiceId, 'stripe_checkout_at']);
  return result.rows[0] || null;
}

/**
 * Check if a TTL start event already exists for a given Stripe event ID
 * This provides additional idempotency protection for TTL instrumentation
 */
export async function getTTLStartEventByStripeId(stripeEventId: string): Promise<Event | null> {
  const query = `
    SELECT * FROM events 
    WHERE type = 'stripe_checkout_at' 
    AND payload_json->>'stripe_event_id' = $1
  `;
  
  const result = await pool().query(query, [stripeEventId]);
  return result.rows[0] || null;
}
