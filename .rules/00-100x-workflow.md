# 100x Workflow (Operational Index)
> **Dental Landing Template Development Workflow - Optimized for fast iteration and delivery**

## 1) Task Classification
- **Functional** → needs testable business logic (clear inputs/outputs)
- **Non-Functional** → conflicts, config/env, one-time fixes, file edits
- **Decision rule:** "Does this require writing *testable* business logic?" If **yes → Functional**

## 2) Conflict-First Gate (always run first)
```bash
git fetch origin main
git merge origin/main --no-commit
```

## 3) Quick Reference
- **Functional** → TDD: RED (write failing test) → GREEN (minimal code to pass) → REFACTOR (improve safely)
- **Non-Functional** → Problem Analysis: Analyze → Identify root cause → Fix directly → Validate

## 4) Critical Commands
```bash
# Conflict check (first)
git merge origin/main --no-commit

# Validate build
npm run typecheck
npm run lint
npm run test
npm run build

# Check form validation
npm run test:forms
```

## 5) Definition of Done (DoD)
Dental Landing Template Success Indicators:
- CI checks green
- No merge conflicts
- All tests passing
- Build successful
- Form validation working
- Working tree clean
- PR mergeable

## 6) Detailed Workflow
For complete methodology, examples, and troubleshooting:
**See: `docs/DEVELOPMENT_GUIDE.md`**

## 7) Dental Landing Template-Specific Examples

### Functional Tasks (TDD Approach)
- **Form Validation**: Write test for validation logic → Implement minimal validation → Refactor for clarity
- **Supabase Integration**: Test database operations → Implement integration → Optimize error handling
- **n8n Workflow**: Test workflow logic → Implement minimal workflow → Refactor for maintainability

### Non-Functional Tasks (Problem Analysis)
- **Build Configuration**: Analyze build issues → Identify root cause → Fix configuration
- **Environment Setup**: Analyze setup problems → Identify missing dependencies → Fix environment
- **Documentation Updates**: Analyze missing docs → Identify gaps → Update documentation

## 8) Dental Landing Template Workflow Patterns

### Form Development
```bash
# 1. Write failing test
npm run test:forms -- --watch

# 2. Implement minimal form validation
# 3. Make test pass
# 4. Refactor for clarity
```

### Supabase Integration
```bash
# 1. Test database connection
npm run test:supabase

# 2. Implement minimal integration
# 3. Test with real data
# 4. Optimize performance
```

### n8n Workflow Development
```bash
# 1. Test webhook endpoint
npm run test:webhooks

# 2. Implement minimal workflow
# 3. Test with form submissions
# 4. Add error handling
```

## 9) Quality Gates

### Pre-commit Validation
```bash
# Always run before committing
npm run typecheck && npm run lint && npm run test && npm run build
```

### Pre-deployment Validation
```bash
# Run before pushing to main
npm run test:e2e
npm run test:forms
npm run build
```

## 10) Emergency Procedures

### Quick Fixes
1. **Identify the problem** - Check error logs and CI status
2. **Fix locally** - Make minimal change to fix issue
3. **Test fix** - Run validation locally
4. **Commit and push** - Deploy fix immediately

### Rollback Procedures
1. **Identify last good commit** - Check git log
2. **Revert changes** - Use git revert or Vercel dashboard
3. **Verify system** - Check that site is working
4. **Investigate root cause** - Fix underlying issue

## 11) Success Metrics

### Velocity Metrics
- **Commits per day**: >5
- **Deployments per day**: >3
- **Lead time**: <1 hour
- **Cycle time**: <2 hours

### Quality Metrics
- **CI success rate**: >95%
- **Rollback rate**: <5%
- **Bug escape rate**: <2%
- **Test coverage**: >80%

### Business Metrics
- **Form conversion rate**: Track lead submissions
- **Site performance**: Page load times <2s
- **Client satisfaction**: Fast delivery (48 hours)
- **System reliability**: >99% uptime

## 12) Best Practices

### Do's ✅
- **Commit frequently** (multiple times per day)
- **Test locally** before committing
- **Use feature flags** for incomplete work
- **Monitor production** after deployment
- **Rollback quickly** if issues arise
- **Document everything** in commit messages

### Don'ts ❌
- **Don't commit broken code** (even with feature flags)
- **Don't skip local testing**
- **Don't ignore CI failures**
- **Don't delay rollbacks** when issues arise
- **Don't commit large files** (>100MB)
- **Don't work on feature branches** (use main)

## 13) Troubleshooting

### Common Issues
1. **Build failures**: Check TypeScript errors and dependencies
2. **Form validation errors**: Verify input schemas and validation logic
3. **Supabase connection issues**: Check credentials and network
4. **n8n workflow failures**: Verify webhook URLs and authentication

### Debug Steps
1. **Check logs**: Review error messages and stack traces
2. **Test locally**: Run validation commands locally
3. **Verify environment**: Check environment variables and configuration
4. **Test individual components**: Isolate the problem area
5. **Check external services**: Verify Supabase and n8n status

## 14) Resources

- **Project Documentation**: `docs/`
- **Component Library**: `src/components/`
- **Form Validation**: `src/lib/validators.ts`
- **Supabase Integration**: `src/integrations/supabase/`
- **n8n Workflows**: `supabase/functions/`
