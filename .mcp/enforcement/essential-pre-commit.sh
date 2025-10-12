#!/bin/bash

# Essential Pre-Commit Enforcement
# Enforces only the 8 critical practices that have high impact and high abandonment risk

set -e

echo "🔍 Running Essential Practice Enforcement..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILURES=0

# 1. TDD Enforcement (Critical for functional tasks)
echo "🧪 TDD Enforcement..."
if git diff --cached --name-only | grep -E "\.(ts|tsx|js|jsx)$" > /dev/null; then
    # Check if this is a functional task by looking for business logic keywords
    CHANGED_FILES=$(git diff --cached --name-only | grep -E "\.(ts|tsx|js|jsx)$")
    FUNCTIONAL_KEYWORDS=("validation" "logic" "algorithm" "calculation" "processing" "integration" "api" "database" "workflow" "business" "authentication" "authorization" "payment" "booking" "scheduling" "form" "submit" "validate" "calculate" "process")
    
    IS_FUNCTIONAL=false
    for file in $CHANGED_FILES; do
        if git diff --cached "$file" | grep -i "${FUNCTIONAL_KEYWORDS[*]}" > /dev/null; then
            IS_FUNCTIONAL=true
            break
        fi
    done
    
    if [ "$IS_FUNCTIONAL" = true ]; then
        # Check for TDD cycle in recent commits
        if git log --oneline -5 | grep -E "\[TDD:(RED|GREEN|REFACTOR)\]" > /dev/null; then
            echo "  ✅ TDD cycle detected"
        else
            echo -e "  ${RED}❌ Functional changes require TDD cycle [TDD:RED] → [TDD:GREEN] → [TDD:REFACTOR]${NC}"
            FAILURES=$((FAILURES + 1))
        fi
    else
        echo "  ✅ Non-functional changes (no TDD required)"
    fi
fi

# 2. Trunk-Based Development (Critical for velocity)
echo "🌳 Trunk-Based Development..."
if git branch --show-current | grep -v "main" > /dev/null; then
    echo -e "  ${RED}❌ Must work on main branch (trunk-based development)${NC}"
    echo "  💡 Switch to main: git checkout main"
    FAILURES=$((FAILURES + 1))
else
    echo "  ✅ On main branch"
fi

# 3. Pre-Conflict Gate (Critical for merge health)
echo "🔀 Pre-Conflict Gate..."
if git fetch origin main && git merge origin/main --no-commit > /dev/null 2>&1; then
    echo "  ✅ No conflicts detected"
    git merge --abort > /dev/null 2>&1
else
    echo -e "  ${RED}❌ Merge conflicts detected - resolve before committing${NC}"
    echo "  💡 Run: git fetch origin main && git merge origin/main"
    FAILURES=$((FAILURES + 1))
fi

# 4. Environment Variables (Critical for deployment)
echo "🔧 Environment Variables..."
if npm run env:check > /dev/null 2>&1; then
    echo "  ✅ Environment variables valid"
else
    echo -e "  ${RED}❌ Environment variable validation failed${NC}"
    echo "  💡 Run: npm run env:check"
    FAILURES=$((FAILURES + 1))
fi

# 5. Type Safety (Critical for maintainability)
echo "📝 Type Safety..."
if npm run typecheck > /dev/null 2>&1; then
    echo "  ✅ TypeScript types valid"
else
    echo -e "  ${RED}❌ TypeScript type checking failed${NC}"
    echo "  💡 Run: npm run typecheck"
    FAILURES=$((FAILURES + 1))
fi

# 6. Code Quality (Critical for consistency)
echo "🧹 Code Quality..."
if npm run lint > /dev/null 2>&1; then
    echo "  ✅ Code quality checks passed"
else
    echo -e "  ${RED}❌ Code quality checks failed${NC}"
    echo "  💡 Run: npm run lint"
    FAILURES=$((FAILURES + 1))
fi

# 7. Tests (Critical for functional changes)
if git diff --cached --name-only | grep -E "\.(ts|tsx|js|jsx)$" > /dev/null; then
    echo "🧪 Test Suite..."
    if npm run test -- --run > /dev/null 2>&1; then
        echo "  ✅ All tests passing"
    else
        echo -e "  ${RED}❌ Some tests failing${NC}"
        echo "  💡 Run: npm run test"
        FAILURES=$((FAILURES + 1))
    fi
fi

# 8. Build Verification (Critical for deployment)
echo "🏗️  Build Verification..."
if npm run build > /dev/null 2>&1; then
    echo "  ✅ Build successful"
else
    echo -e "  ${RED}❌ Build failed${NC}"
    echo "  💡 Run: npm run build"
    FAILURES=$((FAILURES + 1))
fi

# Summary
echo ""
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 All essential checks passed! Ready to commit.${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILURES essential check(s) failed. Fix before committing.${NC}"
    echo ""
    echo "🚀 Quick fixes:"
    echo "  npm run env:check    # Fix environment issues"
    echo "  npm run typecheck    # Fix TypeScript errors"
    echo "  npm run lint         # Fix code quality"
    echo "  npm run test         # Fix failing tests"
    echo "  npm run build        # Fix build issues"
    exit 1
fi
