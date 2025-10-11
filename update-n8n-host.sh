#!/bin/bash
# Update n8n Environment Variables to Use App Runner URL
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

# Get current service configuration
echo "🔍 Getting current service configuration..."
CURRENT_CONFIG=$(aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.SourceConfiguration.ImageRepository.ImageConfiguration' \
    --output json)

CURRENT_ENV_VARS=$(echo "$CURRENT_CONFIG" | jq -c '.RuntimeEnvironmentVariables')
CURRENT_SECRETS=$(echo "$CURRENT_CONFIG" | jq -c '.RuntimeEnvironmentSecrets')

echo "✅ Current configuration retrieved"
echo ""

# Update environment variables to use App Runner URL
echo "🔄 Updating environment variables..."
UPDATED_ENV_VARS=$(echo "$CURRENT_ENV_VARS" | jq --arg HOST "$APPRUNNER_URL" --arg PROTOCOL "https" --arg WEBHOOK_URL "https://$APPRUNNER_URL" '
    .N8N_HOST = $HOST |
    .N8N_PROTOCOL = $PROTOCOL |
    .WEBHOOK_URL = $WEBHOOK_URL
')

echo "✅ Environment variables updated"
echo ""

# Update App Runner service
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
                \"RuntimeEnvironmentVariables\": $UPDATED_ENV_VARS,
                \"RuntimeEnvironmentSecrets\": $CURRENT_SECRETS
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
