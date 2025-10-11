# Enhanced MCP Orchestrator - Complete Workflow Guide

## 🎯 **Overview**

The Enhanced MCP Orchestrator now includes **robust workflow enforcement** with:
- **Task Classification** (Functional vs Non-Functional)
- **TDD Workflow** (Red → Green → Refactor)
- **Problem Analysis Workflow** (Analyze → Identify → Fix → Validate)
- **Conflict-First Gate** (Advanced version)
- **Feature Flag Management**
- **Emergency Rollback Procedures**
- **Fast CI Validation** (2-3 minutes max)
- **Quality Gate Enforcement**

---

## 🔧 **Enhanced Configuration**

### **New Scripts Available**
```bash
# Task Classification
npm run workflow:classify "Implement user authentication" "User can login" "User can logout"

# Conflict-First Gate
npm run workflow:conflict-check

# TDD Workflow
npm run workflow:tdd-red task-123 "User login test" "expect(login('user@test.com')).toBe(true)"
npm run workflow:tdd-green task-123 "function login(email) { return true; }"
npm run workflow:tdd-refactor task-123 "function login(email) { return validateEmail(email); }"

# Problem Analysis (Non-Functional)
npm run workflow:problem-analysis task-456 "Build failing on deployment"

# Fast CI Validation
npm run workflow:fast-ci

# Feature Flag Management
npm run workflow:feature-flag NEW_FEATURE enable
npm run workflow:feature-flag NEW_FEATURE set_rollout 25

# Emergency Procedures
npm run workflow:emergency-rollback "Critical bug in production"

# Quality Gate
npm run workflow:quality-gate task-123
```

---

## 🔄 **Complete Enhanced Workflow**

### **Step 1: Create and Classify Task**
```bash
# Create task
npm run mcp:create "Implement user authentication" P0

# Classify task (determines approach)
npm run workflow:classify "Implement user authentication" "User can login" "User can logout"
# Output: functional (TDD approach)

# OR for non-functional tasks
npm run workflow:classify "Fix build configuration" "Build passes" "Deployment works"
# Output: non_functional (Problem Analysis approach)
```

### **Step 2: Prepare Task (ChatGPT)**
```bash
npm run mcp:prep task-abc123-def456
```

### **Step 3: Workflow-Specific Implementation**

#### **For Functional Tasks (TDD Approach)**

**3a. TDD Red Phase (Write Failing Test)**
```bash
npm run workflow:tdd-red task-abc123-def456 "User login validation" "
describe('User Authentication', () => {
  test('should login with valid email', () => {
    expect(login('user@test.com', 'password123')).toBe(true);
  });
});
"
```

**3b. Claim Task (Cursor)**
```bash
npm run mcp:claim task-abc123-def456 cursor
```

**3c. TDD Green Phase (Make Test Pass)**
```bash
npm run workflow:tdd-green task-abc123-def456 "
function login(email, password) {
  return true; // Minimal implementation
}
"
```

**3d. TDD Refactor Phase (Improve Code)**
```bash
npm run workflow:tdd-refactor task-abc123-def456 "
function login(email, password) {
  if (!validateEmail(email)) return false;
  if (!validatePassword(password)) return false;
  return authenticateUser(email, password);
}
"
```

#### **For Non-Functional Tasks (Problem Analysis Approach)**

**3a. Problem Analysis**
```bash
npm run workflow:problem-analysis task-abc123-def456 "Build failing on deployment"
```

**3b. Claim Task (Cursor)**
```bash
npm run mcp:claim task-abc123-def456 cursor
```

**3c. Direct Fix Implementation**
```bash
# Fix the issue directly based on analysis
# No TDD cycle needed for non-functional tasks
```

### **Step 4: Quality Gate Check**
```bash
npm run workflow:quality-gate task-abc123-def456
```

### **Step 5: Request Review**
```bash
npm run mcp:review task-abc123-def456
```

### **Step 6: Complete Task**
```bash
npm run mcp:complete task-abc123-def456
```

---

## 🚨 **Enhanced Pre-commit Enforcement**

The enhanced pre-commit hook now enforces:

### **1. Conflict-First Gate**
```bash
# Automatically runs before every commit
git fetch origin main
git merge origin/main --no-commit
# Blocks commit if conflicts detected
```

### **2. Practice Enforcement**
- Trunk-based development (on main branch)
- Practice indicators in commit messages
- MCP task system health

### **3. Fast CI Validation**
```bash
# Runs essential checks in <3 minutes
npm run typecheck    # Type checking
npm run lint         # Code linting
npm run test         # Unit tests
npm run build        # Build verification
```

### **4. Automatic Task Status Updates**
- Extracts task ID from commit message
- Updates task status based on test results
- Updates git context (branch, commit, PR)

---

## 🎯 **Task Classification Examples**

### **Functional Tasks (TDD Approach)**
```bash
# These require testable business logic
npm run workflow:classify "Implement payment processing" "Payment succeeds" "Payment fails gracefully"
# → functional (TDD: RED → GREEN → REFACTOR)

npm run workflow:classify "Add form validation" "Valid data accepted" "Invalid data rejected"
# → functional (TDD: RED → GREEN → REFACTOR)

npm run workflow:classify "Create booking system" "Booking created" "Booking conflicts handled"
# → functional (TDD: RED → GREEN → REFACTOR)
```

### **Non-Functional Tasks (Problem Analysis)**
```bash
# These are configuration, fixes, or setup tasks
npm run workflow:classify "Fix build configuration" "Build passes" "Deployment works"
# → non_functional (Problem Analysis: Analyze → Identify → Fix → Validate)

npm run workflow:classify "Update CSS styling" "Layout responsive" "Design consistent"
# → non_functional (Problem Analysis: Analyze → Identify → Fix → Validate)

npm run workflow:classify "Optimize performance" "Page loads faster" "Bundle size reduced"
# → non_functional (Problem Analysis: Analyze → Identify → Fix → Validate)
```

---

## 🚩 **Feature Flag Management**

### **Enable Feature Flag**
```bash
npm run workflow:feature-flag ENHANCED_INTAKE_FORM enable
```

### **Gradual Rollout**
```bash
npm run workflow:feature-flag NEW_PAYMENT_SYSTEM set_rollout 25
# 25% of users get the new feature
```

### **Disable Feature Flag**
```bash
npm run workflow:feature-flag BUGGY_FEATURE disable
```

### **Usage in Code**
```typescript
// lib/feature-flags.ts
if (isFeatureEnabled('ENHANCED_INTAKE_FORM', userId)) {
  // Use new feature
  return <EnhancedIntakeForm />;
} else {
  // Use stable feature
  return <StandardIntakeForm />;
}
```

---

## 🚨 **Emergency Procedures**

### **Emergency Rollback**
```bash
npm run workflow:emergency-rollback "Critical bug in production"
```

**Rollback Steps:**
1. Go to Vercel dashboard
2. Find last good deployment
3. Click "Promote to Production"
4. Monitor system health
5. Verify system is working
6. Investigate root cause
7. Fix the issue
8. Test thoroughly
9. Deploy fix

---

## 📊 **Quality Gates**

### **Pre-Commit Quality Gate**
```bash
# Automatically runs on every commit
npm run workflow:quality-gate task-123
```

**Checks:**
- ✅ Conflict-First Gate (no merge conflicts)
- ✅ Fast CI Validation (typecheck, lint, test, build)
- ✅ Code Coverage (>80%)
- ✅ Practice Enforcement (trunk-based, indicators)

### **Manual Quality Gate**
```bash
# Run manually before important commits
npm run workflow:quality-gate task-123
```

---

## 🔄 **Complete Example: Functional Task**

Let's walk through a complete functional task workflow:

```bash
# 1. Create and classify task
npm run mcp:create "Implement user registration" P0
# → task-abc123-def456

npm run workflow:classify "Implement user registration" "User can register" "Email validation works"
# → functional (TDD approach)

# 2. Prepare task
npm run mcp:prep task-abc123-def456

# 3. TDD Red Phase
npm run workflow:tdd-red task-abc123-def456 "User registration test" "
describe('User Registration', () => {
  test('should register new user', () => {
    const result = registerUser('new@test.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('new@test.com');
  });
});
"

# 4. Claim task
npm run mcp:claim task-abc123-def456 cursor

# 5. TDD Green Phase
npm run workflow:tdd-green task-abc123-def456 "
function registerUser(email, password) {
  return { success: true, user: { email } };
}
"

# 6. TDD Refactor Phase
npm run workflow:tdd-refactor task-abc123-def456 "
function registerUser(email, password) {
  if (!validateEmail(email)) return { success: false, error: 'Invalid email' };
  if (!validatePassword(password)) return { success: false, error: 'Invalid password' };
  
  const user = createUser(email, password);
  return { success: true, user };
}
"

# 7. Quality gate check
npm run workflow:quality-gate task-abc123-def456

# 8. Request review
npm run mcp:review task-abc123-def456

# 9. Complete task
npm run mcp:complete task-abc123-def456
```

---

## 🔄 **Complete Example: Non-Functional Task**

Let's walk through a complete non-functional task workflow:

```bash
# 1. Create and classify task
npm run mcp:create "Fix deployment configuration" P1
# → task-xyz789-abc123

npm run workflow:classify "Fix deployment configuration" "Build passes" "Deployment works"
# → non_functional (Problem Analysis approach)

# 2. Prepare task
npm run mcp:prep task-xyz789-abc123

# 3. Problem Analysis
npm run workflow:problem-analysis task-xyz789-abc123 "Build failing on Vercel deployment"

# 4. Claim task
npm run mcp:claim task-xyz789-abc123 cursor

# 5. Direct Fix Implementation
# Fix the issue directly based on analysis
# No TDD cycle needed for non-functional tasks

# 6. Quality gate check
npm run workflow:quality-gate task-xyz789-abc123

# 7. Request review
npm run mcp:review task-xyz789-abc123

# 8. Complete task
npm run mcp:complete task-xyz789-abc123
```

---

## 🎯 **Key Benefits of Enhanced Workflow**

### **1. Robust Task Classification**
- **Functional tasks** → TDD approach (Red → Green → Refactor)
- **Non-functional tasks** → Problem Analysis approach
- **Automatic approach selection** based on task content

### **2. Enhanced Quality Gates**
- **Conflict-First Gate** prevents merge conflicts
- **Fast CI Validation** ensures code quality (<3 minutes)
- **Comprehensive practice enforcement**

### **3. Feature Flag Safety**
- **Safe feature rollouts** with gradual deployment
- **Emergency rollback** capabilities
- **A/B testing** support

### **4. Emergency Procedures**
- **Quick rollback** procedures for production issues
- **Step-by-step guidance** for crisis management
- **Root cause analysis** integration

### **5. Trunk-Based Development**
- **Direct commits to main** with safety nets
- **Fast feedback loops** (2-3 minutes max)
- **Comprehensive testing** at multiple levels

---

## 🚀 **Ready for Production**

The Enhanced MCP Orchestrator is now **production-ready** with:

- ✅ **Complete workflow enforcement**
- ✅ **Task classification and approach selection**
- ✅ **TDD and Problem Analysis workflows**
- ✅ **Enhanced quality gates**
- ✅ **Feature flag management**
- ✅ **Emergency procedures**
- ✅ **Trunk-based development support**

**Start using the enhanced workflow immediately!** 🎉
