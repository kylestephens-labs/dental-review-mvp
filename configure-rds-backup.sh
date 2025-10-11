#!/bin/bash
# Configure RDS Database Backup and Availability
# This script configures backup retention and optionally enables Multi-AZ

set -e

echo "🗄️  Configuring RDS Database Backup and Availability"
echo "===================================================="

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

# Check current RDS configuration
echo ""
echo "🔍 Checking current RDS configuration..."

CURRENT_CONFIG=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].{BackupRetentionPeriod:BackupRetentionPeriod,MultiAZ:MultiAZ,DBInstanceStatus:DBInstanceStatus}' \
    --output json)

echo "Current configuration:"
echo "$CURRENT_CONFIG" | jq '.'

BACKUP_RETENTION=$(echo "$CURRENT_CONFIG" | jq -r '.BackupRetentionPeriod')
MULTI_AZ=$(echo "$CURRENT_CONFIG" | jq -r '.MultiAZ')
DB_STATUS=$(echo "$CURRENT_CONFIG" | jq -r '.DBInstanceStatus')

echo ""
echo "Current settings:"
echo "- Backup Retention: $BACKUP_RETENTION days"
echo "- Multi-AZ: $MULTI_AZ"
echo "- Database Status: $DB_STATUS"

# Configure backup retention
echo ""
echo "🔧 Configuring backup retention to $RDS_BACKUP_RETENTION_DAYS days..."

aws rds modify-db-instance \
    --db-instance-identifier "$RDS_ID" \
    --backup-retention-period "$RDS_BACKUP_RETENTION_DAYS" \
    --apply-immediately \
    --region "$REGION"

echo "✅ Backup retention configuration initiated"

# Ask about Multi-AZ (optional)
echo ""
echo "❓ Multi-AZ Configuration (Optional)"
echo "===================================="
echo "Multi-AZ provides:"
echo "- Higher availability (99.95% vs 99.5%)"
echo "- Automatic failover to standby replica"
echo "- Synchronous replication"
echo "- ~2x cost increase"
echo ""
echo "Current Multi-AZ status: $MULTI_AZ"
echo ""

read -p "Do you want to enable Multi-AZ for higher availability? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Enabling Multi-AZ..."
    
    aws rds modify-db-instance \
        --db-instance-identifier "$RDS_ID" \
        --multi-az \
        --apply-immediately \
        --region "$REGION"
    
    echo "✅ Multi-AZ configuration initiated"
else
    echo "⏭️  Skipping Multi-AZ configuration"
fi

# Wait for modifications to complete
echo ""
echo "⏳ Waiting for database modifications to complete..."
echo "This may take several minutes..."

while true; do
    STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "$RDS_ID" \
        --region "$REGION" \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text)
    
    echo "Current status: $STATUS"
    
    if [ "$STATUS" = "available" ]; then
        echo "✅ Database modifications completed successfully!"
        break
    elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "incompatible-parameters" ]; then
        echo "❌ Database modification failed!"
        echo "Check AWS Console or CloudWatch logs for details"
        exit 1
    fi
    
    sleep 30
done

# Show final configuration
echo ""
echo "📋 Final RDS Configuration:"
echo "=========================="

FINAL_CONFIG=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].{BackupRetentionPeriod:BackupRetentionPeriod,MultiAZ:MultiAZ,DBInstanceStatus:DBInstanceStatus,DBInstanceClass:DBInstanceClass,Engine:Engine,EngineVersion:EngineVersion}' \
    --output json)

echo "$FINAL_CONFIG" | jq '.'

echo ""
echo "🎉 RDS configuration completed!"
echo ""
echo "📋 Summary:"
echo "- Backup Retention: $RDS_BACKUP_RETENTION_DAYS days"
echo "- Multi-AZ: $(echo "$FINAL_CONFIG" | jq -r '.MultiAZ')"
echo "- Database Status: $(echo "$FINAL_CONFIG" | jq -r '.DBInstanceStatus')"
echo ""
echo "💰 Cost Impact:"
if [ "$(echo "$FINAL_CONFIG" | jq -r '.MultiAZ')" = "true" ]; then
    echo "- Multi-AZ enabled: ~2x storage and compute costs"
    echo "- Backup retention: Additional storage costs for $RDS_BACKUP_RETENTION_DAYS days"
else
    echo "- Single-AZ: Standard costs"
    echo "- Backup retention: Additional storage costs for $RDS_BACKUP_RETENTION_DAYS days"
fi
echo ""
echo "🔐 Security Notes:"
echo "- Backups are encrypted by default"
echo "- Point-in-time recovery available for $RDS_BACKUP_RETENTION_DAYS days"
echo "- Automated backups run during maintenance window"
