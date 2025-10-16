#!/bin/bash
# Monitor AWS App Runner Service Health and Performance
# This script provides comprehensive monitoring for the dental MVP backend

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

echo "📊 AWS App Runner Service Monitor"
echo "================================="
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

# Get service information
print_status "Getting service information..."

SERVICE_INFO=$(aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --region "$REGION")

SERVICE_URL=$(echo "$SERVICE_INFO" | jq -r '.Service.ServiceUrl')
SERVICE_STATUS=$(echo "$SERVICE_INFO" | jq -r '.Service.Status')
SERVICE_CREATED=$(echo "$SERVICE_INFO" | jq -r '.Service.CreatedAt')
SERVICE_UPDATED=$(echo "$SERVICE_INFO" | jq -r '.Service.UpdatedAt')

echo ""
echo "🔍 Service Information"
echo "====================="
echo "Service Name: $SERVICE_NAME"
echo "Service URL: https://$SERVICE_URL"
echo "Status: $SERVICE_STATUS"
echo "Created: $SERVICE_CREATED"
echo "Updated: $SERVICE_UPDATED"
echo ""

# Check service health
print_status "Checking service health..."

if [ "$SERVICE_STATUS" = "RUNNING" ]; then
    print_success "Service is running"
else
    print_error "Service is not running (Status: $SERVICE_STATUS)"
    exit 1
fi

# Test health endpoint
print_status "Testing health endpoint..."

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "https://$SERVICE_URL/healthz" || echo -e "\n000")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)

if [ "$HEALTH_CODE" = "200" ]; then
    print_success "Health endpoint responding (HTTP $HEALTH_CODE)"
    echo "Response: $HEALTH_BODY"
else
    print_error "Health endpoint not responding (HTTP $HEALTH_CODE)"
    echo "Response: $HEALTH_BODY"
fi

# Test other endpoints
print_status "Testing API endpoints..."

# Test 404 endpoint
NOT_FOUND_RESPONSE=$(curl -s -w "\n%{http_code}" "https://$SERVICE_URL/nonexistent" || echo -e "\n000")
NOT_FOUND_CODE=$(echo "$NOT_FOUND_RESPONSE" | tail -n 1)

if [ "$NOT_FOUND_CODE" = "404" ]; then
    print_success "404 handling working correctly"
else
    print_warning "404 handling unexpected (HTTP $NOT_FOUND_CODE)"
fi

# Check CloudWatch logs
print_status "Checking CloudWatch logs..."

LOG_GROUPS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/aws/apprunner/${SERVICE_NAME}" \
    --region "$REGION" \
    --query 'logGroups[].logGroupName' \
    --output text 2>/dev/null || echo "")

if [ -n "$LOG_GROUPS" ]; then
    print_success "CloudWatch log groups found:"
    for log_group in $LOG_GROUPS; do
        echo "  - $log_group"
    done
    
    # Get recent log events
    print_status "Getting recent log events..."
    
    for log_group in $LOG_GROUPS; do
        echo ""
        echo "📋 Recent logs from $log_group:"
        echo "----------------------------------------"
        
        aws logs describe-log-streams \
            --log-group-name "$log_group" \
            --region "$REGION" \
            --order-by LastEventTime \
            --descending \
            --max-items 1 \
            --query 'logStreams[0].logStreamName' \
            --output text 2>/dev/null | while read -r log_stream; do
            if [ "$log_stream" != "None" ] && [ -n "$log_stream" ]; then
                aws logs get-log-events \
                    --log-group-name "$log_group" \
                    --log-stream-name "$log_stream" \
                    --region "$REGION" \
                    --start-time $(($(date +%s) * 1000 - 300000)) \
                    --query 'events[].message' \
                    --output text 2>/dev/null | head -10
            fi
        done
    done
else
    print_warning "No CloudWatch log groups found"
fi

# Check service metrics
print_status "Checking service metrics..."

# Get service metrics from CloudWatch
METRICS=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/AppRunner" \
    --metric-name "ActiveInstances" \
    --dimensions Name="ServiceName",Value="$SERVICE_NAME" \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average \
    --region "$REGION" 2>/dev/null || echo "{}")

if [ "$METRICS" != "{}" ]; then
    ACTIVE_INSTANCES=$(echo "$METRICS" | jq -r '.Datapoints[0].Average // "N/A"')
    print_status "Active instances: $ACTIVE_INSTANCES"
else
    print_warning "No metrics data available yet"
fi

# Performance test
print_status "Running performance test..."

echo "Testing response times..."
for i in {1..5}; do
    RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "https://$SERVICE_URL/healthz" || echo "0")
    echo "  Request $i: ${RESPONSE_TIME}s"
done

# Security check
print_status "Running security checks..."

# Check HTTPS
if curl -s -I "https://$SERVICE_URL/healthz" | grep -q "HTTP/2 200"; then
    print_success "HTTPS is working correctly"
else
    print_warning "HTTPS check inconclusive"
fi

# Check for security headers
SECURITY_HEADERS=$(curl -s -I "https://$SERVICE_URL/healthz" | grep -i "x-frame-options\|x-content-type-options\|x-xss-protection" || echo "")
if [ -n "$SECURITY_HEADERS" ]; then
    print_success "Security headers present"
else
    print_warning "No security headers detected"
fi

# Display summary
echo ""
echo "📊 Monitoring Summary"
echo "===================="
echo "✅ Service Status: $SERVICE_STATUS"
echo "✅ Health Endpoint: HTTP $HEALTH_CODE"
echo "✅ Service URL: https://$SERVICE_URL"
echo "✅ Log Groups: $(echo "$LOG_GROUPS" | wc -w) found"
echo ""

# Display recommendations
echo "💡 Recommendations"
echo "=================="
if [ "$HEALTH_CODE" != "200" ]; then
    echo "❌ Fix health endpoint issues"
fi
if [ -z "$LOG_GROUPS" ]; then
    echo "⚠️  Check CloudWatch log configuration"
fi
if [ "$SERVICE_STATUS" != "RUNNING" ]; then
    echo "❌ Investigate service status issues"
fi

echo ""
echo "🔗 Useful Commands"
echo "=================="
echo "View logs: aws logs describe-log-groups --log-group-name-prefix \"/aws/apprunner/${SERVICE_NAME}\" --region $REGION"
echo "Service details: aws apprunner describe-service --service-arn \"$SERVICE_ARN\" --region $REGION"
echo "Health check: curl https://$SERVICE_URL/healthz"
echo ""

print_success "Monitoring completed successfully!"
