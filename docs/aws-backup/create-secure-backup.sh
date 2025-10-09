#!/bin/bash
# Create Secure AWS Configuration Backup
# This script creates a backup without sensitive information

set -e

echo "🔒 Creating Secure AWS Configuration Backup"
echo "==========================================="

# Create backup directory
BACKUP_DIR="docs/aws-backup/secure-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup in: $BACKUP_DIR"

# Copy configuration files (without sensitive data)
cp -r docs/aws-backup/app-runner "$BACKUP_DIR/"
cp -r docs/aws-backup/rds "$BACKUP_DIR/"
cp -r docs/aws-backup/ecr "$BACKUP_DIR/"
cp -r docs/aws-backup/vpc "$BACKUP_DIR/"
cp -r docs/aws-backup/iam "$BACKUP_DIR/"
cp -r docs/aws-backup/cloudwatch "$BACKUP_DIR/"

# Copy template files
cp docs/aws-backup/environment-variables-template.env "$BACKUP_DIR/"
cp docs/aws-backup/restore-aws-config.sh "$BACKUP_DIR/"
cp docs/aws-backup/README.md "$BACKUP_DIR/"

# Create secure environment file (user must fill in)
cat > "$BACKUP_DIR/environment-variables.env" << 'EOF'
# n8n Environment Variables - AWS App Runner Configuration
# ⚠️  WARNING: This file contains sensitive information
# ⚠️  Do NOT commit this file to version control
# ⚠️  Add this file to .gitignore

# Database Configuration
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=<RDS_ENDPOINT>
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=<DB_USERNAME>
DB_POSTGRESDB_PASSWORD=<DB_PASSWORD>
DB_POSTGRESDB_SSL=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false
DB_POSTGRESDB_CONNECTION_TIMEOUT=60000

# n8n Core Configuration
N8N_ENCRYPTION_KEY=<N8N_ENCRYPTION_KEY>
N8N_LOG_LEVEL=debug
N8N_LOG_OUTPUT=console
EXECUTIONS_MODE=regular
NODE_OPTIONS=--max-old-space-size=1536

# Webhook Configuration
WEBHOOK_URL=https://automation.serviceboost.co
N8N_PROTOCOL=https
N8N_HOST=automation.serviceboost.co
N8N_SKIP_WEBHOOK_DEREGISTRATION=true

# AWS Configuration (Use AWS Secrets Manager or environment variables)
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
EOF

echo "✅ Secure backup created in: $BACKUP_DIR"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "1. Fill in the sensitive values in environment-variables.env"
echo "2. Never commit environment-variables.env to version control"
echo "3. Use AWS Secrets Manager for production credentials"
echo "4. Rotate AWS access keys if they were exposed"
echo ""
echo "🔧 To use this backup:"
echo "1. Update environment-variables.env with real values"
echo "2. Run ./restore-aws-config.sh to check status"
echo "3. Follow the restoration steps in README.md"
