#!/bin/bash
# Configure Environment Variables for AWS App Runner Service
# This script sets up all required environment variables for the dental MVP backend

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
SERVICE_NAME="dental-practice-mvp"
REGION="us-east-1"

echo "🔧 Configuring Environment Variables for AWS App Runner"
echo "======================================================="
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

# Check if service exists
SERVICE_ARN="arn:aws:apprunner:${REGION}:$(aws sts get-caller-identity --query Account --output text):service/${SERVICE_NAME}"

if ! aws apprunner describe-service --service-arn "$SERVICE_ARN" --region "$REGION" &> /dev/null; then
    print_error "Service ${SERVICE_NAME} not found. Please deploy the service first."
    exit 1
fi

print_success "Prerequisites check passed"

# Load environment variables from .env file if it exists
if [ -f "backend/.env" ]; then
    print_status "Loading environment variables from backend/.env..."
    source backend/.env
    print_success "Environment variables loaded"
else
    print_warning "No .env file found. Using default values."
fi

# Function to update environment variable
update_env_var() {
    local var_name="$1"
    local var_value="$2"
    local description="$3"
    
    print_status "Setting $var_name..."
    
    # Update the service with the new environment variable
    aws apprunner update-service \
        --service-arn "$SERVICE_ARN" \
        --region "$REGION" \
        --source-configuration "{
            \"Repository\": {
                \"RepositoryUrl\": \"https://github.com/your-username/dental-review-mvp\",
                \"SourceCodeVersion\": {
                    \"Type\": \"BRANCH\",
                    \"Value\": \"main\"
                },
                \"SourceConfiguration\": {
                    \"ConfigurationSource\": {
                        \"Provider\": \"GITHUB\",
                        \"ConfigurationFile\": \"apprunner.yaml\"
                    }
                }
            }
        }" \
        --instance-configuration "{
            \"Cpu\": \"0.25 vCPU\",
            \"Memory\": \"0.5 GB\"
        }" \
        --auto-scaling-configuration-arn "arn:aws:apprunner:${REGION}:$(aws sts get-caller-identity --query Account --output text):autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001" \
        --environment-variables "{
            \"NODE_ENV\": \"production\",
            \"PORT\": \"3001\",
            \"COMMIT_SHA\": \"${COMMIT_SHA:-dev}\",
            \"DATABASE_URL\": \"${DATABASE_URL:-postgresql://username:password@localhost:5432/dental_mvp}\",
            \"STRIPE_SECRET_KEY\": \"${STRIPE_SECRET_KEY:-sk_test_your_stripe_secret_key_here}\",
            \"STRIPE_PUBLISHABLE_KEY\": \"${STRIPE_PUBLISHABLE_KEY:-pk_test_your_stripe_publishable_key_here}\",
            \"STRIPE_WEBHOOK_SECRET\": \"${STRIPE_WEBHOOK_SECRET:-whsec_your_webhook_secret_here}\",
            \"TWILIO_ACCOUNT_SID\": \"${TWILIO_ACCOUNT_SID:-your_twilio_account_sid}\",
            \"TWILIO_AUTH_TOKEN\": \"${TWILIO_AUTH_TOKEN:-your_twilio_auth_token}\",
            \"AWS_ACCESS_KEY_ID\": \"${AWS_ACCESS_KEY_ID:-your_aws_access_key_id}\",
            \"AWS_SECRET_ACCESS_KEY\": \"${AWS_SECRET_ACCESS_KEY:-your_aws_secret_access_key}\",
            \"SUPABASE_URL\": \"${SUPABASE_URL:-https://your-project.supabase.co}\",
            \"SUPABASE_SERVICE_ROLE_KEY\": \"${SUPABASE_SERVICE_ROLE_KEY:-your_supabase_service_role_key}\",
            \"HMAC_SECRET\": \"${HMAC_SECRET:-$(openssl rand -base64 32)}\",
            \"GOOGLE_PLACES_API_KEY\": \"${GOOGLE_PLACES_API_KEY:-your_google_places_api_key}\",
            \"GOOGLE_CLIENTID\": \"${GOOGLE_CLIENTID:-your_google_client_id}\",
            \"GOOGLE_OATUH_SECRET\": \"${GOOGLE_OATUH_SECRET:-your_google_oauth_secret}\"
        }" > /dev/null
    
    print_success "$var_name configured"
}

# Display current configuration
print_status "Current environment variables:"
aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables' \
    --output table 2>/dev/null || echo "No environment variables currently set"

echo ""

# Interactive configuration
print_status "Starting interactive environment variable configuration..."
echo ""

# Required variables
declare -A REQUIRED_VARS=(
    ["DATABASE_URL"]="PostgreSQL connection string"
    ["STRIPE_SECRET_KEY"]="Stripe secret key for payments"
    ["STRIPE_PUBLISHABLE_KEY"]="Stripe publishable key for payments"
    ["STRIPE_WEBHOOK_SECRET"]="Stripe webhook secret for verification"
    ["TWILIO_ACCOUNT_SID"]="Twilio account SID for SMS"
    ["TWILIO_AUTH_TOKEN"]="Twilio auth token for SMS"
    ["AWS_ACCESS_KEY_ID"]="AWS access key for SES"
    ["AWS_SECRET_ACCESS_KEY"]="AWS secret key for SES"
    ["SUPABASE_URL"]="Supabase project URL"
    ["SUPABASE_SERVICE_ROLE_KEY"]="Supabase service role key"
    ["HMAC_SECRET"]="HMAC secret for token generation"
    ["GOOGLE_PLACES_API_KEY"]="Google Places API key"
    ["GOOGLE_CLIENTID"]="Google OAuth client ID"
    ["GOOGLE_OATUH_SECRET"]="Google OAuth secret"
)

# Configure each required variable
for var_name in "${!REQUIRED_VARS[@]}"; do
    description="${REQUIRED_VARS[$var_name]}"
    current_value="${!var_name}"
    
    echo "🔧 Configuring: $var_name"
    echo "   Description: $description"
    
    if [ -n "$current_value" ] && [ "$current_value" != "your_${var_name,,}_here" ]; then
        echo "   Current value: ${current_value:0:20}..."
        read -p "   Use current value? (y/n): " use_current
        if [ "$use_current" = "y" ] || [ "$use_current" = "Y" ]; then
            continue
        fi
    fi
    
    read -p "   Enter value for $var_name: " new_value
    if [ -n "$new_value" ]; then
        export "$var_name"="$new_value"
    fi
    echo ""
done

# Update the service with all environment variables
print_status "Updating App Runner service with environment variables..."

aws apprunner update-service \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --source-configuration "{
        \"Repository\": {
            \"RepositoryUrl\": \"https://github.com/your-username/dental-review-mvp\",
            \"SourceCodeVersion\": {
                \"Type\": \"BRANCH\",
                \"Value\": \"main\"
            },
            \"SourceConfiguration\": {
                \"ConfigurationSource\": {
                    \"Provider\": \"GITHUB\",
                    \"ConfigurationFile\": \"apprunner.yaml\"
                }
            }
        }
    }" \
    --instance-configuration "{
        \"Cpu\": \"0.25 vCPU\",
        \"Memory\": \"0.5 GB\"
    }" \
    --auto-scaling-configuration-arn "arn:aws:apprunner:${REGION}:$(aws sts get-caller-identity --query Account --output text):autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001" \
    --environment-variables "{
        \"NODE_ENV\": \"production\",
        \"PORT\": \"3001\",
        \"COMMIT_SHA\": \"${COMMIT_SHA:-dev}\",
        \"DATABASE_URL\": \"${DATABASE_URL}\",
        \"STRIPE_SECRET_KEY\": \"${STRIPE_SECRET_KEY}\",
        \"STRIPE_PUBLISHABLE_KEY\": \"${STRIPE_PUBLISHABLE_KEY}\",
        \"STRIPE_WEBHOOK_SECRET\": \"${STRIPE_WEBHOOK_SECRET}\",
        \"TWILIO_ACCOUNT_SID\": \"${TWILIO_ACCOUNT_SID}\",
        \"TWILIO_AUTH_TOKEN\": \"${TWILIO_AUTH_TOKEN}\",
        \"AWS_ACCESS_KEY_ID\": \"${AWS_ACCESS_KEY_ID}\",
        \"AWS_SECRET_ACCESS_KEY\": \"${AWS_SECRET_ACCESS_KEY}\",
        \"SUPABASE_URL\": \"${SUPABASE_URL}\",
        \"SUPABASE_SERVICE_ROLE_KEY\": \"${SUPABASE_SERVICE_ROLE_KEY}\",
        \"HMAC_SECRET\": \"${HMAC_SECRET}\",
        \"GOOGLE_PLACES_API_KEY\": \"${GOOGLE_PLACES_API_KEY}\",
        \"GOOGLE_CLIENTID\": \"${GOOGLE_CLIENTID}\",
        \"GOOGLE_OATUH_SECRET\": \"${GOOGLE_OATUH_SECRET}\"
    }" > /dev/null

print_success "Environment variables updated"

# Wait for deployment to complete
print_status "Waiting for deployment to complete..."
print_warning "This may take a few minutes..."

while true; do
    STATUS=$(aws apprunner describe-service \
        --service-arn "$SERVICE_ARN" \
        --region "$REGION" \
        --query 'Service.Status' \
        --output text)
    
    print_status "Current status: $STATUS"
    
    if [ "$STATUS" = "RUNNING" ]; then
        print_success "Deployment completed successfully!"
        break
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        print_error "Deployment failed!"
        print_error "Check CloudWatch logs for details:"
        echo "aws logs describe-log-groups --log-group-name-prefix \"/aws/apprunner/${SERVICE_NAME}\" --region $REGION"
        exit 1
    fi
    
    sleep 30
done

# Display final configuration
print_status "Final environment variables:"
aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables' \
    --output table

# Get service URL
SERVICE_URL=$(aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION" \
    --query 'Service.ServiceUrl' \
    --output text)

echo ""
echo "🎉 Environment Configuration Complete"
echo "===================================="
echo "✅ Service Name: $SERVICE_NAME"
echo "✅ Service URL: https://$SERVICE_URL"
echo "✅ Region: $REGION"
echo "✅ Environment variables: Configured"
echo ""

print_success "AWS App Runner environment configuration completed successfully!"
