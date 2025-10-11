#!/bin/bash
# Verify and Manage n8n Image Version
# This script checks current image version and provides upgrade capabilities

set -e

echo "🔍 Verifying n8n Image Version"
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

# Check current image version
echo ""
echo "📋 Current Image Configuration:"
echo "==============================="

CURRENT_IMAGE=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.SourceConfiguration.ImageRepository.ImageIdentifier' \
    --output text)

echo "Current image: $CURRENT_IMAGE"

# Extract version from current image
CURRENT_VERSION=$(echo "$CURRENT_IMAGE" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
echo "Current version: $CURRENT_VERSION"

# Show expected image
echo "Expected image: $ECR_IMAGE"
EXPECTED_VERSION=$(echo "$ECR_IMAGE" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
echo "Expected version: $EXPECTED_VERSION"

# Check if versions match
if [ "$CURRENT_VERSION" = "$EXPECTED_VERSION" ]; then
    echo "✅ Image version matches expected version"
else
    echo "⚠️  Image version mismatch!"
    echo "   Current: $CURRENT_VERSION"
    echo "   Expected: $EXPECTED_VERSION"
fi

# Check ECR repository for available images
echo ""
echo "🔍 Checking ECR Repository:"
echo "==========================="

ECR_IMAGES=$(aws ecr list-images \
    --repository-name "$ECR_REPOSITORY_NAME" \
    --region "$REGION" \
    --query 'imageIds[].imageTag' \
    --output text 2>/dev/null || echo "")

if [ -n "$ECR_IMAGES" ]; then
    echo "Available images in ECR:"
    echo "$ECR_IMAGES" | tr ' ' '\n' | sort -V
else
    echo "No images found in ECR repository"
fi

# Show upgrade options
echo ""
echo "🔄 Image Upgrade Options:"
echo "========================="
echo "Current setup uses pinned version: $EXPECTED_VERSION"
echo ""
echo "To upgrade to a newer version:"
echo "1. Pull new image: docker pull n8nio/n8n:1.63.0"
echo "2. Tag for ECR: docker tag n8nio/n8n:1.63.0 ${ECR_IMAGE/1.61.0/1.63.0}"
echo "3. Push to ECR: docker push ${ECR_IMAGE/1.61.0/1.63.0}"
echo "4. Update service: aws apprunner update-service --service-arn $APPRUNNER_SERVICE_ARN --region $REGION --source-configuration '{\"ImageRepository\": {\"ImageRepositoryType\":\"ECR\",\"ImageIdentifier\":\"${ECR_IMAGE/1.61.0/1.63.0}\",\"ImageConfiguration\":{\"Port\":\"5678\"}}}'"
echo ""

# Ask if user wants to upgrade
read -p "Do you want to upgrade to a newer version? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📝 Enter the new n8n version (e.g., 1.63.0):"
    read -p "Version: " NEW_VERSION
    
    if [ -z "$NEW_VERSION" ]; then
        echo "❌ No version specified"
        exit 1
    fi
    
    # Validate version format
    if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "❌ Invalid version format. Use format like 1.63.0"
        exit 1
    fi
    
    echo ""
    echo "🔄 Upgrading to n8n version $NEW_VERSION..."
    
    # Create new image identifier
    NEW_IMAGE_IDENTIFIER="${ECR_IMAGE/$EXPECTED_VERSION/$NEW_VERSION}"
    echo "New image identifier: $NEW_IMAGE_IDENTIFIER"
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed or not in PATH"
        echo "Please install Docker and run the upgrade commands manually:"
        echo ""
        echo "docker pull n8nio/n8n:$NEW_VERSION"
        echo "docker tag n8nio/n8n:$NEW_VERSION $NEW_IMAGE_IDENTIFIER"
        echo "docker push $NEW_IMAGE_IDENTIFIER"
        echo ""
        echo "Then run this script again to update the service."
        exit 1
    fi
    
    # Pull, tag, and push new image
    echo "📥 Pulling n8nio/n8n:$NEW_VERSION..."
    docker pull "n8nio/n8n:$NEW_VERSION"
    
    echo "🏷️  Tagging image for ECR..."
    docker tag "n8nio/n8n:$NEW_VERSION" "$NEW_IMAGE_IDENTIFIER"
    
    echo "📤 Pushing image to ECR..."
    docker push "$NEW_IMAGE_IDENTIFIER"
    
    echo "✅ Image pushed successfully"
    
    # Update App Runner service
    echo ""
    echo "🚀 Updating App Runner service..."
    
    aws apprunner update-service \
        --service-arn "$APPRUNNER_SERVICE_ARN" \
        --region "$REGION" \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageRepositoryType\": \"ECR\",
                \"ImageIdentifier\": \"$NEW_IMAGE_IDENTIFIER\",
                \"ImageConfiguration\": {
                    \"Port\": \"5678\",
                    \"RuntimeEnvironmentVariables\": {
                        \"N8N_HOST\": \"${VERCEL_DOMAIN}\",
                        \"N8N_PROTOCOL\": \"https\",
                        \"WEBHOOK_URL\": \"https://${VERCEL_DOMAIN}\",
                        \"N8N_PORT\": \"5678\",
                        \"N8N_SECURE_MODE\": \"true\",
                        \"N8N_BASIC_AUTH_ACTIVE\": \"true\",
                        \"N8N_BASIC_AUTH_USER\": \"admin\",
                        \"N8N_LOG_LEVEL\": \"info\",
                        \"N8N_LOG_OUTPUT\": \"console\",
                        \"EXECUTIONS_MODE\": \"regular\",
                        \"NODE_OPTIONS\": \"--max-old-space-size=1536\",
                        \"N8N_SKIP_WEBHOOK_DEREGISTRATION\": \"true\",
                        \"DB_TYPE\": \"postgresdb\",
                        \"DB_POSTGRESDB_HOST\": \"${DB_HOST}\",
                        \"DB_POSTGRESDB_PORT\": \"${DB_PORT}\",
                        \"DB_POSTGRESDB_DATABASE\": \"${DB_NAME}\",
                        \"DB_POSTGRESDB_USER\": \"${DB_USER}\",
                        \"DB_POSTGRESDB_SSL\": \"true\",
                        \"DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED\": \"false\",
                        \"DB_POSTGRESDB_CONNECTION_TIMEOUT\": \"60000\",
                        \"N8N_EXECUTIONS_DATA_SAVE_ON_SUCCESS\": \"none\",
                        \"N8N_EXECUTIONS_DATA_SAVE_ON_ERROR\": \"all\",
                        \"N8N_EXECUTIONS_DATA_PRUNE\": \"true\",
                        \"N8N_EXECUTIONS_DATA_MAX_AGE\": \"30\"
                    },
                    \"RuntimeEnvironmentSecrets\": {
                        \"N8N_BASIC_AUTH_PASSWORD\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${S_BASIC}\",
                        \"N8N_ENCRYPTION_KEY\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${S_ENC}\",
                        \"DB_POSTGRESDB_PASSWORD\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${S_SVC}\",
                        \"SERVICEBOOST_SECRET\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${S_SVC}\"
                    }
                }
            },
            \"AutoDeploymentsEnabled\": false,
            \"AuthenticationConfiguration\": {
                \"AccessRoleArn\": \"${APP_RUNNER_ROLE_ARN}\"
            }
        }" \
        --instance-configuration "{
            \"Cpu\": \"1024\",
            \"Memory\": \"2048\",
            \"InstanceRoleArn\": \"arn:aws:iam::${ACCOUNT_ID}:role/AppRunnerSecretsRole\"
        }"
    
    echo "✅ App Runner service update initiated"
    
    # Wait for deployment
    echo ""
    echo "⏳ Waiting for deployment to complete..."
    
    while true; do
        STATUS=$(aws apprunner describe-service \
            --service-arn "$APPRUNNER_SERVICE_ARN" \
            --region "$REGION" \
            --query 'Service.Status' \
            --output text)
        
        echo "Current status: $STATUS"
        
        if [ "$STATUS" = "RUNNING" ]; then
            echo "✅ Upgrade completed successfully!"
            break
        elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
            echo "❌ Upgrade failed!"
            echo "Check CloudWatch logs for details"
            exit 1
        fi
        
        sleep 30
    done
    
    # Verify new version
    echo ""
    echo "🔍 Verifying new version..."
    
    NEW_CURRENT_IMAGE=$(aws apprunner describe-service \
        --service-arn "$APPRUNNER_SERVICE_ARN" \
        --region "$REGION" \
        --query 'Service.SourceConfiguration.ImageRepository.ImageIdentifier' \
        --output text)
    
    echo "New image: $NEW_CURRENT_IMAGE"
    
    # Update aws-config.sh with new version
    echo ""
    echo "📝 Updating aws-config.sh with new version..."
    
    sed -i.bak "s/n8n:1.61.0/n8n:$NEW_VERSION/g" aws-config.sh
    echo "✅ Updated aws-config.sh"
    
    echo ""
    echo "🎉 n8n upgrade to version $NEW_VERSION completed!"
    
else
    echo "⏭️  Skipping upgrade"
fi

# Show current status
echo ""
echo "📋 Current Service Status:"
echo "=========================="

SERVICE_STATUS=$(aws apprunner describe-service \
    --service-arn "$APPRUNNER_SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.{Status:Status,ServiceUrl:ServiceUrl,ImageIdentifier:SourceConfiguration.ImageRepository.ImageIdentifier}' \
    --output json)

echo "$SERVICE_STATUS" | jq '.'

echo ""
echo "🔍 To check for new n8n versions:"
echo "1. Visit: https://github.com/n8n-io/n8n/releases"
echo "2. Check Docker Hub: https://hub.docker.com/r/n8nio/n8n/tags"
echo "3. Run this script again to upgrade when ready"
echo ""
echo "📊 To monitor service health after upgrade:"
echo "./monitor-auto-scaling.sh"
echo "./monitor-storage-usage.sh"
