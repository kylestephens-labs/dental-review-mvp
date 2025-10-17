import { z } from 'zod';

/**
 * Zod validation schemas for onboarding functionality
 * Provides runtime validation and type safety for API responses and form data
 */

// Practice validation schema
export const practiceSchema = z.object({
  id: z.string().min(1, 'Practice ID is required'),
  name: z.string().min(1, 'Practice name is required').max(255, 'Practice name too long'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string().min(10, 'Phone number too short').max(20, 'Phone number too long'),
  city: z.string().nullable(),
  tz: z.string().nullable(),
  status: z.string().min(1, 'Status is required'),
  created_at: z.string().datetime('Invalid date format')
});

// Settings validation schema
export const settingsSchema = z.object({
  id: z.string().min(1, 'Settings ID is required'),
  practice_id: z.string().min(1, 'Practice ID is required'),
  review_link: z.string().url('Invalid review link').nullable(),
  quiet_hours_start: z.number().int().min(0).max(23, 'Invalid quiet hours start'),
  quiet_hours_end: z.number().int().min(0).max(23, 'Invalid quiet hours end'),
  daily_cap: z.number().int().min(1).max(1000, 'Daily cap must be between 1 and 1000'),
  sms_sender: z.string().nullable(),
  email_sender: z.string().nullable(),
  default_locale: z.string().min(2).max(5, 'Invalid locale format'),
  brand_assets_json: z.record(z.any()).nullable(),
  billing_json: z.record(z.any()).nullable(),
  created_at: z.string().datetime('Invalid date format'),
  updated_at: z.string().datetime('Invalid date format')
});

// Onboard prefill response validation schema
export const onboardPrefillResponseSchema = z.object({
  success: z.literal(true),
  practice: practiceSchema,
  settings: settingsSchema,
  redirect_url: z.string().url('Invalid redirect URL')
});

// Onboard error response validation schema
export const onboardErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().min(1, 'Error message is required')
});

// Union schema for all possible onboard responses
export const onboardResponseSchema = z.union([
  onboardPrefillResponseSchema,
  onboardErrorResponseSchema
]);

// Form data validation schema
export const onboardFormDataSchema = z.object({
  practice_name: z.string().min(1, 'Practice name is required').max(255, 'Practice name too long'),
  practice_email: z.string().email('Invalid email address').max(255, 'Email too long'),
  practice_phone: z.string().min(10, 'Phone number too short').max(20, 'Phone number too long'),
  practice_city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  practice_timezone: z.string().min(1, 'Timezone is required'),
  quiet_hours_start: z.number().int().min(0).max(23, 'Invalid quiet hours start'),
  quiet_hours_end: z.number().int().min(0).max(23, 'Invalid quiet hours end'),
  daily_cap: z.number().int().min(1).max(1000, 'Daily cap must be between 1 and 1000'),
  review_link: z.string().url('Invalid review link').min(1, 'Review link is required'),
  default_locale: z.string().min(2).max(5, 'Invalid locale format')
}).refine(
  (data) => data.quiet_hours_start < data.quiet_hours_end,
  {
    message: 'Quiet hours start must be before end time',
    path: ['quiet_hours_start']
  }
);

// Type exports
export type Practice = z.infer<typeof practiceSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type OnboardPrefillResponse = z.infer<typeof onboardPrefillResponseSchema>;
export type OnboardErrorResponse = z.infer<typeof onboardErrorResponseSchema>;
export type OnboardResponse = z.infer<typeof onboardResponseSchema>;
export type OnboardFormData = z.infer<typeof onboardFormDataSchema>;

// Validation helper functions
export function validateOnboardResponse(data: unknown): OnboardResponse {
  return onboardResponseSchema.parse(data);
}

export function validateOnboardFormData(data: unknown): OnboardFormData {
  return onboardFormDataSchema.parse(data);
}

export function isOnboardPrefillResponse(response: OnboardResponse): response is OnboardPrefillResponse {
  return response.success === true;
}

export function isOnboardErrorResponse(response: OnboardResponse): response is OnboardErrorResponse {
  return response.success === false;
}

// Phone number masking utility
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 4) return phone;
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  
  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(Math.max(0, cleaned.length - 4));
  
  return `(${masked.slice(0, 3)}) ${masked.slice(3, 6)}-${lastFour}`;
}

// Timezone options for form
export const TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Phoenix', label: 'Arizona Time (Phoenix)' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)' }
];

// Locale options for form
export const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' }
];
