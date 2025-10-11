# 🌳 Trunk-Based Development Comprehensive Checklist

## MANDATORY CHECKLIST FOR ALL AI TOOLS

Before providing ANY coding assistance, AI tools must verify these trunk-based development practices:

### 🔍 **PRE-WORK CHECKLIST**

#### 1. Conflict-First Gate (100x Workflow)
- [ ] **Run**: `git fetch origin main && git merge origin/main --no-commit`
- [ ] **Verify**: No conflicts detected
- [ ] **Confirm**: Working tree is clean
- [ ] **Action**: Resolve any conflicts before proceeding

#### 2. Branch Verification
- [ ] **Confirm**: Working on `main` branch (not feature branches)
- [ ] **Check**: No feature branches exist (trunk-based discourages them)
- [ ] **Verify**: `git branch --show-current` returns `main`

#### 3. Task Classification (Critical First Step)
- [ ] **Determine**: Is this a **functional** or **non-functional** task?
- [ ] **Functional indicators**: Business logic, algorithms, calculations, processing, integration, API, database, workflow, business rules
- [ ] **Non-functional indicators**: Config, setup, documentation, deployment, environment, build, dependencies, fixes, migrations, infrastructure
- [ ] **Decision rule**: "Does this require writing *testable* business logic?" If **YES → Functional**, If **NO → Non-Functional**
- [ ] **Select**: TDD for functional, Problem Analysis for non-functional

### 🧪 **TDD METHODOLOGY (Functional Tasks Only)**

#### RED Phase (Write Failing Test)
- [ ] **Create**: Test file in `src/__tests__/` directory
- [ ] **Write**: Failing test that describes the requirement
- [ ] **Run**: Test to confirm it fails
- [ ] **Commit**: `git commit -m "test: add failing test for feature [TDD:RED] [TRUNK] [CONFLICT-CLEAR]"`

#### GREEN Phase (Make Test Pass)
- [ ] **Write**: Minimal code to make test pass
- [ ] **Run**: Test to confirm it passes
- [ ] **Commit**: `git commit -m "feat: implement minimal feature [TDD:GREEN] [TRUNK] [CONFLICT-CLEAR]"`

#### REFACTOR Phase (Improve Code)
- [ ] **Improve**: Code structure, performance, error handling
- [ ] **Run**: Tests to ensure they still pass
- [ ] **Commit**: `git commit -m "refactor: improve feature implementation [TDD:REFACTOR] [TRUNK] [CONFLICT-CLEAR]"`

### 🔧 **PROBLEM ANALYSIS METHODOLOGY (Non-Functional Tasks Only)**

#### ANALYZE Phase (Understand the Problem)
- [ ] **Gather**: What exactly is the problem?
- [ ] **Identify**: What are the visible symptoms?
- [ ] **Check**: What do error logs show?
- [ ] **Reproduce**: Can you reproduce the issue?
- [ ] **Scope**: What's affected by this problem?
- [ ] **Impact**: How critical is this problem?

#### IDENTIFY ROOT CAUSE Phase (Find the Source)
- [ ] **Ask Why**: Why is this happening?
- [ ] **Trace Backwards**: What led to this problem?
- [ ] **Check Dependencies**: Are external services involved?
- [ ] **Review Changes**: What changed recently?
- [ ] **Test Hypotheses**: Test your theories about the cause
- [ ] **Confirm**: Verify you've found the real source

#### FIX DIRECTLY Phase (Solve the Problem)
- [ ] **Minimal Change**: Make the smallest change that fixes the issue
- [ ] **Don't Over-Engineer**: Avoid adding unnecessary complexity
- [ ] **Direct Solution**: Address the root cause directly
- [ ] **Test the Fix**: Verify the fix works
- [ ] **Document Changes**: Record what you changed and why

#### VALIDATE Phase (Ensure the Fix Works)
- [ ] **Test Locally**: Verify the fix works in your environment
- [ ] **Test in Staging**: Deploy to staging and test
- [ ] **Monitor Production**: Watch for issues after deployment
- [ ] **Verify Symptoms Gone**: Confirm the original problem is resolved
- [ ] **Check Side Effects**: Ensure no new problems were introduced

### 🌳 **TRUNK-BASED DEVELOPMENT PRACTICES**

#### 1. Direct Commits to Main
- [ ] **Never**: Create feature branches
- [ ] **Always**: Commit directly to `main`
- [ ] **Frequency**: Multiple commits per day (>5 target)
- [ ] **Size**: Small, focused commits (<100MB each)

#### 2. Feature Flag Strategy
- [ ] **Deploy**: With feature flag **disabled** first
- [ ] **Code**: Use feature flags to hide incomplete work
- [ ] **Rollout**: Gradual rollout (0% → 10% → 50% → 100%)
- [ ] **Monitor**: Metrics during rollout
- [ ] **Rollback**: Plan for quick rollback if needed

#### 3. Local Testing Before Commit
- [ ] **Run**: `npm run typecheck`
- [ ] **Run**: `npm run lint`
- [ ] **Run**: `npm run test`
- [ ] **Run**: `npm run build`
- [ ] **Verify**: All checks pass before committing

#### 4. CI/CD Monitoring
- [ ] **Wait**: For CI to complete (2-3 minutes max)
- [ ] **Verify**: CI passes before proceeding
- [ ] **Monitor**: Production after deployment
- [ ] **Watch**: For issues or errors

### ⚡ **VELOCITY & DEPLOYMENT TARGETS**

#### Daily Targets
- [ ] **Commits**: >5 commits per day
- [ ] **Deployments**: >3 deployments per day
- [ ] **Lead Time**: <1 hour (idea to production)
- [ ] **Cycle Time**: <2 hours (commit to deploy)

#### Quality Targets
- [ ] **CI Success Rate**: >95%
- [ ] **Rollback Rate**: <5%
- [ ] **Bug Escape Rate**: <2%
- [ ] **Test Coverage**: >80%

### 🚩 **FEATURE FLAG IMPLEMENTATION**

#### Code Pattern
```typescript
// Check if feature is enabled
if (isFeatureEnabled('NEW_FEATURE', userId)) {
  // New code (hidden from users)
} else {
  // Stable code (visible to users)
}

// Gradual rollouts
updateFeatureFlag('NEW_FEATURE', {
  enabled: true,
  rolloutPercentage: 10 // Start with 10%
});
```

#### Rollout Strategy
- [ ] **Step 1**: Deploy with flag disabled (0% rollout)
- [ ] **Step 2**: Enable for 10% of users
- [ ] **Step 3**: Monitor metrics and increase to 50%
- [ ] **Step 4**: Full rollout to 100% if metrics are good
- [ ] **Step 5**: Remove feature flag after stable

### 📊 **QUALITY GATES**

#### Pre-Commit Validation
- [ ] **Conflict Check**: `git merge origin/main --no-commit`
- [ ] **Type Check**: `npm run typecheck`
- [ ] **Lint Check**: `npm run lint`
- [ ] **Test Check**: `npm run test`
- [ ] **Build Check**: `npm run build`

#### Pre-Deploy Validation
- [ ] **CI Passes**: All automated checks pass
- [ ] **Feature Flags**: Incomplete work is flagged
- [ ] **Monitoring**: Alerts are configured
- [ ] **Rollback Plan**: Ready for quick rollback

#### Post-Deploy Validation
- [ ] **Health Checks**: Application is healthy
- [ ] **Monitoring**: No critical alerts
- [ ] **User Metrics**: Positive user experience
- [ ] **Error Rates**: Within acceptable limits

### 🚨 **EMERGENCY PROCEDURES**

#### Rollback Process
- [ ] **Identify**: Last good deployment
- [ ] **Rollback**: Via Vercel dashboard or git revert
- [ ] **Verify**: System is working
- [ ] **Monitor**: For stability
- [ ] **Investigate**: Root cause of issue
- [ ] **Fix**: The underlying problem
- [ ] **Test**: Thoroughly before redeploy

#### Mean Time to Rollback
- [ ] **Target**: <5 minutes
- [ ] **Process**: Automated rollback triggers
- [ ] **Monitoring**: Real-time alerting
- [ ] **Recovery**: <15 minutes total

### 📝 **COMMIT MESSAGE FORMAT**

#### Required Format
```bash
type: description [PRACTICE_INDICATORS]

# Examples:
feat: add stripe integration [TDD:RED] [TRUNK] [CONFLICT-CLEAR]
fix: resolve webhook issue [TDD:GREEN] [TRUNK] [CONFLICT-CLEAR]
refactor: improve error handling [TDD:REFACTOR] [TRUNK] [CONFLICT-CLEAR]
```

#### Practice Indicators
- `[TDD:RED]` - Red phase completed
- `[TDD:GREEN]` - Green phase completed
- `[TDD:REFACTOR]` - Refactor phase completed
- `[TRUNK]` - Committed directly to main
- `[CONFLICT-CLEAR]` - No conflicts detected
- `[FEATURE-FLAG]` - Using feature flag for rollout
- `[VELOCITY]` - Meeting velocity targets

### 🚫 **TRUNK-BASED DEVELOPMENT DON'TS**

#### Never Do These
- [ ] **Don't**: Create feature branches
- [ ] **Don't**: Commit broken code (even with feature flags)
- [ ] **Don't**: Skip local testing
- [ ] **Don't**: Ignore CI failures
- [ ] **Don't**: Delay rollbacks when issues arise
- [ ] **Don't**: Commit large files (>100MB)
- [ ] **Don't**: Work on non-main branches

### ✅ **TRUNK-BASED DEVELOPMENT DO'S**

#### Always Do These
- [ ] **Do**: Commit frequently (multiple times per day)
- [ ] **Do**: Use feature flags for all new features
- [ ] **Do**: Test locally before committing
- [ ] **Do**: Monitor production after deployment
- [ ] **Do**: Rollback quickly if issues arise
- [ ] **Do**: Document everything in commit messages
- [ ] **Do**: Work directly on main branch

### 🎯 **SUCCESS METRICS TRACKING**

#### Daily Metrics
- [ ] **Commits**: Count commits per day
- [ ] **Deployments**: Count deployments per day
- [ ] **TDD Usage**: Track TDD phase commits
- [ ] **Feature Flags**: Track feature flag usage
- [ ] **Conflicts**: Track conflict resolution

#### Weekly Metrics
- [ ] **Velocity**: Average commits per day
- [ ] **Quality**: CI success rate
- [ ] **Stability**: Rollback rate
- [ ] **Coverage**: Test coverage percentage

### 🔧 **TROUBLESHOOTING**

#### Common Issues
- [ ] **Conflicts**: Run `git status` and resolve
- [ ] **CI Failures**: Check logs and fix issues
- [ ] **Feature Flags**: Verify flag configuration
- [ ] **Rollbacks**: Use Vercel dashboard
- [ ] **Velocity**: Increase commit frequency

#### Emergency Contacts
- [ ] **Vercel Dashboard**: For rollbacks
- [ ] **GitHub Actions**: For CI status
- [ ] **Monitoring**: For production alerts
- [ ] **Team**: For escalation

## 🚨 **ENFORCEMENT LEVELS**

### Level 1: Gentle Reminder
```markdown
💡 **Practice Reminder**: Don't forget to use feature flags for incomplete work!
```

### Level 2: Strong Warning
```markdown
⚠️ **Practice Violation**: This approach doesn't follow trunk-based development. Please commit directly to main with feature flags.
```

### Level 3: Blocking
```markdown
🚨 **Practice Block**: I cannot proceed without confirmation that you'll follow trunk-based development practices.
```

## 🎯 **REMEMBER**

**Trunk-based development is about speed, safety, and continuous delivery. Every practice in this checklist is designed to maximize velocity while minimizing risk. Follow these practices religiously for maximum success!** 🚀
