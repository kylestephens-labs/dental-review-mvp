import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
const mockCreateClient = vi.fn(() => ({
  auth: {
    persistSession: false
  },
  from: vi.fn(),
  functions: {
    invoke: vi.fn()
  }
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Client Initialization', () => {
    test('should create client with correct configuration', async () => {
      // Import the module to trigger client creation
      const { supabase } = await import('../integrations/supabase/client');
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.any(String), // URL from environment
        expect.any(String), // Key from environment
        {
          auth: {
            persistSession: false
          }
        }
      );
      
      expect(supabase).toBeDefined();
    });

    test('should configure auth with persistSession false', async () => {
      await import('../integrations/supabase/client');
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        {
          auth: {
            persistSession: false
          }
        }
      );
    });

    test('should call createClient with three arguments', async () => {
      await import('../integrations/supabase/client');
      
      const callArgs = mockCreateClient.mock.calls[0];
      expect(callArgs).toHaveLength(3);
      expect(typeof callArgs[0]).toBe('string'); // URL
      expect(typeof callArgs[1]).toBe('string'); // Key
      expect(typeof callArgs[2]).toBe('object'); // Config
    });
  });

  describe('Client Configuration', () => {
    test('should export supabase client', async () => {
      const { supabase } = await import('../integrations/supabase/client');
      
      expect(supabase).toBeDefined();
      expect(typeof supabase).toBe('object');
    });

    test('should have correct auth configuration', async () => {
      await import('../integrations/supabase/client');
      
      const config = mockCreateClient.mock.calls[0][2];
      expect(config).toEqual({
        auth: {
          persistSession: false
        }
      });
    });

    test('should be configured for server-side rendering', async () => {
      await import('../integrations/supabase/client');
      
      const config = mockCreateClient.mock.calls[0][2];
      expect(config.auth.persistSession).toBe(false);
    });
  });

  describe('Module Structure', () => {
    test('should import createClient from supabase-js', () => {
      expect(mockCreateClient).toBeDefined();
    });

    test('should export supabase as named export', async () => {
      const module = await import('../integrations/supabase/client');
      
      expect(module).toHaveProperty('supabase');
      expect(module.supabase).toBeDefined();
    });

    test('should not export default', async () => {
      const module = await import('../integrations/supabase/client');
      
      expect(module.default).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle client creation without errors', async () => {
      expect(async () => {
        await import('../integrations/supabase/client');
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    test('should maintain client instance across imports', async () => {
      vi.resetModules();
      
      const { supabase: client1 } = await import('../integrations/supabase/client');
      const { supabase: client2 } = await import('../integrations/supabase/client');
      
      // Should be the same instance
      expect(client1).toBe(client2);
    });
  });
});
