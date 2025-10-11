#!/bin/bash
# Check SNS Subscription Status
# This script shows the current status of SNS subscriptions

set -e

echo "📧 Checking SNS Subscription Status"
echo "==================================="

# Load AWS configuration
if [ -f "aws-config.sh" ]; then
    source aws-config.sh
    echo "✅ Loaded AWS configuration"
else
    echo "❌ aws-config.sh not found. Please run from project root."
    exit 1
fi

# Find the SNS topic
echo ""
echo "🔍 Finding SNS notification topic..."

SNS_TOPIC_ARN=$(aws sns list-topics \
    --region "$REGION" \
    --query 'Topics[?contains(TopicArn, `n8n-alerts`)].TopicArn' \
    --output text)

if [ -z "$SNS_TOPIC_ARN" ]; then
    echo "❌ No SNS topic found for n8n alerts"
    echo "Run setup-cloudwatch-monitoring.sh first"
    exit 1
fi

echo "✅ Found SNS topic: $SNS_TOPIC_ARN"

# List subscriptions
echo ""
echo "📋 Current Subscriptions:"
echo "========================="

aws sns list-subscriptions-by-topic \
    --topic-arn "$SNS_TOPIC_ARN" \
    --region "$REGION" \
    --query 'Subscriptions[].{Endpoint:Endpoint,Protocol:Protocol,SubscriptionArn:SubscriptionArn,Owner:Owner}' \
    --output table

echo ""
echo "📊 Subscription Status Summary:"
echo "=============================="

# Count subscriptions by status
TOTAL_SUBS=$(aws sns list-subscriptions-by-topic \
    --topic-arn "$SNS_TOPIC_ARN" \
    --region "$REGION" \
    --query 'Subscriptions[].SubscriptionArn' \
    --output text | wc -w)

CONFIRMED_SUBS=$(aws sns list-subscriptions-by-topic \
    --topic-arn "$SNS_TOPIC_ARN" \
    --region "$REGION" \
    --query 'Subscriptions[?SubscriptionArn!=`PendingConfirmation`].SubscriptionArn' \
    --output text | wc -w)

PENDING_SUBS=$(aws sns list-subscriptions-by-topic \
    --topic-arn "$SNS_TOPIC_ARN" \
    --region "$REGION" \
    --query 'Subscriptions[?SubscriptionArn==`PendingConfirmation`].SubscriptionArn' \
    --output text | wc -w)

echo "Total subscriptions: $TOTAL_SUBS"
echo "Confirmed subscriptions: $CONFIRMED_SUBS"
echo "Pending confirmation: $PENDING_SUBS"

if [ "$PENDING_SUBS" -gt 0 ]; then
    echo ""
    echo "⚠️  You have pending subscriptions that need confirmation:"
    echo "1. Check your email inbox"
    echo "2. Look for AWS SNS confirmation emails"
    echo "3. Click the confirmation link in the email"
    echo "4. Run this script again to verify confirmation"
fi

if [ "$CONFIRMED_SUBS" -gt 0 ]; then
    echo ""
    echo "✅ You have confirmed subscriptions and will receive alerts!"
fi

echo ""
echo "🔍 To manage subscriptions:"
echo "aws sns list-subscriptions-by-topic --topic-arn $SNS_TOPIC_ARN --region $REGION"
echo ""
echo "🗑️  To unsubscribe a specific subscription:"
echo "aws sns unsubscribe --subscription-arn <SUBSCRIPTION_ARN> --region $REGION"
