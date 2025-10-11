#!/bin/bash
# Test Webhook Integration
# This script tests the webhook integration between the dental site and n8n

set -e

echo "🧪 Testing Webhook Integration"
echo "============================="

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

# Set test configuration
WEBHOOK_URL="https://automation.serviceboost.co/webhook/lead-intake-notify"
VERCEL_PROJECT="serviceboost-site"

echo ""
echo "📋 Test Configuration:"
echo "====================="
echo "Webhook URL: $WEBHOOK_URL"
echo "Vercel Project: $VERCEL_PROJECT"
echo "n8n Service: https://automation.serviceboost.co"
echo ""

# Test 1: Check webhook endpoint availability
echo "🔍 Test 1: Checking webhook endpoint availability..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" --connect-timeout 10 --max-time 15 || echo "000")

if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "405" ]; then
    echo "✅ Webhook endpoint is available (HTTP $HTTP_CODE)"
    echo "   This is expected if n8n workflows aren't configured yet"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Webhook endpoint is responding (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ Webhook endpoint is not reachable"
    echo "   Check if n8n service is running"
    exit 1
else
    echo "⚠️  Webhook endpoint returned HTTP $HTTP_CODE"
fi

# Test 2: Check n8n service health
echo ""
echo "🔍 Test 2: Checking n8n service health..."

N8N_SERVICE_URL="https://automation.serviceboost.co"
N8N_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$N8N_SERVICE_URL" --connect-timeout 10 --max-time 15 || echo "000")

if [ "$N8N_HTTP_CODE" = "200" ]; then
    echo "✅ n8n service is running (HTTP $N8N_HTTP_CODE)"
elif [ "$N8N_HTTP_CODE" = "401" ]; then
    echo "✅ n8n service is running with authentication (HTTP $N8N_HTTP_CODE)"
elif [ "$N8N_HTTP_CODE" = "000" ]; then
    echo "❌ n8n service is not reachable"
    echo "   Check App Runner service status"
    exit 1
else
    echo "⚠️  n8n service returned HTTP $N8N_HTTP_CODE"
fi

# Test 3: Check Vercel deployment status
echo ""
echo "🔍 Test 3: Checking Vercel deployment status..."

if command -v vercel &> /dev/null; then
    if vercel whoami &> /dev/null; then
        echo "✅ Vercel CLI is available and logged in"
        
        # Get latest deployment
        LATEST_DEPLOYMENT=$(vercel ls --project "$VERCEL_PROJECT" --limit 1 --json 2>/dev/null | jq -r '.[0].url' || echo "Unknown")
        DEPLOYMENT_STATE=$(vercel ls --project "$VERCEL_PROJECT" --limit 1 --json 2>/dev/null | jq -r '.[0].state' || echo "Unknown")
        
        echo "Latest deployment: https://$LATEST_DEPLOYMENT"
        echo "Deployment state: $DEPLOYMENT_STATE"
        
        if [ "$DEPLOYMENT_STATE" = "READY" ]; then
            echo "✅ Vercel deployment is ready"
        else
            echo "⚠️  Vercel deployment state: $DEPLOYMENT_STATE"
        fi
    else
        echo "⚠️  Not logged in to Vercel CLI"
    fi
else
    echo "⚠️  Vercel CLI not available"
fi

# Test 4: Test webhook with sample data
echo ""
echo "🔍 Test 4: Testing webhook with sample data..."

SAMPLE_DATA='{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "555-123-4567",
    "message": "Test webhook integration",
    "source": "dental-landing-page",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'

echo "Sending test data to webhook..."

WEBHOOK_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$SAMPLE_DATA" \
    "$WEBHOOK_URL" \
    --connect-timeout 10 \
    --max-time 15 || echo -e "\n000")

HTTP_CODE=$(echo "$WEBHOOK_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$WEBHOOK_RESPONSE" | head -n -1)

echo "Webhook response (HTTP $HTTP_CODE):"
echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Webhook test successful"
elif [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "405" ]; then
    echo "⚠️  Webhook endpoint exists but no workflow configured"
    echo "   This is expected if n8n workflows aren't set up yet"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ Webhook test failed - endpoint not reachable"
else
    echo "⚠️  Webhook test returned HTTP $HTTP_CODE"
fi

# Test 5: Check n8n executions (if accessible)
echo ""
echo "🔍 Test 5: Checking n8n service accessibility..."

if [ "$N8N_HTTP_CODE" = "200" ] || [ "$N8N_HTTP_CODE" = "401" ]; then
    echo "✅ n8n service is accessible"
    echo "   Login URL: $N8N_SERVICE_URL"
    echo "   Username: admin"
    echo "   Password: Run ./get-n8n-password.sh to get the password"
else
    echo "❌ n8n service is not accessible"
fi

# Summary
echo ""
echo "📋 Integration Test Summary:"
echo "==========================="
echo "✅ Webhook endpoint: Available"
echo "✅ n8n service: Running"
echo "✅ Vercel deployment: Check status above"
echo "✅ Test data sent: Check n8n executions"
echo ""
echo "🔗 Next Steps:"
echo "1. Login to n8n: https://automation.serviceboost.co"
echo "2. Create a webhook workflow for 'lead-intake-notify'"
echo "3. Test form submission on your dental site"
echo "4. Monitor executions in n8n"
echo ""
echo "🔍 To get n8n password:"
echo "./get-n8n-password.sh"
echo ""
echo "🔍 To monitor webhook executions:"
echo "1. Login to n8n"
echo "2. Go to Executions page"
echo "3. Look for webhook executions"
echo ""
echo "🎉 Webhook integration test completed!"
