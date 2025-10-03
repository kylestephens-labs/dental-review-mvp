# Dental Landing Template - Development Rules

This folder contains development rules and guidelines specifically tailored for the dental landing template project - a local business automation MVP.

## Project Overview

**Business Goal**: Deliver turnkey landing pages + intake + automation for local businesses (dentists, home services, cleaning companies)

**Tech Stack**: 
- React/Vite frontend
- Supabase database
- n8n workflows for automation
- Vercel deployment

## Rule Categories

### Core Development
- `01-git-workflow.md` - Git workflow and PR strategy
- `02-trunk-based-development.md` - Fast iteration development approach
- `03-github-actions.md` - CI/CD pipeline patterns

### Security & Compliance  
- `04-security-compliance.md` - PII/PHI handling and data protection
- `05-multi-service-integration.md` - Supabase, n8n, Vercel integration patterns

### Automation
- `06-n8n-workflow-guide.md` - Simple automation workflows for intake forms

## Quick Reference

### Essential Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run typecheck    # TypeScript validation
npm run lint         # Code linting

# Git workflow
git checkout main
git pull origin main
git add .
git commit -m "feat: add new feature"
git push origin main

# Deployment
# Automatic via Vercel on push to main
```

### Key Principles
1. **Fast iteration** - Direct commits to main with feature flags
2. **Security first** - Proper PII/PHI handling
3. **Simple automation** - Focus on intake form workflows
4. **Multi-tenant ready** - Design for scaling to multiple clients

## File Organization

```
src/
├── components/          # React components
├── pages/              # Page components  
├── lib/                # Utilities and helpers
├── integrations/       # Supabase integration
└── hooks/              # Custom React hooks

supabase/
├── functions/          # Edge functions
└── migrations/         # Database migrations

.rules/                 # This directory
```

## Development Workflow

1. **Start work**: `git checkout main && git pull origin main`
2. **Make changes**: Use feature flags for incomplete work
3. **Test locally**: `npm run typecheck && npm run lint && npm run build`
4. **Commit**: `git add . && git commit -m "feat: description"`
5. **Deploy**: `git push origin main` (auto-deploys to Vercel)

## Security Guidelines

- **Never commit secrets** - Use environment variables
- **Validate all inputs** - Especially form data
- **Minimize data collection** - Only essential PII
- **Use HTTPS** - All external connections
- **Regular updates** - Keep dependencies current

## Success Metrics

- **Deployment frequency**: Multiple times per day
- **Lead conversion**: Intake form submissions
- **Client satisfaction**: Fast delivery (48 hours)
- **System reliability**: >99% uptime