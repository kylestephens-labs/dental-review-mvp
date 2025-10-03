# Trunk-Based Development Guide

## Overview

This project uses **Trunk-Based Development** - a high-velocity development approach where all developers work directly on the `main` branch with fast feedback loops and comprehensive safety nets.

## Core Principles

### 1. Direct Commits to Main
- ✅ **Always commit directly to `main` branch**
- ✅ **No feature branches** (except for emergency fixes)
- ✅ **Fast feedback loops** (2-3 minutes max)
- ✅ **Feature flags** for incomplete work

### 2. Safety First
- ✅ **Multiple safety nets** prevent bad code from reaching production
- ✅ **Feature flags** for safe feature rollouts
- ✅ **Emergency rollback** for quick recovery
- ✅ **Comprehensive testing** at multiple levels

## Implementation Details

### CI/CD Pipeline (`.github/workflows/ci.yml`)

**Fast Quality Gate (2-3 minutes max)**:
```yaml
# Essential checks only for trunk-based development
- Type check: npm run typecheck
- Lint: npm run lint  
- Unit tests: npm run test -- --run --reporter=basic
- Build check: npm run build
```

**Deploy on Success**:
- Automatic deployment to Vercel after CI passes
- No manual intervention required

### Feature Flags System (`lib/feature-flags.ts`)

**Safe Feature Rollouts**:
```typescript
// Check if feature is enabled
if (isFeatureEnabled('ENHANCED_INTAKE_FORM', userId)) {
  // Use new feature
} else {
  // Use stable feature
}

// Gradual rollouts
updateFeatureFlag('NEW_FEATURE', {
  enabled: true,
  rolloutPercentage: 10 // Start with 10%
});
```

**Available Feature Flags**:
- `ENHANCED_INTAKE_FORM`: Improved form validation
- `DYNAMIC_CONTENT`: Dynamic page generation
- `ADVANCED_ANALYTICS`: Enhanced tracking
- `AUTO_SAVE`: Form auto-save functionality

## Development Workflow

### Daily Development Process

1. **Start Work**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Make Changes**:
   - Write code with feature flags for new features
   - Use feature flags to hide incomplete work
   - Test locally before committing

3. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: add new payment flow with feature flag"
   git push origin main
   ```

4. **Monitor CI**:
   - CI runs automatically (2-3 minutes)
   - Deploys automatically if successful
   - Check GitHub Actions tab for status

5. **Monitor Production**:
   - Watch for issues in production
   - Use feature flags to control rollout
   - Rollback if necessary

### Feature Development with Flags

**Step 1: Deploy with Flag Disabled**
```typescript
// Deploy feature with flag disabled
const useNewFeature = isFeatureEnabled('NEW_FEATURE');
if (useNewFeature) {
  // New code (hidden from users)
} else {
  // Stable code (visible to users)
}
```

**Step 2: Gradual Rollout**
```typescript
// Start with 0% rollout
updateFeatureFlag('NEW_FEATURE', {
  enabled: true,
  rolloutPercentage: 0
});

// Gradually increase
updateFeatureFlag('NEW_FEATURE', {
  rolloutPercentage: 10
});
```

**Step 3: Full Rollout**
```typescript
// Enable for all users
updateFeatureFlag('NEW_FEATURE', {
  enabled: true,
  rolloutPercentage: 100
});
```

## Code Quality Standards

### Commit Messages
```
feat: add new intake form with validation
fix: resolve Supabase connection issue
docs: update deployment documentation
refactor: simplify form component logic
test: add unit tests for form validation
```

### Code Organization
- **Feature flags**: `lib/feature-flags.ts`
- **Components**: `src/components/`
- **Pages**: `src/pages/`
- **Utilities**: `src/lib/`

### Testing Strategy
- **Fast CI**: Essential checks only (2-3 minutes)
- **Feature flags**: Test both enabled/disabled states
- **Local testing**: Always test before committing

## Emergency Procedures

**When to Rollback**:
- Critical bugs in production
- Performance issues
- Security vulnerabilities
- Data corruption

**How to Rollback**:
1. Go to Vercel dashboard
2. Find last good deployment
3. Click "Promote to Production"
4. Monitor system health

**Post-Rollback**:
1. Verify system is working
2. Investigate root cause
3. Fix the issue
4. Test thoroughly
5. Deploy fix

## Best Practices

### Do's ✅
- **Commit frequently** (multiple times per day)
- **Use feature flags** for all new features
- **Test locally** before committing
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

## Success Metrics

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

### Safety Metrics
- **Mean time to rollback**: <5 minutes
- **Recovery time**: <15 minutes
- **Feature flag adoption**: >90%
