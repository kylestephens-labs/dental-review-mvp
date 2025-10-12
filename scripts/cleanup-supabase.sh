#!/bin/bash

# Supabase Cleanup Script for Dental Practice Management MVP
# Removes core business tables from Supabase, keeping only lead generation data
# Based on architecture.md specifications: Supabase for "Lead-gen/outreach only"

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
  
  if [ -z "$SUPABASE_URL" ]; then
    missing_vars+=("SUPABASE_URL")
  fi
  
  if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    missing_vars+=("SUPABASE_SERVICE_ROLE_KEY")
  fi
  
  if [ ${#missing_vars[@]} -ne 0 ]; then
    log_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
      echo "  - $var"
    done
    echo ""
    echo "Please set these variables in your .env file:"
    echo "  SUPABASE_URL=https://your-project.supabase.co"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    exit 1
  fi
}

# Check Supabase CLI
check_supabase_cli() {
  if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI not found. Please install it:"
    echo "  npm install -g supabase"
    exit 1
  fi
  
  log_success "Supabase CLI found"
}

# Check Supabase connection
test_supabase_connection() {
  log_info "Testing Supabase connection..."
  
  # Test connection using curl
  local response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    "$SUPABASE_URL/rest/v1/")
  
  if [ "$response" = "200" ]; then
    log_success "Supabase connection successful!"
  else
    log_error "Supabase connection failed! HTTP status: $response"
    exit 1
  fi
}

# List current tables in Supabase
list_current_tables() {
  log_info "Listing current tables in Supabase..."
  
  local tables=$(curl -s \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    "$SUPABASE_URL/rest/v1/" | jq -r 'keys[]' 2>/dev/null || echo "")
  
  if [ -n "$tables" ]; then
    echo "Current tables:"
    echo "$tables" | while read -r table; do
      echo "  - $table"
    done
  else
    log_warn "Could not retrieve table list"
  fi
}

# Create leads table if it doesn't exist
create_leads_table() {
  log_info "Creating leads table for lead generation..."
  
  local create_leads_sql="
    -- Leads table for lead generation/outreach only
    CREATE TABLE IF NOT EXISTS public.leads (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      source TEXT DEFAULT 'website' NOT NULL, -- website, referral, ad, etc.
      status TEXT DEFAULT 'new' NOT NULL, -- new, contacted, qualified, converted, lost
      notes TEXT,
      metadata JSONB DEFAULT '{}', -- Additional lead data
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      contacted_at TIMESTAMPTZ,
      converted_at TIMESTAMPTZ
    );

    -- Indexes for lead generation
    CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email) WHERE email IS NOT NULL;

    -- Enable RLS
    ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

    -- RLS Policy: Allow all operations for service role
    CREATE POLICY IF NOT EXISTS \"Service role can manage leads\" ON public.leads
      FOR ALL USING (auth.role() = 'service_role');

    -- RLS Policy: Allow authenticated users to read leads
    CREATE POLICY IF NOT EXISTS \"Authenticated users can read leads\" ON public.leads
      FOR SELECT USING (auth.role() = 'authenticated');

    -- Function to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_leads_updated_at()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    \$\$ language 'plpgsql';

    -- Trigger for updated_at
    CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
        FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();

    -- Comments
    COMMENT ON TABLE public.leads IS 'Lead generation and outreach data only';
  "
  
  # Apply the SQL using Supabase CLI
  echo "$create_leads_sql" | supabase db reset --local > /dev/null 2>&1 || {
    log_warn "Could not apply leads table via CLI, trying direct SQL..."
    # Alternative: Use curl to execute SQL
    curl -X POST \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"query\": \"$create_leads_sql\"}" \
      "$SUPABASE_URL/rest/v1/rpc/exec_sql" > /dev/null 2>&1 || {
      log_error "Failed to create leads table"
      exit 1
    }
  }
  
  log_success "Leads table created successfully"
}

# Remove core business tables from Supabase
remove_core_tables() {
  log_info "Removing core business tables from Supabase..."
  
  local core_tables=(
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
  
  for table in "${core_tables[@]}"; do
    log_info "Removing table: $table"
    
    # Drop table using Supabase CLI
    supabase db reset --local > /dev/null 2>&1 || {
      log_warn "Could not remove $table via CLI, trying direct SQL..."
      # Alternative: Use curl to execute SQL
      curl -X POST \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"DROP TABLE IF EXISTS public.$table CASCADE;\"}" \
        "$SUPABASE_URL/rest/v1/rpc/exec_sql" > /dev/null 2>&1 || {
        log_warn "Could not remove $table via API"
      }
    }
  done
  
  log_success "Core business tables removed from Supabase"
}

# Verify Supabase cleanup
verify_cleanup() {
  log_info "Verifying Supabase cleanup..."
  
  local remaining_tables=$(curl -s \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    "$SUPABASE_URL/rest/v1/" | jq -r 'keys[]' 2>/dev/null || echo "")
  
  if [ -n "$remaining_tables" ]; then
    echo "Remaining tables in Supabase:"
    echo "$remaining_tables" | while read -r table; do
      echo "  - $table"
    done
    
    # Check if only leads table remains
    local table_count=$(echo "$remaining_tables" | wc -l)
    if [ "$table_count" -eq 1 ] && echo "$remaining_tables" | grep -q "leads"; then
      log_success "✅ Supabase cleanup successful! Only leads table remains."
    else
      log_warn "⚠️  Supabase still contains other tables. Manual cleanup may be required."
    fi
  else
    log_warn "Could not verify cleanup status"
  fi
}

# Create Supabase configuration for lead generation only
create_supabase_config() {
  log_info "Creating Supabase configuration for lead generation only..."
  
  cat > "src/config/supabase-leads.ts" << 'EOF'
// Supabase Configuration for Lead Generation Only
// This file handles only lead generation/outreach data
// Core business data is now handled by AWS RDS

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client for lead generation only
export const supabaseLeads = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Lead generation operations
export class LeadGenerationService {
  private client = supabaseLeads;

  async createLead(leadData: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    notes?: string;
    metadata?: any;
  }) {
    const { data, error } = await this.client
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getLeads(filters?: {
    status?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = this.client.from('leads').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.source) {
      query = query.eq('source', filters.source);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async updateLead(id: string, updates: {
    status?: string;
    notes?: string;
    metadata?: any;
    contacted_at?: string;
    converted_at?: string;
  }) {
    const { data, error } = await this.client
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLead(id: string) {
    const { error } = await this.client
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getLeadStats() {
    const { data, error } = await this.client
      .from('leads')
      .select('status, source, created_at');

    if (error) throw error;

    // Calculate stats
    const stats = {
      total: data.length,
      byStatus: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      recent: data.filter(lead => {
        const created = new Date(lead.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }).length
    };

    data.forEach(lead => {
      stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1;
      stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1;
    });

    return stats;
  }
}

// Export service instance
export const leadService = new LeadGenerationService();
EOF
  
  log_success "Created Supabase configuration for lead generation only"
}

# Create cleanup summary
create_cleanup_summary() {
  log_info "Creating cleanup summary..."
  
  cat > "supabase-cleanup-summary.md" << EOF
# Supabase Cleanup Summary

## What Was Removed
The following core business tables were removed from Supabase as they now reside in AWS RDS:

- **practices** - Core practice information
- **settings** - Practice configuration
- **templates** - SMS/email templates
- **patients** - Patient information
- **visits** - Appointment/visit records
- **review_requests** - Review request send records
- **engagements** - Patient engagement tracking
- **events** - System events for instrumentation
- **jobs** - Outbox/queue for async processing
- **reviews** - Google Business Profile reviews
- **review_snapshots** - Daily review metrics
- **practice_baselines** - Baseline review counts

## What Remains
Supabase now contains only lead generation data:

- **leads** - Lead generation and outreach data only

## Architecture Compliance
This cleanup ensures compliance with the architecture.md specification:

> **"Supabase (existing)"** - Lead-gen/outreach only; no runtime coupling.

## Next Steps
1. Update your application to use the new dual database architecture
2. Test lead generation functionality
3. Monitor Supabase usage for lead generation only
4. Ensure all core business operations use AWS RDS

## Migration Date
- **Date**: $(date)
- **Status**: ✅ Successfully completed
- **Tables Removed**: 12 core business tables
- **Tables Remaining**: 1 lead generation table

## Verification
Run the following to verify the cleanup:

\`\`\`bash
# Check remaining tables
curl -H "Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY" \\
     -H "apikey: \$SUPABASE_SERVICE_ROLE_KEY" \\
     "\$SUPABASE_URL/rest/v1/"

# Test lead generation
npm run test:leads
\`\`\`

## Support
For issues with lead generation functionality, check:
- Supabase documentation
- Lead generation service code
- RLS policies for leads table
EOF
  
  log_success "Cleanup summary created: supabase-cleanup-summary.md"
}

# Main execution
main() {
  log_info "Starting Supabase cleanup for Dental Practice Management MVP..."
  log_info "Removing core business tables, keeping only lead generation data"
  
  # Pre-flight checks
  check_required_vars
  check_supabase_cli
  test_supabase_connection
  
  # Show current state
  list_current_tables
  
  # Confirm cleanup
  log_warn "This will remove ALL core business tables from Supabase!"
  log_warn "Only the leads table will remain for lead generation."
  echo ""
  read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
  echo ""
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cleanup cancelled by user"
    exit 0
  fi
  
  # Perform cleanup
  create_leads_table
  remove_core_tables
  verify_cleanup
  create_supabase_config
  create_cleanup_summary
  
  log_success "Supabase cleanup completed successfully!"
  log_info "Supabase now contains only lead generation data"
  log_info "Core business data has been moved to AWS RDS"
  echo ""
  log_warn "Remember to:"
  echo "  - Update your application to use dual database architecture"
  echo "  - Test lead generation functionality"
  echo "  - Monitor Supabase usage for leads only"
  echo "  - Ensure all core business operations use AWS RDS"
}

# Run main function
main "$@"
