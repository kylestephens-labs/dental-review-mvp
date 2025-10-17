#!/bin/bash

# Environment Setup Script for Dental Practice Management MVP
# This script helps set up environment variables for different deployment environments

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

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment variables..."
    
    if [ -f "backend/.env" ]; then
        cd backend
        if npm run env:validate; then
            print_success "Environment validation completed"
            return 0
        else
            print_error "Environment validation failed"
            return 1
        fi
        cd ..
    else
        print_warning "No .env file found. Please create one first."
        return 1
    fi
}

# Function to create .env file
create_env_file() {
    local env_type=${1:-development}
    
    print_status "Creating .env file for $env_type environment..."
    
    cat > backend/.env << EOF
# Environment Variables for Dental Practice Management MVP
# Generated on $(date)
# Environment: $env_type

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=$env_type
PORT=3001
COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "dev")

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@localhost:5432/dental_mvp

# =============================================================================
# STRIPE PAYMENT PROCESSING
# =============================================================================
# Get these from Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# =============================================================================
# COMMUNICATION SERVICES
# =============================================================================
# Twilio for SMS notifications
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# AWS SES for email notifications
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1

# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
# Supabase project configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# =============================================================================
# SECURITY & AUTHENTICATION
# =============================================================================
# HMAC secret for token generation
HMAC_SECRET=$(generate_secret)

# =============================================================================
# GOOGLE SERVICES
# =============================================================================
# Google Places API for address autocomplete
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Google OAuth for calendar integration
GOOGLE_CLIENTID=your_google_client_id
GOOGLE_OATUH_SECRET=your_google_oauth_secret

# =============================================================================
# FEATURE FLAGS
# =============================================================================
# Enable/disable features (true/false)
FEATURE_ENHANCED_INTAKE_FORM=true
FEATURE_AUTO_SAVE=true
FEATURE_ADVANCED_ANALYTICS=false

# =============================================================================
# HEALTH CHECK CONFIGURATION
# =============================================================================
# Health check endpoint configuration
HEALTH_CHECK_PATH=/healthz
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_TIMEOUT=5
HEALTH_CHECK_RETRIES=3
EOF

    print_success ".env file created for $env_type environment"
    print_warning "Please update the placeholder values with your actual credentials"
}

# Function to show AWS App Runner configuration
show_aws_config() {
    print_status "AWS App Runner Environment Configuration:"
    echo ""
    echo "Copy these environment variables to your AWS App Runner service:"
    echo ""
    
    if [ -f "backend/.env" ]; then
        # Read .env file and format for AWS App Runner
        grep -v '^#' backend/.env | grep -v '^$' | while IFS='=' read -r key value; do
            if [ -n "$key" ] && [ -n "$value" ]; then
                echo "$key=$value"
            fi
        done
    else
        print_error "No .env file found. Please create one first."
        return 1
    fi
}

# Function to test environment
test_environment() {
    print_status "Testing environment configuration..."
    
    # Test health endpoint if server is running
    local health_url="http://localhost:3001/healthz"
    local response
    
    if response=$(curl -s --connect-timeout 5 --max-time 10 "$health_url" 2>/dev/null); then
        print_success "Health endpoint is accessible"
        if command -v jq >/dev/null 2>&1; then
            echo "$response" | jq . 2>/dev/null || echo "$response"
        else
            echo "$response"
        fi
    else
        print_warning "Health endpoint not accessible. Make sure the server is running on port 3001."
        print_status "To start the server: cd backend && npm run dev"
    fi
}

# Main script
main() {
    echo "🔧 Dental Practice Management MVP - Environment Setup"
    echo "=================================================="
    echo ""
    
    case "${1:-help}" in
        "create")
            create_env_file "${2:-development}"
            ;;
        "validate")
            validate_environment
            ;;
        "aws")
            show_aws_config
            ;;
        "test")
            test_environment
            ;;
        "all")
            create_env_file "${2:-development}"
            validate_environment
            show_aws_config
            ;;
        "help"|*)
            echo "Usage: $0 {create|validate|aws|test|all} [environment]"
            echo ""
            echo "Commands:"
            echo "  create [env]  - Create .env file for specified environment (default: development)"
            echo "  validate     - Validate current environment variables"
            echo "  aws          - Show AWS App Runner configuration"
            echo "  test         - Test current environment"
            echo "  all [env]    - Run all setup steps"
            echo ""
            echo "Examples:"
            echo "  $0 create development"
            echo "  $0 create production"
            echo "  $0 validate"
            echo "  $0 aws"
            echo "  $0 all production"
            ;;
    esac
}

# Run main function with all arguments
main "$@"
