# Development Workflow

## 🎯 **Core Principles**

### **Trunk-Based Development**
- Work directly on `main` branch
- No feature branches
- Fast feedback loops
- Continuous integration

### **TDD (Test-Driven Development)**
- **RED**: Write failing test
- **GREEN**: Write minimal code to pass
- **REFACTOR**: Improve code while keeping tests green

### **Problem Analysis (Non-Functional Tasks)**
- **ANALYZE**: Understand the problem
- **IDENTIFY**: Find root cause
- **FIX**: Implement solution
- **VALIDATE**: Verify fix works

## 🔧 **Essential Practices**

### **1. Pre-Conflict Gate**
```bash
# Always merge latest changes before working
git fetch origin main
git merge origin/main
```

### **2. Environment Variables**
```bash
# Validate environment before committing
npm run env:check
```

### **3. Type Safety**
```bash
# Check TypeScript types
npm run typecheck
```

### **4. Code Quality**
```bash
# Run linting
npm run lint
```

### **5. Testing**
```bash
# Run tests
npm run test
```

### **6. Build Verification**
```bash
# Verify build works
npm run build
```

## 📋 **Task Workflow**

### **For Functional Tasks (TDD)**
1. Write failing test
2. Implement minimal code
3. Refactor and improve
4. Commit with `[TDD:RED]`, `[TDD:GREEN]`, `[TDD:REFACTOR]`

### **For Non-Functional Tasks (Problem Analysis)**
1. Analyze the problem
2. Identify root cause
3. Fix directly
4. Validate solution

## 🚀 **Quick Commands**

```bash
# Check status
npm run env:check
npm run typecheck
npm run lint
npm run test
npm run build

# Git workflow
git fetch origin main
git merge origin/main
git add .
git commit -m "feat: description"
git push origin main
```

## 📊 **Quality Gates**

All commits must pass:
- ✅ Environment validation
- ✅ Type checking
- ✅ Linting
- ✅ Tests (for functional changes)
- ✅ Build verification
- ✅ No merge conflicts
