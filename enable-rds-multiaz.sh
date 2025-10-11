#!/bin/bash
# Enable Multi-AZ for RDS Database
# This script enables Multi-AZ for higher availability (with cost increase)

set -e

echo "🔄 Enabling Multi-AZ for RDS Database"
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

# Check current Multi-AZ status
echo ""
echo "🔍 Checking current Multi-AZ status..."

CURRENT_MULTI_AZ=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].MultiAZ' \
    --output text)

echo "Current Multi-AZ status: $CURRENT_MULTI_AZ"

if [ "$CURRENT_MULTI_AZ" = "true" ]; then
    echo "✅ Multi-AZ is already enabled!"
    exit 0
fi

# Show cost impact warning
echo ""
echo "⚠️  Cost Impact Warning:"
echo "======================="
echo "Enabling Multi-AZ will approximately DOUBLE your RDS costs:"
echo "- Compute: 2x (primary + standby)"
echo "- Storage: 2x (primary + standby)"
echo "- Backup storage: 2x"
echo ""
echo "Benefits:"
echo "- 99.95% availability (vs 99.5%)"
echo "- Automatic failover"
echo "- Synchronous replication"
echo ""

read -p "Are you sure you want to enable Multi-AZ? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏭️  Multi-AZ configuration cancelled"
    exit 0
fi

# Enable Multi-AZ
echo ""
echo "🔧 Enabling Multi-AZ..."

aws rds modify-db-instance \
    --db-instance-identifier "$RDS_ID" \
    --multi-az \
    --apply-immediately \
    --region "$REGION"

echo "✅ Multi-AZ configuration initiated"

# Wait for modification to complete
echo ""
echo "⏳ Waiting for Multi-AZ configuration to complete..."
echo "This may take 10-15 minutes..."

while true; do
    STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "$RDS_ID" \
        --region "$REGION" \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text)
    
    MULTI_AZ_STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "$RDS_ID" \
        --region "$REGION" \
        --query 'DBInstances[0].MultiAZ' \
        --output text)
    
    echo "Current status: $STATUS (Multi-AZ: $MULTI_AZ_STATUS)"
    
    if [ "$STATUS" = "available" ] && [ "$MULTI_AZ_STATUS" = "true" ]; then
        echo "✅ Multi-AZ configuration completed successfully!"
        break
    elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "incompatible-parameters" ]; then
        echo "❌ Multi-AZ configuration failed!"
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
    --query 'DBInstances[0].{BackupRetentionPeriod:BackupRetentionPeriod,MultiAZ:MultiAZ,DBInstanceStatus:DBInstanceStatus,DBInstanceClass:DBInstanceClass,Engine:Engine,EngineVersion:EngineVersion,AvailabilityZone:AvailabilityZone}' \
    --output json)

echo "$FINAL_CONFIG" | jq '.'

echo ""
echo "🎉 Multi-AZ configuration completed!"
echo ""
echo "📋 Summary:"
echo "- Multi-AZ: Enabled"
echo "- Availability: 99.95%"
echo "- Automatic failover: Enabled"
echo "- Database Status: $(echo "$FINAL_CONFIG" | jq -r '.DBInstanceStatus')"
echo ""
echo "💰 Cost Impact:"
echo "- Compute costs: ~2x (primary + standby)"
echo "- Storage costs: ~2x (primary + standby)"
echo "- Backup costs: ~2x"
echo ""
echo "🔐 Security Notes:"
echo "- Synchronous replication between AZs"
echo "- Automatic failover in case of primary failure"
echo "- No application changes required"
