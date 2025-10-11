#!/bin/bash
# Get ServiceBoost Secret
# This script retrieves the ServiceBoost secret from AWS Secrets Manager

set -e

echo "🔐 Retrieving ServiceBoost Secret"
echo "================================="

# Load AWS configuration
if [ -f "aws-config.sh" ]; then
    source aws-config.sh
    echo "✅ Loaded AWS configuration"
else
    echo "❌ aws-config.sh not found. Please run from project root."
    exit 1
fi

# Get the ServiceBoost secret
echo ""
echo "🔍 Retrieving ServiceBoost secret from AWS Secrets Manager..."

SECRET=$(aws secretsmanager get-secret-value \
    --secret-id "$S_SVC" \
    --region "$REGION" \
    --query 'SecretString' \
    --output text)

if [ -z "$SECRET" ]; then
    echo "❌ Failed to retrieve ServiceBoost secret from Secrets Manager"
    exit 1
fi

echo "✅ Secret retrieved successfully"
echo ""
echo "🔐 ServiceBoost Secret Information:"
echo "==================================="
echo "Secret Name: $S_SVC"
echo "Secret Value: $SECRET"
echo "Environment Variable: SERVICEBOOST_SECRET"
echo ""
echo "📋 Usage in n8n:"
echo "1. In n8n workflows, use the environment variable: \$SERVICEBOOST_SECRET"
echo "2. For HTTP requests to ServiceBoost, use this as the Authorization header"
echo "3. Example: Authorization: Bearer $SECRET"
echo ""
echo "⚠️  Security Note:"
echo "- Keep this secret secure"
echo "- Don't log or expose this value"
echo "- Use only in n8n workflows or secure environments"
