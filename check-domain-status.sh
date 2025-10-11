#!/bin/bash
# Monitor Custom Domain Certificate Status
# This script checks the certificate validation status

set -e

echo "🔍 Monitoring Custom Domain Certificate Status"
echo "============================================="

SERVICE_ARN="arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562"
REGION="us-east-2"
CUSTOM_DOMAIN="automation.serviceboost.co"

echo "Checking status for: $CUSTOM_DOMAIN"
echo ""

# Check current status
STATUS=$(aws apprunner describe-custom-domains \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'CustomDomains[0].Status' \
    --output text)

echo "Current status: $STATUS"

case "$STATUS" in
    "ACTIVE")
        echo "✅ Certificate is active! Custom domain is ready."
        echo ""
        echo "🧪 Testing custom domain..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$CUSTOM_DOMAIN" --connect-timeout 10 --max-time 15 || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✅ Custom domain is working! (HTTP $HTTP_CODE)"
        else
            echo "⚠️  Custom domain returned HTTP $HTTP_CODE"
        fi
        
        echo ""
        echo "🎉 Setup complete! Your custom domain is ready:"
        echo "   https://$CUSTOM_DOMAIN"
        echo "   https://$CUSTOM_DOMAIN/webhook/lead-intake-notify"
        ;;
    "pending_certificate_dns_validation")
        echo "⏳ Certificate validation in progress..."
        echo "   This usually takes 5-15 minutes after DNS records are added."
        echo "   Run this script again in a few minutes to check status."
        ;;
    "CREATE_FAILED"|"UPDATE_FAILED"|"create_failed"|"update_failed")
        echo "❌ Certificate creation failed!"
        echo "   Check the DNS records and try again."
        ;;
    *)
        echo "⚠️  Unknown status: $STATUS"
        ;;
esac

echo ""
echo "🔍 To check status manually:"
echo "aws apprunner describe-custom-domains --service-arn $SERVICE_ARN --region $REGION --query 'CustomDomains[].{Domain:DomainName,Status:Status}' --output table"
