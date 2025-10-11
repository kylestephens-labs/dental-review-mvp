import * as fs from 'fs';
import * as path from 'path';

interface EnvConfig {
  requiredVars: string[];
  optionalVars: string[];
  validationRules: Record<string, (value: string) => boolean>;
}

const envConfig: EnvConfig = {
  requiredVars: [
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
  ],
  optionalVars: [
    'NODE_ENV',
    'PORT',
    'LOG_LEVEL'
  ],
  validationRules: {
    'STRIPE_SECRET_KEY': (value: string) => value.startsWith('sk_'),
    'STRIPE_PUBLISHABLE_KEY': (value: string) => value.startsWith('pk_'),
    'TWILIO_ACCOUNT_SID': (value: string) => value.length > 0,
    'DATABASE_URL': (value: string) => value.startsWith('postgres://') || value.startsWith('postgresql://')
  }
};

export function validateEnvironment(): void {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];
  
  // Check required variables
  envConfig.requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === '') {
      missingVars.push(varName);
    } else if (envConfig.validationRules[varName] && !envConfig.validationRules[varName](value)) {
      invalidVars.push(varName);
    }
  });
  
  // Report errors
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
  }
  
  if (invalidVars.length > 0) {
    console.error('❌ Invalid environment variables:');
    invalidVars.forEach(varName => {
      console.error(`   - ${varName} (format validation failed)`);
    });
  }
  
  if (missingVars.length > 0 || invalidVars.length > 0) {
    console.error('\n💡 Copy .env.example to .env and fill in your actual values');
    console.error('📖 See .env.example for the required format');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are present and valid');
}

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEnvironment();
}
