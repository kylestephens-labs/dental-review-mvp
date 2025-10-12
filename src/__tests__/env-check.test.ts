import { describe, test, expect, vi, beforeEach } from 'vitest';
import { validateEnvironment } from '../env-check';

describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear all environment variables
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    test('should pass when all required variables are present and valid', () => {
      // Set up valid environment variables
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789';
      process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.AWS_SES_ACCESS_KEY_ID = 'AKIA123456789';
      process.env.AWS_SES_SECRET_ACCESS_KEY = 'secret_key_123';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza123456789';
      process.env.GOOGLE_CALENDAR_CLIENT_ID = 'client_id_123';
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'client_secret_123';
      process.env.FACEBOOK_GRAPH_ACCESS_TOKEN = 'token_123';
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
      process.env.HMAC_SECRET_KEY = 'hmac_secret_123';

      // Mock console.log to avoid output during tests
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => validateEnvironment()).not.toThrow();
      
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should fail when required variables are missing', () => {
      // Set up only some required variables
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789';
      // Missing other required variables

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => validateEnvironment()).toThrow('process.exit called');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Missing required environment variables:');
      
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should fail when variables have invalid formats', () => {
      // Set up all required variables but with invalid formats
      process.env.STRIPE_SECRET_KEY = 'invalid_stripe_key';
      process.env.STRIPE_PUBLISHABLE_KEY = 'invalid_publishable_key';
      process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.AWS_SES_ACCESS_KEY_ID = 'AKIA123456789';
      process.env.AWS_SES_SECRET_ACCESS_KEY = 'secret_key_123';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza123456789';
      process.env.GOOGLE_CALENDAR_CLIENT_ID = 'client_id_123';
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'client_secret_123';
      process.env.FACEBOOK_GRAPH_ACCESS_TOKEN = 'token_123';
      process.env.DATABASE_URL = 'invalid_database_url';
      process.env.HMAC_SECRET_KEY = 'hmac_secret_123';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => validateEnvironment()).toThrow('process.exit called');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid environment variables:');
      
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should handle empty string values as missing', () => {
      // Set up all required variables but with empty strings
      process.env.STRIPE_SECRET_KEY = '';
      process.env.STRIPE_PUBLISHABLE_KEY = '';
      process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.AWS_SES_ACCESS_KEY_ID = 'AKIA123456789';
      process.env.AWS_SES_SECRET_ACCESS_KEY = 'secret_key_123';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza123456789';
      process.env.GOOGLE_CALENDAR_CLIENT_ID = 'client_id_123';
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'client_secret_123';
      process.env.FACEBOOK_GRAPH_ACCESS_TOKEN = 'token_123';
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
      process.env.HMAC_SECRET_KEY = 'hmac_secret_123';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => validateEnvironment()).toThrow('process.exit called');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Missing required environment variables:');
      
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should validate Stripe key formats', () => {
      // Test invalid Stripe secret key format
      process.env.STRIPE_SECRET_KEY = 'pk_test_invalid'; // Should start with sk_
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789';
      process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.AWS_SES_ACCESS_KEY_ID = 'AKIA123456789';
      process.env.AWS_SES_SECRET_ACCESS_KEY = 'secret_key_123';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza123456789';
      process.env.GOOGLE_CALENDAR_CLIENT_ID = 'client_id_123';
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'client_secret_123';
      process.env.FACEBOOK_GRAPH_ACCESS_TOKEN = 'token_123';
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
      process.env.HMAC_SECRET_KEY = 'hmac_secret_123';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => validateEnvironment()).toThrow('process.exit called');
      
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should validate database URL format', () => {
      // Test invalid database URL format
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789';
      process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.AWS_SES_ACCESS_KEY_ID = 'AKIA123456789';
      process.env.AWS_SES_SECRET_ACCESS_KEY = 'secret_key_123';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza123456789';
      process.env.GOOGLE_CALENDAR_CLIENT_ID = 'client_id_123';
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'client_secret_123';
      process.env.FACEBOOK_GRAPH_ACCESS_TOKEN = 'token_123';
      process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/db'; // Should start with postgres://
      process.env.HMAC_SECRET_KEY = 'hmac_secret_123';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      expect(() => validateEnvironment()).toThrow('process.exit called');
      
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
