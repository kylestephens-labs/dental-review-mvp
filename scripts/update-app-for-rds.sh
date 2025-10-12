#!/bin/bash

# Update Dental App to Use RDS Script
# Updates application configuration to use AWS RDS instead of Supabase for core business data
# Keeps Supabase only for lead generation/outreach data

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

# Create dual database configuration
create_db_config() {
  log_info "Creating dual database configuration..."
  
  cat > "src/config/database.ts" << 'EOF'
// Dual Database Configuration for Dental Practice Management
// RDS: Core business data (practices, patients, visits, etc.)
// Supabase: Lead generation/outreach data only

import { Pool } from 'pg';

// RDS Configuration (Core Business Data)
const rdsConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Supabase Configuration (Lead Generation Only)
const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Create RDS connection pool
export const rdsPool = new Pool(rdsConfig);

// Supabase client (for lead generation only)
import { createClient } from '@supabase/supabase-js';
export const supabaseClient = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);

// Database connection utilities
export const testConnections = async () => {
  try {
    // Test RDS connection
    const rdsClient = await rdsPool.connect();
    await rdsClient.query('SELECT 1');
    rdsClient.release();
    console.log('✅ RDS connection successful');
    
    // Test Supabase connection
    const { data, error } = await supabaseClient.from('leads').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
      throw error;
    }
    console.log('✅ Supabase connection successful');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeConnections = async () => {
  await rdsPool.end();
  console.log('Database connections closed');
};

// Export configurations for reference
export { rdsConfig, supabaseConfig };
EOF
  
  log_success "Created dual database configuration"
}

# Update environment variables
update_env_vars() {
  log_info "Updating environment variables..."
  
  # Create production environment file
  cat > ".env.production" << EOF
# Production Environment Variables
# Core Business Data (AWS RDS)
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Lead Generation Data (Supabase)
SUPABASE_URL=${SUPABASE_URL:-}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-}

# AWS Configuration
AWS_REGION=${AWS_REGION}
AWS_PROFILE=${AWS_PROFILE}

# Application Configuration
NODE_ENV=production
PORT=3000

# External Services
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-}
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID:-}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN:-}
TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER:-}

# Generated on: $(date)
EOF
  
  log_success "Created production environment file: .env.production"
}

# Create database service layer
create_db_service() {
  log_info "Creating database service layer..."
  
  cat > "src/services/database.ts" << 'EOF'
// Database Service Layer for Dental Practice Management
// Handles all database operations with proper error handling and logging

import { rdsPool, supabaseClient } from '../config/database';
import { PoolClient } from 'pg';

// Core Business Data Operations (RDS)
export class RDSDatabaseService {
  private pool = rdsPool;

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('RDS Query Error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('RDS Transaction Error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Practice operations
  async createPractice(data: any) {
    const query = `
      INSERT INTO practices (name, phone, email, city, tz, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    return this.query(query, [data.name, data.phone, data.email, data.city, data.tz, data.status]);
  }

  async getPractice(id: string) {
    const query = 'SELECT * FROM practices WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Patient operations
  async createPatient(data: any) {
    const query = `
      INSERT INTO patients (practice_id, first_name, mobile_e164, email, opted_out)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    return this.query(query, [data.practice_id, data.first_name, data.mobile_e164, data.email, data.opted_out]);
  }

  async getPatientsByPractice(practiceId: string) {
    const query = 'SELECT * FROM patients WHERE practice_id = $1 ORDER BY created_at DESC';
    const result = await this.query(query, [practiceId]);
    return result.rows;
  }

  // Visit operations
  async createVisit(data: any) {
    const query = `
      INSERT INTO visits (practice_id, patient_id, occurred_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    return this.query(query, [data.practice_id, data.patient_id, data.occurred_at]);
  }

  async getVisitsByPractice(practiceId: string) {
    const query = `
      SELECT v.*, p.first_name as patient_name
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      WHERE v.practice_id = $1
      ORDER BY v.occurred_at DESC
    `;
    const result = await this.query(query, [practiceId]);
    return result.rows;
  }

  // Review request operations
  async createReviewRequest(data: any) {
    const query = `
      INSERT INTO review_requests (practice_id, patient_id, visit_id, channel, template_id, locale, variant)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    return this.query(query, [
      data.practice_id, data.patient_id, data.visit_id, data.channel,
      data.template_id, data.locale, data.variant
    ]);
  }

  async updateReviewRequestStatus(id: string, status: string, providerMsgId?: string) {
    const query = `
      UPDATE review_requests
      SET status = $2, provider_msg_id = $3, sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE sent_at END
      WHERE id = $1
      RETURNING *
    `;
    return this.query(query, [id, status, providerMsgId]);
  }

  // Event logging
  async logEvent(type: string, practiceId: string, actor: string = 'system', payload: any = {}) {
    const query = `
      INSERT INTO events (type, practice_id, actor, payload_json)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    return this.query(query, [type, practiceId, actor, JSON.stringify(payload)]);
  }

  // Job queue operations
  async enqueueJob(type: string, payload: any, availableAt?: Date) {
    const query = `
      INSERT INTO jobs (type, payload_json, available_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    return this.query(query, [type, JSON.stringify(payload), availableAt || new Date()]);
  }

  async getPendingJobs(limit: number = 10) {
    const query = `
      SELECT * FROM jobs
      WHERE status = 'pending' AND available_at <= NOW()
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await this.query(query, [limit]);
    return result.rows;
  }

  async updateJobStatus(id: string, status: string, error?: string) {
    const query = `
      UPDATE jobs
      SET status = $2, last_error = $3, attempts = attempts + 1
      WHERE id = $1
      RETURNING *
    `;
    return this.query(query, [id, status, error]);
  }
}

// Lead Generation Operations (Supabase)
export class SupabaseService {
  private client = supabaseClient;

  async createLead(data: any) {
    const { data: result, error } = await this.client
      .from('leads')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  async getLeads(filters?: any) {
    let query = this.client.from('leads').select('*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async updateLead(id: string, updates: any) {
    const { data, error } = await this.client
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// Export service instances
export const rdsService = new RDSDatabaseService();
export const supabaseService = new SupabaseService();
EOF
  
  log_success "Created database service layer"
}

# Update package.json scripts
update_package_scripts() {
  log_info "Updating package.json scripts..."
  
  # Read current package.json
  if [ -f "package.json" ]; then
    # Add new scripts for RDS operations
    cat >> "package.json" << 'EOF'
    "scripts": {
      "rds:setup": "./scripts/setup-aws-rds.sh",
      "rds:migrate": "./scripts/migrate-to-rds.sh",
      "rds:test": "node -e \"require('./src/config/database').testConnections().then(console.log)\"",
      "rds:status": "aws rds describe-db-instances --db-instance-identifier dental-core-db --query 'DBInstances[0].DBInstanceStatus' --output text",
      "rds:endpoint": "aws rds describe-db-instances --db-instance-identifier dental-core-db --query 'DBInstances[0].Endpoint.Address' --output text"
    }
EOF
  fi
  
  log_success "Updated package.json with RDS scripts"
}

# Create migration guide
create_migration_guide() {
  log_info "Creating migration guide..."
  
  cat > "docs/rds-migration-guide.md" << 'EOF'
# RDS Migration Guide

This guide explains how to migrate from Supabase to AWS RDS for core business data while keeping Supabase for lead generation only.

## Architecture Overview

### Before Migration
- **Supabase**: All tables (practices, patients, visits, etc.)
- **Application**: Single database connection

### After Migration
- **AWS RDS**: Core business tables (practices, patients, visits, etc.)
- **Supabase**: Lead generation only (leads table)
- **Application**: Dual database connections

## Migration Steps

### 1. Set Up AWS RDS
```bash
# Create RDS instance following architecture spec
npm run rds:setup
```

### 2. Apply Migrations
```bash
# Apply core business tables to RDS
npm run rds:migrate
```

### 3. Update Application
```bash
# Update app to use dual database architecture
npm run app:update-rds
```

### 4. Test Connections
```bash
# Test both RDS and Supabase connections
npm run rds:test
```

## Database Usage

### Core Business Data (RDS)
Use `rdsService` for all core business operations:

```typescript
import { rdsService } from './services/database';

// Create practice
const practice = await rdsService.createPractice({
  name: 'Dental Practice',
  phone: '+1234567890',
  email: 'info@dental.com',
  city: 'San Francisco',
  tz: 'America/Los_Angeles',
  status: 'active'
});

// Create patient
const patient = await rdsService.createPatient({
  practice_id: practice.rows[0].id,
  first_name: 'John',
  email: 'john@example.com',
  opted_out: false
});

// Create visit
const visit = await rdsService.createVisit({
  practice_id: practice.rows[0].id,
  patient_id: patient.rows[0].id,
  occurred_at: new Date()
});
```

### Lead Generation Data (Supabase)
Use `supabaseService` for lead generation only:

```typescript
import { supabaseService } from './services/database';

// Create lead
const lead = await supabaseService.createLead({
  name: 'Prospect Name',
  email: 'prospect@example.com',
  phone: '+1234567890',
  source: 'website',
  status: 'new'
});
```

## Environment Variables

### Production (.env.production)
```bash
# Core Business Data (AWS RDS)
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=dental_practice
DB_USER=postgres
DB_PASSWORD=your-secure-password
DATABASE_URL=postgresql://postgres:password@host:port/database

# Lead Generation Data (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS Configuration
AWS_REGION=us-west-2
AWS_PROFILE=your-profile
```

## Monitoring and Maintenance

### RDS Monitoring
- Monitor RDS instance status: `npm run rds:status`
- Check RDS endpoint: `npm run rds:endpoint`
- View CloudWatch metrics for performance

### Supabase Monitoring
- Monitor lead generation metrics
- Track conversion rates
- Analyze lead quality

## Troubleshooting

### Connection Issues
1. Check RDS instance status
2. Verify security group rules
3. Test network connectivity
4. Validate credentials

### Performance Issues
1. Monitor RDS CloudWatch metrics
2. Check connection pool usage
3. Analyze slow query logs
4. Optimize indexes

### Data Consistency
1. Verify all tables exist in RDS
2. Check data integrity constraints
3. Validate RLS policies
4. Test transaction handling

## Security Considerations

### RDS Security
- Use SSL connections in production
- Implement proper IAM roles
- Enable encryption at rest
- Regular security updates

### Supabase Security
- Use service role key for server operations
- Implement proper RLS policies
- Monitor API usage
- Regular security audits

## Rollback Plan

If issues arise, you can rollback by:
1. Reverting application code
2. Switching back to Supabase connection
3. Restoring from Supabase backups
4. Re-applying Supabase migrations

## Support

For issues with:
- **RDS**: Check AWS documentation and support
- **Supabase**: Check Supabase documentation and support
- **Application**: Review this guide and code comments
EOF
  
  log_success "Created migration guide: docs/rds-migration-guide.md"
}

# Main execution
main() {
  log_info "Starting application update for RDS migration..."
  log_info "Updating dental app to use AWS RDS for core business data"
  
  # Pre-flight checks
  check_required_vars
  
  # Create new configuration
  create_db_config
  update_env_vars
  create_db_service
  update_package_scripts
  create_migration_guide
  
  log_success "Application update completed successfully!"
  log_info "Next steps:"
  echo "  1. Test the new dual database configuration"
  echo "  2. Update your application code to use the new services"
  echo "  3. Deploy to production with new environment variables"
  echo "  4. Monitor both RDS and Supabase connections"
  echo ""
  log_warn "Remember to:"
  echo "  - Test all database operations before going live"
  echo "  - Update your deployment scripts"
  echo "  - Monitor both databases for performance"
  echo "  - Keep Supabase only for lead generation"
}

# Run main function
main "$@"
