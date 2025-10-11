#!/bin/bash
# Subscribe to CloudWatch Alerts
# This script helps you subscribe to SNS notifications for CloudWatch alarms

set -e

echo "📧 Subscribe to CloudWatch Alerts"
echo "================================="

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

# Get email address from parameter or prompt
if [ -n "$1" ]; then
    EMAIL_ADDRESS="$1"
    echo "📧 Using provided email address: $EMAIL_ADDRESS"
else
    echo ""
    echo "📧 Enter your email address to receive alerts:"
    read -p "Email: " EMAIL_ADDRESS
    
    if [ -z "$EMAIL_ADDRESS" ]; then
        echo "❌ Email address is required"
        exit 1
    fi
fi

# Subscribe to SNS topic
echo ""
echo "🔔 Subscribing to alerts..."

SUBSCRIPTION_ARN=$(aws sns subscribe \
    --topic-arn "$SNS_TOPIC_ARN" \
    --protocol email \
    --notification-endpoint "$EMAIL_ADDRESS" \
    --region "$REGION" \
    --query 'SubscriptionArn' \
    --output text)

echo "✅ Subscription created: $SUBSCRIPTION_ARN"

echo ""
echo "📧 Check your email ($EMAIL_ADDRESS) for confirmation!"
echo "You need to click the confirmation link to start receiving alerts."
echo ""
echo "📋 What you'll be notified about:"
echo "================================="
echo "🚨 App Runner 5xx errors (>5 errors in 5 minutes)"
echo "🚨 App Runner high CPU (>80% for 10 minutes)"
echo "🚨 App Runner high memory (>85% for 10 minutes)"
echo "🚨 RDS high CPU (>80% for 10 minutes)"
echo "🚨 RDS high connections (>15 connections for 10 minutes)"
echo "🚨 RDS low storage (<2GB free space)"
echo "🚨 App Runner health check failures (>3 failures in 5 minutes)"
echo ""
echo "🔍 To manage subscriptions:"
echo "aws sns list-subscriptions-by-topic --topic-arn $SNS_TOPIC_ARN --region $REGION"
echo ""
echo "🗑️  To unsubscribe:"
echo "aws sns unsubscribe --subscription-arn $SUBSCRIPTION_ARN --region $REGION"
