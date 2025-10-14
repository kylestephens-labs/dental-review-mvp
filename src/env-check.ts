import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
  const envVars = envFile.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  for (const line of envVars) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
} catch (error) {
  // .env file doesn't exist, continue with system environment variables
  console.log('No .env file found, using system environment variables');
}

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
    'AWS_ACCESS_KEY_ID', // Updated to match GitHub secret
    'AWS_SES_SECRET_ACCESS_KEY',
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_CLIENTID', // Updated to match GitHub secret
    'GOOGLE_OATUH_SECRET', // Updated to match GitHub secret
    'DATABASE_URL',
    'HMAC_SECRET', // Updated to match GitHub secret
    // Supabase configuration
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
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
    'STRIPE_SECRET_KEY': (value: string) => value.startsWith('sk_') && !value.includes('your_') && value.length > 20,
    'STRIPE_PUBLISHABLE_KEY': (value: string) => value.startsWith('pk_') && !value.includes('your_') && value.length > 20,
    'STRIPE_WEBHOOK_SECRET': (value: string) => value.startsWith('whsec_') && !value.includes('your_') && value.length > 20,
    'TWILIO_ACCOUNT_SID': (value: string) => value.startsWith('AC') && !value.includes('your_') && value.length > 20,
    'TWILIO_AUTH_TOKEN': (value: string) => !value.includes('your_') && value.length > 20,
    'AWS_ACCESS_KEY_ID': (value: string) => !value.includes('your_') && value.length > 10, // Updated to match GitHub secret
    'AWS_SES_SECRET_ACCESS_KEY': (value: string) => !value.includes('your_') && value.length > 20,
    'GOOGLE_PLACES_API_KEY': (value: string) => !value.includes('your_') && value.length > 20,
    'GOOGLE_CLIENTID': (value: string) => !value.includes('your_') && value.length > 20, // Updated to match GitHub secret
    'GOOGLE_OATUH_SECRET': (value: string) => !value.includes('your_') && value.length > 20, // Updated to match GitHub secret
    'DATABASE_URL': (value: string) => (value.startsWith('postgres://') || value.startsWith('postgresql://')) && !value.includes('username:password@localhost') && value.length > 30,
    'HMAC_SECRET': (value: string) => !value.includes('your_') && value.length > 20, // Updated to match GitHub secret
    'JWT_SECRET': (value: string) => !value.includes('your_') && value.length > 20,
    'SUPABASE_URL': (value: string) => value.startsWith('https://') && !value.includes('your_') && value.length > 20,
    'SUPABASE_SERVICE_ROLE_KEY': (value: string) => !value.includes('your_') && value.length > 20
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
