#!/bin/bash
# Simplified Practice Checker Script - MVP Sequential Agent Handoff

echo "🔍 MCP PRACTICE CHECK"
echo "===================="

# Check for conflict-first gate
echo ""
echo "1. 🔍 CONFLICT-FIRST GATE CHECK"
echo "-------------------------------"
if ! git fetch origin main >/dev/null 2>&1; then
  echo "❌ Cannot fetch origin main - check network/credentials"
  exit 1
fi

if ! git merge origin/main --no-commit >/dev/null 2>&1; then
  echo "❌ CONFLICT DETECTED - Resolve before proceeding"
  echo "   Run: git status to see conflicts"
  echo "   Run: git diff to see conflict details"
  exit 1
else
  echo "✅ No conflicts detected"
  git merge --abort >/dev/null 2>&1
fi

# Check working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Working tree not clean - uncommitted changes detected"
  echo "   Run: git status to see uncommitted files"
else
  echo "✅ Working tree is clean"
fi

# Check for trunk-based development
echo ""
echo "2. 🌳 TRUNK-BASED DEVELOPMENT CHECK"
echo "-----------------------------------"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Not on main branch: $CURRENT_BRANCH"
  echo "   Trunk-based development requires working on main branch"
  echo "   Run: git checkout main"
  exit 1
else
  echo "✅ On main branch - trunk-based development confirmed"
fi

# Check for MCP task files
echo ""
echo "3. 📋 MCP TASK SYSTEM CHECK"
echo "---------------------------"
if [ -d ".mcp/tasks" ]; then
  echo "✅ MCP task directory found"
  
  # Count tasks in each status
  PENDING_COUNT=$(find .mcp/tasks/pending -name "*.md" 2>/dev/null | wc -l)
  READY_COUNT=$(find .mcp/tasks/ready -name "*.md" 2>/dev/null | wc -l)
  IN_PROGRESS_COUNT=$(find .mcp/tasks/in-progress -name "*.md" 2>/dev/null | wc -l)
  REVIEW_COUNT=$(find .mcp/tasks/review -name "*.md" 2>/dev/null | wc -l)
  COMPLETED_COUNT=$(find .mcp/tasks/completed -name "*.md" 2>/dev/null | wc -l)
  FAILED_COUNT=$(find .mcp/tasks/failed -name "*.md" 2>/dev/null | wc -l)
  
  echo "   Task status summary:"
  echo "     Pending: $PENDING_COUNT"
  echo "     Ready: $READY_COUNT"
  echo "     In Progress: $IN_PROGRESS_COUNT"
  echo "     Review: $REVIEW_COUNT"
  echo "     Completed: $COMPLETED_COUNT"
  echo "     Failed: $FAILED_COUNT"
else
  echo "⚠️  MCP task directory not found"
  echo "   Run: mkdir -p .mcp/tasks/{pending,ready,in-progress,review,completed,failed}"
fi

# Check for local testing
echo ""
echo "4. 🧪 LOCAL TESTING CHECK"
echo "-------------------------"
if [ -f "package.json" ]; then
  if grep -q "test" package.json; then
    echo "✅ Test scripts found in package.json"
    echo "   Run: npm test before committing"
  else
    echo "⚠️  No test scripts found in package.json"
  fi
else
  echo "⚠️  No package.json found - cannot verify test setup"
fi

# Check commit message quality
echo ""
echo "5. 📝 COMMIT MESSAGE QUALITY CHECK"
echo "----------------------------------"
RECENT_COMMITS=$(git log --since="1 day ago" --oneline | head -3)
if [ -n "$RECENT_COMMITS" ]; then
  echo "Recent commits:"
  echo "$RECENT_COMMITS"
else
  echo "No commits today"
fi

# Check for practice indicators in commits
PRACTICE_INDICATORS=$(git log --since="1 day ago" --grep="\[TDD:\|\[TRUNK\]|\[CONFLICT-CLEAR\]|\[FEATURE-FLAG\]|\[VELOCITY\]" | wc -l)
if [ $PRACTICE_INDICATORS -eq 0 ]; then
  echo "⚠️  No practice indicators found in recent commits"
  echo "   Use format: feat: description [TDD:RED] [TRUNK] [CONFLICT-CLEAR]"
else
  echo "✅ Practice indicators found: $PRACTICE_INDICATORS commits"
fi

# Summary
echo ""
echo "📊 PRACTICE CHECK SUMMARY"
echo "=========================="
echo "✅ Conflict-first gate: PASSED"
echo "✅ Trunk-based development: PASSED"
if [ $PRACTICE_INDICATORS -gt 0 ]; then
  echo "✅ Practice indicators: PASSED"
else
  echo "⚠️  Practice indicators: NEEDS IMPROVEMENT"
fi

echo ""
echo "✅ MCP practice check complete"
echo "🚀 Ready for sequential agent handoff!"