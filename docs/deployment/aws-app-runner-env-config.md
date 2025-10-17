# AWS App Runner Environment Configuration

## Quick Setup Guide

### Step 1: Access App Runner Console
1. Go to [AWS App Runner Console](https://console.aws.amazon.com/apprunner/)
2. Click "Create service"
3. Choose "Source code repository"

### Step 2: Connect Repository
1. Connect to GitHub
2. Select your repository: `dental-review-mvp`
3. Choose branch: `main`
4. Select "Use a configuration file" and specify: `apprunner.yaml`

### Step 3: Configure Environment Variables

In the App Runner console, add these environment variables:

#### Required Variables
```
NODE_ENV=production
PORT=3001
COMMIT_SHA=auto-generated-by-app-runner
```

#### Database Configuration
```
DATABASE_URL=postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/dental_mvp
```

#### Stripe Configuration
```
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe
```

#### Communication Services
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

#### Supabase Configuration
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Security
```
HMAC_SECRET=your_secure_hmac_secret_minimum_32_characters
```

#### Google Services
```
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GOOGLE_CLIENTID=your_google_oauth_client_id
GOOGLE_OATUH_SECRET=your_google_oauth_secret
```

### Step 4: Health Check Configuration

In the App Runner service configuration:

1. **Health check path**: `/healthz`
2. **Health check interval**: `30 seconds`
3. **Health check timeout**: `5 seconds`
4. **Health check retries**: `3`

### Step 5: Service Configuration

1. **Service name**: `dental-practice-mvp`
2. **Virtual CPU**: `0.25 vCPU`
3. **Virtual memory**: `0.5 GB`
4. **Auto scaling**: `1-10 instances`

## Environment Variable Validation

### Pre-Deployment Check
Before deploying, validate your environment variables:

```bash
# In your local environment
cd backend
npm run env:validate
```

### Post-Deployment Check
After deployment, verify the health endpoint:

```bash
# Replace with your App Runner URL
curl https://your-app-runner-url.us-east-1.awsapprunner.com/healthz
```

Expected response:
```json
{
  "status": "ok",
  "sha": "your-commit-sha"
}
```

## Security Best Practices

### 1. Use AWS Secrets Manager
For sensitive data, consider using AWS Secrets Manager:

1. Create secrets in AWS Secrets Manager
2. Reference them in App Runner environment variables:
   ```
   DATABASE_URL=${{ secrets.DATABASE_URL }}
   STRIPE_SECRET_KEY=${{ secrets.STRIPE_SECRET_KEY }}
   ```

### 2. IAM Roles
- Create an IAM role for App Runner
- Attach policies for required AWS services (RDS, SES, etc.)
- Use the role instead of access keys where possible

### 3. Environment-Specific Configuration
- **Development**: Use test API keys
- **Staging**: Use staging API keys  
- **Production**: Use live API keys

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Check variable names (case-sensitive)
   - Verify no extra spaces
   - Ensure variables are set in App Runner console

2. **Database Connection Failed**
   - Verify DATABASE_URL format
   - Check RDS security groups
   - Ensure database is accessible from App Runner

3. **Health Check Failing**
   - Verify health check path is `/healthz`
   - Check application logs in CloudWatch
   - Ensure port 3001 is exposed

### Debug Commands

```bash
# Check App Runner logs
aws logs describe-log-groups --log-group-name-prefix /aws/apprunner

# Test health endpoint
curl -v https://your-app-runner-url/healthz

# Check environment variables in container
aws apprunner describe-service --service-arn your-service-arn
```

## Next Steps

1. ✅ Set up AWS RDS PostgreSQL database
2. ✅ Configure Stripe webhook endpoints
3. ✅ Set up Twilio account
4. ✅ Configure AWS SES
5. ✅ Set up Supabase project
6. ✅ Generate secure HMAC secret
7. ✅ Configure Google APIs
8. 🚀 Deploy to AWS App Runner

## Support

If you encounter issues:
1. Check CloudWatch logs for error details
2. Verify all environment variables are set correctly
3. Test the health endpoint manually
4. Review the environment validation output
