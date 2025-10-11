#!/bin/bash
# Get n8n Basic Authentication Password
# This script retrieves the basic auth password from AWS Secrets Manager

set -e

echo "🔐 Retrieving n8n Basic Authentication Password"
echo "==============================================="

# Load AWS configuration
if [ -f "aws-config.sh" ]; then
    source aws-config.sh
    echo "✅ Loaded AWS configuration"
else
    echo "❌ aws-config.sh not found. Please run from project root."
    exit 1
fi

# Get the basic auth password
echo ""
echo "🔍 Retrieving basic auth password from AWS Secrets Manager..."

PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id "$S_BASIC" \
    --region "$REGION" \
    --query 'SecretString' \
    --output text)

if [ -z "$PASSWORD" ]; then
    echo "❌ Failed to retrieve password from Secrets Manager"
    exit 1
fi

echo "✅ Password retrieved successfully"
echo ""
echo "🔐 n8n Basic Authentication Credentials:"
echo "========================================"
echo "URL: https://$VERCEL_DOMAIN"
echo "Username: admin"
echo "Password: $PASSWORD"
echo ""
echo "📋 Login Instructions:"
echo "1. Go to https://$VERCEL_DOMAIN"
echo "2. Enter username: admin"
echo "3. Enter password: $PASSWORD"
echo "4. Click 'Sign In'"
echo ""
echo "⚠️  Security Note:"
echo "- Keep this password secure"
echo "- Consider changing it in n8n settings"
echo "- Don't share these credentials publicly"
