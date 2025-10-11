#!/bin/bash
# Update n8n Environment Variables to Use App Runner URL (Simplified)
# This script updates the n8n instance to use the App Runner URL instead of the custom domain

set -e

echo "🔧 Updating n8n Environment Variables"
echo "====================================="

SERVICE_ARN="arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562"
REGION="us-east-2"
APPRUNNER_URL="uncqyimekm.us-east-2.awsapprunner.com"

echo "Service ARN: $SERVICE_ARN"
echo "App Runner URL: $APPRUNNER_URL"
echo ""

# Update App Runner service with new environment variables
echo "🚀 Updating App Runner service..."

aws apprunner update-service \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --source-configuration "{
        \"ImageRepository\": {
            \"ImageRepositoryType\": \"ECR\",
            \"ImageIdentifier\": \"625246225347.dkr.ecr.us-east-2.amazonaws.com/n8n:1.61.0\",
            \"ImageConfiguration\": {
                \"Port\": \"5678\",
                \"RuntimeEnvironmentVariables\": {
                    \"N8N_HOST\": \"$APPRUNNER_URL\",
                    \"N8N_PROTOCOL\": \"https\",
                    \"WEBHOOK_URL\": \"https://$APPRUNNER_URL\",
                    \"N8N_PORT\": \"5678\",
                    \"N8N_SECURE_MODE\": \"true\",
                    \"N8N_LOG_LEVEL\": \"info\",
                    \"N8N_LOG_OUTPUT\": \"console\",
                    \"EXECUTIONS_MODE\": \"regular\",
                    \"NODE_OPTIONS\": \"--max-old-space-size=1536\",
                    \"N8N_SKIP_WEBHOOK_DEREGISTRATION\": \"true\",
                    \"DB_TYPE\": \"postgresdb\",
                    \"DB_POSTGRESDB_HOST\": \"n8n-database.cb0ys2yimzmc.us-east-2.rds.amazonaws.com\",
                    \"DB_POSTGRESDB_PORT\": \"5432\",
                    \"DB_POSTGRESDB_DATABASE\": \"postgres\",
                    \"DB_POSTGRESDB_USER\": \"n8nadmin\",
                    \"DB_POSTGRESDB_PASSWORD\": \"TempPassword123!\",
                    \"DB_POSTGRESDB_SSL\": \"true\",
                    \"DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED\": \"false\",
                    \"DB_POSTGRESDB_CONNECTION_TIMEOUT\": \"60000\",
                    \"N8N_ENCRYPTION_KEY\": \"n8n-encryption-key-2024\"
                }
            }
        },
        \"AutoDeploymentsEnabled\": false,
        \"AuthenticationConfiguration\": {
            \"AccessRoleArn\": \"arn:aws:iam::625246225347:role/AppRunnerECRAccessRole\"
        }
    }" \
    --instance-configuration "{
        \"Cpu\": \"1024\",
        \"Memory\": \"2048\",
        \"InstanceRoleArn\": \"arn:aws:iam::625246225347:role/AppRunnerSecretsRole\"
    }"

echo "✅ App Runner service update initiated"
echo ""

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
echo "This may take a few minutes..."
aws apprunner wait service-running --service-arn "$SERVICE_ARN" --region "$REGION"
if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
else
    echo "❌ Deployment failed or timed out. Check App Runner console for details."
    exit 1
fi

# Test updated service
echo ""
echo "🧪 Testing updated service..."
SERVICE_URL=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region "$REGION" --query 'Service.ServiceUrl' --output text)
echo "Service URL: $SERVICE_URL"
echo "Testing basic connectivity..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$SERVICE_URL")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Service is responding (HTTP 200)"
else
    echo "⚠️  Service response unexpected. HTTP Code: $HTTP_CODE. Check logs if needed."
fi

echo ""
echo "🎉 n8n Environment Variables Updated!"
echo "====================================="
echo "✅ N8N_HOST: $APPRUNNER_URL"
echo "✅ N8N_PROTOCOL: https"
echo "✅ WEBHOOK_URL: https://$APPRUNNER_URL"
echo ""
echo "📋 Next Steps:"
echo "1. Go back to your n8n Gmail credential"
echo "2. The OAuth Redirect URL should now show: https://$APPRUNNER_URL/credential/callback"
echo "3. Try 'Sign in with Google' again"
echo ""
echo "🔧 If the OAuth Redirect URL still shows the old URL:"
echo "1. Refresh the n8n page"
echo "2. Or delete and recreate the Gmail credential"
