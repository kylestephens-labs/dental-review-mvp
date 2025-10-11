#!/bin/bash
# Quick n8n Version Check
# This script quickly checks the current n8n version without upgrade prompts

set -e

echo "🔍 Quick n8n Version Check"
echo "=========================="

# Load AWS configuration
if [ -f "aws-config.sh" ]; then
    source aws-config.sh
else
    echo "❌ aws-config.sh not found. Please run from project root."
    exit 1
fi

# Get current image version
CURRENT_IMAGE=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.SourceConfiguration.ImageRepository.ImageIdentifier' \
    --output text)

CURRENT_VERSION=$(echo "$CURRENT_IMAGE" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")

echo "Current n8n version: $CURRENT_VERSION"
echo "Image: $CURRENT_IMAGE"

# Get service status
STATUS=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.Status' \
    --output text)

echo "Service status: $STATUS"

# Check if it matches expected version
EXPECTED_VERSION=$(echo "$ECR_IMAGE" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")

if [ "$CURRENT_VERSION" = "$EXPECTED_VERSION" ]; then
    echo "✅ Version matches expected: $EXPECTED_VERSION"
else
    echo "⚠️  Version mismatch! Expected: $EXPECTED_VERSION"
fi

echo ""
echo "🔍 To upgrade: ./verify-and-upgrade-n8n.sh"
echo "📊 To monitor: ./monitor-auto-scaling.sh"
