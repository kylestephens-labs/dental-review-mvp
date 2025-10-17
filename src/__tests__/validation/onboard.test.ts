import { describe, it, expect } from 'vitest';
import {
  practiceSchema,
  settingsSchema,
  onboardPrefillResponseSchema,
  onboardErrorResponseSchema,
  onboardResponseSchema,
  onboardFormDataSchema,
  validateOnboardResponse,
  validateOnboardFormData,
  isOnboardPrefillResponse,
  isOnboardErrorResponse,
  maskPhoneNumber,
  TIMEZONE_OPTIONS,
  LOCALE_OPTIONS
} from '../../lib/validation/onboard';

describe('Onboard Validation Schemas', () => {
  describe('practiceSchema', () => {
    it('should validate a valid practice object', () => {
      const validPractice = {
        id: 'practice-123',
        name: 'Test Dental Practice',
        email: 'test@example.com',
        phone: '+1234567890',
        city: 'Test City',
        tz: 'America/Los_Angeles',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z'
      };

      expect(() => practiceSchema.parse(validPractice)).not.toThrow();
    });

    it('should reject practice with invalid email', () => {
      const invalidPractice = {
        id: 'practice-123',
        name: 'Test Dental Practice',
        email: 'invalid-email',
        phone: '+1234567890',
        city: 'Test City',
        tz: 'America/Los_Angeles',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z'
      };

      expect(() => practiceSchema.parse(invalidPractice)).toThrow();
    });

    it('should reject practice with missing required fields', () => {
      const invalidPractice = {
        id: 'practice-123',
        name: 'Test Dental Practice'
        // Missing required fields
      };

      expect(() => practiceSchema.parse(invalidPractice)).toThrow();
    });
  });

  describe('settingsSchema', () => {
    it('should validate a valid settings object', () => {
      const validSettings = {
        id: 'settings-123',
        practice_id: 'practice-123',
        review_link: 'https://g.page/test',
        quiet_hours_start: 8,
        quiet_hours_end: 20,
        daily_cap: 50,
        sms_sender: '+1234567890',
        email_sender: 'noreply@example.com',
        default_locale: 'en',
        brand_assets_json: { logo: 'test.png' },
        billing_json: { plan: 'basic' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      expect(() => settingsSchema.parse(validSettings)).not.toThrow();
    });

    it('should reject settings with invalid quiet hours', () => {
      const invalidSettings = {
        id: 'settings-123',
        practice_id: 'practice-123',
        review_link: 'https://g.page/test',
        quiet_hours_start: 25, // Invalid hour
        quiet_hours_end: 20,
        daily_cap: 50,
        sms_sender: '+1234567890',
        email_sender: 'noreply@example.com',
        default_locale: 'en',
        brand_assets_json: null,
        billing_json: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      expect(() => settingsSchema.parse(invalidSettings)).toThrow();
    });
  });

  describe('onboardPrefillResponseSchema', () => {
    it('should validate a valid prefill response', () => {
      const validResponse = {
        success: true,
        practice: {
          id: 'practice-123',
          name: 'Test Dental Practice',
          email: 'test@example.com',
          phone: '+1234567890',
          city: 'Test City',
          tz: 'America/Los_Angeles',
          status: 'active',
          created_at: '2023-01-01T00:00:00Z'
        },
        settings: {
          id: 'settings-123',
          practice_id: 'practice-123',
          review_link: 'https://g.page/test',
          quiet_hours_start: 8,
          quiet_hours_end: 20,
          daily_cap: 50,
          sms_sender: '+1234567890',
          email_sender: 'noreply@example.com',
          default_locale: 'en',
          brand_assets_json: null,
          billing_json: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        redirect_url: 'https://example.com/onboard/token123'
      };

      expect(() => onboardPrefillResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should reject response with success: false', () => {
      const invalidResponse = {
        success: false,
        practice: {},
        settings: {},
        redirect_url: 'https://example.com/onboard/token123'
      };

      expect(() => onboardPrefillResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('onboardErrorResponseSchema', () => {
    it('should validate a valid error response', () => {
      const validError = {
        success: false,
        error: 'Token expired'
      };

      expect(() => onboardErrorResponseSchema.parse(validError)).not.toThrow();
    });

    it('should reject error response with success: true', () => {
      const invalidError = {
        success: true,
        error: 'Token expired'
      };

      expect(() => onboardErrorResponseSchema.parse(invalidError)).toThrow();
    });
  });

  describe('onboardFormDataSchema', () => {
    it('should validate valid form data', () => {
      const validFormData = {
        practice_name: 'Test Dental Practice',
        practice_email: 'test@example.com',
        practice_phone: '+1234567890',
        practice_city: 'Test City',
        practice_timezone: 'America/Los_Angeles',
        quiet_hours_start: 8,
        quiet_hours_end: 20,
        daily_cap: 50,
        review_link: 'https://g.page/test',
        default_locale: 'en'
      };

      expect(() => onboardFormDataSchema.parse(validFormData)).not.toThrow();
    });

    it('should reject form data with quiet hours start >= end', () => {
      const invalidFormData = {
        practice_name: 'Test Dental Practice',
        practice_email: 'test@example.com',
        practice_phone: '+1234567890',
        practice_city: 'Test City',
        practice_timezone: 'America/Los_Angeles',
        quiet_hours_start: 20,
        quiet_hours_end: 8, // Start after end
        daily_cap: 50,
        review_link: 'https://g.page/test',
        default_locale: 'en'
      };

      expect(() => onboardFormDataSchema.parse(invalidFormData)).toThrow();
    });

    it('should reject form data with invalid daily cap', () => {
      const invalidFormData = {
        practice_name: 'Test Dental Practice',
        practice_email: 'test@example.com',
        practice_phone: '+1234567890',
        practice_city: 'Test City',
        practice_timezone: 'America/Los_Angeles',
        quiet_hours_start: 8,
        quiet_hours_end: 20,
        daily_cap: 0, // Invalid cap
        review_link: 'https://g.page/test',
        default_locale: 'en'
      };

      expect(() => onboardFormDataSchema.parse(invalidFormData)).toThrow();
    });
  });

  describe('Validation helper functions', () => {
    it('should validate onboard response correctly', () => {
      const validResponse = {
        success: true,
        practice: {
          id: 'practice-123',
          name: 'Test Practice',
          email: 'test@example.com',
          phone: '+1234567890',
          city: 'Test City',
          tz: 'America/Los_Angeles',
          status: 'active',
          created_at: '2023-01-01T00:00:00Z'
        },
        settings: {
          id: 'settings-123',
          practice_id: 'practice-123',
          review_link: 'https://g.page/test',
          quiet_hours_start: 8,
          quiet_hours_end: 20,
          daily_cap: 50,
          sms_sender: '+1234567890',
          email_sender: 'noreply@example.com',
          default_locale: 'en',
          brand_assets_json: null,
          billing_json: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        redirect_url: 'https://example.com/onboard/token123'
      };

      expect(() => validateOnboardResponse(validResponse)).not.toThrow();
    });

    it('should identify prefill response correctly', () => {
      const prefillResponse = {
        success: true,
        practice: {} as any,
        settings: {} as any,
        redirect_url: 'https://example.com'
      };

      const errorResponse = {
        success: false,
        error: 'Token expired'
      };

      expect(isOnboardPrefillResponse(prefillResponse)).toBe(true);
      expect(isOnboardPrefillResponse(errorResponse)).toBe(false);
    });

    it('should identify error response correctly', () => {
      const prefillResponse = {
        success: true,
        practice: {} as any,
        settings: {} as any,
        redirect_url: 'https://example.com'
      };

      const errorResponse = {
        success: false,
        error: 'Token expired'
      };

      expect(isOnboardErrorResponse(prefillResponse)).toBe(false);
      expect(isOnboardErrorResponse(errorResponse)).toBe(true);
    });
  });

  describe('Utility functions', () => {
    describe('maskPhoneNumber', () => {
      it('should mask phone numbers correctly', () => {
        expect(maskPhoneNumber('+1234567890')).toBe('(***) ***-7890');
        expect(maskPhoneNumber('1234567890')).toBe('(***) ***-7890');
        expect(maskPhoneNumber('123456789')).toBe('(***) **-6789');
        expect(maskPhoneNumber('1234')).toBe('1234');
        expect(maskPhoneNumber('')).toBe('');
        expect(maskPhoneNumber('abc')).toBe('abc');
      });
    });

    describe('Constants', () => {
      it('should have timezone options', () => {
        expect(TIMEZONE_OPTIONS).toBeDefined();
        expect(Array.isArray(TIMEZONE_OPTIONS)).toBe(true);
        expect(TIMEZONE_OPTIONS.length).toBeGreaterThan(0);
        expect(TIMEZONE_OPTIONS[0]).toHaveProperty('value');
        expect(TIMEZONE_OPTIONS[0]).toHaveProperty('label');
      });

      it('should have locale options', () => {
        expect(LOCALE_OPTIONS).toBeDefined();
        expect(Array.isArray(LOCALE_OPTIONS)).toBe(true);
        expect(LOCALE_OPTIONS.length).toBeGreaterThan(0);
        expect(LOCALE_OPTIONS[0]).toHaveProperty('value');
        expect(LOCALE_OPTIONS[0]).toHaveProperty('label');
      });
    });
  });
});
