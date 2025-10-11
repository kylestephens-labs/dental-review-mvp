#!/bin/bash
# App Runner Service Update with Basic Authentication
# This script updates the n8n App Runner service with basic auth and secrets

set -e

echo "🔧 Updating App Runner Service with Basic Authentication"
echo "========================================================"

# Load AWS configuration
if [ -f "aws-config.sh" ]; then
    source aws-config.sh
    echo "✅ Loaded AWS configuration"
else
    echo "❌ aws-config.sh not found. Please run from project root."
    exit 1
fi

# Validate configuration
echo ""
echo "🔍 Validating configuration..."
validate_aws_config

# Set up secrets
echo ""
echo "🔐 Setting up AWS Secrets Manager..."

# Create basic auth password secret
echo "Creating basic auth password secret..."
aws secretsmanager create-secret \
    --name "$S_BASIC" \
    --secret-string "$(openssl rand -base64 36)" \
    --region "$REGION" \
    --description "n8n basic authentication password" \
    2>/dev/null || echo "Secret $S_BASIC already exists"

# Create encryption key secret
echo "Creating encryption key secret..."
aws secretsmanager create-secret \
    --name "$S_ENC" \
    --secret-string "$(openssl rand -base64 32)" \
    --region "$REGION" \
    --description "n8n encryption key" \
    2>/dev/null || echo "Secret $S_ENC already exists"

# Create ServiceBoost secret
echo "Creating ServiceBoost secret..."
aws secretsmanager create-secret \
    --name "$S_SVC" \
    --secret-string "sb_prod_94f1e38e_secret" \
    --region "$REGION" \
    --description "ServiceBoost integration secret" \
    2>/dev/null || echo "Secret $S_SVC already exists"

echo "✅ Secrets configured"

# Update App Runner service
echo ""
echo "🚀 Updating App Runner service..."

aws apprunner update-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --source-configuration "{
        \"ImageRepository\": {
            \"ImageRepositoryType\": \"ECR\",
            \"ImageIdentifier\": \"${ECR_IMAGE}\",
            \"ImageConfiguration\": {
                \"Port\": \"5678\",
                \"RuntimeEnvironmentVariables\": {
                    \"N8N_HOST\": \"${VERCEL_DOMAIN}\",
                    \"N8N_PROTOCOL\": \"https\",
                    \"WEBHOOK_URL\": \"https://${VERCEL_DOMAIN}\",
                    \"N8N_PORT\": \"5678\",
                    \"N8N_SECURE_MODE\": \"true\",
                    \"N8N_BASIC_AUTH_ACTIVE\": \"true\",
                    \"N8N_BASIC_AUTH_USER\": \"admin\",
                    \"N8N_LOG_LEVEL\": \"info\",
                    \"N8N_LOG_OUTPUT\": \"console\",
                    \"EXECUTIONS_MODE\": \"regular\",
                    \"NODE_OPTIONS\": \"--max-old-space-size=1536\",
                    \"N8N_SKIP_WEBHOOK_DEREGISTRATION\": \"true\",
                    \"DB_TYPE\": \"postgresdb\",
                    \"DB_POSTGRESDB_HOST\": \"${DB_HOST}\",
                    \"DB_POSTGRESDB_PORT\": \"${DB_PORT}\",
                    \"DB_POSTGRESDB_DATABASE\": \"${DB_NAME}\",
                    \"DB_POSTGRESDB_USER\": \"${DB_USER}\",
                    \"DB_POSTGRESDB_SSL\": \"true\",
                    \"DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED\": \"false\",
                    \"DB_POSTGRESDB_CONNECTION_TIMEOUT\": \"60000\"
                },
                \"RuntimeEnvironmentSecrets\": {
                    \"N8N_BASIC_AUTH_PASSWORD\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${S_BASIC}\",
                    \"N8N_ENCRYPTION_KEY\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${S_ENC}\",
                    \"DB_POSTGRESDB_PASSWORD\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${S_SVC}\"
                }
            }
        },
        \"AutoDeploymentsEnabled\": false,
        \"AuthenticationConfiguration\": {
            \"AccessRoleArn\": \"${APP_RUNNER_ROLE_ARN}\"
        }
    }" \
    --instance-configuration "{
        \"Cpu\": \"1024\",
        \"Memory\": \"2048\",
        \"InstanceRoleArn\": \"arn:aws:iam::${ACCOUNT_ID}:role/AppRunnerSecretsRole\"
    }"

echo "✅ App Runner service update initiated"

# Wait for deployment to complete
echo ""
echo "⏳ Waiting for deployment to complete..."
echo "This may take a few minutes..."

# Check deployment status
while true; do
    STATUS=$(aws apprunner describe-service \
        --service-arn "$APPRUNNER_SERVICE_ARN" \
        --region "$REGION" \
        --query 'Service.Status' \
        --output text)
    
    echo "Current status: $STATUS"
    
    if [ "$STATUS" = "RUNNING" ]; then
        echo "✅ Deployment completed successfully!"
        break
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo "❌ Deployment failed!"
        echo "Check CloudWatch logs for details:"
        echo "aws logs describe-log-groups --log-group-name-prefix \"/aws/apprunner/n8n-prod-working\" --region $REGION"
        exit 1
    fi
    
    sleep 30
done

# Test the service
echo ""
echo "🧪 Testing updated service..."

# Get the service URL
SERVICE_URL=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.ServiceUrl' \
    --output text)

echo "Service URL: https://$SERVICE_URL"

# Test basic connectivity
echo "Testing basic connectivity..."
if curl -s -o /dev/null -w "%{http_code}" "https://$SERVICE_URL" --connect-timeout 10 --max-time 15 | grep -q "401"; then
    echo "✅ Service is responding (401 Unauthorized - expected with basic auth)"
else
    echo "⚠️  Service response unexpected. Check logs if needed."
fi

echo ""
echo "🎉 App Runner service update completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up custom domain: $VERCEL_DOMAIN"
echo "2. Configure DNS to point to: $SERVICE_URL"
echo "3. Test basic authentication with admin user"
echo "4. Configure n8n workflows"
echo ""
echo "🔐 Basic Authentication:"
echo "Username: admin"
echo "Password: Retrieved from AWS Secrets Manager"
echo ""
echo "To get the password:"
echo "aws secretsmanager get-secret-value --secret-id $S_BASIC --region $REGION --query SecretString --output text"
