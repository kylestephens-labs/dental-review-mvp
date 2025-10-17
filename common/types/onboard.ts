/**
 * Shared TypeScript types for onboarding functionality
 * Used by both frontend and backend for type safety
 */

export interface Practice {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  tz: string | null;
  status: string;
  created_at: string;
}

export interface Settings {
  id: string;
  practice_id: string;
  review_link: string | null;
  quiet_hours_start: number;
  quiet_hours_end: number;
  daily_cap: number;
  sms_sender: string | null;
  email_sender: string | null;
  default_locale: string;
  brand_assets_json: Record<string, any> | null;
  billing_json: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardPrefillResponse {
  success: boolean;
  practice: Practice;
  settings: Settings;
  redirect_url: string;
}

export interface OnboardErrorResponse {
  success: false;
  error: string;
}

export type OnboardResponse = OnboardPrefillResponse | OnboardErrorResponse;

export interface OnboardFormData {
  practice_name: string;
  practice_email: string;
  practice_phone: string;
  practice_city: string;
  practice_timezone: string;
  quiet_hours_start: number;
  quiet_hours_end: number;
  daily_cap: number;
  review_link: string;
  default_locale: string;
}

export interface OnboardFormErrors {
  [key: string]: string | undefined;
}

export interface OnboardPageProps {
  token: string;
  initialData?: OnboardPrefillResponse;
  error?: OnboardErrorResponse;
}

export interface OnboardFormProps {
  initialData: OnboardPrefillResponse;
  onSubmit: (data: OnboardFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  errors?: OnboardFormErrors;
}

// Token validation states
export type TokenValidationState = 
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'expired'
  | 'used'
  | 'error';

export interface TokenValidationResult {
  state: TokenValidationState;
  data?: OnboardPrefillResponse;
  error?: OnboardErrorResponse;
}
