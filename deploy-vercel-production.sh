#!/bin/bash
# Deploy to Vercel Production with Updated Webhook URL
# This script updates the production environment and triggers a deployment

set -e

echo "🚀 Deploying to Vercel Production with Updated Webhook"
echo "====================================================="

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

# Set Vercel project configuration
VERCEL_PROJECT="serviceboost-site"
WEBHOOK_URL="https://automation.serviceboost.co/webhook/lead-intake-notify"

echo ""
echo "📋 Deployment Configuration:"
echo "============================"
echo "Vercel Project: $VERCEL_PROJECT"
echo "Webhook URL: $WEBHOOK_URL"
echo "n8n Service: https://automation.serviceboost.co"
echo ""

# Check if Vercel CLI is installed
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

# Show current environment variables
echo ""
echo "🔍 Current Production Environment Variables:"
echo "==========================================="

vercel env ls production --project "$VERCEL_PROJECT" 2>/dev/null || echo "No environment variables found"

# Remove existing webhook URL (if it exists)
echo ""
echo "🗑️  Removing existing N8N_INTAKE_WEBHOOK variable..."

vercel env rm N8N_INTAKE_WEBHOOK production -y --project "$VERCEL_PROJECT" 2>/dev/null || echo "Variable not found (this is OK)"

# Add new webhook URL
echo ""
echo "➕ Adding new N8N_INTAKE_WEBHOOK variable..."

echo -n "$WEBHOOK_URL" | vercel env add N8N_INTAKE_WEBHOOK production --project "$VERCEL_PROJECT"

echo "✅ Environment variable added"

# Verify the new variable
echo ""
echo "🔍 Verifying new environment variable..."

NEW_WEBHOOK=$(vercel env pull .env.production --project "$VERCEL_PROJECT" 2>/dev/null && grep N8N_INTAKE_WEBHOOK .env.production | cut -d'=' -f2- || echo "Not found")

if [ "$NEW_WEBHOOK" = "$WEBHOOK_URL" ]; then
    echo "✅ Webhook URL correctly set: $NEW_WEBHOOK"
else
    echo "❌ Webhook URL mismatch!"
    echo "Expected: $WEBHOOK_URL"
    echo "Got: $NEW_WEBHOOK"
    exit 1
fi

# Clean up temporary file
rm -f .env.production

# Deploy to production
echo ""
echo "🚀 Deploying to production..."

vercel deploy --prod --project "$VERCEL_PROJECT"

echo "✅ Production deployment initiated"

# Get deployment URL
echo ""
echo "🔍 Getting deployment information..."

DEPLOYMENT_URL=$(vercel ls --project "$VERCEL_PROJECT" --limit 1 --json | jq -r '.[0].url' 2>/dev/null || echo "Unknown")

echo "Deployment URL: https://$DEPLOYMENT_URL"

# Test the webhook endpoint
echo ""
echo "🧪 Testing webhook endpoint..."

if curl -s -o /dev/null -w "%{http_code}" "https://automation.serviceboost.co/webhook/lead-intake-notify" --connect-timeout 10 --max-time 15 | grep -q "404\|405\|200"; then
    echo "✅ Webhook endpoint is responding"
else
    echo "⚠️  Webhook endpoint may not be ready yet"
    echo "   This is normal if n8n workflows haven't been configured yet"
fi

# Show integration status
echo ""
echo "📋 Integration Status:"
echo "====================="
echo "✅ Vercel project: $VERCEL_PROJECT"
echo "✅ Webhook URL: $WEBHOOK_URL"
echo "✅ Production deployment: Initiated"
echo "✅ n8n service: https://automation.serviceboost.co"
echo ""
echo "🔗 Next Steps:"
echo "1. Wait for Vercel deployment to complete"
echo "2. Test the dental landing page form submission"
echo "3. Configure n8n workflows to handle the webhook"
echo "4. Monitor webhook delivery in n8n executions"
echo ""
echo "🔍 To monitor deployment:"
echo "vercel logs --project $VERCEL_PROJECT"
echo ""
echo "🔍 To check webhook in n8n:"
echo "1. Login to: https://automation.serviceboost.co"
echo "2. Go to Executions page"
echo "3. Submit a test form on your dental site"
echo "4. Check for webhook executions"
echo ""
echo "🎉 Vercel deployment with updated webhook completed!"
