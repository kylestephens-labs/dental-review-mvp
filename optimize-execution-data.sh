#!/bin/bash
# Optimize n8n Execution Data Management
# This script configures n8n to manage execution data efficiently

set -e

echo "⚡ Optimizing n8n Execution Data Management"
echo "==========================================="

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

# Show current execution data settings
echo ""
echo "📊 Current Execution Data Settings:"
echo "=================================="

CURRENT_CONFIG=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables' \
    --output json)

echo "Current execution-related environment variables:"
echo "$CURRENT_CONFIG" | jq 'to_entries[] | select(.key | contains("EXECUTIONS")) | {key: .key, value: .value}'

# Update App Runner service with optimized execution data settings
echo ""
echo "🔧 Updating App Runner service with optimized execution data settings..."

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
                    \"DB_POSTGRESDB_CONNECTION_TIMEOUT\": \"60000\",
                    \"N8N_EXECUTIONS_DATA_SAVE_ON_SUCCESS\": \"none\",
                    \"N8N_EXECUTIONS_DATA_SAVE_ON_ERROR\": \"all\",
                    \"N8N_EXECUTIONS_DATA_PRUNE\": \"true\",
                    \"N8N_EXECUTIONS_DATA_MAX_AGE\": \"30\"
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
        echo "Check CloudWatch logs for details"
        exit 1
    fi
    
    sleep 30
done

# Verify the new configuration
echo ""
echo "🔍 Verifying new execution data configuration..."

NEW_CONFIG=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables' \
    --output json)

echo "New execution-related environment variables:"
echo "$NEW_CONFIG" | jq 'to_entries[] | select(.key | contains("EXECUTIONS")) | {key: .key, value: .value}'

# Show optimization benefits
echo ""
echo "⚡ Execution Data Optimization Benefits:"
echo "======================================="
echo "✅ N8N_EXECUTIONS_DATA_SAVE_ON_SUCCESS=none"
echo "   - Successful executions: No data saved (saves storage)"
echo "   - Only execution metadata kept (timing, status)"
echo ""
echo "✅ N8N_EXECUTIONS_DATA_SAVE_ON_ERROR=all"
echo "   - Failed executions: Full data saved (for debugging)"
echo "   - Includes input/output data for troubleshooting"
echo ""
echo "✅ N8N_EXECUTIONS_DATA_PRUNE=true"
echo "   - Automatic cleanup enabled"
echo "   - Old execution data automatically removed"
echo ""
echo "✅ N8N_EXECUTIONS_DATA_MAX_AGE=30"
echo "   - Execution data kept for 30 days"
echo "   - Automatic pruning after 30 days"
echo ""
echo "💰 Storage Impact:"
echo "=================="
echo "- Successful executions: ~90% storage reduction"
echo "- Failed executions: Full data kept for debugging"
echo "- Automatic cleanup: Prevents database bloat"
echo "- 30-day retention: Balances debugging needs with storage costs"
echo ""
echo "🔍 Performance Impact:"
echo "======================"
echo "- Faster database queries (less data to scan)"
echo "- Reduced backup sizes"
echo "- Better n8n UI performance"
echo "- Lower RDS storage costs"
echo ""
echo "📊 Monitoring Recommendations:"
echo "============================="
echo "1. Monitor RDS storage usage over time"
echo "2. Check execution success/failure rates"
echo "3. Adjust MAX_AGE if debugging needs change"
echo "4. Consider enabling execution data for critical workflows"
echo ""
echo "🎉 Execution data optimization completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Monitor database storage usage"
echo "2. Test workflow executions to verify behavior"
echo "3. Adjust settings if debugging needs change"
echo ""
echo "🔍 To monitor execution data:"
echo "1. Login to n8n: https://${VERCEL_DOMAIN}"
echo "2. Go to Executions page"
echo "3. Check that successful executions show minimal data"
echo "4. Verify failed executions show full data for debugging"
