#!/bin/bash

# Enhanced Pre-Commit Enforcement
# Enforces high-impact practices that tend to be abandoned

set -e

echo "🔍 Running Enhanced Pre-Commit Enforcement..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to run check and track failures
run_check() {
    local check_name="$1"
    local command="$2"
    
    echo -n "  🔍 $check_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILURES=$((FAILURES + 1))
        return 1
    fi
}

echo "📋 Running High-Impact Practice Checks..."

# 1. TDD Enforcement (for functional tasks)
if git diff --cached --name-only | grep -E "\.(ts|tsx|js|jsx)$" > /dev/null; then
    echo "  🧪 Checking TDD compliance for code changes..."
    
    # Check if this is a functional task (look for TDD commits)
    if git log --oneline -10 | grep -E "\[TDD:(RED|GREEN|REFACTOR)\]" > /dev/null; then
        echo "    ✅ TDD cycle detected in recent commits"
    else
        echo "    ⚠️  No TDD cycle detected - ensure this is a non-functional task"
    fi
fi

# 2. Trunk-Based Development
echo "  🌳 Checking trunk-based development..."
if git branch --show-current | grep -v "main" > /dev/null; then
    echo -e "    ${YELLOW}⚠️  Not on main branch - ensure this is intentional${NC}"
else
    echo "    ✅ On main branch"
fi

# 3. Pre-Conflict Gate
echo "  🔀 Running pre-conflict gate..."
run_check "Conflict Check" "git fetch origin main && git merge origin/main --no-commit"

# 4. Environment Variable Validation
echo "  🔧 Checking environment variables..."
run_check "Env Check" "npm run env:check"

# 5. Type Safety
echo "  📝 Checking TypeScript types..."
run_check "Type Check" "npm run typecheck"

# 6. Code Quality
echo "  🧹 Checking code quality..."
run_check "Lint Check" "npm run lint"

# 7. Feature Flag Discipline
echo "  🚩 Checking feature flag discipline..."
if git diff --cached --name-only | grep -E "\.(ts|tsx|js|jsx)$" > /dev/null; then
    # Check if new features have feature flags
    if git diff --cached | grep -E "(function|const|class).*=" | grep -v "isFeatureEnabled\|useFeatureFlag" > /dev/null; then
        echo "    ⚠️  New code detected - ensure feature flags are used for new features"
    else
        echo "    ✅ Feature flag discipline maintained"
    fi
fi

# 8. Commit Message Standards
echo "  📝 Checking commit message format..."
COMMIT_MSG=$(cat "$1")
if echo "$COMMIT_MSG" | grep -E "^(feat|fix|docs|style|refactor|test|chore):" > /dev/null; then
    echo "    ✅ Commit message follows conventional format"
else
    echo -e "    ${YELLOW}⚠️  Commit message should follow conventional format: type: description${NC}"
    echo "    Examples: feat: add user authentication, fix: resolve login bug"
fi

# 9. Test Coverage (for functional changes)
if git diff --cached --name-only | grep -E "\.(ts|tsx|js|jsx)$" > /dev/null; then
    echo "  🧪 Checking test coverage..."
    if npm run test -- --coverage --watchAll=false > /dev/null 2>&1; then
        echo "    ✅ Tests passing"
    else
        echo -e "    ${YELLOW}⚠️  Some tests failing - ensure all tests pass${NC}"
    fi
fi

# 10. Build Verification
echo "  🏗️  Verifying build..."
run_check "Build Check" "npm run build"

# Summary
echo ""
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready to commit.${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILURES check(s) failed. Please fix before committing.${NC}"
    echo ""
    echo "💡 Quick fixes:"
    echo "  - Run 'npm run env:check' to fix environment issues"
    echo "  - Run 'npm run typecheck' to fix TypeScript errors"
    echo "  - Run 'npm run lint' to fix code quality issues"
    echo "  - Run 'npm run test' to fix failing tests"
    echo "  - Run 'npm run build' to fix build issues"
    exit 1
fi
