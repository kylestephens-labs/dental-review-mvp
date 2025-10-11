#!/bin/bash
# Set up CloudWatch Monitoring and Alarms
# This script creates comprehensive monitoring for App Runner and RDS

set -e

echo "📊 Setting up CloudWatch Monitoring and Alarms"
echo "============================================="

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

# Generate unique alarm suffix
ALARM_SUFFIX=$(date +%s)
echo "Using alarm suffix: $ALARM_SUFFIX"

# Set up SNS topic for notifications (optional)
echo ""
echo "📧 Setting up SNS notification topic..."

SNS_TOPIC_ARN=$(aws sns create-topic \
    --name "n8n-alerts-${ALARM_SUFFIX}" \
    --region "$REGION" \
    --query 'TopicArn' \
    --output text 2>/dev/null || echo "")

if [ -n "$SNS_TOPIC_ARN" ]; then
    echo "✅ SNS topic created: $SNS_TOPIC_ARN"
    echo "📝 To receive notifications, subscribe to this topic with your email"
else
    echo "⚠️  SNS topic creation failed or already exists"
fi

# Create CloudWatch alarms
echo ""
echo "🚨 Creating CloudWatch alarms..."

# 1. App Runner 5xx Error Alarm
echo "Creating App Runner 5xx error alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "apprunner-5xx-${ALARM_SUFFIX}" \
    --alarm-description "High 5xx errors on App Runner ${ALARM_SVC_NAME}" \
    --metric-name "HTTPCode_Target_5XX_Count" \
    --namespace "$ALARM_NS" \
    --dimensions Name=ServiceName,Value="${ALARM_SVC_NAME}" \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 5 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions ${SNS_TOPIC_ARN:+$SNS_TOPIC_ARN} \
    --region "$REGION"

echo "✅ 5xx error alarm created"

# 2. App Runner CPU High Alarm
echo "Creating App Runner CPU alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "apprunner-cpu-${ALARM_SUFFIX}" \
    --alarm-description "High CPU utilization on App Runner ${ALARM_SVC_NAME}" \
    --metric-name "CPUUtilization" \
    --namespace "$ALARM_NS" \
    --dimensions Name=ServiceName,Value="${ALARM_SVC_NAME}" \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions ${SNS_TOPIC_ARN:+$SNS_TOPIC_ARN} \
    --region "$REGION"

echo "✅ CPU alarm created"

# 3. App Runner Memory High Alarm
echo "Creating App Runner memory alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "apprunner-memory-${ALARM_SUFFIX}" \
    --alarm-description "High memory utilization on App Runner ${ALARM_SVC_NAME}" \
    --metric-name "MemoryUtilization" \
    --namespace "$ALARM_NS" \
    --dimensions Name=ServiceName,Value="${ALARM_SVC_NAME}" \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 85 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions ${SNS_TOPIC_ARN:+$SNS_TOPIC_ARN} \
    --region "$REGION"

echo "✅ Memory alarm created"

# 4. RDS CPU High Alarm
echo "Creating RDS CPU alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "rds-cpu-${ALARM_SUFFIX}" \
    --alarm-description "High CPU utilization on RDS ${RDS_ID}" \
    --metric-name "CPUUtilization" \
    --namespace "AWS/RDS" \
    --dimensions Name=DBInstanceIdentifier,Value="${RDS_ID}" \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions ${SNS_TOPIC_ARN:+$SNS_TOPIC_ARN} \
    --region "$REGION"

echo "✅ RDS CPU alarm created"

# 5. RDS Database Connections Alarm
echo "Creating RDS connections alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "rds-connections-${ALARM_SUFFIX}" \
    --alarm-description "High database connections on RDS ${RDS_ID}" \
    --metric-name "DatabaseConnections" \
    --namespace "AWS/RDS" \
    --dimensions Name=DBInstanceIdentifier,Value="${RDS_ID}" \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 15 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions ${SNS_TOPIC_ARN:+$SNS_TOPIC_ARN} \
    --region "$REGION"

echo "✅ RDS connections alarm created"

# 6. RDS Free Storage Space Alarm
echo "Creating RDS storage alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "rds-storage-${ALARM_SUFFIX}" \
    --alarm-description "Low free storage space on RDS ${RDS_ID}" \
    --metric-name "FreeStorageSpace" \
    --namespace "AWS/RDS" \
    --dimensions Name=DBInstanceIdentifier,Value="${RDS_ID}" \
    --statistic Average \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 2000000000 \
    --comparison-operator LessThanThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions ${SNS_TOPIC_ARN:+$SNS_TOPIC_ARN} \
    --region "$REGION"

echo "✅ RDS storage alarm created"

# 7. App Runner Service Health Alarm (using custom metric)
echo "Creating App Runner health check alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "apprunner-health-${ALARM_SUFFIX}" \
    --alarm-description "App Runner service health check failures" \
    --metric-name "HealthCheckFailureCount" \
    --namespace "$ALARM_NS" \
    --dimensions Name=ServiceName,Value="${ALARM_SVC_NAME}" \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 3 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions ${SNS_TOPIC_ARN:+$SNS_TOPIC_ARN} \
    --region "$REGION"

echo "✅ Health check alarm created"

# Set up log retention policies
echo ""
echo "📝 Setting up CloudWatch log retention policies..."

# App Runner application logs
LOG_GROUP_APP="/aws/apprunner/${ALARM_SVC_NAME}/${ALARM_SVC_NAME}/application"
aws logs create-log-group \
    --log-group-name "$LOG_GROUP_APP" \
    --region "$REGION" \
    2>/dev/null || echo "Log group $LOG_GROUP_APP already exists"

aws logs put-retention-policy \
    --log-group-name "$LOG_GROUP_APP" \
    --retention-in-days 30 \
    --region "$REGION" \
    2>/dev/null || echo "Retention policy already set"

echo "✅ Application log retention set to 30 days"

# App Runner instance logs
LOG_GROUP_INSTANCE="/aws/apprunner/${ALARM_SVC_NAME}/${ALARM_SVC_NAME}/instance"
aws logs create-log-group \
    --log-group-name "$LOG_GROUP_INSTANCE" \
    --region "$REGION" \
    2>/dev/null || echo "Log group $LOG_GROUP_INSTANCE already exists"

aws logs put-retention-policy \
    --log-group-name "$LOG_GROUP_INSTANCE" \
    --retention-in-days 30 \
    --region "$REGION" \
    2>/dev/null || echo "Retention policy already set"

echo "✅ Instance log retention set to 30 days"

# List all created alarms
echo ""
echo "📋 Created CloudWatch Alarms:"
echo "============================="

aws cloudwatch describe-alarms \
    --alarm-names \
        "apprunner-5xx-${ALARM_SUFFIX}" \
        "apprunner-cpu-${ALARM_SUFFIX}" \
        "apprunner-memory-${ALARM_SUFFIX}" \
        "rds-cpu-${ALARM_SUFFIX}" \
        "rds-connections-${ALARM_SUFFIX}" \
        "rds-storage-${ALARM_SUFFIX}" \
        "apprunner-health-${ALARM_SUFFIX}" \
    --region "$REGION" \
    --query 'MetricAlarms[].{Name:AlarmName,State:StateValue,Threshold:Threshold}' \
    --output table

echo ""
echo "🎉 CloudWatch monitoring setup completed!"
echo ""
echo "📊 Monitoring Summary:"
echo "====================="
echo "✅ App Runner 5xx errors: >5 errors in 5 minutes"
echo "✅ App Runner CPU: >80% for 10 minutes"
echo "✅ App Runner Memory: >85% for 10 minutes"
echo "✅ RDS CPU: >80% for 10 minutes"
echo "✅ RDS Connections: >15 connections for 10 minutes"
echo "✅ RDS Storage: <2GB free space"
echo "✅ App Runner Health: >3 failures in 5 minutes"
echo ""
echo "📝 Log Retention:"
echo "- Application logs: 30 days"
echo "- Instance logs: 30 days"
echo ""
if [ -n "$SNS_TOPIC_ARN" ]; then
    echo "📧 SNS Notifications:"
    echo "- Topic ARN: $SNS_TOPIC_ARN"
    echo "- To receive emails, subscribe to this topic"
    echo ""
    echo "To subscribe your email:"
    echo "aws sns subscribe --topic-arn $SNS_TOPIC_ARN --protocol email --notification-endpoint your-email@example.com --region $REGION"
fi
echo ""
echo "🔍 To view alarms:"
echo "aws cloudwatch describe-alarms --region $REGION"
echo ""
echo "📊 To view metrics:"
echo "aws cloudwatch get-metric-statistics --namespace $ALARM_NS --metric-name CPUUtilization --dimensions Name=ServiceName,Value=$ALARM_SVC_NAME --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Average --region $REGION"
