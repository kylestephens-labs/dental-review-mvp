# Supabase Quick Reference

## 🚀 **Essential Commands**

### **Local Development**
```bash
supabase start                    # Start local Supabase
supabase stop                     # Stop local Supabase
supabase status                   # Check local status
supabase db reset                 # Reset local database
```

### **Migration Management**
```bash
supabase migration new <name>     # Create new migration
supabase migration list --local   # List local migrations
supabase migration list --remote  # List remote migrations
supabase db push                  # Deploy to remote
supabase db pull                  # Pull from remote
```

### **Project Management**
```bash
supabase login                    # Authenticate
supabase projects list           # List projects
supabase link --project-ref <id>  # Link to project
```

## 📋 **Our NPM Scripts**

```bash
npm run supabase:deploy          # Deploy migrations
npm run supabase:status          # Check status
npm run supabase:verify          # Verify deployment
```

## 🔧 **Database URLs**

### **Local Development**
- **Database**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Studio**: `http://127.0.0.1:54323`
- **API**: `http://127.0.0.1:54321`

### **Remote Production**
- **Database**: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
- **Studio**: Available in Supabase Dashboard
- **API**: Available in Supabase Dashboard

## 📁 **File Locations**

- **Migrations**: `supabase/migrations/`
- **Config**: `supabase/config.toml`
- **Seed Data**: `supabase/seed.sql`
- **Deployment Script**: `scripts/deploy-supabase.sh`

## 🎯 **Current Status**

- **Project**: Local Business Automation
- **Migrations Applied**: 3 (leads, form column, core tables)
- **Core Tables**: 12 tables created
- **Status**: ✅ Ready for remote deployment

## 🚨 **Emergency Commands**

```bash
# Rollback last migration
supabase migration new rollback_<name>
# Add DROP statements in new migration file
npm run supabase:deploy

# Reset everything
supabase stop
supabase start
supabase db reset
```
