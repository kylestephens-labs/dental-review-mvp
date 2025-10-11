# Supabase Database Deployment Guide

This guide explains how to manage database changes in the dental practice management system using Supabase's migration system.

## 🗄️ **Overview**

Supabase uses a **migration-based approach** similar to Rails or Django, where database changes are tracked as versioned migration files that can be applied consistently across different environments.

## 📁 **Migration File Structure**

```
supabase/
├── migrations/
│   ├── 20251003070138_416c01ad-5445-42c1-8b6b-ff0a52b7dcde.sql  # Existing leads table
│   ├── 20251003195940_add_form_column_to_leads.sql              # Existing form column
│   └── 20251011232553_001_init_core_tables.sql                 # Our core tables migration
├── seed.sql                                                     # Seed data (optional)
└── config.toml                                                  # Supabase configuration
```

## 🔄 **Migration Workflow**

### **1. Local Development**

```bash
# Start local Supabase
supabase start

# Reset database (applies all migrations)
supabase db reset

# Check status
supabase status
```

### **2. Creating New Migrations**

```bash
# Generate new migration file
supabase migration new add_patient_preferences

# Edit the generated file in supabase/migrations/
# Add your SQL changes

# Test locally
supabase db reset
```

### **3. Deploying to Remote**

```bash
# Deploy migrations to remote Supabase project
npm run supabase:deploy

# Or manually:
supabase db push
```

## 🚀 **Deployment Commands**

We've set up convenient npm scripts for database deployment:

### **Available Commands:**

```bash
# Deploy all pending migrations to remote
npm run supabase:deploy

# Check current project status
npm run supabase:status

# Verify remote deployment
npm run supabase:verify
```

### **Manual Commands:**

```bash
# List all migrations
supabase migration list --local
supabase migration list --remote

# Push local changes to remote
supabase db push

# Pull remote changes to local
supabase db pull

# Reset local database
supabase db reset
```

## 🔧 **Migration Best Practices**

### **1. Always Use Migrations**
- ✅ **DO**: Create migration files for all database changes
- ❌ **DON'T**: Make direct changes to remote database

### **2. Test Locally First**
- ✅ **DO**: Test migrations locally with `supabase db reset`
- ❌ **DON'T**: Deploy untested migrations

### **3. Use Descriptive Names**
- ✅ **DO**: `add_patient_preferences_table`
- ❌ **DON'T**: `migration_001`

### **4. Include Rollback Logic**
- ✅ **DO**: Include `DROP` statements for rollbacks
- ❌ **DON'T**: Create irreversible migrations

## 📋 **Current Migration Status**

### **Applied Migrations:**
1. **20251003070138_416c01ad-5445-42c1-8b6b-ff0a52b7dcde.sql**
   - Creates `leads` table for lead capture

2. **20251003195940_add_form_column_to_leads.sql**
   - Adds `form` column to `leads` table

3. **20251011232553_001_init_core_tables.sql**
   - Creates all 12 core tables for dental practice management
   - Includes indexes, constraints, RLS policies, and triggers
   - Logs migration completion in `events` table

### **Core Tables Created:**
- `practices` - Core practice information
- `settings` - Practice configuration
- `templates` - SMS/email templates
- `patients` - Patient information with encrypted phone numbers
- `visits` - Appointment/visit records with idempotency constraints
- `review_requests` - Review request send records
- `engagements` - Patient engagement tracking
- `events` - System events for instrumentation
- `jobs` - Outbox/queue for async processing
- `reviews` - Google Business Profile reviews
- `review_snapshots` - Daily review metrics
- `practice_baselines` - Baseline review counts

## 🌐 **Environment Management**

### **Local Development:**
```bash
# Start local Supabase
supabase start

# Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# Studio URL: http://127.0.0.1:54323
```

### **Remote Production:**
```bash
# Deploy to remote
npm run supabase:deploy

# Check remote status
supabase projects list
```

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. Migration Conflicts**
```bash
# If migrations are out of sync
supabase db pull  # Pull remote changes
supabase db reset # Reset local
```

#### **2. Authentication Issues**
```bash
# Re-authenticate with Supabase
supabase login
```

#### **3. Connection Issues**
```bash
# Check project status
npm run supabase:status

# Verify remote connection
npm run supabase:verify
```

### **Migration Rollback:**
```bash
# If you need to rollback a migration
# 1. Create a new migration with rollback SQL
supabase migration new rollback_core_tables

# 2. Add DROP statements in the new migration file
# 3. Deploy the rollback migration
npm run supabase:deploy
```

## 📊 **Monitoring & Logging**

### **Migration Logging:**
All migrations are logged in the `events` table:
```sql
SELECT type, actor, payload_json, occurred_at 
FROM public.events 
WHERE type = 'migration_completed';
```

### **Database Health Checks:**
```bash
# Check table counts
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\dt public.*"

# Check triggers
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';"
```

## 🎯 **Next Steps**

1. **Deploy to Remote**: Use `npm run supabase:deploy` to deploy core tables
2. **Set Up RLS Policies**: Configure row-level security policies
3. **Add Seed Data**: Create `supabase/seed.sql` for initial data
4. **Monitor Performance**: Set up database monitoring and alerts

## 📚 **Additional Resources**

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Database Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated**: 2025-10-11  
**Migration Version**: 001_init_core_tables  
**Status**: ✅ Ready for deployment
