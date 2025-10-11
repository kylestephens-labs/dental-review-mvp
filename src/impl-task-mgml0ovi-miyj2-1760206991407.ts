
// Create .env.example file
const fs = require('fs');

const envExample = `# Environment Variables Template
# Copy this file to .env and fill in your actual values

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Twilio SMS/Communication
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

# AWS SES Email Service
AWS_SES_ACCESS_KEY_ID=your_aws_ses_access_key_id_here
AWS_SES_SECRET_ACCESS_KEY=your_aws_ses_secret_access_key_here

# Google Services
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
GOOGLE_CALENDAR_CLIENT_ID=your_google_calendar_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_calendar_client_secret_here

# Facebook Graph API
FACEBOOK_GRAPH_ACCESS_TOKEN=your_facebook_graph_access_token_here

# Database
DATABASE_URL=your_database_url_here

# HMAC Secret for JWT/signing
HMAC_SECRET_KEY=your_hmac_secret_key_here
`;

fs.writeFileSync('.env.example', envExample);

// Create environment validation script
const envCheckScript = `import * as fs from 'fs';
import * as path from 'path';

const requiredEnvVars = [
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

export function validateEnvironment(): void {
  const missingVars: string[] = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName] === '') {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Copy .env.example to .env and fill in your actual values');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are present');
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateEnvironment();
}
`;

fs.writeFileSync('src/env-check.ts', envCheckScript);

// Add npm script to package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
packageJson.scripts['env:check'] = 'npx tsx src/env-check.ts';
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log('✅ Environment setup completed');
