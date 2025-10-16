import { pool, PoolClient } from '../config/database.js';

export interface Settings {
  practice_id: string;
  review_link: string | null;
  quiet_hours_start: number;
  quiet_hours_end: number;
  daily_cap: number;
  sms_sender: string;
  email_sender: string;
  default_locale: string;
  brand_assets_json: Record<string, any>;
  billing_json: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSettingsData {
  billing_json: Record<string, any>;
  review_link?: string | null;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  daily_cap?: number;
  sms_sender?: string;
  email_sender?: string;
  default_locale?: string;
  brand_assets_json?: Record<string, any>;
}

export async function createDefaultSettings(
  practiceId: string, 
  data: CreateSettingsData,
  client?: PoolClient
): Promise<Settings> {
  const query = `
    INSERT INTO settings (
      practice_id, 
      review_link, 
      quiet_hours_start, 
      quiet_hours_end, 
      daily_cap, 
      sms_sender, 
      email_sender, 
      default_locale, 
      brand_assets_json, 
      billing_json
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const values = [
    practiceId,
    data.review_link || null,
    data.quiet_hours_start || 8,
    data.quiet_hours_end || 20,
    data.daily_cap || 50,
    data.sms_sender || 'DentalCare',
    data.email_sender || 'noreply@dentalcare.com',
    data.default_locale || 'en',
    JSON.stringify(data.brand_assets_json || {}),
    JSON.stringify(data.billing_json)
  ];

  const dbClient = client || pool();
  const result = await dbClient.query(query, values);
  return result.rows[0];
}

export async function getSettingsByPracticeId(practiceId: string): Promise<Settings | null> {
  const query = 'SELECT * FROM settings WHERE practice_id = $1';
  const result = await pool().query(query, [practiceId]);
  return result.rows[0] || null;
}
