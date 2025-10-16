# 🚀 Prove Quality Gates - Cursor Kickoff Prompt

**For new Cursor chats working on this project**

---

## 🎯 **SYSTEM OVERVIEW**

This project uses **Prove Quality Gates** - a comprehensive quality enforcement system that ensures every code change meets strict standards before merging. **No code ships without passing `npm run prove`.**

### **Core Philosophy**
- **Single Source of Truth**: One CLI (`npm run prove`) orchestrates all quality checks
- **Mode-Aware Enforcement**: Different rules for functional vs non-functional tasks
- **Trunk-Based Development**: Work directly on main branch with automated conflict prevention
- **Objective Verification**: Never trust narration - trust the verifier logs

---

## 🏗️ **SYSTEM ARCHITECTURE**

### **Project Structure**
```
tools/prove/                    # Quality Gates enforcement layer
├── cli.ts                     # Entry point: runs all gates
├── context.ts                 # Builds shared context (git, mode, config)
├── runner.ts                  # Orchestrates checks (serial + parallel)
├── logger.ts                  # Structured logging for human/CI
├── config.ts                  # Configuration management with Zod
├── prove.config.ts            # Default configuration values
├── checks/                    # Individual quality verifiers
│   ├── trunk.ts              # Enforce main branch work
│   ├── deliveryMode.ts       # Mode resolution (functional/non-functional)
│   ├── commit-msg-convention.ts
│   ├── killswitch-required.ts
│   ├── feature-flag-lint.ts
│   ├── tddChangedHasTests.ts
│   ├── diffCoverage.ts
│   ├── security.ts
│   ├── contracts.ts
│   └── shared/               # Shared utilities
└── utils/                     # Helper functions

tasks/
├── TASK.json                 # Defines mode: functional/non-functional
└── PROBLEM_ANALYSIS.md       # Required for non-functional tasks
```

### **Quality Gates Catalogue**

#### **Critical Checks (Serial, Fail-Fast)**
| Check | Purpose | Quick Mode |
|-------|---------|------------|
| `trunk` | Verify working on main branch | ✅ |
| `delivery-mode` | Resolve functional vs non-functional mode | ✅ |
| `commit-msg-convention` | Validate conventional commit format | ✅ |
| `killswitch-required` | Require kill-switches on feature commits | ✅ |
| `pre-conflict` | Prevent merge conflicts with main | ❌ |

#### **Parallel Checks (Concurrent)**
| Check | Purpose | Quick Mode |
|-------|---------|------------|
| `env-check` | Validate environment variables | ✅ |
| `typecheck` | TypeScript type safety | ✅ |
| `lint` | ESLint with zero warnings | ✅ |
| `tests` | Vitest test suite | ✅ |
| `feature-flag-lint` | Validate feature flag usage | ✅ |

#### **Mode-Specific Checks**
| Check | Purpose | Mode | Quick Mode |
|-------|---------|------|------------|
| `tdd-changed-has-tests` | Changed files must have tests | Functional | ✅ |
| `diff-coverage` | Changed lines must meet coverage threshold | Functional | ✅ |

#### **Optional Checks (Toggle-Controlled)**
| Check | Purpose | Toggle | Quick Mode |
|-------|---------|--------|------------|
| `coverage` | Global test coverage threshold | `coverage` | ❌ |
| `build-web` | Frontend build verification | - | ❌ |
| `build-api` | Backend build verification | - | ❌ |
| `security` | Security vulnerability scan | `security` | ❌ |
| `contracts` | API specification validation | `contracts` | ❌ |
| `db-migrations` | Database migration validation | `dbMigrations` | ❌ |

---

## 🔄 **WORKFLOW MODES**

### **Functional Tasks** (Feature development, bug fixes)
- **Mode Resolution**: `tasks/TASK.json` → PR label → PR title tag `[MODE:F]`
- **Requirements**: 
  - TDD cycle (Red → Green → Refactor)
  - Test files for changed source files
  - Diff coverage ≥ 85% on changed lines
  - Kill-switch for feature commits

### **Non-Functional Tasks** (Analysis, configuration, documentation)
- **Mode Resolution**: `tasks/TASK.json` → PR label → PR title tag `[MODE:NF]`
- **Requirements**:
  - `tasks/PROBLEM_ANALYSIS.md` with Analyze/Fix/Validate sections (≥200 chars)
  - No TDD or diff coverage requirements

---

## 🛠️ **DEVELOPER COMMANDS**

### **Primary Commands**
```bash
npm run prove          # Full quality gates (all checks)
npm run prove:quick    # Fast loop (env/typecheck/lint/test + mode-specific)
```

### **Configuration**
- **File**: `tools/prove/prove.config.ts`
- **Environment**: `.env.local` for local development
- **Overrides**: Environment variables (e.g., `PROVE_MODE=functional`)

---

## 📋 **CURSOR CHAT REQUIREMENTS**

### **Before Starting Work**
1. **Check current status**: Run `npm run prove:quick` to see current state
2. **Identify mode**: Check `tasks/TASK.json` or determine from task description
3. **Understand requirements**: Review mode-specific requirements above

### **During Development**
1. **Follow TDD** (if functional): Write failing test → Make it pass → Refactor
2. **Keep commits small**: Aim for <500 lines per commit
3. **Use conventional commits**: `(<feat|fix|chore|refactor>): description [T-YYYY-MM-DD-###] [MODE:F|NF]`
4. **Add kill-switches** (if functional feature): Use feature flags or environment variables

### **Before Completion**
1. **Run full prove**: `npm run prove` must pass
2. **Include prove logs**: Paste the prove output in your response
3. **Verify mode compliance**: Ensure all mode-specific requirements are met

### **Required Response Format**
```
## Prove Check Results
**Command:** `npm run prove`
**Status:** ✅ PASSED / ❌ FAILED

**Logs:**
```
[Full prove output here]
```

**Report:**
```json
[prove-report.json content here]
```
```

---

## 🚨 **COMMON FAILURES & FIXES**

### **Trunk Check Failed**
- **Issue**: Not working on main branch
- **Fix**: Switch to main branch or create PR

### **Delivery Mode Failed**
- **Issue**: Mode not resolved or wrong requirements
- **Fix**: 
  - Create/update `tasks/TASK.json` with correct mode
  - For non-functional: ensure `PROBLEM_ANALYSIS.md` exists with required sections

### **TDD Check Failed** (Functional mode)
- **Issue**: Changed source files without corresponding test files
- **Fix**: Create test files for all changed source files

### **Diff Coverage Failed** (Functional mode)
- **Issue**: Changed lines don't meet 85% coverage threshold
- **Fix**: Add tests to cover the changed lines

### **Kill-switch Required Failed**
- **Issue**: Feature commit without kill-switch
- **Fix**: Add feature flag, environment variable, or config toggle

### **Commit Message Convention Failed**
- **Issue**: Commit message doesn't follow format
- **Fix**: Use `git commit --amend` with correct format

---

## 🔧 **CONFIGURATION REFERENCE**

### **Key Configuration Options**
```typescript
// tools/prove/prove.config.ts
{
  thresholds: {
    diffCoverageFunctional: 85,        // 85% coverage for functional tasks
    diffCoverageFunctionalRefactor: 60, // 60% for refactor tasks
    globalCoverage: 25,                // Global coverage threshold
    maxWarnings: 0,                    // ESLint max warnings
    maxCommitSize: 500,                // Max lines per commit
  },
  toggles: {
    coverage: true,                    // Enable global coverage check
    diffCoverage: true,                // Enable diff coverage check
    security: true,                    // Enable security scans
    contracts: true,                   // Enable API contract validation
    tdd: true,                        // Enable TDD check
  }
}
```

### **Environment Variables**
- `PROVE_MODE`: Override task mode (functional/non-functional)
- `PROVE_JSON`: Enable JSON output mode
- `COMMIT_SIZE_CHECK_ENABLED`: Toggle commit size check

---

## 📊 **MONITORING & REPORTING**

### **Local Development**
- **Logs**: Structured output with check results and timing
- **Report**: `prove-report.json` generated after each run
- **Quick Mode**: Use `npm run prove:quick` for faster feedback

### **CI/CD Integration**
- **GitHub Actions**: `.github/workflows/prove.yml` runs on every push/PR
- **Branch Protection**: Requires "Prove Quality Gates" check to pass
- **Artifacts**: `prove-report.json` uploaded for each CI run

---

## 🎯 **SUCCESS CRITERIA**

### **For Every Cursor Chat**
1. ✅ **Prove passes**: `npm run prove` returns exit code 0
2. ✅ **Mode compliance**: All mode-specific requirements met
3. ✅ **Logs included**: Prove output pasted in response
4. ✅ **No regressions**: Existing functionality preserved

### **For Functional Tasks**
1. ✅ **TDD followed**: Red → Green → Refactor cycle
2. ✅ **Tests added**: All changed source files have tests
3. ✅ **Coverage met**: Changed lines meet 85% coverage threshold
4. ✅ **Kill-switch present**: Feature commits include safety mechanism

### **For Non-Functional Tasks**
1. ✅ **Analysis documented**: `PROBLEM_ANALYSIS.md` with required sections
2. ✅ **Mode resolved**: Correct mode in `tasks/TASK.json` or PR label

---

## 🚀 **QUICK START CHECKLIST**

- [ ] Run `npm run prove:quick` to check current status
- [ ] Identify task mode (functional/non-functional)
- [ ] Create/update `tasks/TASK.json` if needed
- [ ] For non-functional: ensure `PROBLEM_ANALYSIS.md` exists
- [ ] Follow appropriate development workflow
- [ ] Run `npm run prove` before completion
- [ ] Include prove logs in response
- [ ] Verify all requirements met

---

## 📚 **ADDITIONAL RESOURCES**

- **Architecture**: `docs/prove.md/prove_enforcement_8_paths/architecture.md`
- **Overview**: `docs/prove.md/prove_enforcement_8_paths/prove-overview.md`
- **Tasks**: `docs/prove.md/prove_enforcement_8_paths/tasks.md`
- **Migration Strategy**: `docs/prove.md/migration-strategy.md`

---

**Remember: No code ships without passing `npm run prove`. This is the contract.**
