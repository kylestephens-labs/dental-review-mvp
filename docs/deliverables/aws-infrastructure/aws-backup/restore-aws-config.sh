#!/bin/bash
# AWS Configuration Restoration Script
# This script helps restore the AWS configuration if needed
# Created: $(date)

set -e

echo "🔄 AWS Configuration Restoration Script"
echo "========================================"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Variables
REGION="us-east-2"
SERVICE_NAME="n8n-prod-working"
VPC_CONNECTOR_NAME="n8n-vpc-connector"
DB_INSTANCE_ID="n8n-database"
ECR_REPO_NAME="n8n"

echo ""
echo "📋 Current AWS Resources Status:"
echo "================================"

# Check App Runner Service
echo -n "App Runner Service: "
if aws apprunner describe-service --service-arn "arn:aws:apprunner:${REGION}:$(aws sts get-caller-identity --query Account --output text):service/${SERVICE_NAME}" --region ${REGION} > /dev/null 2>&1; then
    echo "✅ EXISTS"
else
    echo "❌ NOT FOUND"
fi

# Check RDS Instance
echo -n "RDS Database: "
if aws rds describe-db-instances --db-instance-identifier ${DB_INSTANCE_ID} --region ${REGION} > /dev/null 2>&1; then
    echo "✅ EXISTS"
else
    echo "❌ NOT FOUND"
fi

# Check ECR Repository
echo -n "ECR Repository: "
if aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${REGION} > /dev/null 2>&1; then
    echo "✅ EXISTS"
else
    echo "❌ NOT FOUND"
fi

# Check VPC Connector
echo -n "VPC Connector: "
if aws apprunner describe-vpc-connector --vpc-connector-arn "arn:aws:apprunner:${REGION}:$(aws sts get-caller-identity --query Account --output text):vpcconnector/${VPC_CONNECTOR_NAME}" --region ${REGION} > /dev/null 2>&1; then
    echo "✅ EXISTS"
else
    echo "❌ NOT FOUND"
fi

echo ""
echo "📁 Backup Files Available:"
echo "=========================="
ls -la docs/aws-backup/

echo ""
echo "🔧 Manual Restoration Steps:"
echo "============================"
echo "1. Review the backup files in docs/aws-backup/"
echo "2. Use AWS Console or CLI to recreate resources if needed"
echo "3. Reference the JSON files for exact configuration values"
echo "4. Use environment-variables.env for App Runner configuration"
echo ""
echo "⚠️  Note: This script only checks status. Manual restoration required."
echo "   See docs/learnings/aws-app-runner-n8n-setup.md for detailed setup steps."
