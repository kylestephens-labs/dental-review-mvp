# Merge Protection Strategy

## Overview

This document outlines our merge protection strategy that reconciles **direct commits to main** (trunk-based development) with **enforcement mechanisms** to maintain code quality and prevent broken deployments.

## Core Principles

### 1. Trunk-Based Development
- **Direct commits to main**: All development work happens directly on the `main` branch
- **No long-lived feature branches**: Branches exist for minutes, not days or weeks
- **Continuous integration**: Every commit triggers quality gates and deployment

### 2. Enforcement Strategy
- **Pre-commit hooks**: Run `prove:quick` before allowing commits
- **Pre-push hooks**: Run `prove:quick` before allowing pushes
- **Post-deploy smoke tests**: Validate deployment health after each push
- **Auto-rollback**: Automatically detect and provide recovery instructions for broken deployments

## Protection Mechanisms

### Pre-Commit Protection
```bash
# .husky/pre-commit
npm run prove:quick
```
- **Purpose**: Prevent broken code from being committed
- **Scope**: Fast checks (env + typecheck + lint + unit tests)
- **Timeout**: 2-3 minutes maximum
- **Bypass**: `git commit --no-verify` (emergency only)

### Pre-Push Protection
```bash
# .husky/pre-push
npm run prove:quick
```
- **Purpose**: Prevent broken code from being pushed to remote
- **Scope**: Fast checks (env + typecheck + lint + unit tests)
- **Timeout**: 2-3 minutes maximum
- **Bypass**: `git push --no-verify` (emergency only)

### Post-Deploy Validation
```yaml
# .github/workflows/post-deploy-smoke.yml
- name: Run smoke tests
  run: npm run test:smoke
```
- **Purpose**: Validate deployment health after successful CI/CD
- **Scope**: Comprehensive smoke tests (health, login, CRUD, performance)
- **Timeout**: 10 minutes maximum
- **Failure**: Creates rollback issue and notifies team

## Branch Protection Rules

### Required Status Checks
1. **Prove Quality Gates (Fast)** - `prove-fast.yml`
   - Must pass before merge
   - Runs on every push to main
   - 2-3 minute execution time
   - Includes: trunk, commit message, kill-switch, lint, typecheck

2. **Prove Quality Gates (Full)** - `prove-nightly.yml`
   - Runs nightly at 2 AM UTC
   - Comprehensive validation
   - 30 minute execution time
   - Includes: all fast checks + coverage + security + build analysis

### Branch Protection Settings
```yaml
# GitHub Branch Protection Rules
required_status_checks:
  strict: true
  contexts:
    - "Prove Quality Gates (Fast)"
enforce_admins: true
required_pull_request_reviews: null  # Disabled for direct commits
restrictions: null  # No branch restrictions
allow_force_pushes: false
allow_deletions: false
```

## Workflow for Short-Lived PRs

### When PRs Are Used
- **Code reviews**: When explicit review is needed
- **Collaborative work**: Multiple developers working on same feature
- **Experimental changes**: Testing new approaches
- **Documentation**: Major documentation updates

### PR Requirements
1. **Source branch**: Must be based on latest `main`
2. **Target branch**: Always `main`
3. **Status checks**: Must pass "Prove Quality Gates (Fast)"
4. **Review policy**: Optional (can be merged by author)
5. **Merge strategy**: Squash and merge (preferred) or merge commit

### PR Lifecycle
```bash
# 1. Create feature branch (minutes before merge)
git checkout -b feature/quick-fix
git add .
git commit -m "feat: quick fix [T-2025-01-18-017] [MODE:F]"

# 2. Push and create PR
git push origin feature/quick-fix
# Create PR via GitHub UI or CLI

# 3. Wait for status checks (2-3 minutes)
# Prove Quality Gates (Fast) must pass

# 4. Merge immediately after checks pass
# Squash and merge preferred
```

## Direct Commit Workflow

### When Direct Commits Are Used
- **Small fixes**: Typo corrections, minor refactoring
- **Configuration updates**: Environment variables, build settings
- **Documentation**: README updates, inline comments
- **Test updates**: Adding or fixing tests
- **Dependency updates**: Security patches, minor version bumps

### Direct Commit Process
```bash
# 1. Make changes
git add .
git commit -m "fix: typo in README [T-2025-01-18-018] [MODE:NF]"

# 2. Pre-commit hook runs prove:quick (2-3 minutes)
# 3. Pre-push hook runs prove:quick (2-3 minutes)
# 4. Push to main
git push origin main

# 5. Post-deploy smoke tests run automatically
# 6. If smoke tests fail, auto-rollback process triggers
```

## Emergency Procedures

### Bypassing Hooks (Emergency Only)
```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency: critical fix [T-2025-01-18-019] [MODE:NF]"

# Skip pre-push hook
git push --no-verify origin main

# ⚠️  Use only in genuine emergencies
# ⚠️  Must follow up with proper testing
# ⚠️  Document reason in commit message
```

### Rollback Procedures
```bash
# If deployment is broken, use these commands:

# Option 1: Revert last commit (recommended)
git revert HEAD --no-edit
git push origin main

# Option 2: Reset to previous commit
git reset --hard HEAD~1
git push --force-with-lease origin main

# Option 3: Check GitHub Issues for auto-generated rollback instructions
```

## Quality Gates Integration

### Prove Quality Gates
- **Single source of truth**: All enforcement goes through `prove` system
- **Mode-aware**: Different thresholds for functional vs non-functional tasks
- **Fail-fast**: Stops on first critical failure
- **Comprehensive**: Covers trunk discipline, commit conventions, kill-switches, conflicts

### Enforcement Levels
1. **Critical** (fail-fast):
   - Trunk-based development
   - Commit message convention
   - Kill-switch requirements
   - Pre-conflict checks

2. **Important** (continue on failure):
   - Linting errors
   - Type checking
   - Unit test failures
   - Coverage thresholds

3. **Informational** (nightly only):
   - Security audits
   - Bundle size analysis
   - Performance benchmarks

## Monitoring and Alerts

### Success Metrics
- **Commit frequency**: High frequency indicates good trunk discipline
- **Build success rate**: Should be >95% for main branch
- **Deployment success rate**: Should be >99% with auto-rollback
- **Mean time to recovery**: <5 minutes for critical issues

### Failure Alerts
- **GitHub Issues**: Auto-created for main branch failures
- **Slack/Teams**: Notifications for critical failures
- **Email**: Alerts for repeated failures
- **Dashboard**: Real-time status monitoring

## Best Practices

### For Developers
1. **Commit often**: Small, frequent commits are better than large ones
2. **Test locally**: Run `npm run prove:quick` before committing
3. **Use feature flags**: For new features that need kill-switches
4. **Follow conventions**: Use proper commit message format
5. **Monitor deployments**: Check smoke test results after pushing

### For Code Reviews
1. **Focus on logic**: Don't review formatting (handled by linters)
2. **Check kill-switches**: Ensure new features have proper toggles
3. **Verify tests**: Ensure adequate test coverage
4. **Review documentation**: Keep docs up to date
5. **Merge quickly**: Don't let PRs sit for days

### For Operations
1. **Monitor dashboards**: Watch for deployment failures
2. **Respond to alerts**: Address issues within 5 minutes
3. **Update documentation**: Keep this document current
4. **Review metrics**: Analyze success/failure patterns
5. **Improve processes**: Continuously refine the workflow

## Configuration Files

### Key Files
- `.husky/pre-commit`: Pre-commit hook
- `.husky/pre-push`: Pre-push hook
- `.github/workflows/prove-fast.yml`: Fast CI on push
- `.github/workflows/prove-nightly.yml`: Comprehensive nightly checks
- `.github/workflows/post-deploy-smoke.yml`: Post-deploy validation
- `tools/prove/`: Prove quality gates system
- `playwright.smoke.config.ts`: Smoke test configuration

### Environment Variables
- `SMOKE_TEST_URL`: Target URL for smoke tests
- `SMOKE_TESTS_ENABLED`: Feature flag for smoke tests
- `PROVE_JSON=1`: JSON output for CI systems
- `NODE_ENV`: Environment (development/staging/production)

## Conclusion

This merge protection strategy enables **rapid, safe development** by:

1. **Enforcing quality** at every step without slowing down development
2. **Preventing broken deployments** through comprehensive validation
3. **Enabling quick recovery** through automated rollback procedures
4. **Maintaining trunk discipline** while providing safety nets
5. **Scaling with the team** through automated enforcement

The key is **speed with safety** - we want developers to move fast, but never break the main branch or production deployments.

---

*Last updated: 2025-01-18*
*Version: 1.0*
