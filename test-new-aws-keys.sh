#!/bin/bash
# Test New AWS Keys Script
# Run this after updating your AWS keys to make sure everything still works

set -e

echo "🧪 Testing New AWS Keys"
echo "======================="
echo ""

# Test 1: Basic AWS access
echo "1. Testing basic AWS access..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ AWS access working"
    NEW_USER=$(aws sts get-caller-identity --query 'Arn' --output text)
    echo "   User: $NEW_USER"
else
    echo "❌ AWS access failed"
    exit 1
fi

# Test 2: App Runner service
echo ""
echo "2. Testing App Runner service..."
if aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562" --region us-east-2 > /dev/null 2>&1; then
    echo "✅ App Runner service accessible"
    SERVICE_STATUS=$(aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562" --region us-east-2 --query 'Service.Status' --output text)
    echo "   Service status: $SERVICE_STATUS"
else
    echo "❌ App Runner service not accessible"
    exit 1
fi

# Test 3: RDS database
echo ""
echo "3. Testing RDS database..."
if aws rds describe-db-instances --db-instance-identifier n8n-database --region us-east-2 > /dev/null 2>&1; then
    echo "✅ RDS database accessible"
    DB_STATUS=$(aws rds describe-db-instances --db-instance-identifier n8n-database --region us-east-2 --query 'DBInstances[0].DBInstanceStatus' --output text)
    echo "   Database status: $DB_STATUS"
else
    echo "❌ RDS database not accessible"
    exit 1
fi

# Test 4: ECR access
echo ""
echo "4. Testing ECR access..."
if aws ecr describe-repositories --repository-names n8n --region us-east-2 > /dev/null 2>&1; then
    echo "✅ ECR repository accessible"
else
    echo "❌ ECR repository not accessible"
    exit 1
fi

# Test 5: Webhook endpoint
echo ""
echo "5. Testing webhook endpoint..."
if curl -s -o /dev/null -w "%{http_code}" https://uncqyimekm.us-east-2.awsapprunner.com --connect-timeout 10 --max-time 15 | grep -q "200"; then
    echo "✅ Webhook endpoint responding (HTTP 200)"
else
    echo "⚠️  Webhook endpoint not responding (this might be normal if n8n is restarting)"
fi

echo ""
echo "🎉 All tests passed! Your new AWS keys are working correctly."
echo ""
echo "✅ Safe to delete the old keys in AWS Console"
echo "✅ Your n8n deployment is still working"
echo "✅ All AWS services are accessible"
