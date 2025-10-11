# ==== AWS Configuration Variables ====
# Fill these with your actual AWS values

# AWS Account & Region
REGION="us-east-2"
ACCOUNT_ID="625246225347"

# App Runner Service Configuration
APPRUNNER_SERVICE_ARN="arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562"
APPRUNNER_CUSTOM_DOMAIN="automation.serviceboost.co"   # subdomain you want for n8n
APPRUNNER_DEFAULT_URL="uncqyimekm.us-east-2.awsapprunner.com"  # from your service

# RDS Database Configuration
RDS_ID="n8n-database"
RDS_BACKUP_RETENTION_DAYS=7

# AWS Secrets Manager (already created is fine; if not, use these names)
S_ENC="n8n/encryption_key"
S_BASIC="n8n/basic_auth_password"
S_SVC="n8n/serviceboost_secret"

# CloudWatch Alarm settings
ALARM_NS="AWS/AppRunner"
ALARM_SVC_NAME="n8n-prod-working"
ALARM_SUFFIX="$(date +%s)"  # unique suffix

# Vercel project/zone for DNS (if using vercel CLI)
VERCEL_DOMAIN="automation.serviceboost.co"
VERCEL_ZONE="serviceboost.co"

# Current image (already pinned)
ECR_IMAGE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/n8n:1.61.0"

# ==== Additional Configuration Variables ====

# Database Configuration
DB_HOST="n8n-database.cb0ys2yimzmc.us-east-2.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="n8nadmin"
DB_PASSWORD="TempPassword123!"  # Consider moving to Secrets Manager

# n8n Configuration
N8N_ENCRYPTION_KEY="n8n-encryption-key-2024"  # Consider moving to Secrets Manager
N8N_LOG_LEVEL="debug"
N8N_LOG_OUTPUT="console"
EXECUTIONS_MODE="regular"
NODE_OPTIONS="--max-old-space-size=1536"

# Webhook Configuration
WEBHOOK_URL="https://automation.serviceboost.co"
N8N_PROTOCOL="https"
N8N_HOST="automation.serviceboost.co"
N8N_SKIP_WEBHOOK_DEREGISTRATION="true"

# SSL Configuration
DB_POSTGRESDB_SSL="true"
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED="false"
DB_POSTGRESDB_CONNECTION_TIMEOUT="60000"

# VPC Configuration
VPC_CONNECTOR_ARN="arn:aws:apprunner:us-east-2:625246225347:vpcconnector/n8n-vpc-connector/1/66c2ddbd153f4ebd9e0d2fbd4708e0fd"
SECURITY_GROUP_ID="sg-0ca13c80fa10269ae"
SUBNET_IDS="subnet-041fd766306521d94,subnet-058fa4e75ab32ae45"

# ECR Configuration
ECR_REPOSITORY_NAME="n8n"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# IAM Configuration
IAM_USER_NAME="serviceboost14"
APP_RUNNER_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/AppRunnerECRAccessRole"

# CloudWatch Configuration
LOG_GROUP_PREFIX="/aws/apprunner/n8n-prod-working"
OBSERVABILITY_CONFIG_ARN="arn:aws:apprunner:us-east-2:625246225347:observabilityconfiguration/n8n-observability/1/63bf599a06f94e45ad8286c0e01f7060"

# ==== Environment-Specific Overrides ====

# Development Environment
if [ "${ENVIRONMENT:-production}" = "development" ]; then
    APPRUNNER_CUSTOM_DOMAIN="dev-automation.serviceboost.co"
    WEBHOOK_URL="https://dev-automation.serviceboost.co"
    N8N_HOST="dev-automation.serviceboost.co"
    N8N_LOG_LEVEL="debug"
fi

# Staging Environment
if [ "${ENVIRONMENT:-production}" = "staging" ]; then
    APPRUNNER_CUSTOM_DOMAIN="staging-automation.serviceboost.co"
    WEBHOOK_URL="https://staging-automation.serviceboost.co"
    N8N_HOST="staging-automation.serviceboost.co"
    N8N_LOG_LEVEL="info"
fi

# Production Environment (default)
if [ "${ENVIRONMENT:-production}" = "production" ]; then
    APPRUNNER_CUSTOM_DOMAIN="automation.serviceboost.co"
    WEBHOOK_URL="https://automation.serviceboost.co"
    N8N_HOST="automation.serviceboost.co"
    N8N_LOG_LEVEL="info"
fi

# ==== Validation Functions ====

validate_aws_config() {
    echo "🔍 Validating AWS Configuration..."
    
    # Check required variables
    if [ -z "$ACCOUNT_ID" ] || [ -z "$REGION" ]; then
        echo "❌ Missing required AWS configuration"
        return 1
    fi
    
    # Check App Runner service ARN format
    if [[ ! "$APPRUNNER_SERVICE_ARN" =~ ^arn:aws:apprunner:${REGION}:${ACCOUNT_ID}:service/ ]]; then
        echo "❌ Invalid App Runner service ARN format"
        return 1
    fi
    
    # Check RDS ID
    if [ -z "$RDS_ID" ]; then
        echo "❌ Missing RDS instance ID"
        return 1
    fi
    
    echo "✅ AWS configuration validation passed"
    return 0
}

# ==== Export Functions ====

export_aws_vars() {
    export AWS_REGION="$REGION"
    export AWS_ACCOUNT_ID="$ACCOUNT_ID"
    export APPRUNNER_SERVICE_ARN
    export APPRUNNER_CUSTOM_DOMAIN
    export APPRUNNER_DEFAULT_URL
    export RDS_ID
    export ECR_IMAGE
}

export_n8n_vars() {
    export DB_TYPE="postgresdb"
    export DB_POSTGRESDB_HOST="$DB_HOST"
    export DB_POSTGRESDB_PORT="$DB_PORT"
    export DB_POSTGRESDB_DATABASE="$DB_NAME"
    export DB_POSTGRESDB_USER="$DB_USER"
    export DB_POSTGRESDB_PASSWORD="$DB_PASSWORD"
    export DB_POSTGRESDB_SSL="$DB_POSTGRESDB_SSL"
    export DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED="$DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED"
    export DB_POSTGRESDB_CONNECTION_TIMEOUT="$DB_POSTGRESDB_CONNECTION_TIMEOUT"
    
    export N8N_ENCRYPTION_KEY
    export N8N_LOG_LEVEL
    export N8N_LOG_OUTPUT
    export EXECUTIONS_MODE
    export NODE_OPTIONS
    
    export WEBHOOK_URL
    export N8N_PROTOCOL
    export N8N_HOST
    export N8N_SKIP_WEBHOOK_DEREGISTRATION
}

# ==== Usage Instructions ====

# To use this configuration file:
# 1. Source it: source aws-config.sh
# 2. Validate: validate_aws_config
# 3. Export variables: export_aws_vars && export_n8n_vars
# 4. Use in scripts: ./your-script.sh

# Example usage:
# source aws-config.sh
# validate_aws_config
# export_aws_vars
# export_n8n_vars
# aws apprunner describe-service --service-arn "$APPRUNNER_SERVICE_ARN" --region "$REGION"
