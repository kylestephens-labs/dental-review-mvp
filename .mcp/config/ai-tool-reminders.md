# 🤖 AI Tool Practice Reminders

## MANDATORY CONFIGURATION FOR ALL AI TOOLS

Before responding to ANY coding request, you MUST follow this protocol:

### 1. **Comprehensive Practice Reminder Check**
Always start responses with:

```markdown
## ⚠️ COMPREHENSIVE PRACTICE REMINDER CHECK

Before I help with this task, let me confirm our engineering practices:

### 🔍 CONFLICT-FIRST GATE (100x Workflow)
- [ ] Have you run `git fetch origin main && git merge origin/main --no-commit`?
- [ ] Are there any conflicts that need to be resolved before proceeding?
- [ ] Have you confirmed the working tree is clean?

### 📋 TASK CLASSIFICATION (Critical First Step)
- [ ] **Determine task type**: Is this **functional** or **non-functional**?
- [ ] **Functional indicators**: Requires testable business logic, algorithms, calculations, processing, integration, API, database, workflow, business rules
- [ ] **Non-functional indicators**: Config, setup, documentation, deployment, environment, build, dependencies, fixes, migrations, infrastructure
- [ ] **Decision rule**: "Does this require writing *testable* business logic?" If **YES → Functional**, If **NO → Non-Functional**

### 🧪 TDD METHODOLOGY (Functional Tasks Only)
- [ ] **Confirmed**: This is a **functional task** requiring testable business logic
- [ ] Will you follow TDD: **RED** (failing test) → **GREEN** (minimal code) → **REFACTOR** (improve)?
- [ ] Will you commit each TDD phase separately?
- [ ] Do you have test files ready for the RED phase?

### 🌳 TRUNK-BASED DEVELOPMENT (Critical Practices)
- [ ] Are you working directly on the **main branch** (no feature branches)?
- [ ] Will you commit **frequently** (multiple times per day, >5 target)?
- [ ] Will you use **feature flags** for any incomplete work?
- [ ] Will you **test locally** before every commit?
- [ ] Will you **monitor CI** (2-3 minutes) and production after deployment?
- [ ] Do you have a **rollback plan** if issues arise?

### 🔧 PROBLEM ANALYSIS METHODOLOGY (Non-Functional Tasks)
- [ ] Is this a **non-functional task** (config/env/fixes/documentation)?
- [ ] Will you follow Problem Analysis: **Analyze** → **Identify root cause** → **Fix directly** → **Validate**?
- [ ] Have you **analyzed the problem** thoroughly before proposing solutions?
- [ ] Will you **identify the root cause** rather than just symptoms?
- [ ] Will you **fix directly** without over-engineering?
- [ ] Will you **validate the fix** works as expected?

### 🚩 FEATURE FLAG STRATEGY
- [ ] Will you deploy with feature flag **disabled** first?
- [ ] Will you use **gradual rollout** (0% → 10% → 50% → 100%)?
- [ ] Will you **monitor metrics** during rollout?
- [ ] Do you have a **rollback plan** for the feature flag?

### 📊 QUALITY GATES & SAFETY
- [ ] Will you run **pre-commit validation** (typecheck, lint, test, build)?
- [ ] Will you ensure **CI success rate >95%**?
- [ ] Will you **document everything** in commit messages?
- [ ] Will you **rollback quickly** (<5 minutes) if issues arise?

### 🚨 EMERGENCY PROCEDURES
- [ ] Do you know how to **rollback via Vercel dashboard**?
- [ ] Do you have **monitoring alerts** set up?
- [ ] Do you know the **mean time to rollback** target (<5 minutes)?

**I ACKNOWLEDGE AND WILL FOLLOW ALL PRACTICES ABOVE** ✅
```

### 2. **Code Template Enforcement**
Every code suggestion must include:

```typescript
/**
 * 🚨 PRACTICE REMINDERS - READ BEFORE CODING
 * 
 * 1. CONFLICT-FIRST GATE: git merge origin/main --no-commit
 * 2. TDD: RED → GREEN → REFACTOR (for functional tasks)
 * 3. TRUNK-BASED: Commit to main, use feature flags
 * 4. VELOCITY: >5 commits/day, >3 deployments/day
 * 5. QUALITY: Run tests, lint, build before commit
 * 
 * DO NOT PROCEED WITHOUT FOLLOWING THESE PRACTICES
 */
```

### 3. **Commit Message Format**
Always suggest commit messages with practice indicators:

```bash
# Format: type: description [PRACTICE_INDICATORS]
feat: add stripe integration [TDD:RED] [TRUNK] [CONFLICT-CLEAR]
fix: resolve webhook issue [TDD:GREEN] [TRUNK] [CONFLICT-CLEAR]
refactor: improve error handling [TDD:REFACTOR] [TRUNK] [CONFLICT-CLEAR]
```

### 4. **Practice Indicators Reference**
- `[TDD:RED]` - Red phase completed (failing test written)
- `[TDD:GREEN]` - Green phase completed (test passes)
- `[TDD:REFACTOR]` - Refactor phase completed (code improved)
- `[TRUNK]` - Committed directly to main branch
- `[CONFLICT-CLEAR]` - No conflicts detected
- `[FEATURE-FLAG]` - Using feature flag for rollout
- `[VELOCITY]` - Meeting velocity targets

### 5. **Task Classification Reminder**
Always ask:

```markdown
**Task Classification Required:**
- **Functional**: Requires testable business logic → Use TDD
- **Non-Functional**: Config/env/fixes → Use Problem Analysis

Which approach applies to this task?
```

### 6. **Enforcement Levels**

#### **Level 1: Gentle Reminder**
```markdown
💡 **Practice Reminder**: Don't forget to run the conflict-first gate and use TDD for functional tasks!
```

#### **Level 2: Strong Warning**
```markdown
⚠️ **Practice Violation**: This approach doesn't follow our TDD methodology. Please use RED → GREEN → REFACTOR.
```

#### **Level 3: Blocking**
```markdown
🚨 **Practice Block**: I cannot proceed without confirmation that you'll follow our engineering practices.
```

### 7. **Response Template**
Use this template for ALL coding responses:

```markdown
## ⚠️ PRACTICE REMINDER CHECK
[Practice reminder check as above]

## 📋 TASK CLASSIFICATION
[Ask for functional vs non-functional classification]

## 🧪 APPROACH CONFIRMATION
[Confirm TDD for functional, Problem Analysis for non-functional]

## 💻 CODE SUGGESTION
[Include practice reminders in code comments]

## 📝 COMMIT MESSAGE
[Include practice indicators in commit message]

## ✅ VALIDATION
[Remind to run practice checker before commit]
```

### 8. **Common Violations to Watch For**

#### **TDD Violations**
- ❌ Writing code without tests first
- ❌ Skipping the RED phase
- ❌ Not committing each TDD phase separately
- ❌ Writing tests after code

#### **Trunk-Based Violations**
- ❌ Creating feature branches
- ❌ Not committing frequently enough
- ❌ Not using feature flags for incomplete work
- ❌ Working on non-main branches

#### **Conflict-First Gate Violations**
- ❌ Starting work without checking conflicts
- ❌ Not resolving conflicts before proceeding
- ❌ Committing with unresolved conflicts

#### **Velocity Violations**
- ❌ Less than 5 commits per day
- ❌ Less than 3 deployments per day
- ❌ Long lead times (>1 hour)
- ❌ Long cycle times (>2 hours)

### 9. **Success Metrics**
Track these metrics to ensure practice adherence:

- **Practice Reminder Rate**: 100% of responses include reminders
- **TDD Usage Rate**: 90% of functional tasks use TDD
- **Trunk-Based Rate**: 100% of commits to main
- **Conflict-Free Rate**: 100% of commits without conflicts
- **Velocity Target Rate**: >5 commits/day, >3 deployments/day

### 10. **Emergency Override**
Only in true emergencies (production down, security issue):

```markdown
🚨 **EMERGENCY OVERRIDE**: This is a critical production issue.
Practices may be temporarily bypassed, but must be documented and reviewed.
```

## 🎯 **Implementation Checklist**

- [ ] Configure AI tool to use this reminder system
- [ ] Test practice reminder responses
- [ ] Verify commit message format enforcement
- [ ] Monitor practice adherence metrics
- [ ] Update reminders based on common violations

**Remember: Consistency is key. Every response must include practice reminders!** 🚀
