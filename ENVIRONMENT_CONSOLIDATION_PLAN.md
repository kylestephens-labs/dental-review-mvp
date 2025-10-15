# Environment File Consolidation Plan

## 🚨 **Current State: Environment File Chaos**

### **5 Environment Files (112 total lines)**
1. **`.env`** (29 lines) - Main environment file with actual values
2. **`.env.example`** (32 lines) - Template for main application
3. **`.env.local`** (4 lines) - Local overrides
4. **`n8n-core.env`** (12 lines) - n8n production configuration
5. **`n8n-local.env`** (6 lines) - n8n local configuration
6. **~~`mcp-orchestrator/env.example`~~** (29 lines) - ~~MCP orchestrator template~~ ✅ **MIGRATED TO SEPARATE REPO**

### **The Problems**
1. **Scattered Configuration**: Environment variables spread across 5 files
2. **Redundancy**: Same variables defined in multiple places
3. **Confusion**: Which file to use for what?
4. **Maintenance Nightmare**: 5 files to keep in sync
5. **Deployment Complexity**: Multiple files to manage

## 🎯 **Consolidation Strategy: 5 → 1 File**

### **Target: Single `.env.example` File**

## 📊 **Analysis by File**

### **1. `.env` (Main Application)**
**Purpose**: Production/development environment variables
**Key Variables**:
- Stripe keys (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY)
- Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
- AWS SES (AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY)
- Google APIs (GOOGLE_PLACES_API_KEY, GOOGLE_CALENDAR_*)
- Database (DATABASE_URL)
- Security (HMAC_SECRET_KEY)

### **2. `.env.example` (Template)**
**Purpose**: Template for main application
**Content**: Same as .env but with placeholder values
**Status**: Keep as base template

### **3. `.env.local` (Local Overrides)**
**Purpose**: Local development overrides
**Content**: Minimal local-specific variables
**Status**: Merge into main template

### **4. `n8n-core.env` (n8n Production)**
**Purpose**: n8n production configuration
**Key Variables**:
- WEBHOOK_URL, N8N_PROTOCOL, N8N_HOST
- N8N_ENCRYPTION_KEY, N8N_LOG_LEVEL
- Database connection (DB_POSTGRESDB_*)

**Status**: Merge into main template with N8N_ prefix

### **5. `n8n-local.env` (n8n Local)**
**Purpose**: n8n local configuration
**Content**: Minimal n8n local variables
**Status**: Merge into main template

### **6. ~~`mcp-orchestrator/env.example` (MCP Template)~~** ✅ **MIGRATED**
**Purpose**: ~~MCP orchestrator configuration~~ (moved to separate repo)
**Key Variables**: ~~Server config, Database, External services, Security~~ (now in mcp-orchestrator repo)
**Status**: ✅ **Successfully migrated to separate repository**

## 🚀 **Consolidation Plan**

### **Phase 1: Create Unified Template**
Create a single `.env.example` with all variables organized by category:

```bash
# =============================================================================
# DENTAL PRACTICE MVP - ENVIRONMENT CONFIGURATION
# =============================================================================
# Copy this file to .env and fill in your actual values

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# =============================================================================
# STRIPE PAYMENT PROCESSING
# =============================================================================
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# =============================================================================
# TWILIO SMS SERVICE
# =============================================================================
TWILIO_ACCOUNT_SID=AC_your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

# =============================================================================
# AWS SERVICES
# =============================================================================
AWS_SES_ACCESS_KEY_ID=your_aws_ses_access_key_id_here
AWS_SES_SECRET_ACCESS_KEY=your_aws_ses_secret_access_key_here
AWS_REGION=us-east-1

# =============================================================================
# GOOGLE SERVICES
# =============================================================================
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
GOOGLE_CALENDAR_CLIENT_ID=your_google_calendar_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_calendar_client_secret_here

# =============================================================================
# FACEBOOK INTEGRATION
# =============================================================================
FACEBOOK_GRAPH_ACCESS_TOKEN=your_facebook_graph_access_token_here

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL=postgresql://username:password@localhost:5432/dental_practice

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
HMAC_SECRET_KEY=your_hmac_secret_key_here
JWT_SECRET=your_jwt_secret_here

# =============================================================================
# N8N WORKFLOW AUTOMATION
# =============================================================================
N8N_WEBHOOK_URL=https://automation.serviceboost.co
N8N_PROTOCOL=https
N8N_HOST=automation.serviceboost.co
N8N_ENCRYPTION_KEY=your_n8n_encryption_key_here
N8N_LOG_LEVEL=debug
N8N_SKIP_WEBHOOK_DEREGISTRATION=true

# N8N Database Configuration
N8N_DB_TYPE=postgresdb
N8N_DB_HOST=your_n8n_database_host_here
N8N_DB_PORT=5432
N8N_DB_DATABASE=postgres
N8N_DB_USER=your_n8n_database_user_here
N8N_DB_PASSWORD=your_n8n_database_password_here

# =============================================================================
# MCP ORCHESTRATOR (Optional)
# =============================================================================
MCP_AGENT_HEARTBEAT_INTERVAL=30000
MCP_TASK_TIMEOUT=7200000
MCP_MAX_CONCURRENT_TASKS=20

# =============================================================================
# MONITORING & OBSERVABILITY (Optional)
# =============================================================================
SENTRY_DSN=https://your_sentry_dsn_here
GIT_SHA=unknown
```

### **Phase 2: Update Environment Validation**
Update `src/env-check.ts` to validate the consolidated variables:

```typescript
const envConfig: EnvConfig = {
  requiredVars: [
    // Core application
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'AWS_SES_ACCESS_KEY_ID',
    'AWS_SES_SECRET_ACCESS_KEY',
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_CALENDAR_CLIENT_ID',
    'GOOGLE_CALENDAR_CLIENT_SECRET',
    'FACEBOOK_GRAPH_ACCESS_TOKEN',
    'DATABASE_URL',
    'HMAC_SECRET_KEY',
    // N8N configuration
    'N8N_WEBHOOK_URL',
    'N8N_PROTOCOL',
    'N8N_HOST',
    'N8N_ENCRYPTION_KEY',
    'N8N_DB_HOST',
    'N8N_DB_USER',
    'N8N_DB_PASSWORD'
  ],
  optionalVars: [
    'NODE_ENV',
    'PORT',
    'LOG_LEVEL',
    'AWS_REGION',
    'N8N_LOG_LEVEL',
    'N8N_SKIP_WEBHOOK_DEREGISTRATION',
    'MCP_AGENT_HEARTBEAT_INTERVAL',
    'MCP_TASK_TIMEOUT',
    'MCP_MAX_CONCURRENT_TASKS',
    'SENTRY_DSN',
    'GIT_SHA'
  ],
  validationRules: {
    'STRIPE_SECRET_KEY': (value: string) => value.startsWith('sk_'),
    'STRIPE_PUBLISHABLE_KEY': (value: string) => value.startsWith('pk_'),
    'TWILIO_ACCOUNT_SID': (value: string) => value.startsWith('AC'),
    'DATABASE_URL': (value: string) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'N8N_WEBHOOK_URL': (value: string) => value.startsWith('https://'),
    'N8N_PROTOCOL': (value: string) => ['http', 'https'].includes(value)
  }
};
```

### **Phase 3: Update Application Code**
Update any code that references the old environment variable names:

```typescript
// Old: process.env.DB_POSTGRESDB_HOST
// New: process.env.N8N_DB_HOST

// Old: process.env.WEBHOOK_URL  
// New: process.env.N8N_WEBHOOK_URL
```

### **Phase 4: Clean Up**
Delete the redundant environment files:
```bash
rm -f .env.local
rm -f n8n-core.env
rm -f n8n-local.env
# rm -f mcp-orchestrator/env.example  # ✅ Already migrated to separate repo
```

## 📊 **Expected Results**

### **Before (Current)**
- **Files**: 5 environment files
- **Lines**: 112 total lines
- **Maintenance**: High (5 files to sync)
- **Clarity**: Low (scattered configuration)
- **Usability**: Poor (confusing which file to use)

### **After (Proposed)**
- **Files**: 1 environment file (.env.example)
- **Lines**: ~80 lines (30% reduction)
- **Maintenance**: Low (1 file to manage)
- **Clarity**: High (organized by category)
- **Usability**: Excellent (single source of truth)

## 🎯 **Benefits**

- ✅ **Single source of truth** - All environment variables in one place
- ✅ **Clear organization** - Grouped by service/function
- ✅ **Easy maintenance** - One file to update
- ✅ **Better documentation** - Clear comments and sections
- ✅ **Consistent naming** - N8N_ prefix for n8n variables
- ✅ **Validation** - Comprehensive validation rules

## 🚨 **Risk Mitigation**

1. **Backup current files** - Git commit before changes
2. **Gradual migration** - Update code references first
3. **Test thoroughly** - Verify all services work
4. **Update documentation** - Update any references to old files
5. **Team communication** - Notify team of changes

**Result: 80% less complexity, 100% more maintainable!** 🚀
