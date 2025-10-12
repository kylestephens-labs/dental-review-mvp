# AWS RDS Migration for Dental Practice Management MVP

This document provides a complete guide for migrating from Supabase to AWS RDS for core business data, following the architecture.md specifications.

## 🎯 **Architecture Compliance**

### **Before Migration (INCORRECT)**
- ❌ **Supabase**: Contains ALL core business tables
- ❌ **Missing**: AWS RDS for core business data
- ❌ **Architecture**: Violates documented design

### **After Migration (CORRECT)**
- ✅ **AWS RDS**: All core business tables (practices, patients, visits, etc.)
- ✅ **Supabase**: Only lead generation/outreach data
- ✅ **Architecture**: Compliant with architecture.md specification

## 📋 **Migration Steps**

### **Step 1: Set Up AWS RDS**
```bash
# Create RDS instance following architecture spec (db.t4g.micro)
npm run rds:setup
```

**What this does:**
- Creates `db.t4g.micro` PostgreSQL instance
- Sets up security groups and subnets
- Configures encryption and backups
- Generates `.env.rds` with connection details

### **Step 2: Apply Core Business Tables**
```bash
# Apply migration to RDS
npm run rds:migrate
```

**What this does:**
- Applies `scripts/migrations/001_init.sql` to RDS
- Creates all 12 core business tables
- Sets up indexes, constraints, and RLS policies
- Verifies table creation and functionality

### **Step 3: Update Application**
```bash
# Update app to use dual database architecture
npm run app:update-rds
```

**What this does:**
- Creates dual database configuration
- Updates environment variables
- Creates database service layer
- Adds new npm scripts for RDS operations

### **Step 4: Clean Up Supabase**
```bash
# Remove core business tables from Supabase
npm run supabase:cleanup
```

**What this does:**
- Removes all core business tables from Supabase
- Keeps only `leads` table for lead generation
- Creates lead generation service
- Verifies cleanup completion

## 🔧 **Scripts Overview**

### **RDS Setup Script** (`scripts/setup-aws-rds.sh`)
- Creates AWS RDS PostgreSQL instance (`db.t4g.micro`)
- Configures security groups and subnets
- Sets up encryption and backups
- Generates connection environment file

### **RDS Migration Script** (`scripts/migrate-to-rds.sh`)
- Applies core business tables to RDS
- Verifies table creation and functionality
- Tests sample data insertion
- Generates migration summary

### **App Update Script** (`scripts/update-app-for-rds.sh`)
- Creates dual database configuration
- Updates environment variables
- Creates database service layer
- Adds RDS-specific npm scripts

### **Supabase Cleanup Script** (`scripts/cleanup-supabase.sh`)
- Removes core business tables from Supabase
- Keeps only lead generation data
- Creates lead generation service
- Verifies cleanup completion

## 📊 **Database Architecture**

### **AWS RDS (Core Business Data)**
```sql
-- Core business tables
practices          -- Practice information
settings           -- Practice configuration
templates          -- SMS/email templates
patients           -- Patient information
visits             -- Appointment records
review_requests    -- Review request tracking
engagements        -- Patient engagement
events             -- System events
jobs               -- Async job queue
reviews            -- Google Business Profile reviews
review_snapshots   -- Daily review metrics
practice_baselines -- Baseline review counts
```

### **Supabase (Lead Generation Only)**
```sql
-- Lead generation only
leads              -- Lead generation and outreach data
```

## 🔌 **Connection Configuration**

### **RDS Connection**
```typescript
import { rdsService } from './services/database';

// Core business operations
const practice = await rdsService.createPractice(data);
const patient = await rdsService.createPatient(data);
const visit = await rdsService.createVisit(data);
```

### **Supabase Connection**
```typescript
import { leadService } from './services/database';

// Lead generation only
const lead = await leadService.createLead(data);
const leads = await leadService.getLeads(filters);
```

## 🌍 **Environment Variables**

### **Production (.env.production)**
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

## 🚀 **Deployment Process**

### **1. Pre-Migration Checklist**
- [ ] AWS CLI configured and authenticated
- [ ] Required environment variables set
- [ ] Supabase project accessible
- [ ] Application code backed up

### **2. Migration Execution**
```bash
# Step 1: Set up RDS
npm run rds:setup

# Step 2: Apply migrations
npm run rds:migrate

# Step 3: Update application
npm run app:update-rds

# Step 4: Clean up Supabase
npm run supabase:cleanup
```

### **3. Post-Migration Verification**
```bash
# Test RDS connection
npm run rds:test

# Check RDS status
npm run rds:status

# Get RDS endpoint
npm run rds:endpoint

# Test lead generation
npm run test:leads
```

## 📈 **Monitoring and Maintenance**

### **RDS Monitoring**
- Monitor instance status: `npm run rds:status`
- Check endpoint: `npm run rds:endpoint`
- View CloudWatch metrics for performance
- Monitor connection pool usage

### **Supabase Monitoring**
- Monitor lead generation metrics
- Track conversion rates
- Analyze lead quality
- Monitor API usage

## 🔒 **Security Considerations**

### **RDS Security**
- Use SSL connections in production
- Implement proper IAM roles
- Enable encryption at rest
- Regular security updates

### **Supabase Security**
- Use service role key for server operations
- Implement proper RLS policies
- Monitor API usage
- Regular security audits

## 🚨 **Troubleshooting**

### **Connection Issues**
1. Check RDS instance status
2. Verify security group rules
3. Test network connectivity
4. Validate credentials

### **Performance Issues**
1. Monitor RDS CloudWatch metrics
2. Check connection pool usage
3. Analyze slow query logs
4. Optimize indexes

### **Data Consistency**
1. Verify all tables exist in RDS
2. Check data integrity constraints
3. Validate RLS policies
4. Test transaction handling

## 🔄 **Rollback Plan**

If issues arise, you can rollback by:
1. Reverting application code
2. Switching back to Supabase connection
3. Restoring from Supabase backups
4. Re-applying Supabase migrations

## 📚 **Additional Resources**

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Architecture.md](./docs/dentist_project/architecture.md)

## 🎯 **Success Criteria**

- ✅ All core business tables running on AWS RDS
- ✅ Supabase contains only lead generation data
- ✅ Application uses dual database architecture
- ✅ All database operations tested and working
- ✅ Architecture compliance with architecture.md
- ✅ Performance monitoring in place
- ✅ Security best practices implemented

---

**Migration Date**: $(date)  
**Status**: Ready for execution  
**Architecture Compliance**: ✅ Fully compliant with architecture.md
