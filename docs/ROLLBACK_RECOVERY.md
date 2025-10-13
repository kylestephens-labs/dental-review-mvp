# 🚨 Auto-Rollback Recovery Guide

## Overview

The Prove Quality Gates system includes automatic rollback procedures when the main branch fails quality checks. This document outlines the automated recovery path and manual procedures.

## 🚨 When Auto-Rollback Triggers

Auto-rollback is triggered when:
- A push to the `main` branch occurs
- The `prove-fast.yml` workflow fails
- The failure is not due to infrastructure issues

## 🔄 Automated Recovery Process

### 1. Immediate Failure Detection
- Workflow detects prove quality gates failure
- Logs detailed failure information
- Triggers rollback procedures

### 2. Rollback Instructions Display
The workflow automatically displays:
- **Exact git commands** to revert the commit
- **Alternative rollback methods** (revert vs reset)
- **Deployment rollback options**
- **Investigation steps** for root cause analysis

### 3. Automatic Issue Creation
- Creates a GitHub issue with `urgent` and `rollback` labels
- Includes all failure details and recovery instructions
- Provides a checklist for recovery completion

### 4. Team Notification
- Logs clear notification messages
- Provides links to detailed logs and issues
- Highlights the urgency of the situation

## 🔧 Manual Recovery Procedures

### Option 1: Revert Commit (Recommended)
```bash
# Revert the last commit (creates a new commit that undoes changes)
git revert HEAD --no-edit
git push origin main
```

**Pros:**
- Preserves commit history
- Safe for collaborative environments
- Creates audit trail

**Cons:**
- Creates additional commit
- Requires force push if already pushed

### Option 2: Reset to Previous Commit
```bash
# Reset to previous commit (removes the bad commit entirely)
git reset --hard HEAD~1
git push --force-with-lease origin main
```

**Pros:**
- Clean history
- No additional commits

**Cons:**
- Rewrites history
- Requires force push
- Can cause issues for other developers

### Option 3: Deployment Rollback
- **Vercel**: Go to deployments dashboard and rollback to previous version
- **AWS**: Use deployment rollback features
- **Other platforms**: Check platform-specific rollback procedures

## 📋 Recovery Checklist

When a rollback is triggered, follow this checklist:

- [ ] **Immediate Action**
  - [ ] Execute rollback using one of the provided methods
  - [ ] Verify main branch is in working state
  - [ ] Confirm deployment is restored

- [ ] **Investigation**
  - [ ] Review workflow logs for specific failure reasons
  - [ ] Run `npm run prove:quick` locally to reproduce
  - [ ] Identify root cause of the failure

- [ ] **Fix Implementation**
  - [ ] Fix the identified issues
  - [ ] Test locally with `npm run prove:quick`
  - [ ] Ensure all quality gates pass

- [ ] **Re-deployment**
  - [ ] Create new commit with fixes
  - [ ] Push to main (will trigger prove-fast.yml)
  - [ ] Verify deployment is successful

- [ ] **Cleanup**
  - [ ] Update the rollback issue with resolution
  - [ ] Close the issue when fully resolved
  - [ ] Document lessons learned

## 🛡️ Prevention Measures

### Pre-Push Validation
- Always run `npm run prove:quick` locally before pushing
- Use the pre-push hook to catch issues early
- Test changes thoroughly in development

### Quality Gates
- Ensure all tests pass before committing
- Run linting and type checking
- Verify build succeeds locally

### Trunk Discipline
- Keep commits small and focused
- Use feature flags for risky changes
- Implement kill switches for new features

## 🚨 Emergency Contacts

If automated rollback fails or issues persist:

1. **Check GitHub Actions** for detailed logs
2. **Review the auto-created issue** for specific instructions
3. **Contact the development team** via appropriate channels
4. **Escalate to platform administrators** if deployment issues persist

## 📊 Monitoring and Alerts

The system provides:
- **Real-time failure notifications** in GitHub Actions
- **Automatic issue creation** with detailed context
- **Clear recovery instructions** in workflow logs
- **Status tracking** through issue checklists

## 🔍 Troubleshooting Common Issues

### Workflow Fails to Create Issue
- Check GitHub token permissions
- Verify repository access
- Review workflow logs for API errors

### Rollback Commands Don't Work
- Ensure you have push permissions to main
- Check if branch protection rules are blocking
- Verify you're on the correct branch

### Deployment Rollback Issues
- Check deployment platform status
- Verify rollback permissions
- Review platform-specific documentation

---

*This document is automatically updated when rollback procedures change.*
