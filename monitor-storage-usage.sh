#!/bin/bash
# Monitor RDS Storage Usage
# This script monitors database storage usage and execution data impact

set -e

echo "📊 Monitoring RDS Storage Usage"
echo "==============================="

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

# Get current RDS storage metrics
echo ""
echo "💾 Current RDS Storage Metrics:"
echo "=============================="

# Get database instance details
DB_INFO=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].{AllocatedStorage:AllocatedStorage,StorageType:StorageType,StorageEncrypted:StorageEncrypted,DBInstanceClass:DBInstanceClass}' \
    --output json)

echo "Database Configuration:"
echo "$DB_INFO" | jq '.'

# Get storage metrics from CloudWatch
echo ""
echo "📈 Storage Metrics (Last 24 Hours):"
echo "==================================="

END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)
START_TIME=$(date -u -v-1d +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S)

echo "Time range: $START_TIME to $END_TIME"

# Free Storage Space
echo ""
echo "🆓 Free Storage Space:"
FREE_STORAGE=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/RDS" \
    --metric-name "FreeStorageSpace" \
    --dimensions Name=DBInstanceIdentifier,Value="$RDS_ID" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 3600 \
    --statistics Average \
    --region "$REGION" \
    --query 'Datapoints[-1].Average' \
    --output text 2>/dev/null || echo "No data")

if [ "$FREE_STORAGE" != "No data" ] && [ "$FREE_STORAGE" != "None" ]; then
    FREE_STORAGE_GB=$(echo "scale=2; $FREE_STORAGE / 1024 / 1024 / 1024" | bc 2>/dev/null || echo "N/A")
    echo "Latest free storage: ${FREE_STORAGE_GB} GB"
else
    echo "No recent storage data available"
fi

# Database Connections
echo ""
echo "🔗 Database Connections:"
DB_CONNECTIONS=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/RDS" \
    --metric-name "DatabaseConnections" \
    --dimensions Name=DBInstanceIdentifier,Value="$RDS_ID" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 3600 \
    --statistics Average \
    --region "$REGION" \
    --query 'Datapoints[-1].Average' \
    --output text 2>/dev/null || echo "No data")

echo "Latest connections: ${DB_CONNECTIONS:-N/A}"

# CPU Utilization
echo ""
echo "💻 CPU Utilization:"
CPU_UTIL=$(aws cloudwatch get-metric-statistics \
    --namespace "AWS/RDS" \
    --metric-name "CPUUtilization" \
    --dimensions Name=DBInstanceIdentifier,Value="$RDS_ID" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period 3600 \
    --statistics Average \
    --region "$REGION" \
    --query 'Datapoints[-1].Average' \
    --output text 2>/dev/null || echo "No data")

echo "Latest CPU utilization: ${CPU_UTIL:-N/A}%"

# Show storage optimization impact
echo ""
echo "⚡ Execution Data Optimization Impact:"
echo "====================================="
echo "✅ N8N_EXECUTIONS_DATA_SAVE_ON_SUCCESS=none"
echo "   - Successful executions: Minimal data saved"
echo "   - Estimated storage savings: 80-90%"
echo ""
echo "✅ N8N_EXECUTIONS_DATA_SAVE_ON_ERROR=all"
echo "   - Failed executions: Full data saved for debugging"
echo "   - Critical for troubleshooting issues"
echo ""
echo "✅ N8N_EXECUTIONS_DATA_PRUNE=true"
echo "   - Automatic cleanup of old execution data"
echo "   - Prevents database bloat over time"
echo ""
echo "✅ N8N_EXECUTIONS_DATA_MAX_AGE=30"
echo "   - 30-day retention for execution data"
echo "   - Balances debugging needs with storage costs"
echo ""

# Calculate storage usage percentage
if [ "$FREE_STORAGE" != "No data" ] && [ "$FREE_STORAGE" != "None" ]; then
    ALLOCATED_STORAGE=$(echo "$DB_INFO" | jq -r '.AllocatedStorage')
    ALLOCATED_STORAGE_BYTES=$(echo "$ALLOCATED_STORAGE * 1024 * 1024 * 1024" | bc 2>/dev/null || echo "0")
    USED_STORAGE=$(echo "$ALLOCATED_STORAGE_BYTES - $FREE_STORAGE" | bc 2>/dev/null || echo "0")
    USAGE_PERCENTAGE=$(echo "scale=2; ($USED_STORAGE / $ALLOCATED_STORAGE_BYTES) * 100" | bc 2>/dev/null || echo "N/A")
    
    echo "📊 Storage Usage Analysis:"
    echo "========================="
    echo "Allocated storage: ${ALLOCATED_STORAGE} GB"
    echo "Free storage: ${FREE_STORAGE_GB} GB"
    echo "Used storage: $(echo "scale=2; $USED_STORAGE / 1024 / 1024 / 1024" | bc 2>/dev/null || echo "N/A") GB"
    echo "Usage percentage: ${USAGE_PERCENTAGE}%"
    
    if [ "$USAGE_PERCENTAGE" != "N/A" ]; then
        USAGE_VALUE=$(echo "$USAGE_PERCENTAGE" | cut -d'.' -f1)
        if [ "$USAGE_VALUE" -gt 80 ]; then
            echo "⚠️  High storage usage detected! Consider:"
            echo "   - Increasing allocated storage"
            echo "   - Reviewing execution data retention"
            echo "   - Checking for data bloat"
        elif [ "$USAGE_VALUE" -gt 60 ]; then
            echo "📊 Moderate storage usage. Monitor for growth."
        else
            echo "✅ Storage usage is healthy."
        fi
    fi
fi

# Show recommendations
echo ""
echo "💡 Storage Optimization Recommendations:"
echo "======================================="
echo "1. Monitor storage usage trends over time"
echo "2. Set up CloudWatch alarms for storage thresholds"
echo "3. Review execution success/failure rates"
echo "4. Consider adjusting MAX_AGE based on debugging needs"
echo "5. Enable execution data for critical workflows if needed"
echo ""
echo "🔍 To monitor storage trends:"
echo "aws cloudwatch get-metric-statistics --namespace AWS/RDS --metric-name FreeStorageSpace --dimensions Name=DBInstanceIdentifier,Value=$RDS_ID --start-time \$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) --end-time \$(date -u +%Y-%m-%dT%H:%M:%S) --period 3600 --statistics Average --region $REGION"
echo ""
echo "📈 To view execution data in n8n:"
echo "1. Login to: https://${VERCEL_DOMAIN}"
echo "2. Go to Executions page"
echo "3. Check successful vs failed execution data"
echo "4. Verify optimization is working correctly"
