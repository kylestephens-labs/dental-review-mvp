#!/bin/bash
# Fix Custom Domain SSL Certificate
# This script fixes the automation.serviceboost.co SSL certificate issue

set -e

echo "🔧 Fixing Custom Domain SSL Certificate"
echo "======================================="

# ==== CONFIGURATION ====
REGION="us-east-2"
SERVICE_ARN="arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562"
CUSTOM_DOMAIN="automation.serviceboost.co"
VERCEL_ZONE="serviceboost.co"   # Your Vercel DNS zone name

echo "Service ARN: $SERVICE_ARN"
echo "Custom Domain: $CUSTOM_DOMAIN"
echo "Vercel Zone: $VERCEL_ZONE"
echo ""

# ==== STEP 1: Delete any failed domain config (clean slate) ====
echo "🗑️  Step 1: Removing failed domain configuration..."
aws apprunner disassociate-custom-domain \
  --service-arn "$SERVICE_ARN" \
  --domain-name "$CUSTOM_DOMAIN" \
  --region "$REGION" 2>/dev/null || echo "Domain not associated or already removed"

echo "✅ Old domain configuration removed"
echo ""

# Wait a moment for cleanup
echo "⏳ Waiting for cleanup..."
sleep 10

# ==== STEP 2: Re-add the domain to trigger new validation records ====
echo "🔗 Step 2: Re-associating custom domain..."
aws apprunner associate-custom-domain \
  --service-arn "$SERVICE_ARN" \
  --domain-name "$CUSTOM_DOMAIN" \
  --region "$REGION"

echo "✅ Domain re-associated"
echo ""

# Wait for validation records to be generated
echo "⏳ Waiting for validation records to be generated..."
sleep 15

# ==== STEP 3: Fetch new CNAME validation records ====
echo "🔍 Step 3: Fetching validation records..."
aws apprunner describe-custom-domains \
  --service-arn "$SERVICE_ARN" \
  --region "$REGION" \
  --query 'CustomDomains[].CertificateValidationRecords' \
  --output json > validation.json

echo "✅ Validation records saved to validation.json"
echo ""
echo "📋 Validation Records:"
cat validation.json | jq -r '.[] | .[] | "Name: \(.Name)\nValue: \(.Value)\n---"'
echo ""

# ==== STEP 4: Automatically add validation CNAME(s) to Vercel DNS ====
echo "📝 Step 4: Adding validation CNAME records to Vercel DNS..."
cat validation.json | jq -r '.[] | .[] | "vercel dns add '"$VERCEL_ZONE"' \(.Name) CNAME \(.Value)"' | bash

echo "✅ Validation CNAME records added to Vercel"
echo ""

# ==== STEP 5: Add primary routing CNAME to point automation. → App Runner URL ====
echo "🔗 Step 5: Adding primary routing CNAME..."
APPRUNNER_URL=$(aws apprunner describe-service \
  --service-arn "$SERVICE_ARN" \
  --region "$REGION" \
  --query 'Service.ServiceUrl' \
  --output text)

echo "App Runner URL: $APPRUNNER_URL"
vercel dns add "$VERCEL_ZONE" "automation" CNAME "$APPRUNNER_URL"

echo "✅ Primary routing CNAME added"
echo ""

# ==== STEP 6: Wait and verify certificate status ====
echo "⏳ Step 6: Waiting for SSL certificate validation..."
echo "This may take 5–15 minutes..."
echo ""

# Poll for certificate status
ATTEMPTS=0
MAX_ATTEMPTS=20  # 20 minutes max

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  STATUS=$(aws apprunner describe-custom-domains \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query "CustomDomains[?DomainName=='${CUSTOM_DOMAIN}'].Status" \
    --output text)
  
  echo "Attempt $((ATTEMPTS + 1))/$MAX_ATTEMPTS - Current status: $STATUS"
  
  if [ "$STATUS" = "Ready" ]; then
    echo "🎉 SSL certificate issued successfully for ${CUSTOM_DOMAIN}!"
    break
  elif [ "$STATUS" = "create_failed" ] || [ "$STATUS" = "update_failed" ]; then
    echo "❌ Certificate creation failed with status: $STATUS"
    echo "Please check the validation records and try again."
    exit 1
  fi
  
  echo "Still pending validation... sleeping 60s"
  sleep 60
  ATTEMPTS=$((ATTEMPTS + 1))
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
  echo "⚠️  Timeout waiting for certificate validation"
  echo "Please check the status manually:"
  echo "aws apprunner describe-custom-domains --service-arn $SERVICE_ARN --region $REGION"
  exit 1
fi

echo ""
echo "📋 Final Domain Status:"
aws apprunner describe-custom-domains \
  --service-arn "$SERVICE_ARN" \
  --region "$REGION" \
  --query 'CustomDomains[].{Domain:DomainName,Status:Status,CertificateValidationRecords:CertificateValidationRecords}' \
  --output table

echo ""
echo "🎉 Custom Domain Setup Complete!"
echo "================================"
echo "✅ Domain: $CUSTOM_DOMAIN"
echo "✅ Status: Ready"
echo "✅ SSL Certificate: Valid"
echo ""
echo "🧪 Test your domain:"
echo "curl -I https://$CUSTOM_DOMAIN"
echo ""
echo "🔧 Update your OAuth redirect URI to:"
echo "https://$CUSTOM_DOMAIN/rest/oauth2-credential/callback"
