
describe('Environment Validation', () => {
  test('should validate all required environment variables', () => {
    const requiredVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY', 
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'AWS_SES_ACCESS_KEY_ID',
      'AWS_SES_SECRET_ACCESS_KEY',
      'GOOGLE_PLACES_API_KEY',
      'GOOGLE_CALENDAR_CLIENT_ID',
      'GOOGLE_CALENDAR_CLIENT_SECRET',
      'FACEBOOK_GRAPH_ACCESS_TOKEN',
      'DATABASE_URL',
      'HMAC_SECRET_KEY'
    ];
    
    requiredVars.forEach(varName => {
      expect(process.env[varName]).toBeDefined();
      expect(process.env[varName]).not.toBe('');
    });
  });
  
  test('should fail fast if any required env vars are missing', () => {
    // This test should fail initially since .env.example doesn't exist
    expect(() => require('./src/env-check')).toThrow('Missing required environment variables');
  });
});
