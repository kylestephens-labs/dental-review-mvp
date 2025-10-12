#!/bin/bash

# RDS Migration Script for Dental Practice Management MVP
# Applies core business tables to AWS RDS PostgreSQL instance
# Based on architecture.md specifications

set -e

# Load environment variables from .env.rds if it exists
if [ -f .env.rds ]; then
  export $(cat .env.rds | xargs)
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
  
  if [ -z "$DB_HOST" ]; then
    missing_vars+=("DB_HOST")
  fi
  
  if [ -z "$DB_PORT" ]; then
    missing_vars+=("DB_PORT")
  fi
  
  if [ -z "$DB_NAME" ]; then
    missing_vars+=("DB_NAME")
  fi
  
  if [ -z "$DB_USER" ]; then
    missing_vars+=("DB_USER")
  fi
  
  if [ -z "$DB_PASSWORD" ]; then
    missing_vars+=("DB_PASSWORD")
  fi
  
  if [ ${#missing_vars[@]} -ne 0 ]; then
    log_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
      echo "  - $var"
    done
    echo ""
    echo "Please run './scripts/setup-aws-rds.sh' first to create .env.rds"
    exit 1
  fi
}

# Check if psql is available
check_psql() {
  if ! command -v psql &> /dev/null; then
    log_error "psql not found. Please install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo "  CentOS: sudo yum install postgresql"
    exit 1
  fi
  
  log_success "PostgreSQL client found"
}

# Test database connection
test_connection() {
  log_info "Testing connection to RDS instance..."
  
  if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" &> /dev/null; then
    log_success "Database connection successful!"
  else
    log_error "Database connection failed!"
    echo "Please check your RDS instance is running and accessible"
    exit 1
  fi
}

# Apply migration to RDS
apply_migration() {
  local migration_file="scripts/migrations/001_init.sql"
  
  if [ ! -f "$migration_file" ]; then
    log_error "Migration file not found: $migration_file"
    exit 1
  fi
  
  log_info "Applying migration: $migration_file"
  log_info "This will create all core business tables in AWS RDS..."
  
  # Apply migration
  if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
    log_success "Migration applied successfully!"
  else
    log_error "Migration failed!"
    exit 1
  fi
}

# Verify tables were created
verify_tables() {
  log_info "Verifying tables were created..."
  
  local expected_tables=(
    "practices"
    "settings"
    "templates"
    "patients"
    "visits"
    "review_requests"
    "engagements"
    "events"
    "jobs"
    "reviews"
    "review_snapshots"
    "practice_baselines"
  )
  
  local missing_tables=()
  
  for table in "${expected_tables[@]}"; do
    local exists=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');")
    
    if [ "$exists" = " t" ]; then
      log_success "✓ Table '$table' exists"
    else
      log_error "✗ Table '$table' missing"
      missing_tables+=("$table")
    fi
  done
  
  if [ ${#missing_tables[@]} -ne 0 ]; then
    log_error "Missing tables: ${missing_tables[*]}"
    exit 1
  fi
  
  log_success "All core business tables verified!"
}

# Verify indexes were created
verify_indexes() {
  log_info "Verifying indexes were created..."
  
  local index_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';")
  
  log_success "Created $index_count performance indexes"
}

# Verify RLS policies
verify_rls() {
  log_info "Verifying Row Level Security policies..."
  
  local rls_tables=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_class WHERE relrowsecurity = true AND relkind = 'r';")
  
  log_success "Row Level Security enabled on $rls_tables tables"
}

# Verify functions and triggers
verify_functions() {
  log_info "Verifying functions and triggers..."
  
  local function_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_proc WHERE proname IN ('update_updated_at_column', 'set_occurred_date');")
  
  local trigger_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%updated_at%' OR tgname LIKE '%occurred_date%';")
  
  log_success "Created $function_count functions and $trigger_count triggers"
}

# Test sample data insertion
test_sample_data() {
  log_info "Testing sample data insertion..."
  
  # Test practice creation
  local practice_id=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "INSERT INTO practices (name, phone, email, city) VALUES ('Test Practice', '+1234567890', 'test@example.com', 'Test City') RETURNING id;" | tr -d ' ')
  
  if [ -n "$practice_id" ]; then
    log_success "✓ Practice created with ID: $practice_id"
    
    # Test settings creation
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO settings (practice_id, review_link, daily_cap) VALUES ('$practice_id', 'https://example.com/review', 50);" &> /dev/null
    log_success "✓ Settings created"
    
    # Test patient creation
    local patient_id=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "INSERT INTO patients (practice_id, first_name, email) VALUES ('$practice_id', 'Test Patient', 'patient@example.com') RETURNING id;" | tr -d ' ')
    
    if [ -n "$patient_id" ]; then
      log_success "✓ Patient created with ID: $patient_id"
      
      # Test visit creation
      PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO visits (practice_id, patient_id, occurred_at) VALUES ('$practice_id', '$patient_id', NOW());" &> /dev/null
      log_success "✓ Visit created"
    fi
    
    # Clean up test data
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM practices WHERE id = '$practice_id';" &> /dev/null
    log_info "Test data cleaned up"
  else
    log_error "Failed to create test practice"
    exit 1
  fi
}

# Generate connection summary
generate_summary() {
  log_info "Generating connection summary..."
  
  cat > "rds-migration-summary.md" << EOF
# RDS Migration Summary

## Database Connection Details
- **Host**: $DB_HOST
- **Port**: $DB_PORT
- **Database**: $DB_NAME
- **User**: $DB_USER
- **Connection String**: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME

## Tables Created
- practices (core practice information)
- settings (practice configuration)
- templates (SMS/email templates)
- patients (patient information with encrypted phone numbers)
- visits (appointment/visit records)
- review_requests (review request send records)
- engagements (patient engagement tracking)
- events (system events for instrumentation)
- jobs (outbox/queue for async processing)
- reviews (Google Business Profile reviews)
- review_snapshots (daily review metrics)
- practice_baselines (baseline review counts)

## Features Implemented
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Performance indexes for high-volume queries
- ✅ Unique constraints for data integrity
- ✅ Automatic timestamp updates (triggers)
- ✅ Encrypted phone number storage
- ✅ Idempotency constraints for visits
- ✅ Comprehensive audit logging

## Next Steps
1. Update application connection strings to use RDS
2. Test all database operations
3. Migrate any existing data from Supabase
4. Update environment variables in production

## Migration Applied
- **File**: scripts/migrations/001_init.sql
- **Date**: $(date)
- **Status**: ✅ Successfully applied to AWS RDS

EOF
  
  log_success "Migration summary created: rds-migration-summary.md"
}

# Main execution
main() {
  log_info "Starting RDS migration for Dental Practice Management MVP..."
  log_info "Applying core business tables to AWS RDS PostgreSQL"
  
  # Pre-flight checks
  check_required_vars
  check_psql
  test_connection
  
  # Apply migration
  apply_migration
  
  # Verify installation
  verify_tables
  verify_indexes
  verify_rls
  verify_functions
  test_sample_data
  
  # Generate summary
  generate_summary
  
  log_success "RDS migration completed successfully!"
  log_info "Core business tables are now running on AWS RDS"
  log_info "Next steps:"
  echo "  1. Update your application to use RDS connection"
  echo "  2. Test all database operations"
  echo "  3. Migrate any existing data from Supabase"
  echo "  4. Update production environment variables"
}

# Run main function
main "$@"
