/**
 * API client for onboarding functionality
 * Provides typed methods for communicating with the backend onboarding endpoints
 */

import { 
  OnboardResponse, 
  OnboardPrefillResponse, 
  OnboardErrorResponse,
  TokenValidationState,
  TokenValidationResult
} from '../../lib/validation/onboard';
import { validateOnboardResponse, isOnboardPrefillResponse, isOnboardErrorResponse } from '../../lib/validation/onboard';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Fetch onboarding data using a magic link token
 * @param token - The HMAC-signed magic link token
 * @returns Promise resolving to validation result with data or error
 */
export async function fetchOnboardData(token: string, retryCount = 0): Promise<TokenValidationResult> {
  try {
    // Validate token format
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return {
        state: 'invalid',
        error: {
          success: false,
          error: 'Invalid token format'
        }
      };
    }

    // Make API request
    const response = await fetch(`${API_BASE_URL}/onboard/${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // Add timeout for better UX (2 seconds as per spec)
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });

    // Parse response
    const data = await response.json();
    const validatedData = validateOnboardResponse(data);

    // Handle different response statuses
    if (response.ok) {
      if (isOnboardPrefillResponse(validatedData)) {
        return {
          state: 'valid',
          data: validatedData
        };
      } else {
        return {
          state: 'error',
          error: validatedData
        };
      }
    } else {
      // Handle error responses based on status code
      if (response.status === 401) {
        return {
          state: 'invalid',
          error: validatedData
        };
      } else if (response.status === 409) {
        return {
          state: 'used',
          error: validatedData
        };
      } else if (response.status === 410) {
        return {
          state: 'expired',
          error: validatedData
        };
      } else {
        return {
          state: 'error',
          error: validatedData
        };
      }
    }
  } catch (error) {
    // Handle network errors, timeouts, etc.
    console.error('Onboard API error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        // Automatic retry once if timeout and we haven't retried yet
        if (retryCount === 0) {
          return fetchOnboardData(token, 1);
        }
        return {
          state: 'error',
          error: {
            success: false,
            error: 'Request timed out. Please try again.'
          }
        };
      } else if (error.name === 'AbortError') {
        return {
          state: 'error',
          error: {
            success: false,
            error: 'Request was cancelled. Please try again.'
          }
        };
      }
    }

    return {
      state: 'error',
      error: {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      }
    };
  }
}

/**
 * Submit onboarding form data (for future use)
 * @param token - The magic link token
 * @param formData - The form data to submit
 * @returns Promise resolving to success or error response
 */
export async function submitOnboardData(
  token: string, 
  formData: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/onboard/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData),
      signal: AbortSignal.timeout(15000) // 15 second timeout for POST
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: data.error || 'Failed to save onboarding data' 
      };
    }
  } catch (error) {
    console.error('Onboard submit error:', error);
    return { 
      success: false, 
      error: 'Network error. Please try again.' 
    };
  }
}

/**
 * Get error message for token validation state
 * @param state - The token validation state
 * @param error - Optional error response
 * @returns User-friendly error message
 */
export function getTokenErrorMessage(state: TokenValidationState, error?: OnboardErrorResponse): string {
  switch (state) {
    case 'invalid':
      return 'This onboarding link is invalid or corrupted. Please request a new link.';
    case 'expired':
      return 'This onboarding link has expired. Please request a new link.';
    case 'used':
      return 'This onboarding link has already been used. Please request a new link.';
    case 'error':
      return error?.error || 'An unexpected error occurred. Please try again.';
    case 'loading':
      return 'Loading...';
    case 'valid':
      return '';
    default:
      return 'An unknown error occurred. Please try again.';
  }
}

/**
 * Check if token validation state indicates an error
 * @param state - The token validation state
 * @returns True if state indicates an error
 */
export function isTokenErrorState(state: TokenValidationState): boolean {
  return ['invalid', 'expired', 'used', 'error'].includes(state);
}

/**
 * Check if token validation state indicates success
 * @param state - The token validation state
 * @returns True if state indicates success
 */
export function isTokenSuccessState(state: TokenValidationState): boolean {
  return state === 'valid';
}

/**
 * Check if token validation state indicates loading
 * @param state - The token validation state
 * @returns True if state indicates loading
 */
export function isTokenLoadingState(state: TokenValidationState): boolean {
  return state === 'loading';
}
