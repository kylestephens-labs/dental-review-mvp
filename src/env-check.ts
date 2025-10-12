import * as fs from 'fs';
import * as path from 'path';

interface EnvConfig {
  requiredVars: string[];
  optionalVars: string[];
  validationRules: Record<string, (value: string) => boolean>;
}

const envConfig: EnvConfig = {
  requiredVars: [
    // Core application
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'AWS_SES_ACCESS_KEY_ID',
    'AWS_SES_SECRET_ACCESS_KEY',
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_CALENDAR_CLIENT_ID',
    'GOOGLE_CALENDAR_CLIENT_SECRET',
    'FACEBOOK_GRAPH_ACCESS_TOKEN',
    'DATABASE_URL',
    'HMAC_SECRET_KEY',
    // N8N configuration
    'N8N_WEBHOOK_URL',
    'N8N_PROTOCOL',
    'N8N_HOST',
    'N8N_ENCRYPTION_KEY',
    'N8N_DB_HOST',
    'N8N_DB_USER',
    'N8N_DB_PASSWORD',
    // Supabase configuration
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'N8N_INTAKE_WEBHOOK'
  ],
  optionalVars: [
    'NODE_ENV',
    'PORT',
    'LOG_LEVEL',
    'AWS_REGION',
    'N8N_LOG_LEVEL',
    'N8N_SKIP_WEBHOOK_DEREGISTRATION',
    'N8N_DB_TYPE',
    'N8N_DB_PORT',
    'N8N_DB_DATABASE',
    'MCP_AGENT_HEARTBEAT_INTERVAL',
    'MCP_TASK_TIMEOUT',
    'MCP_MAX_CONCURRENT_TASKS',
    'SENTRY_DSN',
    'GIT_SHA',
    'JWT_SECRET'
  ],
  validationRules: {
    'STRIPE_SECRET_KEY': (value: string) => value.startsWith('sk_'),
    'STRIPE_PUBLISHABLE_KEY': (value: string) => value.startsWith('pk_'),
    'STRIPE_WEBHOOK_SECRET': (value: string) => value.startsWith('whsec_'),
    'TWILIO_ACCOUNT_SID': (value: string) => value.startsWith('AC'),
    'DATABASE_URL': (value: string) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'N8N_WEBHOOK_URL': (value: string) => value.startsWith('https://'),
    'N8N_PROTOCOL': (value: string) => ['http', 'https'].includes(value),
    'N8N_HOST': (value: string) => value.length > 0,
    'SUPABASE_URL': (value: string) => value.startsWith('https://'),
    'N8N_INTAKE_WEBHOOK': (value: string) => value.startsWith('https://')
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
