#!/bin/bash

# AWS RDS Setup Script for Dental Practice Management MVP
# Based on architecture.md specifications: db.t4g.micro PostgreSQL instance
# Creates RDS instance with proper security groups, subnets, and configuration

set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

# Function to display colored output
log_info() {
  echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
  echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_warn() {
  echo -e "\033[0;33m[WARN]\033[0m $1"
}

log_error() {
  echo -e "\033[0;31m[ERROR]\033[0m $1" >&2
}

# Check for required environment variables
check_required_vars() {
  local missing_vars=()
  
  if [ -z "$AWS_REGION" ]; then
    missing_vars+=("AWS_REGION")
  fi
  
  if [ -z "$AWS_PROFILE" ]; then
    missing_vars+=("AWS_PROFILE")
  fi
  
  if [ -z "$RDS_MASTER_PASSWORD" ]; then
    missing_vars+=("RDS_MASTER_PASSWORD")
  fi
  
  if [ -z "$VPC_ID" ]; then
    missing_vars+=("VPC_ID")
  fi
  
  if [ ${#missing_vars[@]} -ne 0 ]; then
    log_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
      echo "  - $var"
    done
    echo ""
    echo "Please set these variables in your .env file or environment:"
    echo "  AWS_REGION=us-west-2"
    echo "  AWS_PROFILE=your-aws-profile"
    echo "  RDS_MASTER_PASSWORD=your-secure-password"
    echo "  VPC_ID=vpc-xxxxxxxxx"
    exit 1
  fi
}

# Check AWS CLI configuration
check_aws_cli() {
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI not found. Please install it: https://aws.amazon.com/cli/"
    exit 1
  fi
  
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS CLI not configured or credentials invalid. Please run 'aws configure'"
    exit 1
  fi
  
  log_success "AWS CLI configured and authenticated"
}

# Get default VPC if not specified
get_default_vpc() {
  if [ -z "$VPC_ID" ]; then
    log_info "VPC_ID not specified, getting default VPC..."
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
    if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
      log_error "No default VPC found. Please specify VPC_ID in your environment"
      exit 1
    fi
    log_success "Using default VPC: $VPC_ID"
  fi
}

# Create security group for RDS
create_security_group() {
  local sg_name="dental-rds-sg"
  local sg_description="Security group for Dental Practice Management RDS instance"
  
  log_info "Creating security group: $sg_name"
  
  # Check if security group already exists
  local existing_sg=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$sg_name" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text)
  
  if [ "$existing_sg" != "None" ] && [ -n "$existing_sg" ]; then
    log_warn "Security group $sg_name already exists: $existing_sg"
    SECURITY_GROUP_ID="$existing_sg"
    return
  fi
  
  # Create security group
  SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "$sg_name" \
    --description "$sg_description" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' --output text)
  
  log_success "Created security group: $SECURITY_GROUP_ID"
  
  # Add inbound rule for PostgreSQL (port 5432) from App Runner subnets
  log_info "Adding inbound rule for PostgreSQL (port 5432)..."
  aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 5432 \
    --source-group "$SECURITY_GROUP_ID" \
    --output text > /dev/null
  
  log_success "Security group rules configured"
}

# Get subnet IDs for RDS
get_subnet_ids() {
  log_info "Getting subnet IDs for RDS..."
  
  # Get all subnets in the VPC
  SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[].SubnetId' --output text)
  
  if [ -z "$SUBNET_IDS" ]; then
    log_error "No subnets found in VPC $VPC_ID"
    exit 1
  fi
  
  # Convert to array and take first 2 (RDS requires at least 2 subnets)
  SUBNET_ARRAY=($SUBNET_IDS)
  if [ ${#SUBNET_ARRAY[@]} -lt 2 ]; then
    log_error "VPC $VPC_ID must have at least 2 subnets for RDS"
    exit 1
  fi
  
  SUBNET_1="${SUBNET_ARRAY[0]}"
  SUBNET_2="${SUBNET_ARRAY[1]}"
  
  log_success "Using subnets: $SUBNET_1, $SUBNET_2"
}

# Create DB subnet group
create_db_subnet_group() {
  local subnet_group_name="dental-rds-subnet-group"
  local subnet_group_description="Subnet group for Dental Practice Management RDS instance"
  
  log_info "Creating DB subnet group: $subnet_group_name"
  
  # Check if subnet group already exists
  local existing_group=$(aws rds describe-db-subnet-groups \
    --db-subnet-group-name "$subnet_group_name" \
    --query 'DBSubnetGroups[0].DBSubnetGroupName' --output text 2>/dev/null || echo "None")
  
  if [ "$existing_group" != "None" ] && [ -n "$existing_group" ]; then
    log_warn "DB subnet group $subnet_group_name already exists"
    return
  fi
  
  # Create subnet group
  aws rds create-db-subnet-group \
    --db-subnet-group-name "$subnet_group_name" \
    --db-subnet-group-description "$subnet_group_description" \
    --subnet-ids "$SUBNET_1" "$SUBNET_2" \
    --output text > /dev/null
  
  log_success "Created DB subnet group: $subnet_group_name"
}

# Create RDS instance
create_rds_instance() {
  local db_instance_id="dental-core-db"
  local db_name="dental_practice"
  local master_username="postgres"
  local master_password="$RDS_MASTER_PASSWORD"
  local db_instance_class="db.t4g.micro"
  local allocated_storage="20"
  local engine="postgres"
  local engine_version="15.4"
  local backup_retention_period="7"
  local multi_az="false"
  local storage_type="gp3"
  local storage_encrypted="true"
  local deletion_protection="false"
  local skip_final_snapshot="true"
  
  log_info "Creating RDS instance: $db_instance_id"
  
  # Check if RDS instance already exists
  local existing_instance=$(aws rds describe-db-instances \
    --db-instance-identifier "$db_instance_id" \
    --query 'DBInstances[0].DBInstanceIdentifier' --output text 2>/dev/null || echo "None")
  
  if [ "$existing_instance" != "None" ] && [ -n "$existing_instance" ]; then
    log_warn "RDS instance $db_instance_id already exists"
    return
  fi
  
  # Create RDS instance
  aws rds create-db-instance \
    --db-instance-identifier "$db_instance_id" \
    --db-name "$db_name" \
    --db-instance-class "$db_instance_class" \
    --allocated-storage "$allocated_storage" \
    --engine "$engine" \
    --engine-version "$engine_version" \
    --master-username "$master_username" \
    --master-user-password "$master_password" \
    --vpc-security-group-ids "$SECURITY_GROUP_ID" \
    --db-subnet-group-name "dental-rds-subnet-group" \
    --backup-retention-period "$backup_retention_period" \
    --multi-az "$multi_az" \
    --storage-type "$storage_type" \
    --storage-encrypted "$storage_encrypted" \
    --deletion-protection "$deletion_protection" \
    --skip-final-snapshot "$skip_final_snapshot" \
    --tags Key=Project,Value=DentalPracticeManagement Key=Environment,Value=Production \
    --output text > /dev/null
  
  log_success "RDS instance creation initiated: $db_instance_id"
  log_info "This may take 5-10 minutes to complete..."
}

# Wait for RDS instance to be available
wait_for_rds_available() {
  local db_instance_id="dental-core-db"
  local max_attempts=60
  local attempt=1
  
  log_info "Waiting for RDS instance to be available..."
  
  while [ $attempt -le $max_attempts ]; do
    local status=$(aws rds describe-db-instances \
      --db-instance-identifier "$db_instance_id" \
      --query 'DBInstances[0].DBInstanceStatus' --output text)
    
    if [ "$status" = "available" ]; then
      log_success "RDS instance is now available!"
      break
    elif [ "$status" = "failed" ] || [ "$status" = "incompatible-parameters" ]; then
      log_error "RDS instance creation failed with status: $status"
      exit 1
    fi
    
    log_info "Attempt $attempt/$max_attempts: Status = $status"
    sleep 30
    ((attempt++))
  done
  
  if [ $attempt -gt $max_attempts ]; then
    log_error "RDS instance did not become available within expected time"
    exit 1
  fi
}

# Get RDS endpoint
get_rds_endpoint() {
  local db_instance_id="dental-core-db"
  
  log_info "Getting RDS endpoint..."
  
  RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$db_instance_id" \
    --query 'DBInstances[0].Endpoint.Address' --output text)
  
  RDS_PORT=$(aws rds describe-db-instances \
    --db-instance-identifier "$db_instance_id" \
    --query 'DBInstances[0].Endpoint.Port' --output text)
  
  log_success "RDS endpoint: $RDS_ENDPOINT:$RDS_PORT"
}

# Create environment file with RDS connection details
create_env_file() {
  local env_file=".env.rds"
  
  log_info "Creating environment file: $env_file"
  
  cat > "$env_file" << EOF
# AWS RDS Connection Details
# Generated by setup-aws-rds.sh

# Database Connection
DATABASE_URL=postgresql://postgres:${RDS_MASTER_PASSWORD}@${RDS_ENDPOINT}:${RDS_PORT}/dental_practice
DB_HOST=${RDS_ENDPOINT}
DB_PORT=${RDS_PORT}
DB_NAME=dental_practice
DB_USER=postgres
DB_PASSWORD=${RDS_MASTER_PASSWORD}

# AWS Configuration
AWS_REGION=${AWS_REGION}
AWS_PROFILE=${AWS_PROFILE}
VPC_ID=${VPC_ID}
SECURITY_GROUP_ID=${SECURITY_GROUP_ID}

# RDS Instance Details
RDS_INSTANCE_ID=dental-core-db
RDS_INSTANCE_CLASS=db.t4g.micro
RDS_ENGINE=postgres
RDS_ENGINE_VERSION=15.4
RDS_ALLOCATED_STORAGE=20
RDS_STORAGE_TYPE=gp3
RDS_STORAGE_ENCRYPTED=true
RDS_BACKUP_RETENTION=7
RDS_MULTI_AZ=false

# Generated on: $(date)
EOF
  
  log_success "Environment file created: $env_file"
  log_warn "Keep this file secure and never commit it to version control!"
}

# Test database connection
test_db_connection() {
  log_info "Testing database connection..."
  
  # Check if psql is available
  if ! command -v psql &> /dev/null; then
    log_warn "psql not found. Install PostgreSQL client to test connection."
    return
  fi
  
  # Test connection
  if PGPASSWORD="$RDS_MASTER_PASSWORD" psql -h "$RDS_ENDPOINT" -p "$RDS_PORT" -U postgres -d dental_practice -c "SELECT version();" &> /dev/null; then
    log_success "Database connection test passed!"
  else
    log_error "Database connection test failed!"
    exit 1
  fi
}

# Main execution
main() {
  log_info "Starting AWS RDS setup for Dental Practice Management MVP..."
  log_info "Following architecture.md specifications: db.t4g.micro PostgreSQL"
  
  # Pre-flight checks
  check_required_vars
  check_aws_cli
  get_default_vpc
  
  # Create AWS resources
  create_security_group
  get_subnet_ids
  create_db_subnet_group
  create_rds_instance
  
  # Wait and configure
  wait_for_rds_available
  get_rds_endpoint
  create_env_file
  test_db_connection
  
  log_success "AWS RDS setup completed successfully!"
  log_info "Next steps:"
  echo "  1. Review the generated .env.rds file"
  echo "  2. Apply database migrations: npm run migrate:rds"
  echo "  3. Update your application to use RDS connection"
  echo "  4. Test all database operations"
  echo ""
  log_warn "Remember to:"
  echo "  - Keep .env.rds secure and never commit it"
  echo "  - Update your application's database connection"
  echo "  - Test all functionality before going live"
}

# Run main function
main "$@"
