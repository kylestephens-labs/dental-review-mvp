# Environment Variables Organization

## Overview

This document outlines the reorganization of environment variables across the n8n automation system. The variables have been split into three dedicated environment files based on their functionality and project scope.

## File Structure

```
/Users/kylestephens/N8N/
├── n8n-core.env              # Core n8n functionality
├── social_media_scraping.env # Social media data collection
├── local_bus_auto.env        # Local business automation
└── n8n-extra.env            # Legacy file (to be deprecated)
```

## Environment Files

### 1. n8n-core.env
**Purpose**: Core n8n functionality and shared services

**Key Components**:
- n8n core configuration (host, port, database, etc.)
- Shared AI configuration
- Database settings (PostgreSQL)
- Authentication and security settings
- Rate limiting and performance settings

**Notable Variables**:
- `N8N_HOST=localhost`
- `N8N_PORT=5678`
- `N8N_DATABASE_TYPE=postgresdb`
- `OPENAI_API_KEY=sk-REPLACE_ME_WITH_CORE_OPENAI_KEY`

### 2. social_media_scraping.env
**Purpose**: Social media data collection and processing

**Supabase Project**: `nbhuojgyyeoeecccpxtw`

**Key Components**:
- Supabase configuration for social media project
- Social media API keys (Discord, Twitter, YouTube)
- Rate limiting for social media APIs
- Clustering and AI processing settings

**Notable Variables**:
- `SUPABASE_URL=https://nbhuojgyyeoeecccpxtw.supabase.co`
- `DISCORD_BOT_TOKEN=MTQxNzc3Njc5NjQ1OTMzOTc5Ng...`
- `TWITTER_API_IO_KEY=new1_d1e4abb5a3574a3f9c8d5de09c64a2e9`
- `YT_API_KEY=AIzaSyB7orDw_DnOIrfISVyJFd_m96yTeMREaOk`
- Rate limiting: `DC_CAP=20`, `REDDIT_CAP=60`, `YT_CAP=50`, `X_CAP=1666`
- `OPENAI_API_KEY=sk-REPLACE_ME_WITH_SOCIAL_MEDIA_OPENAI_KEY`

### 3. local_bus_auto.env
**Purpose**: Local business automation (Dental Landing Page)

**Supabase Project**: `aeznfrekdipwhhpntvue`

**Key Components**:
- Supabase configuration for business automation project
- ServiceBoost integration
- Stripe payment processing
- Demo API key for landing page

**Notable Variables**:
- `SUPABASE_URL=https://aeznfrekdipwhhpntvue.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `SERVICEBOOST_SECRET=sb_prod_94f1e38e_secret`
- `N8N_INTAKE_WEBHOOK=http://localhost:5678/webhook/lead-intake-notify`
- `STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE`
- `DEMO_API_KEY=my-secret-api-key-123`

## Decision Rationale

### Variable Placement Decisions

1. **DEMO_API_KEY** → `local_bus_auto.env`
   - **Reason**: Specific to the dental landing page demo functionality
   - **Scope**: Local business automation project only

2. **OpenAI API Key** → Both `n8n-core.env` and `social_media_scraping.env`
   - **Reason**: Different AI processing needs for core n8n vs social media scraping
   - **Implementation**: Separate keys with different placeholders for different use cases

3. **Rate Limiting** → `social_media_scraping.env`
   - **Reason**: Specific to social media API rate limits
   - **Scope**: Social media data collection only

4. **Database Configuration** → `n8n-core.env`
   - **Reason**: Shared PostgreSQL database across all projects
   - **Scope**: Core n8n infrastructure

## Supabase Project Mapping

| Environment File | Supabase Project ID | Project Name | Purpose |
|------------------|---------------------|--------------|---------|
| `social_media_scraping.env` | `nbhuojgyyeoeecccpxtw` | social_media_scraping | Social media data collection |
| `local_bus_auto.env` | `aeznfrekdipwhhpntvue` | Local Business Automation | Dental landing page automation |

## Migration Notes

### From n8n-extra.env
The original `n8n-extra.env` file contained mixed variables from different projects. These have been reorganized as follows:

- **Core n8n settings** → `n8n-core.env`
- **Social media variables** → `social_media_scraping.env`
- **Business automation variables** → `local_bus_auto.env`

### Service Role Keys
- **social_media_scraping**: Uses existing key from `n8n-extra.env`
- **local_bus_auto**: Updated with new service role key for `aeznfrekdipwhhpntvue` project

## Usage Instructions

### Loading Environment Files
Each environment file should be loaded based on the specific workflow or service being used:

```bash
# For core n8n functionality
source /Users/kylestephens/N8N/n8n-core.env

# For social media scraping workflows
source /Users/kylestephens/N8N/social_media_scraping.env

# For local business automation workflows
source /Users/kylestephens/N8N/local_bus_auto.env
```

### Docker/Container Usage
When using with Docker or containers, mount the appropriate environment file:

```bash
# Example for social media scraping container
docker run --env-file /Users/kylestephens/N8N/social_media_scraping.env your-image

# Example for business automation container
docker run --env-file /Users/kylestephens/N8N/local_bus_auto.env your-image
```

## Security Considerations

1. **Service Role Keys**: Both Supabase service role keys have full database access
2. **API Keys**: Social media API keys are project-specific and rate-limited
3. **Stripe Keys**: Live production keys require secure handling
4. **OpenAI Keys**: Separate keys allow for different usage tracking and billing

## Next Steps

1. **Update n8n workflows** to use the appropriate environment file
2. **Update Docker configurations** to load correct environment files
3. **Deprecate n8n-extra.env** once all workflows are migrated
4. **Add OpenAI API keys** to both core and social media environment files
5. **Update Stripe publishable key** in local_bus_auto.env with actual value

## File Locations

- **Environment Files**: `/Users/kylestephens/N8N/`
- **Documentation**: `/Users/kylestephens/Desktop/business_auto/Dental/dental-landing-template/docs/`
- **Legacy File**: `/Users/kylestephens/N8N/n8n-extra.env` (to be deprecated)

---

**Last Updated**: October 7, 2024  
**Version**: 1.0  
**Status**: Complete
