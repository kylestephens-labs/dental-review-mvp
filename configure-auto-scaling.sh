#!/bin/bash
# Configure App Runner Auto Scaling
# This script creates and applies an auto scaling configuration for better performance and cost optimization

set -e

echo "📈 Configuring App Runner Auto Scaling"
echo "====================================="

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

# Check current auto scaling configuration
echo ""
echo "🔍 Checking current auto scaling configuration..."

CURRENT_ASC=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.AutoScalingConfigurationSummary' \
    --output json)

echo "Current auto scaling configuration:"
echo "$CURRENT_ASC" | jq '.'

# Create new Auto Scaling configuration
echo ""
echo "🔧 Creating new Auto Scaling configuration..."

ASC_ARN=$(aws apprunner create-auto-scaling-configuration \
    --auto-scaling-configuration-name "n8n-asc-v2" \
    --max-concurrency 100 \
    --max-size 2 \
    --min-size 1 \
    --region "$REGION" \
    --query 'AutoScalingConfiguration.AutoScalingConfigurationArn' \
    --output text)

echo "✅ Auto Scaling configuration created: $ASC_ARN"

# Show the configuration details
echo ""
echo "📋 Auto Scaling Configuration Details:"
echo "====================================="

aws apprunner describe-auto-scaling-configuration \
    --auto-scaling-configuration-arn "$ASC_ARN" \
    --region "$REGION" \
    --query 'AutoScalingConfiguration.{Name:AutoScalingConfigurationName,MinSize:MinSize,MaxSize:MaxSize,MaxConcurrency:MaxConcurrency,CreatedAt:CreatedAt}' \
    --output json | jq '.'

# Apply the auto scaling configuration to the service
echo ""
echo "🚀 Applying Auto Scaling configuration to App Runner service..."

aws apprunner update-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --auto-scaling-configuration-arn "$ASC_ARN"

echo "✅ Auto Scaling configuration applied"

# Wait for service update to complete
echo ""
echo "⏳ Waiting for service update to complete..."
echo "This may take a few minutes..."

while true; do
    STATUS=$(aws apprunner describe-service \
        --service-arn "$APPRUNNER_SERVICE_ARN" \
        --region "$REGION" \
        --query 'Service.Status' \
        --output text)
    
    echo "Current status: $STATUS"
    
    if [ "$STATUS" = "RUNNING" ]; then
        echo "✅ Service update completed successfully!"
        break
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo "❌ Service update failed!"
        echo "Check CloudWatch logs for details"
        exit 1
    fi
    
    sleep 30
done

# Verify the new configuration
echo ""
echo "🔍 Verifying new Auto Scaling configuration..."

NEW_ASC=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.AutoScalingConfigurationSummary' \
    --output json)

echo "New auto scaling configuration:"
echo "$NEW_ASC" | jq '.'

# Show scaling behavior explanation
echo ""
echo "📊 Auto Scaling Behavior:"
echo "========================"
echo "✅ Min Size: 1 instance (always running)"
echo "✅ Max Size: 2 instances (max during traffic spikes)"
echo "✅ Max Concurrency: 100 requests per instance"
echo ""
echo "🔄 Scaling Logic:"
echo "- Scale UP: When CPU > 80% OR concurrent requests > 100 per instance"
echo "- Scale DOWN: When CPU < 20% AND concurrent requests < 50 per instance"
echo "- Scale OUT: Add instances when current instances are at capacity"
echo "- Scale IN: Remove instances when traffic decreases"
echo ""
echo "💰 Cost Impact:"
echo "- Minimum cost: 1 instance always running"
echo "- Maximum cost: 2 instances during peak traffic"
echo "- Automatic scaling: No manual intervention needed"
echo ""
echo "⚡ Performance Benefits:"
echo "- Faster response times during traffic spikes"
echo "- Better handling of concurrent webhook requests"
echo "- Automatic load distribution across instances"
echo ""
echo "🎉 Auto Scaling configuration completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Monitor scaling behavior in CloudWatch"
echo "2. Adjust thresholds if needed based on usage patterns"
echo "3. Consider enabling Multi-AZ for RDS if high availability is critical"
echo ""
echo "🔍 To monitor scaling:"
echo "aws cloudwatch get-metric-statistics --namespace AWS/AppRunner --metric-name ActiveInstances --dimensions Name=ServiceName,Value=n8n-prod-working --start-time \$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) --end-time \$(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Average --region $REGION"
