#!/bin/bash
# Deploy Dental Practice Management MVP to AWS App Runner
# This script creates and deploys the backend API to AWS App Runner

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
readonly SERVICE_NAME="dental-practice-mvp"
readonly REGION="us-east-1"
readonly REPOSITORY_URL="https://github.com/your-username/dental-review-mvp"
readonly BRANCH="main"
readonly CONFIG_FILE="apprunner.yaml"
readonly MAX_RETRIES=30
readonly RETRY_INTERVAL=30

echo "🚀 Deploying Dental Practice Management MVP to AWS App Runner"
echo "============================================================="
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "Not logged in to AWS. Please run 'aws configure' first."
    exit 1
fi

# Check if apprunner.yaml exists
if [ ! -f "$CONFIG_FILE" ]; then
    print_error "apprunner.yaml not found. Please ensure it exists in the project root."
    exit 1
fi

print_success "Prerequisites check passed"

# Check if service already exists
print_status "Checking if App Runner service already exists..."

if aws apprunner describe-service --service-arn "arn:aws:apprunner:${REGION}:$(aws sts get-caller-identity --query Account --output text):service/${SERVICE_NAME}" --region "$REGION" &> /dev/null; then
    print_warning "Service ${SERVICE_NAME} already exists. Updating instead of creating new service."
    UPDATE_EXISTING=true
else
    print_status "Service ${SERVICE_NAME} does not exist. Will create new service."
    UPDATE_EXISTING=false
fi

# Create or update the service
if [ "$UPDATE_EXISTING" = true ]; then
    print_status "Updating existing App Runner service..."
    
    # Update service using apprunner.yaml
    aws apprunner update-service \
        --service-arn "arn:aws:apprunner:${REGION}:$(aws sts get-caller-identity --query Account --output text):service/${SERVICE_NAME}" \
        --region "$REGION" \
        --source-configuration "{
            \"Repository\": {
                \"RepositoryUrl\": \"${REPOSITORY_URL}\",
                \"SourceCodeVersion\": {
                    \"Type\": \"BRANCH\",
                    \"Value\": \"${BRANCH}\"
                },
                \"SourceConfiguration\": {
                    \"ConfigurationSource\": {
                        \"Provider\": \"GITHUB\",
                        \"ConfigurationFile\": \"${CONFIG_FILE}\"
                    }
                }
            }
        }"
    
    print_success "Service update initiated"
else
    print_status "Creating new App Runner service..."
    
    # Create new service using apprunner.yaml
    aws apprunner create-service \
        --service-name "$SERVICE_NAME" \
        --region "$REGION" \
        --source-configuration "{
            \"Repository\": {
                \"RepositoryUrl\": \"${REPOSITORY_URL}\",
                \"SourceCodeVersion\": {
                    \"Type\": \"BRANCH\",
                    \"Value\": \"${BRANCH}\"
                },
                \"SourceConfiguration\": {
                    \"ConfigurationSource\": {
                        \"Provider\": \"GITHUB\",
                        \"ConfigurationFile\": \"${CONFIG_FILE}\"
                    }
                }
            }
        }" \
        --instance-configuration "{
            \"Cpu\": \"0.25 vCPU\",
            \"Memory\": \"0.5 GB\"
        }" \
        --auto-scaling-configuration-arn "arn:aws:apprunner:${REGION}:$(aws sts get-caller-identity --query Account --output text):autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001"
    
    print_success "Service creation initiated"
fi

# Wait for deployment to complete
print_status "Waiting for deployment to complete..."
print_warning "This may take 5-10 minutes..."

SERVICE_ARN="arn:aws:apprunner:${REGION}:$(aws sts get-caller-identity --query Account --output text):service/${SERVICE_NAME}"

# Wait for deployment with retry logic
wait_for_deployment() {
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        STATUS=$(aws apprunner describe-service \
            --service-arn "$SERVICE_ARN" \
            --region "$REGION" \
            --query 'Service.Status' \
            --output text 2>/dev/null || echo "PENDING")
        
        print_status "Current status: $STATUS (attempt $((retry_count + 1))/$MAX_RETRIES)"
        
        case "$STATUS" in
            "RUNNING")
                print_success "Deployment completed successfully!"
                return 0
                ;;
            "CREATE_FAILED"|"UPDATE_FAILED")
                print_error "Deployment failed!"
                print_error "Check CloudWatch logs for details:"
                echo "aws logs describe-log-groups --log-group-name-prefix \"/aws/apprunner/${SERVICE_NAME}\" --region $REGION"
                return 1
                ;;
            *)
                sleep $RETRY_INTERVAL
                retry_count=$((retry_count + 1))
                ;;
        esac
    done
    
    print_error "Deployment timeout after $((MAX_RETRIES * RETRY_INTERVAL / 60)) minutes"
    return 1
}

wait_for_deployment || exit 1

# Get service URL
print_status "Getting service URL..."

SERVICE_URL=$(aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.ServiceUrl' \
    --output text)

print_success "Service URL: https://$SERVICE_URL"

# Test the health endpoint
print_status "Testing health endpoint..."

sleep 10  # Give the service a moment to fully start

if curl -s -f "https://$SERVICE_URL/healthz" > /dev/null; then
    print_success "Health endpoint is responding"
    
    # Get health response
    HEALTH_RESPONSE=$(curl -s "https://$SERVICE_URL/healthz")
    print_status "Health response: $HEALTH_RESPONSE"
else
    print_warning "Health endpoint not responding yet. This may be normal if the service is still starting."
fi

# Display deployment summary
echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo "✅ Service Name: $SERVICE_NAME"
echo "✅ Service URL: https://$SERVICE_URL"
echo "✅ Region: $REGION"
echo "✅ Repository: $REPOSITORY_URL"
echo "✅ Branch: $BRANCH"
echo "✅ Configuration: $CONFIG_FILE"
echo ""

# Display next steps
echo "📋 Next Steps"
echo "============="
echo "1. Configure environment variables in AWS App Runner console:"
echo "   https://console.aws.amazon.com/apprunner/home?region=${REGION}#/services/${SERVICE_NAME}/configuration"
echo ""
echo "2. Set up custom domain (optional):"
echo "   https://console.aws.amazon.com/apprunner/home?region=${REGION}#/services/${SERVICE_NAME}/custom-domains"
echo ""
echo "3. Monitor service logs:"
echo "   aws logs describe-log-groups --log-group-name-prefix \"/aws/apprunner/${SERVICE_NAME}\" --region $REGION"
echo ""
echo "4. Test the API endpoints:"
echo "   curl https://$SERVICE_URL/healthz"
echo ""

print_success "AWS App Runner deployment completed successfully!"
