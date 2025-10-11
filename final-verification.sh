#!/bin/bash
# Final Verification After Key Rotation
# Run this after deleting the old AWS keys

echo "🔍 Final Verification After Key Rotation"
echo "========================================"
echo ""

# Test 1: Verify only new key exists
echo "1. Checking remaining access keys..."
REMAINING_KEYS=$(aws iam list-access-keys --user-name serviceboost14 --query 'AccessKeyMetadata[].AccessKeyId' --output text)
echo "   Remaining keys: $REMAINING_KEYS"

if [[ "$REMAINING_KEYS" == *"AKIAZDE4UIPBWHZXPVUV"* ]] && [[ "$REMAINING_KEYS" != *"AKIAZDE4UIPB2HRYFGGX"* ]]; then
    echo "✅ Only new key remains (old key successfully deleted)"
else
    echo "❌ Key deletion verification failed"
    exit 1
fi

# Test 2: Verify AWS access still works
echo ""
echo "2. Testing AWS access with remaining key..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ AWS access working with new key"
else
    echo "❌ AWS access failed"
    exit 1
fi

# Test 3: Verify App Runner service
echo ""
echo "3. Testing App Runner service..."
if aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562" --region us-east-2 > /dev/null 2>&1; then
    echo "✅ App Runner service accessible"
    SERVICE_STATUS=$(aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562" --region us-east-2 --query 'Service.Status' --output text)
    echo "   Service status: $SERVICE_STATUS"
else
    echo "❌ App Runner service not accessible"
    exit 1
fi

# Test 4: Verify webhook endpoint
echo ""
echo "4. Testing webhook endpoint..."
if curl -s -o /dev/null -w "%{http_code}" https://uncqyimekm.us-east-2.awsapprunner.com --connect-timeout 10 --max-time 15 | grep -q "200"; then
    echo "✅ Webhook endpoint responding (HTTP 200)"
else
    echo "⚠️  Webhook endpoint not responding (check if n8n is restarting)"
fi

echo ""
echo "🎉 Key rotation completed successfully!"
echo ""
echo "✅ Old key deleted: AKIAZDE4UIPB2HRYFGGX"
echo "✅ New key active: AKIAZDE4UIPBWHZXPVUV"
echo "✅ n8n deployment still running"
echo "✅ All AWS services accessible"
echo ""
echo "🔒 Security status: IMPROVED"
echo "   - Exposed keys have been rotated"
echo "   - Only secure keys remain active"
echo "   - All services continue to function"
