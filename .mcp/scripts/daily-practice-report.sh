#!/bin/bash
# Daily Practice Report - Monitors engineering practice adherence

echo "📊 Daily Practice Report - $(date)"
echo "=================================="

# Count commits today
COMMITS_TODAY=$(git log --since="1 day ago" --oneline | wc -l)
echo "📈 Commits today: $COMMITS_TODAY (target: >5)"

# Check TDD usage
TDD_RED=$(git log --since="1 day ago" --grep="TDD:RED" | wc -l)
TDD_GREEN=$(git log --since="1 day ago" --grep="TDD:GREEN" | wc -l)
TDD_REFACTOR=$(git log --since="1 day ago" --grep="TDD:REFACTOR" | wc -l)
echo "🧪 TDD commits: RED=$TDD_RED, GREEN=$TDD_GREEN, REFACTOR=$TDD_REFACTOR"

# Check trunk-based usage
TRUNK_COMMITS=$(git log --since="1 day ago" --grep="TRUNK" | wc -l)
echo "🌳 Trunk-based commits: $TRUNK_COMMITS"

# Check conflict resolution
CONFLICT_CLEAR=$(git log --since="1 day ago" --grep="CONFLICT-CLEAR" | wc -l)
echo "🔍 Conflict-free commits: $CONFLICT_CLEAR"

# Check feature flag usage
FEATURE_FLAG=$(git log --since="1 day ago" --grep="FEATURE-FLAG" | wc -l)
echo "🚩 Feature flag commits: $FEATURE_FLAG"

# Check velocity
VELOCITY=$(git log --since="1 day ago" --grep="VELOCITY" | wc -l)
echo "⚡ Velocity commits: $VELOCITY"

echo ""
echo "📊 Practice Adherence Analysis:"

# Velocity analysis
if [ $COMMITS_TODAY -ge 5 ]; then
  echo "✅ Velocity target met: $COMMITS_TODAY commits (target: >5)"
else
  echo "⚠️  Below velocity target: $COMMITS_TODAY commits (target: >5)"
fi

# TDD analysis
if [ $TDD_RED -gt 0 ] || [ $TDD_GREEN -gt 0 ] || [ $TDD_REFACTOR -gt 0 ]; then
  echo "✅ TDD usage detected: $((TDD_RED + TDD_GREEN + TDD_REFACTOR)) TDD commits"
else
  echo "⚠️  No TDD usage detected - consider TDD for functional tasks"
fi

# Trunk-based analysis
if [ $TRUNK_COMMITS -eq $COMMITS_TODAY ]; then
  echo "✅ Trunk-based development: 100% of commits to main"
else
  echo "⚠️  Trunk-based development: $TRUNK_COMMITS/$COMMITS_TODAY commits to main"
fi

# Conflict analysis
if [ $CONFLICT_CLEAR -eq $COMMITS_TODAY ]; then
  echo "✅ Conflict-free: 100% of commits conflict-free"
else
  echo "⚠️  Conflict-free: $CONFLICT_CLEAR/$COMMITS_TODAY commits conflict-free"
fi

# Feature flag analysis
if [ $FEATURE_FLAG -gt 0 ]; then
  echo "✅ Feature flags: $FEATURE_FLAG commits using feature flags"
else
  echo "💡 Feature flags: Consider using feature flags for incomplete work"
fi

echo ""
echo "🎯 Recommendations:"

if [ $COMMITS_TODAY -lt 5 ]; then
  echo "- Increase commit frequency to meet velocity targets"
fi

if [ $TDD_RED -eq 0 ] && [ $TDD_GREEN -eq 0 ] && [ $TDD_REFACTOR -eq 0 ]; then
  echo "- Use TDD methodology for functional tasks"
fi

if [ $TRUNK_COMMITS -lt $COMMITS_TODAY ]; then
  echo "- Ensure all commits go directly to main branch"
fi

if [ $CONFLICT_CLEAR -lt $COMMITS_TODAY ]; then
  echo "- Run conflict-first gate before every commit"
fi

if [ $FEATURE_FLAG -eq 0 ]; then
  echo "- Consider using feature flags for incomplete features"
fi

echo ""
echo "✅ Practice report complete"
