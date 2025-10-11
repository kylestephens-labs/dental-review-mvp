#!/bin/bash
# Set Up Custom Domain for App Runner Service
# This script associates a custom domain with App Runner and configures DNS

set -e

echo "🌐 Setting Up Custom Domain for App Runner"
echo "========================================="

# Load AWS configuration
if [ -f "aws-config.sh" ]; then
    source aws-config.sh
    echo "✅ Loaded AWS configuration"
else
    echo "❌ aws-config.sh not found. Please run from project root."
    exit 1
fi

# Validate configuration
echo ""
echo "🔍 Validating configuration..."
validate_aws_config

# Set domain configuration
REGION="us-east-2"
SERVICE_ARN="arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562"
APEX_ZONE="serviceboost.co"
CUSTOM_DOMAIN="automation.serviceboost.co"

echo ""
echo "📋 Domain Configuration:"
echo "======================="
echo "Region: $REGION"
echo "Service ARN: $SERVICE_ARN"
echo "Apex Zone: $APEX_ZONE"
echo "Custom Domain: $CUSTOM_DOMAIN"
echo ""

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo "Please install it with: npm i -g vercel"
    echo "Or visit: https://vercel.com/cli"
    exit 1
fi

echo "✅ Vercel CLI found"

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel"
    echo "Please run: vercel login"
    exit 1
fi

echo "✅ Logged in to Vercel"

# Step A: Associate custom domain with App Runner
echo ""
echo "🔗 Step A: Associating custom domain with App Runner..."

aws apprunner associate-custom-domain \
    --service-arn "$SERVICE_ARN" \
    --domain-name "$CUSTOM_DOMAIN" \
    --region "$REGION"

echo "✅ Custom domain associated with App Runner"

# Step B: Get validation CNAME records and add them to Vercel DNS
echo ""
echo "🔍 Step B: Getting certificate validation records..."

VALIDATION_RECORDS=$(aws apprunner describe-custom-domains \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'CustomDomains[].CertificateValidationRecords' \
    --output json)

echo "Certificate validation records:"
echo "$VALIDATION_RECORDS" | jq '.'

# Add validation CNAME records to Vercel DNS
echo ""
echo "📝 Adding validation CNAME records to Vercel DNS..."

echo "$VALIDATION_RECORDS" | jq -r '.[] | .[] | "vercel dns add '"$APEX_ZONE"' \(.Name) CNAME \(.Value)"' | while read -r command; do
    echo "Executing: $command"
    eval "$command"
done

echo "✅ Validation CNAME records added to Vercel DNS"

# Step C: Add main CNAME record for direct routing
echo ""
echo "🔗 Step C: Adding main CNAME record for direct routing..."

APPRUNNER_URL=$(aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.ServiceUrl' \
    --output text)

echo "App Runner URL: $APPRUNNER_URL"

# Extract subdomain from custom domain
SUBDOMAIN="${CUSTOM_DOMAIN%%.$APEX_ZONE}"
echo "Subdomain: $SUBDOMAIN"

# Add main CNAME record
vercel dns add "$APEX_ZONE" "$SUBDOMAIN" CNAME "$APPRUNNER_URL"

echo "✅ Main CNAME record added to Vercel DNS"

# Step D: Poll until TLS is Ready
echo ""
echo "⏳ Step D: Waiting for TLS certificate to be ready..."
echo "This may take 5-15 minutes..."

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: Checking certificate status..."
    
    DOMAIN_STATUS=$(aws apprunner describe-custom-domains \
        --service-arn "$SERVICE_ARN" \
        --region "$REGION" \
        --query 'CustomDomains[].{Domain:DomainName,Status:Status}' \
        --output table)
    
    echo "$DOMAIN_STATUS"
    
    # Check if any domain is in PENDING_CERTIFICATE_DNS_VALIDATION status
    if echo "$DOMAIN_STATUS" | grep -q "PENDING_CERTIFICATE_DNS_VALIDATION"; then
        echo "⏳ Certificate validation in progress... waiting 30 seconds"
        sleep 30
    elif echo "$DOMAIN_STATUS" | grep -q "ACTIVE"; then
        echo "✅ Certificate is active! Custom domain is ready."
        break
    elif echo "$DOMAIN_STATUS" | grep -q "CREATE_FAILED\|UPDATE_FAILED"; then
        echo "❌ Certificate creation failed!"
        echo "Check the validation records and try again."
        exit 1
    else
        echo "⏳ Certificate status unknown... waiting 30 seconds"
        sleep 30
    fi
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "⚠️  Timeout waiting for certificate. Check status manually:"
    echo "aws apprunner describe-custom-domains --service-arn $SERVICE_ARN --region $REGION"
fi

# Final status check
echo ""
echo "📋 Final Domain Status:"
echo "======================"

aws apprunner describe-custom-domains \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'CustomDomains[].{Domain:DomainName,Status:Status,CertificateValidationRecords:CertificateValidationRecords}' \
    --output json | jq '.'

# Test the custom domain
echo ""
echo "🧪 Testing Custom Domain:"
echo "========================"

echo "Testing: https://$CUSTOM_DOMAIN"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$CUSTOM_DOMAIN" --connect-timeout 10 --max-time 15 || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Custom domain is working! (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "⚠️  Custom domain not responding yet (DNS propagation may take time)"
else
    echo "⚠️  Custom domain returned HTTP $HTTP_CODE"
fi

# Test webhook endpoint
echo ""
echo "Testing webhook endpoint: https://$CUSTOM_DOMAIN/webhook/lead-intake-notify"
WEBHOOK_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$CUSTOM_DOMAIN/webhook/lead-intake-notify" --connect-timeout 10 --max-time 15 || echo "000")

if [ "$WEBHOOK_CODE" = "404" ] || [ "$WEBHOOK_CODE" = "405" ]; then
    echo "✅ Webhook endpoint is available! (HTTP $WEBHOOK_CODE - no workflow configured yet)"
elif [ "$WEBHOOK_CODE" = "000" ]; then
    echo "⚠️  Webhook endpoint not responding yet"
else
    echo "⚠️  Webhook endpoint returned HTTP $WEBHOOK_CODE"
fi

echo ""
echo "🎉 Custom domain setup completed!"
echo ""
echo "📋 Next Steps:"
echo "============="
echo "1. Wait for DNS propagation (5-15 minutes)"
echo "2. Test: https://$CUSTOM_DOMAIN"
echo "3. Deploy to Vercel: ./deploy-vercel-production.sh"
echo "4. Configure n8n workflows for webhook processing"
echo ""
echo "🔍 To check domain status:"
echo "aws apprunner describe-custom-domains --service-arn $SERVICE_ARN --region $REGION"
echo ""
echo "🔍 To test domain:"
echo "curl -I https://$CUSTOM_DOMAIN"
echo "curl -I https://$CUSTOM_DOMAIN/webhook/lead-intake-notify"
