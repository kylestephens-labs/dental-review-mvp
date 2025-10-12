# Security Guidelines for Dental Landing Template

## 🚨 CRITICAL: Never Commit Secrets to Git

This repository has been configured with multiple layers of protection to prevent accidental secret exposure.

## What Are Secrets?

Secrets include but are not limited to:
- API keys (Stripe, AWS, Google, etc.)
- Database passwords
- Authentication tokens
- Private keys
- Environment variables with sensitive data

## Protection Mechanisms

### 1. Enhanced .gitignore
The `.gitignore` file now excludes:
- All `.env*` files
- All `n8n*.env` files
- AWS credentials files
- Private keys and certificates
- Database files

### 2. Pre-commit Hook
A pre-commit hook automatically scans staged files for secret patterns:
- Stripe keys (`sk_live_`, `sk_test_`, `pk_live_`, `pk_test_`)
- AWS credentials (`AKIA`, base64 patterns)
- Google API keys (`AIza`)
- GitHub tokens (`ghp_`, `gho_`, etc.)
- Private keys (`-----BEGIN PRIVATE KEY-----`)

### 3. GitHub Push Protection
GitHub automatically scans pushes for secrets and blocks them.

## Best Practices

### ✅ DO:
- Use `.env.example` files with placeholder values
- Store real secrets in environment variables
- Use secrets management services (AWS Secrets Manager, etc.)
- Test with fake/test credentials only
- Use environment-specific configuration

### ❌ DON'T:
- Commit `.env` files with real secrets
- Hardcode API keys in source code
- Share credentials in chat/email
- Use production secrets in development
- Store secrets in documentation files

## Environment Setup

### For Development:
1. Copy `.env.example` to `.env.local`
2. Fill in your test/development credentials
3. Never commit `.env.local`

### For Production:
1. Use environment variables or secrets management
2. Never store production secrets in the repository
3. Use CI/CD environment variable injection

## Emergency Response

If secrets are accidentally committed:

1. **Immediately** revoke the exposed credentials
2. Use `git filter-branch` to remove from history:
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch "path/to/file"' --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push to update remote:
   ```bash
   git push --force origin main
   ```
4. Generate new credentials
5. Update all systems with new credentials

## File Structure

```
.env.example          # Template with placeholder values (committed)
.env.local           # Local development secrets (ignored)
.env                 # Environment-specific secrets (ignored)
n8n-core.env         # N8N configuration (ignored)
n8n-local.env        # Local N8N configuration (ignored)
```

## Monitoring

- Pre-commit hooks run automatically
- GitHub push protection monitors all pushes
- Regular security audits recommended

## Contact

For security concerns, contact the development team immediately.

---
**Remember: Security is everyone's responsibility!**
