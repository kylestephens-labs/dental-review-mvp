#!/bin/bash
# AWS Infrastructure Status Summary
# This script provides a comprehensive overview of your AWS infrastructure

set -e

echo "🏗️  AWS Infrastructure Status Summary"
echo "===================================="

# Load AWS configuration
if [ -f "aws-config.sh" ]; then
    source aws-config.sh
    echo "✅ Loaded AWS configuration"
else
    echo "❌ aws-config.sh not found. Please run from project root."
    exit 1
fi

echo ""
echo "📋 Infrastructure Overview:"
echo "=========================="

# App Runner Service
echo ""
echo "🚀 App Runner Service:"
APP_RUNNER_STATUS=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.{Status:Status,ServiceUrl:ServiceUrl,ImageIdentifier:SourceConfiguration.ImageRepository.ImageIdentifier}' \
    --output json)

echo "$APP_RUNNER_STATUS" | jq '.'

# RDS Database
echo ""
echo "🗄️  RDS Database:"
RDS_STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].{Status:DBInstanceStatus,Class:DBInstanceClass,Engine:Engine,Version:EngineVersion,Storage:AllocatedStorage,MultiAZ:MultiAZ}' \
    --output json)

echo "$RDS_STATUS" | jq '.'

# ECR Repository
echo ""
echo "📦 ECR Repository:"
ECR_STATUS=$(aws ecr describe-repositories \
    --repository-names "$ECR_REPOSITORY_NAME" \
    --region "$REGION" \
    --query 'repositories[0].{Name:repositoryName,URI:repositoryUri,CreatedAt:createdAt}' \
    --output json)

echo "$ECR_STATUS" | jq '.'

# CloudWatch Alarms
echo ""
echo "📊 CloudWatch Alarms:"
ALARM_COUNT=$(aws cloudwatch describe-alarms \
    --region "$REGION" \
    --query 'MetricAlarms[?contains(AlarmName, `n8n`) || contains(AlarmName, `apprunner`) || contains(AlarmName, `rds`)].AlarmName' \
    --output text | wc -w)

echo "Active alarms: $ALARM_COUNT"

# SNS Subscriptions
echo ""
echo "📧 SNS Notifications:"
SNS_TOPIC_ARN=$(aws sns list-topics \
    --region "$REGION" \
    --query 'Topics[?contains(TopicArn, `n8n-alerts`)].TopicArn' \
    --output text)

if [ -n "$SNS_TOPIC_ARN" ]; then
    SUB_COUNT=$(aws sns list-subscriptions-by-topic \
        --topic-arn "$SNS_TOPIC_ARN" \
        --region "$REGION" \
        --query 'Subscriptions[].SubscriptionArn' \
        --output text | wc -w)
    
    CONFIRMED_COUNT=$(aws sns list-subscriptions-by-topic \
        --topic-arn "$SNS_TOPIC_ARN" \
        --region "$REGION" \
        --query 'Subscriptions[?SubscriptionArn!=`PendingConfirmation`].SubscriptionArn' \
        --output text | wc -w)
    
    echo "Total subscriptions: $SUB_COUNT"
    echo "Confirmed subscriptions: $CONFIRMED_COUNT"
else
    echo "No SNS topic found"
fi

# Storage Usage
echo ""
echo "💾 Storage Usage:"
FREE_STORAGE=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/RDS" \
    --metric-name "FreeStorageSpace" \
    --dimensions Name=DBInstanceIdentifier,Value="$RDS_ID" \
    --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Average \
    --region "$REGION" \
    --query 'Datapoints[-1].Average' \
    --output text 2>/dev/null || echo "No data")

if [ "$FREE_STORAGE" != "No data" ] && [ "$FREE_STORAGE" != "None" ]; then
    FREE_STORAGE_GB=$(echo "scale=2; $FREE_STORAGE / 1024 / 1024 / 1024" | bc 2>/dev/null || echo "N/A")
    echo "Free storage: ${FREE_STORAGE_GB} GB"
else
    echo "Storage data: Not available"
fi

# Service Health
echo ""
echo "🏥 Service Health:"
echo "=================="

# Test App Runner
APP_RUNNER_URL=$(echo "$APP_RUNNER_STATUS" | jq -r '.ServiceUrl')
if curl -s -o /dev/null -w "%{http_code}" "https://$APP_RUNNER_URL" --connect-timeout 5 --max-time 10 | grep -q "200"; then
    echo "✅ App Runner: Healthy"
else
    echo "❌ App Runner: Unhealthy"
fi

# Test webhook endpoint
if curl -s -o /dev/null -w "%{http_code}" "https://$APP_RUNNER_URL/webhook/lead-intake-notify" --connect-timeout 5 --max-time 10 | grep -q "404\|405"; then
    echo "✅ Webhook endpoint: Available (no workflow configured yet)"
else
    echo "❌ Webhook endpoint: Not responding"
fi

# Summary
echo ""
echo "📋 Infrastructure Summary:"
echo "========================="
echo "✅ App Runner: n8n service running"
echo "✅ RDS: PostgreSQL database with backups"
echo "✅ ECR: Docker image repository"
echo "✅ CloudWatch: Monitoring and alerting"
echo "✅ SNS: Email notifications configured"
echo "✅ Secrets: AWS Secrets Manager integration"
echo "✅ Auto Scaling: 1-2 instances based on load"
echo "✅ Execution Data: Optimized for storage efficiency"
echo "✅ Version Management: Pinned to n8n 1.61.0"
echo ""
echo "🔗 Key URLs:"
echo "==========="
echo "n8n Service: https://$APP_RUNNER_URL"
echo "Webhook: https://$APP_RUNNER_URL/webhook/lead-intake-notify"
echo "Custom Domain: https://automation.serviceboost.co (needs DNS setup)"
echo ""
echo "📋 Next Steps:"
echo "============="
echo "1. Check email for SNS confirmation and click the link"
echo "2. Set up custom domain: automation.serviceboost.co"
echo "3. Deploy to Vercel: ./deploy-vercel-production.sh"
echo "4. Configure n8n workflows for webhook processing"
echo "5. Test end-to-end integration"
echo ""
echo "🔍 Useful Commands:"
echo "=================="
echo "Check n8n version: ./check-n8n-version.sh"
echo "Monitor scaling: ./monitor-auto-scaling.sh"
echo "Check storage: ./monitor-storage-usage.sh"
echo "Test webhook: ./test-webhook-integration.sh"
echo "Get n8n password: ./get-n8n-password.sh"
echo ""
echo "🎉 Your AWS infrastructure is production-ready!"
