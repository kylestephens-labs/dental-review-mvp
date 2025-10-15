// Test setup file - configure testing library matchers
import '@testing-library/jest-dom';

// Polyfill ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Clear VITE_FEATURE_* environment variables in tests to prevent interference
// This allows tests to use updateFeatureFlag mutations without env overrides
if (typeof process !== 'undefined' && process.env) {
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_FEATURE_')) {
      delete process.env[key];
    }
  });
}

// Also clear import.meta.env if available (Vite environment)
if (typeof import.meta !== 'undefined' && import.meta.env) {
  Object.keys(import.meta.env).forEach(key => {
    if (key.startsWith('VITE_FEATURE_')) {
      delete import.meta.env[key];
    }
  });
}

// Ensure Vite environment variables are available for tests
if (typeof import.meta !== 'undefined' && import.meta.env) {
  // Set default test values for Supabase if not already set
  if (!import.meta.env.VITE_SUPABASE_URL) {
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  }
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'test_anon_key_123456789';
  }
}

// Note: Environment variables for tests should be set in individual test files
// to allow full control over test environment setup
