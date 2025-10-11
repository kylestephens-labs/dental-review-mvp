# 🚨 Practice Enforcement System

## Overview
This system ensures AI tools consistently follow our engineering best practices: TDD, Trunk-Based Development, Conflict-First Gate, and 100x Workflow.

## 🎯 **Enforcement Layers**

### **Layer 1: Pre-Task Reminders**
Before any task assignment, AI tools must acknowledge:

```markdown
## ⚠️ MANDATORY PRACTICE CHECKLIST

Before starting ANY task, confirm you will:

### 🔍 Conflict-First Gate
- [ ] Run `git fetch origin main && git merge origin/main --no-commit`
- [ ] Resolve any conflicts before proceeding
- [ ] Only start work after conflicts are clear

### 🧪 TDD Methodology (for functional tasks)
- [ ] RED: Write failing test first
- [ ] GREEN: Write minimal code to pass test
- [ ] REFACTOR: Improve code while keeping tests passing
- [ ] Commit each phase separately

### 🌳 Trunk-Based Development
- [ ] Commit directly to main branch
- [ ] Use feature flags for incomplete work
- [ ] Multiple commits per day (>5 target)
- [ ] No feature branches (except emergencies)

### ⚡ 100x Workflow
- [ ] Classify task: functional vs non-functional
- [ ] Use appropriate approach based on classification
- [ ] Fast CI validation (2-3 minutes max)
- [ ] Quality gates at each stage

### 📊 Velocity Targets
- [ ] >5 commits per day
- [ ] >3 deployments per day
- [ ] <1 hour lead time
- [ ] <2 hours cycle time

**I ACKNOWLEDGE AND WILL FOLLOW ALL PRACTICES ABOVE** ✅
```

### **Layer 2: Task Template Enforcement**
Every task must include practice reminders:

```json
{
  "practice_reminders": {
    "conflict_first_gate": "MANDATORY: Run git merge origin/main --no-commit before starting",
    "tdd_required": "MANDATORY: Use TDD for functional tasks (RED → GREEN → REFACTOR)",
    "trunk_based": "MANDATORY: Commit directly to main, use feature flags",
    "velocity_target": "MANDATORY: >5 commits/day, >3 deployments/day",
    "quality_gates": "MANDATORY: Pre-commit, pre-deploy, post-deploy validation"
  }
}
```

### **Layer 3: Code Comments Enforcement**
Every code file must start with practice reminders:

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

### **Layer 4: Commit Message Enforcement**
Every commit must include practice indicators:

```bash
# Commit message format:
feat: add stripe integration [TDD:RED] [TRUNK] [CONFLICT-CLEAR]

# Practice indicators:
[TDD:RED] - Red phase completed
[TDD:GREEN] - Green phase completed  
[TDD:REFACTOR] - Refactor phase completed
[TRUNK] - Committed directly to main
[CONFLICT-CLEAR] - No conflicts detected
[FEATURE-FLAG] - Using feature flag for rollout
[VELOCITY] - Meeting velocity targets
```

### **Layer 5: AI Tool Configuration**
Configure AI tools to always include practice reminders:

```yaml
# .cursor/settings.json
{
  "ai.reminders": {
    "enabled": true,
    "practices": [
      "conflict-first-gate",
      "tdd-methodology", 
      "trunk-based-development",
      "velocity-targets",
      "quality-gates"
    ],
    "reminder_frequency": "every_task",
    "enforcement_level": "mandatory"
  }
}
```

## 🛠️ **Implementation Tools**

### **1. Practice Checker Script**
```bash
#!/bin/bash
# .mcp/scripts/check-practices.sh

echo "🔍 Checking engineering practices..."

# Check for conflict-first gate
if ! git merge origin/main --no-commit; then
  echo "❌ CONFLICT DETECTED - Resolve before proceeding"
  exit 1
fi

# Check for TDD (look for test files)
if [ ! -f "src/__tests__/*.test.ts" ]; then
  echo "⚠️  No test files found - TDD required for functional tasks"
fi

# Check for feature flags
if ! grep -r "isFeatureEnabled\|featureFlag" src/; then
  echo "⚠️  No feature flags found - Consider using for incomplete work"
fi

echo "✅ Practices check complete"
```

### **2. Pre-Commit Hook**
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🚨 PRACTICE ENFORCEMENT - Pre-commit check"

# Run practice checker
./.mcp/scripts/check-practices.sh

# Check commit message format
if ! echo "$1" | grep -E "\[TDD:|\[TRUNK\]|\[CONFLICT-CLEAR\]"; then
  echo "❌ Commit message missing practice indicators"
  echo "Required format: feat: description [TDD:RED] [TRUNK] [CONFLICT-CLEAR]"
  exit 1
fi

echo "✅ Pre-commit check passed"
```

### **3. AI Tool Prompts**
```markdown
## 🚨 MANDATORY AI TOOL CONFIGURATION

Before responding to ANY coding request, you MUST:

1. **Remind user of practices** if not mentioned
2. **Ask for confirmation** that practices will be followed
3. **Include practice indicators** in all code suggestions
4. **Reference this file** for practice details

### Example Response Format:
"Before I help with this task, let me remind you of our engineering practices:

🔍 **Conflict-First Gate**: Have you run `git merge origin/main --no-commit`?
🧪 **TDD**: Is this a functional task requiring TDD (RED → GREEN → REFACTOR)?
🌳 **Trunk-Based**: Will you commit directly to main with feature flags?
⚡ **Velocity**: Are you targeting >5 commits/day?

Please confirm you'll follow these practices before I proceed."
```

## 📊 **Monitoring & Enforcement**

### **Daily Practice Report**
```bash
#!/bin/bash
# .mcp/scripts/daily-practice-report.sh

echo "📊 Daily Practice Report - $(date)"

# Count commits
COMMITS=$(git log --since="1 day ago" --oneline | wc -l)
echo "Commits today: $COMMITS (target: >5)"

# Check TDD usage
TDD_COMMITS=$(git log --since="1 day ago" --grep="TDD:" | wc -l)
echo "TDD commits: $TDD_COMMITS"

# Check trunk-based usage
TRUNK_COMMITS=$(git log --since="1 day ago" --grep="TRUNK" | wc -l)
echo "Trunk-based commits: $TRUNK_COMMITS"

# Check conflict resolution
CONFLICT_COMMITS=$(git log --since="1 day ago" --grep="CONFLICT-CLEAR" | wc -l)
echo "Conflict-free commits: $CONFLICT_COMMITS"

# Generate report
if [ $COMMITS -lt 5 ]; then
  echo "⚠️  Below velocity target - increase commit frequency"
fi

if [ $TDD_COMMITS -eq 0 ]; then
  echo "⚠️  No TDD usage detected - consider TDD for functional tasks"
fi

echo "✅ Practice report complete"
```

### **Practice Violation Alerts**
```bash
#!/bin/bash
# .mcp/scripts/violation-alert.sh

# Check for practice violations
if [ $COMMITS -lt 3 ]; then
  echo "🚨 VIOLATION: Below minimum commits (3/day)"
fi

if [ $TDD_COMMITS -eq 0 ] && [ $FUNCTIONAL_TASKS -gt 0 ]; then
  echo "🚨 VIOLATION: Functional tasks without TDD"
fi

if [ $CONFLICT_COMMITS -lt $COMMITS ]; then
  echo "🚨 VIOLATION: Commits without conflict-first gate"
fi
```

## 🎯 **Success Metrics**

### **Practice Adherence Targets**
- **Conflict-First Gate**: 100% of tasks
- **TDD Usage**: 90% of functional tasks
- **Trunk-Based Development**: 100% of commits
- **Velocity Targets**: >5 commits/day, >3 deployments/day
- **Quality Gates**: 100% of commits

### **Enforcement Levels**
1. **Reminder**: Gentle prompt to follow practices
2. **Warning**: Clear indication of practice violation
3. **Block**: Prevent commit/deployment until practices followed
4. **Alert**: Notify team of repeated violations

## 🚀 **Getting Started**

1. **Install practice checker**:
   ```bash
   chmod +x .mcp/scripts/check-practices.sh
   chmod +x .mcp/scripts/daily-practice-report.sh
   ```

2. **Set up pre-commit hook**:
   ```bash
   cp .mcp/scripts/pre-commit .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

3. **Configure AI tools** to use practice reminders

4. **Run daily reports** to monitor adherence

This system ensures **consistent practice adherence** across all AI tools and team members! 🎯
