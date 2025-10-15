import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Set SKIP_ENV_FILE flag before importing to prevent .env file loading
vi.hoisted(() => {
  process.env.SKIP_ENV_FILE = 'true';
});

// Import after setting the flag
import { validateEnvironment, loadEnvFromFile } from '../env-check';

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
      // Set up valid environment variables for this test
      process.env.STRIPE_SECRET_KEY = 'sk_test_12345678901234567890';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_12345678901234567890';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_12345678901234567890';
      process.env.TWILIO_ACCOUNT_SID = 'AC12345678901234567890';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_12345678901234567890';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA12345678901234567890';
      process.env.AWS_SECRET_ACCESS_KEY = 'secret_key_12345678901234567890';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza12345678901234567890';
      process.env.GOOGLE_CLIENTID = 'client_id_12345678901234567890';
      process.env.GOOGLE_OATUH_SECRET = 'client_secret_12345678901234567890';
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/database_name';
      process.env.HMAC_SECRET = 'hmac_secret_12345678901234567890';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_key_12345678901234567890';

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock process.exit to prevent actual exit during tests
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        // Do nothing - just prevent actual exit
        return undefined as never;
      });

      expect(() => validateEnvironment()).not.toThrow();
      
      // Assert that success message is logged
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ All required environment variables are present and valid');
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should fail when required variables are missing', () => {
      // Clear all environment variables to test missing variables
      Object.keys(process.env).forEach(key => {
        delete process.env[key];
      });
      // Missing all required variables

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        // Do nothing - just prevent actual exit
        return undefined as never;
      });

      expect(() => validateEnvironment()).not.toThrow();
      
      // Assert that process.exit was called with 1
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Assert that error messages were logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Missing required environment variables:');
      expect(consoleErrorSpy).toHaveBeenCalledWith('\n💡 Copy .env.example to .env and fill in your actual values');
      expect(consoleErrorSpy).toHaveBeenCalledWith('📖 See .env.example for the required format');
      
      // Assert that success message was NOT logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith('✅ All required environment variables are present and valid');
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should fail when variables have invalid formats', () => {
      // Set up all required variables but with invalid formats
      process.env.STRIPE_SECRET_KEY = 'invalid_stripe_key';
      process.env.STRIPE_PUBLISHABLE_KEY = 'invalid_publishable_key';
      process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA123456789';
      process.env.AWS_SECRET_ACCESS_KEY = 'secret_key_123';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza123456789';
      process.env.GOOGLE_CLIENTID = 'client_id_123';
      process.env.GOOGLE_OATUH_SECRET = 'client_secret_123';
      process.env.DATABASE_URL = 'invalid_database_url';
      process.env.HMAC_SECRET = 'hmac_secret_123';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        // Do nothing - just prevent actual exit
        return undefined as never;
      });

      expect(() => validateEnvironment()).not.toThrow();
      
      // Assert that process.exit was called with 1
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Assert that error messages were logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid environment variables:');
      expect(consoleErrorSpy).toHaveBeenCalledWith('\n💡 Copy .env.example to .env and fill in your actual values');
      expect(consoleErrorSpy).toHaveBeenCalledWith('📖 See .env.example for the required format');
      
      // Assert that success message was NOT logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith('✅ All required environment variables are present and valid');
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should handle empty string values as missing', () => {
      // Set up all required variables but with empty strings
      process.env.STRIPE_SECRET_KEY = '';
      process.env.STRIPE_PUBLISHABLE_KEY = '';
      process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA123456789';
      process.env.AWS_SECRET_ACCESS_KEY = 'secret_key_123';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza123456789';
      process.env.GOOGLE_CLIENTID = 'client_id_123';
      process.env.GOOGLE_OATUH_SECRET = 'client_secret_123';
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
      process.env.HMAC_SECRET = 'hmac_secret_123';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        // Do nothing - just prevent actual exit
        return undefined as never;
      });

      expect(() => validateEnvironment()).not.toThrow();
      
      // Assert that process.exit was called with 1
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Assert that error messages were logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Missing required environment variables:');
      expect(consoleErrorSpy).toHaveBeenCalledWith('\n💡 Copy .env.example to .env and fill in your actual values');
      expect(consoleErrorSpy).toHaveBeenCalledWith('📖 See .env.example for the required format');
      
      // Assert that success message was NOT logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith('✅ All required environment variables are present and valid');
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should validate Stripe key formats', () => {
      // Test invalid Stripe secret key format
      process.env.STRIPE_SECRET_KEY = 'pk_test_invalid'; // Should start with sk_
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789';
      process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA123456789';
      process.env.AWS_SECRET_ACCESS_KEY = 'secret_key_123';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza123456789';
      process.env.GOOGLE_CLIENTID = 'client_id_123';
      process.env.GOOGLE_OATUH_SECRET = 'client_secret_123';
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
      process.env.HMAC_SECRET = 'hmac_secret_123';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        // Do nothing - just prevent actual exit
        return undefined as never;
      });

      expect(() => validateEnvironment()).not.toThrow();
      
      // Assert that process.exit was called with 1
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Assert that error messages were logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid environment variables:');
      expect(consoleErrorSpy).toHaveBeenCalledWith('\n💡 Copy .env.example to .env and fill in your actual values');
      expect(consoleErrorSpy).toHaveBeenCalledWith('📖 See .env.example for the required format');
      
      // Assert that success message was NOT logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith('✅ All required environment variables are present and valid');
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should validate database URL format', () => {
      // Test invalid database URL format
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789';
      process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
      process.env.TWILIO_AUTH_TOKEN = 'auth_token_123';
      process.env.AWS_ACCESS_KEY_ID = 'AKIA123456789';
      process.env.AWS_SECRET_ACCESS_KEY = 'secret_key_123';
      process.env.GOOGLE_PLACES_API_KEY = 'AIza123456789';
      process.env.GOOGLE_CLIENTID = 'client_id_123';
      process.env.GOOGLE_OATUH_SECRET = 'client_secret_123';
      process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/db'; // Should start with postgres://
      process.env.HMAC_SECRET = 'hmac_secret_123';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        // Do nothing - just prevent actual exit
        return undefined as never;
      });

      expect(() => validateEnvironment()).not.toThrow();
      
      // Assert that process.exit was called with 1
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Assert that error messages were logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid environment variables:');
      expect(consoleErrorSpy).toHaveBeenCalledWith('\n💡 Copy .env.example to .env and fill in your actual values');
      expect(consoleErrorSpy).toHaveBeenCalledWith('📖 See .env.example for the required format');
      
      // Assert that success message was NOT logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith('✅ All required environment variables are present and valid');
      
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
