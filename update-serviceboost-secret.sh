#!/bin/bash
# Update App Runner Service with ServiceBoost Secret
# This script updates the n8n App Runner service to include ServiceBoost secret

set -e

echo "🔧 Updating App Runner Service with ServiceBoost Secret"
echo "======================================================="

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

# Create/update ServiceBoost secret
echo ""
echo "🔐 Creating/updating ServiceBoost secret..."

# Generate a new ServiceBoost secret
SERVICEBOOST_SECRET="sb_prod_$(openssl rand -hex 12)_secret"
echo "Generated ServiceBoost secret: $SERVICEBOOST_SECRET"

# Create or update the secret
aws secretsmanager create-secret \
    --name "$S_SVC" \
    --secret-string "$SERVICEBOOST_SECRET" \
    --region "$REGION" \
    --description "ServiceBoost integration secret for n8n" \
    2>/dev/null || {
    echo "Secret already exists, updating with new value..."
    aws secretsmanager update-secret \
        --secret-id "$S_SVC" \
        --secret-string "$SERVICEBOOST_SECRET" \
        --region "$REGION"
}

echo "✅ ServiceBoost secret configured"

# Get current service configuration
echo ""
echo "🔍 Getting current service configuration..."

CURRENT_CONFIG=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.SourceConfiguration' \
    --output json)

echo "✅ Current configuration retrieved"

# Update App Runner service with ServiceBoost secret
echo ""
echo "🚀 Updating App Runner service with ServiceBoost secret..."

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
                    \"DB_POSTGRESDB_PASSWORD\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${S_SVC}\",
                    \"SERVICEBOOST_SECRET\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${S_SVC}\"
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
if curl -s -o /dev/null -w "%{http_code}" "https://$SERVICE_URL" --connect-timeout 10 --max-time 15 | grep -q "200"; then
    echo "✅ Service is responding (HTTP 200)"
else
    echo "⚠️  Service response unexpected. Check logs if needed."
fi

echo ""
echo "🎉 App Runner service update completed!"
echo ""
echo "📋 ServiceBoost Secret Information:"
echo "=================================="
echo "Secret Name: $S_SVC"
echo "Secret Value: $SERVICEBOOST_SECRET"
echo "Environment Variable: SERVICEBOOST_SECRET"
echo ""
echo "🔐 To retrieve the secret later:"
echo "aws secretsmanager get-secret-value --secret-id $S_SVC --region $REGION --query SecretString --output text"
echo ""
echo "📋 Next Steps:"
echo "1. Configure n8n workflows to use SERVICEBOOST_SECRET"
echo "2. Test webhook integration with ServiceBoost"
echo "3. Set up custom domain: $VERCEL_DOMAIN"
