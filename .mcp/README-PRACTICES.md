# 🚨 Practice Enforcement System

## Overview
This system ensures AI tools consistently follow our engineering best practices: **TDD**, **Trunk-Based Development**, **Conflict-First Gate**, and **100x Workflow**.

## 🎯 **The Problem**
AI tools often default to non-TDD, non-trunk-based approaches unless explicitly reminded. This leads to:
- ❌ Poor code quality
- ❌ Integration conflicts
- ❌ Slow delivery
- ❌ Inconsistent practices

## ✅ **The Solution**
Multi-layer enforcement system that **reminds**, **validates**, and **blocks** until practices are followed.

## 🛠️ **Quick Setup**

### 1. Install Practice Enforcement
```bash
# Install pre-commit hook
npm run practices:install

# Check current practices
npm run practices:check

# View daily report
npm run practices:report
```

### 2. Configure AI Tools
All AI tools must use the reminder system in `.mcp/config/ai-tool-reminders.md`

## 📋 **Available Commands**

| Command | Purpose | Usage |
|---------|---------|-------|
| `npm run practices:check` | Check current practices | Before starting work |
| `npm run practices:report` | Daily practice report | End of day review |
| `npm run practices:install` | Install pre-commit hook | One-time setup |

## 🔍 **Practice Checklist**

### Before Every Task:
- [ ] **Conflict-First Gate**: `git merge origin/main --no-commit`
- [ ] **Task Classification**: Functional vs Non-Functional
- [ ] **TDD Approach**: RED → GREEN → REFACTOR (for functional)
- [ ] **Trunk-Based**: Commit directly to main
- [ ] **Feature Flags**: Use for incomplete work
- [ ] **Velocity**: Target >5 commits/day

### Before Every Commit:
- [ ] **Practice Checker**: `npm run practices:check`
- [ ] **Commit Message**: Include practice indicators
- [ ] **Quality Gates**: Tests, lint, build pass
- [ ] **Feature Flags**: Incomplete work flagged

## 📊 **Practice Indicators**

Include these in commit messages:

```bash
# TDD Phases
[TDD:RED]     # Red phase completed (failing test)
[TDD:GREEN]   # Green phase completed (test passes)
[TDD:REFACTOR] # Refactor phase completed (code improved)

# Development Practices
[TRUNK]        # Committed directly to main
[CONFLICT-CLEAR] # No conflicts detected
[FEATURE-FLAG] # Using feature flag for rollout
[VELOCITY]     # Meeting velocity targets
```

## 🚨 **Enforcement Levels**

### Level 1: Gentle Reminder
```markdown
💡 Practice Reminder: Don't forget to run the conflict-first gate!
```

### Level 2: Strong Warning
```markdown
⚠️ Practice Violation: This approach doesn't follow our TDD methodology.
```

### Level 3: Blocking
```markdown
🚨 Practice Block: I cannot proceed without practice confirmation.
```

## 📈 **Success Metrics**

| Metric | Target | Current |
|--------|--------|---------|
| Commits per day | >5 | [Check report] |
| TDD usage | 90% of functional tasks | [Check report] |
| Trunk-based commits | 100% | [Check report] |
| Conflict-free commits | 100% | [Check report] |
| Feature flag usage | >50% | [Check report] |

## 🔧 **Troubleshooting**

### Common Issues:

#### "Practice check failed"
```bash
# Run detailed check
npm run practices:check

# Resolve conflicts
git status
git add .
git commit -m "fix: resolve conflicts [CONFLICT-CLEAR]"
```

#### "Commit message missing indicators"
```bash
# Use proper format
git commit -m "feat: add feature [TDD:RED] [TRUNK] [CONFLICT-CLEAR]"
```

#### "Below velocity target"
```bash
# Increase commit frequency
# Make smaller, more frequent commits
# Use feature flags for incomplete work
```

## 🎯 **AI Tool Configuration**

### For Cursor:
1. Open `.mcp/config/ai-tool-reminders.md`
2. Copy the reminder template
3. Configure Cursor to use this template
4. Test with a sample request

### For ChatGPT/Codex:
1. Always start with practice reminder check
2. Ask for practice confirmation
3. Include practice indicators in suggestions
4. Reference this file for details

## 📚 **Reference Files**

- **Practice Reminders**: `.mcp/enforcement/practice-reminders.md`
- **AI Tool Config**: `.mcp/config/ai-tool-reminders.md`
- **Practice Checker**: `.mcp/scripts/check-practices.sh`
- **Daily Report**: `.mcp/scripts/daily-practice-report.sh`
- **Pre-commit Hook**: `.mcp/scripts/pre-commit`

## 🚀 **Getting Started**

1. **Install the system**:
   ```bash
   npm run practices:install
   ```

2. **Check current status**:
   ```bash
   npm run practices:check
   ```

3. **Configure AI tools** to use reminders

4. **Start using practices** in all development

5. **Monitor daily** with reports

## 💡 **Tips for Success**

- **Always run practice checker** before starting work
- **Use practice indicators** in every commit message
- **Configure AI tools** to remind you of practices
- **Review daily reports** to track adherence
- **Ask for help** if practices aren't clear

## 🎯 **Remember**

**Consistency is key!** Every response, every commit, every task must follow our engineering practices. The system is designed to help you succeed, not to block you.

**Questions?** Check the reference files or run `npm run practices:check` for guidance.

---

**Happy coding with best practices!** 🚀
