#!/bin/bash
# Add DNS Validation Records for Custom Domain
# This script adds the required CNAME records for SSL certificate validation

set -e

echo "🔧 Adding DNS Validation Records"
echo "==============================="

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo "Please install it with: npm i -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel"
    echo "Please run: vercel login"
    exit 1
fi

echo "✅ Vercel CLI is ready"

# Add the validation CNAME records
echo ""
echo "📝 Adding validation CNAME records..."

# Record 1
echo "Adding record 1..."
vercel dns add serviceboost.co "_e895ca58aef524639f4f0a0b13190a66.automation" CNAME "_a3178018ce8695c986e29b63ed0dfeb6.xlfgrmvvlj.acm-validations.aws."

# Record 2
echo "Adding record 2..."
vercel dns add serviceboost.co "_79d673f8acdaf527b1c87bd1a7b5d058.www.automation" CNAME "_5d27a3a5b9511f872b5f5ce5d0efd3f3.xlfgrmvvlj.acm-validations.aws."

# Record 3
echo "Adding record 3..."
vercel dns add serviceboost.co "_f17b84fde78369e8981f20b77ee3154f.2a57j780olh9y9xqbb05rfdkozihhcw.automation" CNAME "_226b48ab580308b7e26dc8fb18568954.xlfgrmvvlj.acm-validations.aws."

# Add main CNAME record
echo ""
echo "Adding main CNAME record..."
vercel dns add serviceboost.co "automation" CNAME "uncqyimekm.us-east-2.awsapprunner.com"

echo ""
echo "✅ All DNS records added!"
echo ""
echo "⏳ Now waiting for certificate validation..."
echo "This usually takes 5-15 minutes."
echo ""
echo "🔍 To check status:"
echo "aws apprunner describe-custom-domains --service-arn arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562 --region us-east-2 --query 'CustomDomains[].{Domain:DomainName,Status:Status}' --output table"
