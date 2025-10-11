#!/bin/bash
# Fix Custom Domain Certificate Issue
# This script removes the failed domain and recreates it

set -e

echo "🔧 Fixing Custom Domain Certificate Issue"
echo "========================================="

SERVICE_ARN="arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562"
REGION="us-east-2"
CUSTOM_DOMAIN="automation.serviceboost.co"

echo "Service ARN: $SERVICE_ARN"
echo "Custom Domain: $CUSTOM_DOMAIN"
echo ""

# Step 1: Disassociate the failed domain
echo "🗑️  Step 1: Removing failed domain association..."

aws apprunner disassociate-custom-domain \
    --service-arn "$SERVICE_ARN" \
    --domain-name "$CUSTOM_DOMAIN" \
    --region "$REGION"

echo "✅ Domain disassociated"

# Wait a moment for cleanup
echo "⏳ Waiting for cleanup..."
sleep 10

# Step 2: Reassociate the domain
echo ""
echo "🔗 Step 2: Reassociating domain..."

aws apprunner associate-custom-domain \
    --service-arn "$SERVICE_ARN" \
    --domain-name "$CUSTOM_DOMAIN" \
    --region "$REGION"

echo "✅ Domain reassociated"

# Step 3: Get new validation records
echo ""
echo "🔍 Step 3: Getting new validation records..."

NEW_RECORDS=$(aws apprunner describe-custom-domains \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'CustomDomains[].CertificateValidationRecords' \
    --output json)

echo "New validation records:"
echo "$NEW_RECORDS" | jq '.'

# Step 4: Add new DNS records
echo ""
echo "📝 Step 4: Adding new DNS records to Vercel..."

# Remove old records first
echo "Removing old DNS records..."
vercel dns rm serviceboost.co rec_0a24198f5588c5f56cda5145 --yes 2>/dev/null || true
vercel dns rm serviceboost.co rec_b2d97ab224ec92f6f2ba69cb --yes 2>/dev/null || true
vercel dns rm serviceboost.co rec_34940e1d86c3fd1e86ab9257 --yes 2>/dev/null || true

# Add new records
echo "$NEW_RECORDS" | jq -r '.[] | .[] | "vercel dns add serviceboost.co \(.Name) CNAME \(.Value)"' | while read -r command; do
    echo "Executing: $command"
    eval "$command"
done

echo ""
echo "✅ New DNS records added!"
echo ""
echo "⏳ Now waiting for certificate validation..."
echo "This usually takes 5-15 minutes."
echo ""
echo "🔍 To check status:"
echo "./check-domain-status.sh"
