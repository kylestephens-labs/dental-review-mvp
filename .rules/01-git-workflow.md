# Git Workflow & PR Strategy

## Git Rules
- Never rebase (use git merge)
- Squash and Merge only for PRs
- Run pre-merge validation before merging
- Direct commits to main for fast iteration

## PR Requirements
- All CI checks must be green
- No merge conflicts
- All tests passing
- Build successful
- Working tree clean

## Task Isolation
- Single-concern, small diffs
- No cross-scope edits
- Complete one task before starting next

## Commit Message Format
```
type(scope): description

Examples:
feat(form): add intake form validation
fix(api): resolve Supabase connection issue
docs(readme): update deployment instructions
test(form): add form submission tests
refactor(components): simplify header component
```

## Branch Naming Convention
- **Features**: `feature/feature-name` (e.g., `feature/intake-form`)
- **Fixes**: `fix/issue-description` (e.g., `fix/form-validation`)
- **Docs**: `docs/update-description` (e.g., `docs/deployment-guide`)
- **Tests**: `test/feature-description` (e.g., `test/form-submission`)

## Pre-commit Validation
```bash
# Run these before every commit
npm run typecheck
npm run lint
npm run test
npm run build
```

## Emergency Procedures
- **Hotfixes**: Commit directly to main with `hotfix:` prefix
- **Rollbacks**: Use Vercel dashboard or `git revert`
- **Conflicts**: Resolve locally, test, then push

## Best Practices
- **Commit frequently** (multiple times per day)
- **Use descriptive messages** that explain the change
- **Test before committing** (run validation locally)
- **Keep commits atomic** (one logical change per commit)
- **Update documentation** when changing APIs or workflows
