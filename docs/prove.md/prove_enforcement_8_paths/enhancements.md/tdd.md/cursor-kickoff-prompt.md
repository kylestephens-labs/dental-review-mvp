# 🚀 Prove Quality Gates - Cursor Kickoff

**Essential context for new Cursor chats working on this project**

---

## 🎯 **CORE SYSTEM**

**Prove Quality Gates** enforces strict quality standards. **No code ships without passing `npm run prove`.**

### **Key Principles**
- **Single CLI**: `npm run prove` orchestrates all quality checks
- **Mode-Aware**: Different rules for functional vs non-functional tasks  
- **Trunk-Based**: Work directly on main branch
- **Objective Verification**: Trust the logs, not narration

---

## 🏗️ **ARCHITECTURE**

### **Project Structure**
```
tools/prove/                    # Quality enforcement layer
├── cli.ts                     # Entry point
├── runner.ts                  # Orchestrates checks (serial + parallel)
├── checks/                    # Individual verifiers
│   ├── trunk.ts              # Main branch enforcement
│   ├── deliveryMode.ts       # Mode resolution
│   ├── tddChangedHasTests.ts # TDD enforcement
│   ├── diffCoverage.ts       # Coverage enforcement
│   └── [8 other checks]
└── prove.config.ts           # Configuration

tasks/
├── TASK.json                 # Defines mode: functional/non-functional
└── PROBLEM_ANALYSIS.md       # Required for non-functional tasks
```

### **Quality Checks**

| **Type** | **Checks** | **Purpose** |
|----------|------------|-------------|
| **Critical** | trunk, delivery-mode, commit-msg-convention, killswitch-required | Serial, fail-fast |
| **Parallel** | env-check, typecheck, lint, tests, feature-flag-lint | Concurrent execution |
| **Mode-Specific** | tdd-changed-has-tests, diff-coverage | Functional mode only |
| **Optional** | coverage, build-web, build-api, security, contracts | Toggle-controlled |

---

## 🔄 **WORKFLOW MODES**

### **Functional Tasks** (Features, bug fixes)
- **Mode**: `tasks/TASK.json` → PR label → `[MODE:F]` tag
- **Requirements**: 
  - TDD cycle (Red → Green → Refactor)
  - Test files for changed source files
  - Diff coverage ≥ 85% on changed lines
  - Kill-switch for feature commits

### **Non-Functional Tasks** (Analysis, config, docs)
- **Mode**: `tasks/TASK.json` → PR label → `[MODE:NF]` tag
- **Requirements**:
  - `tasks/PROBLEM_ANALYSIS.md` with Analyze/Fix/Validate sections (≥200 chars)
  - No TDD or coverage requirements

---

## 🛠️ **COMMANDS**

```bash
npm run prove          # Full quality gates (all checks)
npm run prove:quick    # Fast loop (env/typecheck/lint/test + mode-specific)
```

**Configuration**: `tools/prove/prove.config.ts`

---

## 📋 **CURSOR CHAT WORKFLOW**

### **Before Starting**
1. Run `npm run prove:quick` to check current status
2. Identify mode (functional/non-functional)
3. Create/update `tasks/TASK.json` if needed

### **During Development**
1. **Follow TDD** (if functional): Write failing test → Make it pass → Refactor
2. **Keep commits small**: Aim for <1000 lines per commit
3. **Use conventional commits**: `(<feat|fix|chore>): description [T-YYYY-MM-DD-###] [MODE:F|NF]`
4. **Add kill-switches** (if functional feature): Use feature flags or env vars

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

| **Failure** | **Issue** | **Fix** |
|-------------|-----------|---------|
| **Trunk Check** | Not on main branch | Switch to main branch |
| **Delivery Mode** | Mode not resolved | Create/update `tasks/TASK.json` |
| **TDD Check** | Changed files without tests | Create test files for changed source files |
| **Diff Coverage** | <85% coverage on changed lines | Add tests to cover changed lines |
| **Kill-switch Required** | Feature commit without kill-switch | Add feature flag/env var/config toggle |
| **Commit Message** | Wrong format | Use `git commit --amend` with correct format |

---

## 🔧 **CONFIGURATION**

### **Key Settings** (`tools/prove/prove.config.ts`)
```typescript
{
  thresholds: {
    diffCoverageFunctional: 85,        // 85% coverage for functional tasks
    diffCoverageFunctionalRefactor: 60, // 60% for refactor tasks
    globalCoverage: 25,                // Global coverage threshold
    maxWarnings: 0,                    // ESLint max warnings
    maxCommitSize: 1000,               // Max lines per commit
  },
  toggles: {
    coverage: true,                    // Enable global coverage check
    diffCoverage: false,               // Disable diff coverage (temporarily)
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

**Remember: No code ships without passing `npm run prove`. This is the contract.**