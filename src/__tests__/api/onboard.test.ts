import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchOnboardData,
  submitOnboardData,
  getTokenErrorMessage,
  isTokenErrorState,
  isTokenSuccessState,
  isTokenLoadingState
} from '../../lib/api/onboard';
import { TokenValidationState } from '../../lib/validation/onboard';

// Mock fetch globally
global.fetch = vi.fn();

describe('Onboard API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchOnboardData', () => {
    it('should return valid state for successful response', async () => {
      const mockResponse = {
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

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await fetchOnboardData('valid-token');

      expect(result.state).toBe('valid');
      expect(result.data).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/onboard/valid-token',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should return invalid state for 401 response', async () => {
      const mockError = {
        success: false,
        error: 'Invalid token'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockError)
      } as Response);

      const result = await fetchOnboardData('invalid-token');

      expect(result.state).toBe('invalid');
      expect(result.error).toEqual(mockError);
    });

    it('should return expired state for 410 response', async () => {
      const mockError = {
        success: false,
        error: 'Token expired'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 410,
        json: () => Promise.resolve(mockError)
      } as Response);

      const result = await fetchOnboardData('expired-token');

      expect(result.state).toBe('expired');
      expect(result.error).toEqual(mockError);
    });

    it('should return used state for 409 response', async () => {
      const mockError = {
        success: false,
        error: 'Token already used'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve(mockError)
      } as Response);

      const result = await fetchOnboardData('used-token');

      expect(result.state).toBe('used');
      expect(result.error).toEqual(mockError);
    });

    it('should return error state for network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchOnboardData('token');

      expect(result.state).toBe('error');
      expect(result.error?.error).toContain('Network error');
    });

    it('should return error state for timeout', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      vi.mocked(fetch).mockRejectedValueOnce(timeoutError);

      const result = await fetchOnboardData('token');

      expect(result.state).toBe('error');
      expect(result.error?.error).toContain('Request timed out');
    });

    it('should return invalid state for empty token', async () => {
      const result = await fetchOnboardData('');

      expect(result.state).toBe('invalid');
      expect(result.error?.error).toBe('Invalid token format');
    });

    it('should return invalid state for null token', async () => {
      const result = await fetchOnboardData(null as any);

      expect(result.state).toBe('invalid');
      expect(result.error?.error).toBe('Invalid token format');
    });
  });

  describe('submitOnboardData', () => {
    it('should return success for valid submission', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response);

      const result = await submitOnboardData('token', { name: 'Test' });

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/onboard/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: 'Test' })
        })
      );
    });

    it('should return error for failed submission', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Validation failed' })
      } as Response);

      const result = await submitOnboardData('token', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('should return error for network failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await submitOnboardData('token', { name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error. Please try again.');
    });
  });

  describe('Token validation helper functions', () => {
    describe('getTokenErrorMessage', () => {
      it('should return correct message for invalid state', () => {
        const message = getTokenErrorMessage('invalid');
        expect(message).toBe('This onboarding link is invalid or corrupted. Please request a new link.');
      });

      it('should return correct message for expired state', () => {
        const message = getTokenErrorMessage('expired');
        expect(message).toBe('This onboarding link has expired. Please request a new link.');
      });

      it('should return correct message for used state', () => {
        const message = getTokenErrorMessage('used');
        expect(message).toBe('This onboarding link has already been used. Please request a new link.');
      });

      it('should return custom error message for error state', () => {
        const error = { success: false, error: 'Custom error message' };
        const message = getTokenErrorMessage('error', error);
        expect(message).toBe('Custom error message');
      });

      it('should return default error message for error state without custom error', () => {
        const message = getTokenErrorMessage('error');
        expect(message).toBe('An unexpected error occurred. Please try again.');
      });

      it('should return empty string for valid state', () => {
        const message = getTokenErrorMessage('valid');
        expect(message).toBe('');
      });

      it('should return loading message for loading state', () => {
        const message = getTokenErrorMessage('loading');
        expect(message).toBe('Loading...');
      });
    });

    describe('isTokenErrorState', () => {
      it('should return true for error states', () => {
        expect(isTokenErrorState('invalid')).toBe(true);
        expect(isTokenErrorState('expired')).toBe(true);
        expect(isTokenErrorState('used')).toBe(true);
        expect(isTokenErrorState('error')).toBe(true);
      });

      it('should return false for non-error states', () => {
        expect(isTokenErrorState('loading')).toBe(false);
        expect(isTokenErrorState('valid')).toBe(false);
      });
    });

    describe('isTokenSuccessState', () => {
      it('should return true for valid state', () => {
        expect(isTokenSuccessState('valid')).toBe(true);
      });

      it('should return false for non-success states', () => {
        expect(isTokenSuccessState('loading')).toBe(false);
        expect(isTokenSuccessState('invalid')).toBe(false);
        expect(isTokenSuccessState('expired')).toBe(false);
        expect(isTokenSuccessState('used')).toBe(false);
        expect(isTokenSuccessState('error')).toBe(false);
      });
    });

    describe('isTokenLoadingState', () => {
      it('should return true for loading state', () => {
        expect(isTokenLoadingState('loading')).toBe(true);
      });

      it('should return false for non-loading states', () => {
        expect(isTokenLoadingState('valid')).toBe(false);
        expect(isTokenLoadingState('invalid')).toBe(false);
        expect(isTokenLoadingState('expired')).toBe(false);
        expect(isTokenLoadingState('used')).toBe(false);
        expect(isTokenLoadingState('error')).toBe(false);
      });
    });
  });
});
