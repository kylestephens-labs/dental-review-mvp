# Environment Variables Configuration

## Overview

This document outlines all environment variables required for the Dental Practice Management MVP deployment to AWS App Runner.

## Required Environment Variables

### Application Configuration
```bash
NODE_ENV=production
PORT=3001
COMMIT_SHA=your-git-commit-sha-here
```

### Database Configuration
```bash
# PostgreSQL connection string for AWS RDS
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/dental_mvp
```

### Stripe Payment Processing
```bash
# Get these from Stripe Dashboard
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Communication Services
```bash
# Twilio for SMS notifications
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# AWS SES for email notifications
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
```

### Supabase Configuration
```bash
# Supabase project configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Security & Authentication
```bash
# HMAC secret for token generation (generate a secure random string)
HMAC_SECRET=your_hmac_secret_key_here
```

### Google Services
```bash
# Google Places API for address autocomplete
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Google OAuth for calendar integration
GOOGLE_CLIENTID=your_google_client_id
GOOGLE_OATUH_SECRET=your_google_oauth_secret
```

### Feature Flags
```bash
# Enable/disable features (true/false)
FEATURE_ENHANCED_INTAKE_FORM=true
FEATURE_AUTO_SAVE=true
FEATURE_ADVANCED_ANALYTICS=false
```

### Health Check Configuration
```bash
# Health check endpoint configuration
HEALTH_CHECK_PATH=/healthz
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_TIMEOUT=5
HEALTH_CHECK_RETRIES=3
```

## AWS App Runner Configuration

### Environment Variables in App Runner Console

1. **Navigate to App Runner Service**
   - Go to AWS App Runner console
   - Select your service
   - Click on "Configuration" tab
   - Click "Edit" in Environment variables section

2. **Add Each Variable**
   - Click "Add environment variable"
   - Enter the variable name and value
   - Repeat for all required variables

3. **Required Variables for Production**
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/dental_mvp
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   HMAC_SECRET=your_hmac_secret_key_here
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   GOOGLE_CLIENTID=your_google_client_id
   GOOGLE_OATUH_SECRET=your_google_oauth_secret
   ```

### Using apprunner.yaml

The `apprunner.yaml` file already includes environment variable configuration:

```yaml
env:
  - name: NODE_ENV
    value: production
  - name: COMMIT_SHA
    value: $GIT_COMMIT_SHA
  - name: PORT
    value: "3001"
  - name: DATABASE_URL
    value: $DATABASE_URL
  # ... (all other variables)
```

## Security Best Practices

### 1. Use AWS Secrets Manager
For sensitive data, consider using AWS Secrets Manager:

```bash
# Instead of direct values, reference secrets
DATABASE_URL=${{ secrets.DATABASE_URL }}
STRIPE_SECRET_KEY=${{ secrets.STRIPE_SECRET_KEY }}
```

### 2. Environment-Specific Values
- **Development**: Use test API keys and local database
- **Staging**: Use staging API keys and staging database
- **Production**: Use live API keys and production database

### 3. Secret Rotation
- Regularly rotate API keys and secrets
- Use IAM roles where possible instead of access keys
- Monitor secret usage and access

## Validation

### Environment Check Script
The application includes an environment validation script:

```bash
# Run environment check
npm run env:check
```

### Health Check Validation
After deployment, verify environment variables are loaded:

```bash
# Check health endpoint
curl https://your-app-runner-url/healthz
```

Expected response:
```json
{
  "status": "ok",
  "sha": "your-commit-sha"
}
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Check App Runner console for missing variables
   - Verify variable names match exactly (case-sensitive)
   - Ensure no extra spaces or characters

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check RDS security groups
   - Ensure database is accessible from App Runner

3. **API Key Issues**
   - Verify API keys are valid and active
   - Check API key permissions and limits
   - Ensure keys match the correct environment (test/live)

### Debug Commands

```bash
# Check environment variables in container
docker exec -it your-container env | grep -E "(DATABASE|STRIPE|TWILIO)"

# Test database connection
npm run test:db-connection

# Validate all environment variables
npm run env:validate
```

## Next Steps

1. Set up AWS RDS PostgreSQL database
2. Configure Stripe webhook endpoints
3. Set up Twilio account and phone numbers
4. Configure AWS SES for email sending
5. Set up Supabase project
6. Generate secure HMAC secret
7. Configure Google APIs
8. Deploy to AWS App Runner with environment variables
