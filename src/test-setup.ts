// Test setup file - configure testing library matchers
import '@testing-library/jest-dom';

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
