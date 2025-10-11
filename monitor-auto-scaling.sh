#!/bin/bash
# Monitor App Runner Auto Scaling
# This script shows current scaling metrics and behavior

set -e

echo "📊 Monitoring App Runner Auto Scaling"
echo "===================================="

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

# Get current service status
echo ""
echo "🔍 Current Service Status:"
echo "=========================="

SERVICE_STATUS=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.{Status:Status,ServiceUrl:ServiceUrl,AutoScalingConfig:AutoScalingConfigurationSummary}' \
    --output json)

echo "$SERVICE_STATUS" | jq '.'

# Get auto scaling configuration details
echo ""
echo "📈 Auto Scaling Configuration:"
echo "=============================="

ASC_ARN=$(echo "$SERVICE_STATUS" | jq -r '.AutoScalingConfig.AutoScalingConfigurationArn')

aws apprunner describe-auto-scaling-configuration \
    --auto-scaling-configuration-arn "$ASC_ARN" \
    --region "$REGION" \
    --query 'AutoScalingConfiguration.{Name:AutoScalingConfigurationName,MinSize:MinSize,MaxSize:MaxSize,MaxConcurrency:MaxConcurrency,CreatedAt:CreatedAt}' \
    --output json | jq '.'

# Get current metrics (last hour)
echo ""
echo "📊 Current Metrics (Last Hour):"
echo "==============================="

END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)
START_TIME=$(date -u -v-1H +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)

echo "Time range: $START_TIME to $END_TIME"

# Active Instances
echo ""
echo "🔄 Active Instances:"
ACTIVE_INSTANCES=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/AppRunner" \
    --metric-name "ActiveInstances" \
    --dimensions Name=ServiceName,Value="$ALARM_SVC_NAME" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 300 \
    --statistics Average \
    --region "$REGION" \
    --query 'Datapoints[0].Average' \
    --output text 2>/dev/null || echo "No data")

echo "Average active instances: ${ACTIVE_INSTANCES:-N/A}"

# CPU Utilization
echo ""
echo "💻 CPU Utilization:"
CPU_UTIL=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/AppRunner" \
    --metric-name "CPUUtilization" \
    --dimensions Name=ServiceName,Value="$ALARM_SVC_NAME" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 300 \
    --statistics Average \
    --region "$REGION" \
    --query 'Datapoints[0].Average' \
    --output text 2>/dev/null || echo "No data")

echo "Average CPU utilization: ${CPU_UTIL:-N/A}%"

# Memory Utilization
echo ""
echo "🧠 Memory Utilization:"
MEMORY_UTIL=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/AppRunner" \
    --metric-name "MemoryUtilization" \
    --dimensions Name=ServiceName,Value="$ALARM_SVC_NAME" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 300 \
    --statistics Average \
    --region "$REGION" \
    --query 'Datapoints[0].Average' \
    --output text 2>/dev/null || echo "No data")

echo "Average memory utilization: ${MEMORY_UTIL:-N/A}%"

# Request Count
echo ""
echo "📡 Request Count:"
REQUEST_COUNT=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/AppRunner" \
    --metric-name "RequestCount" \
    --dimensions Name=ServiceName,Value="$ALARM_SVC_NAME" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 300 \
    --statistics Sum \
    --region "$REGION" \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "No data")

echo "Total requests: ${REQUEST_COUNT:-N/A}"

# Show scaling recommendations
echo ""
echo "💡 Scaling Recommendations:"
echo "==========================="

if [ "$CPU_UTIL" != "No data" ] && [ "$CPU_UTIL" != "None" ]; then
    CPU_VALUE=$(echo "$CPU_UTIL" | cut -d'.' -f1)
    if [ "$CPU_VALUE" -gt 80 ]; then
        echo "⚠️  High CPU usage detected ($CPU_UTIL%). Consider:"
        echo "   - Increasing max-size if scaling out frequently"
        echo "   - Optimizing n8n workflows for better performance"
    elif [ "$CPU_VALUE" -lt 20 ]; then
        echo "✅ Low CPU usage ($CPU_UTIL%). Current scaling is efficient."
    else
        echo "✅ CPU usage is moderate ($CPU_UTIL%). Scaling is working well."
    fi
else
    echo "📊 No recent CPU data available. Service may be idle."
fi

if [ "$ACTIVE_INSTANCES" != "No data" ] && [ "$ACTIVE_INSTANCES" != "None" ]; then
    INSTANCE_VALUE=$(echo "$ACTIVE_INSTANCES" | cut -d'.' -f1)
    if [ "$INSTANCE_VALUE" -gt 1 ]; then
        echo "🔄 Multiple instances active ($ACTIVE_INSTANCES). Scaling is responding to load."
    else
        echo "✅ Single instance active ($ACTIVE_INSTANCES). Efficient resource usage."
    fi
fi

# Show cost implications
echo ""
echo "💰 Cost Implications:"
echo "====================="
if [ "$ACTIVE_INSTANCES" != "No data" ] && [ "$ACTIVE_INSTANCES" != "None" ]; then
    INSTANCE_VALUE=$(echo "$ACTIVE_INSTANCES" | cut -d'.' -f1)
    if [ "$INSTANCE_VALUE" -gt 1 ]; then
        echo "💸 Currently running $INSTANCE_VALUE instance(s) - higher cost during peak"
    else
        echo "💚 Running 1 instance - optimal cost efficiency"
    fi
else
    echo "💚 Running minimum 1 instance - optimal cost efficiency"
fi

echo ""
echo "🔍 To view detailed metrics in AWS Console:"
echo "1. Go to CloudWatch → Metrics → AWS/AppRunner"
echo "2. Select your service: $ALARM_SVC_NAME"
echo "3. View ActiveInstances, CPUUtilization, MemoryUtilization"
echo ""
echo "📈 To adjust scaling thresholds:"
echo "1. Go to App Runner → Auto Scaling configurations"
echo "2. Edit 'n8n-asc-v2' configuration"
echo "3. Adjust MinSize, MaxSize, or MaxConcurrency as needed"
