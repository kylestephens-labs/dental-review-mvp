// Test setup file - configure testing library matchers
import '@testing-library/jest-dom';
import { vi, afterEach, beforeEach } from 'vitest';

// Polyfill ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Global cleanup to prevent hanging processes
const timers: Set<NodeJS.Timeout> = new Set();
const intervals: Set<NodeJS.Timeout> = new Set();

// Override setTimeout and setInterval to track them
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

global.setTimeout = ((callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
  const id = originalSetTimeout(callback, delay, ...args);
  timers.add(id);
  return id;
}) as typeof setTimeout;

global.setInterval = ((callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
  const id = originalSetInterval(callback, delay, ...args);
  intervals.add(id);
  return id;
}) as typeof setInterval;

global.clearTimeout = ((id: NodeJS.Timeout) => {
  timers.delete(id);
  return originalClearTimeout(id);
}) as typeof clearTimeout;

global.clearInterval = ((id: NodeJS.Timeout) => {
  intervals.delete(id);
  return originalClearInterval(id);
}) as typeof clearInterval;

// Clean up all timers after each test
afterEach(() => {
  // Clear all tracked timers
  timers.forEach(id => originalClearTimeout(id));
  intervals.forEach(id => originalClearInterval(id));
  timers.clear();
  intervals.clear();
  
  // Clear any remaining timers that might have been created
  vi.clearAllTimers();
});

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  
  // Clean up DOM after each test to prevent test isolation issues
  document.body.innerHTML = '';
});

// Global cleanup to ensure processes terminate
afterAll(() => {
  // Force cleanup of any remaining timers
  timers.forEach(id => originalClearTimeout(id));
  intervals.forEach(id => originalClearInterval(id));
  timers.clear();
  intervals.clear();
  
  // Clear all vitest timers
  vi.clearAllTimers();
  
  // Clear any React roots that might be hanging around
  const roots = document.querySelectorAll('[data-reactroot]');
  roots.forEach(root => root.remove());
  
  // Clear any test containers
  const testContainers = document.querySelectorAll('[data-testid]');
  testContainers.forEach(container => container.remove());
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Note: Removed process.exit as it was too aggressive
});

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
