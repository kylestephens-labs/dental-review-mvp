# AWS App Runner Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Dental Practice Management MVP backend to AWS App Runner.

## Prerequisites

### Required Tools
- ✅ AWS CLI installed and configured
- ✅ Git repository access
- ✅ Node.js 18+ (for local testing)
- ✅ Docker (for local testing)

### Required AWS Resources
- ✅ AWS Account with App Runner access
- ✅ IAM permissions for App Runner service creation
- ✅ GitHub repository with code
- ✅ Environment variables configured

## Deployment Scripts

### 1. `deploy-app-runner.sh`
**Purpose**: Creates and deploys the App Runner service
**Usage**: `./scripts/deploy-app-runner.sh`

**Features**:
- Creates new App Runner service or updates existing
- Uses `apprunner.yaml` configuration
- Configures auto-scaling
- Monitors deployment progress
- Tests health endpoint

### 2. `configure-app-runner-env.sh`
**Purpose**: Configures environment variables for the service
**Usage**: `./scripts/configure-app-runner-env.sh`

**Features**:
- Interactive environment variable setup
- Loads from `.env` file if available
- Updates service configuration
- Validates all required variables

### 3. `monitor-app-runner.sh`
**Purpose**: Monitors service health and performance
**Usage**: `./scripts/monitor-app-runner.sh`

**Features**:
- Service status monitoring
- Health endpoint testing
- CloudWatch logs analysis
- Performance metrics
- Security checks

### 4. `setup-env.sh`
**Purpose**: Sets up local environment for development
**Usage**: `./scripts/setup-env.sh [command]`

**Commands**:
- `create [env]` - Create .env file
- `validate` - Validate environment variables
- `aws` - Show AWS App Runner configuration
- `test` - Test local environment
- `all [env]` - Run all setup steps

## Step-by-Step Deployment

### Step 1: Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "feat: prepare for AWS App Runner deployment"
git push origin main
```

### Step 2: Configure Environment Variables
```bash
# Create environment file
./scripts/setup-env.sh create production

# Edit the file with your actual values
nano backend/.env

# Validate configuration
./scripts/setup-env.sh validate
```

### Step 3: Deploy to App Runner
```bash
# Deploy the service
./scripts/deploy-app-runner.sh
```

### Step 4: Configure Environment Variables
```bash
# Configure environment variables in App Runner
./scripts/configure-app-runner-env.sh
```

### Step 5: Monitor Deployment
```bash
# Monitor service health
./scripts/monitor-app-runner.sh
```

## Configuration Files

### `apprunner.yaml`
- **Purpose**: App Runner service configuration
- **Location**: Project root
- **Contains**: Build commands, runtime settings, environment variables

### `Dockerfile`
- **Purpose**: Container configuration for Docker deployment
- **Location**: Project root
- **Contains**: Multi-stage build, health checks, security settings

### `backend/package.json`
- **Purpose**: Node.js dependencies and scripts
- **Location**: `backend/` directory
- **Contains**: Production dependencies, build scripts, health check commands

## Environment Variables

### Required Variables
```bash
NODE_ENV=production
PORT=3001
COMMIT_SHA=your-git-commit-sha
DATABASE_URL=postgresql://username:password@host:5432/database
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
HMAC_SECRET=your_secure_hmac_secret
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GOOGLE_CLIENTID=your_google_client_id
GOOGLE_OATUH_SECRET=your_google_oauth_secret
```

## Health Check Configuration

### App Runner Health Check
- **Path**: `/healthz`
- **Expected Response**: HTTP 200 with `{"status": "ok", "sha": "commit-sha"}`
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Retries**: 3

### Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/healthz || exit 1
```

## Monitoring and Troubleshooting

### CloudWatch Logs
- **Log Groups**: `/aws/apprunner/dental-practice-mvp`
- **View Logs**: AWS Console → CloudWatch → Log Groups
- **CLI Command**: `aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner/dental-practice-mvp"`

### Service Status
- **Check Status**: `aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-1:ACCOUNT:service/dental-practice-mvp"`
- **Service URL**: Available in service description

### Health Endpoint Testing
```bash
# Test health endpoint
curl https://your-service-url.awsapprunner.com/healthz

# Expected response
{"status":"ok","sha":"your-commit-sha"}
```

## Security Considerations

### IAM Permissions
- **App Runner Service Role**: Minimal permissions for service operation
- **Instance Role**: Permissions for CloudWatch logs and metrics
- **Secrets Manager**: Access to environment variables

### Network Security
- **HTTPS Only**: All traffic encrypted in transit
- **VPC Integration**: Optional for enhanced security
- **Security Groups**: Managed by App Runner

### Environment Variables
- **Sensitive Data**: Use AWS Secrets Manager for production
- **Rotation**: Regular rotation of API keys and secrets
- **Access Control**: Limit access to environment variables

## Cost Optimization

### Instance Configuration
- **CPU**: 0.25 vCPU (minimum)
- **Memory**: 0.5 GB (minimum)
- **Auto Scaling**: 1-10 instances based on demand

### Monitoring Costs
- **CloudWatch Logs**: Monitor log volume
- **Metrics**: Track service usage
- **Alarms**: Set up cost alerts

## Rollback Procedures

### Service Rollback
```bash
# Update service to previous configuration
aws apprunner update-service \
  --service-arn "your-service-arn" \
  --source-configuration "previous-configuration"
```

### Code Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

## Maintenance Tasks

### Regular Updates
- **Dependencies**: Update npm packages regularly
- **Security**: Apply security patches
- **Monitoring**: Review logs and metrics

### Backup Procedures
- **Code**: Git repository serves as backup
- **Configuration**: Store in version control
- **Secrets**: Backup to secure location

## Support and Documentation

### AWS Documentation
- [App Runner Developer Guide](https://docs.aws.amazon.com/apprunner/)
- [App Runner API Reference](https://docs.aws.amazon.com/apprunner/latest/APIReference/)

### Project Documentation
- `docs/deployment/` - Deployment documentation
- `docs/API.md` - API documentation
- `README.md` - Project overview

## Quick Reference

### Essential Commands
```bash
# Deploy service
./scripts/deploy-app-runner.sh

# Configure environment
./scripts/configure-app-runner-env.sh

# Monitor service
./scripts/monitor-app-runner.sh

# Setup local environment
./scripts/setup-env.sh all production
```

### Service URLs
- **Health Check**: `https://your-service-url.awsapprunner.com/healthz`
- **API Base**: `https://your-service-url.awsapprunner.com/`
- **AWS Console**: `https://console.aws.amazon.com/apprunner/`

### Emergency Contacts
- **AWS Support**: AWS Console → Support
- **Project Issues**: GitHub Issues
- **Documentation**: `docs/deployment/`

---

**Last Updated**: 2025-01-18
**Version**: 1.0.0
**Status**: Production Ready
