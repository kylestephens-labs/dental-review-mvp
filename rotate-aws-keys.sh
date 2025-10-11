#!/bin/bash
# Safe AWS Key Rotation Script
# This script helps rotate AWS keys without breaking your deployment

set -e

echo "🔄 AWS Key Rotation Script"
echo "========================="
echo ""

# Check if AWS CLI is working
echo "1. Testing current AWS access..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ Current AWS access is working"
    CURRENT_USER=$(aws sts get-caller-identity --query 'Arn' --output text)
    echo "   Current user: $CURRENT_USER"
else
    echo "❌ Current AWS access is not working"
    exit 1
fi

echo ""
echo "2. Testing App Runner service access..."
if aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562" --region us-east-2 > /dev/null 2>&1; then
    echo "✅ App Runner service is accessible"
else
    echo "❌ Cannot access App Runner service"
    exit 1
fi

echo ""
echo "3. Testing RDS database access..."
if aws rds describe-db-instances --db-instance-identifier n8n-database --region us-east-2 > /dev/null 2>&1; then
    echo "✅ RDS database is accessible"
else
    echo "❌ Cannot access RDS database"
    exit 1
fi

echo ""
echo "✅ All AWS services are accessible with current keys"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Go to AWS Console → IAM → Users → serviceboost14"
echo "2. Click 'Security credentials' tab"
echo "3. Click 'Create access key'"
echo "4. Choose 'Command Line Interface (CLI)'"
echo "5. Copy the new Access Key ID and Secret Access Key"
echo ""
echo "6. Run this command to update your local config:"
echo "   aws configure set aws_access_key_id <NEW_ACCESS_KEY_ID>"
echo "   aws configure set aws_secret_access_key <NEW_SECRET_ACCESS_KEY>"
echo ""
echo "7. Test the new keys with:"
echo "   aws sts get-caller-identity"
echo ""
echo "8. If everything works, delete the old keys in AWS Console"
echo ""
echo "⚠️  IMPORTANT: Don't delete the old keys until you've tested the new ones!"
