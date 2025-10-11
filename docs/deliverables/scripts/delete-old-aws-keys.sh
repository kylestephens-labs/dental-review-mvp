#!/bin/bash
# Delete Old AWS Keys Script
# This script helps you identify and delete the old AWS access keys

echo "🗑️  Delete Old AWS Keys"
echo "======================"
echo ""

# Get current user info
echo "Current AWS user:"
aws sts get-caller-identity --query 'Arn' --output text
echo ""

# List all access keys for the user
echo "Current access keys for serviceboost14:"
aws iam list-access-keys --user-name serviceboost14 --query 'AccessKeyMetadata[].{AccessKeyId:AccessKeyId,Status:Status,CreateDate:CreateDate}' --output table
echo ""

echo "📋 Instructions to delete old keys:"
echo "=================================="
echo "1. Go to AWS Console → IAM → Users → serviceboost14"
echo "2. Click 'Security credentials' tab"
echo "3. Find the access key: AKIAZDE4UIPB2HRYFGGX"
echo "4. Click 'Delete' next to that key"
echo "5. Confirm deletion"
echo ""
echo "⚠️  IMPORTANT: Only delete AKIAZDE4UIPB2HRYFGGX (the old one)"
echo "✅ Keep AKIAZDE4UIPBWHZXPVUV (the new one we just tested)"
echo ""
echo "After deleting, run this command to verify:"
echo "aws iam list-access-keys --user-name serviceboost14"
