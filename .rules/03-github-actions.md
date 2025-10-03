# GitHub Actions Workflow Design

## Problem Context
GitHub Actions workflows often fail due to fragile design patterns that don't account for real-world variability in input data and execution environments.

## Key Design Principles

### 1. Input Sanitization & Validation
**Problem**: External input (PR titles, bodies, file paths) often contains special characters that break shell interpretation.

**Solution Pattern**:
```yaml
# ❌ VULNERABLE: Direct shell interpretation
echo "${{ github.event.pull_request.body }}" > /tmp/pr_body.txt

# ✅ ROBUST: Safe character handling
printf '%s\n' '${{ github.event.pull_request.body }}' > /tmp/pr_body.txt
```

**Key Insights**:
- Always use `printf` with format strings for external data
- Never trust that input data is shell-safe
- Validate file creation before proceeding

### 2. Git State Management
**Problem**: GitHub Actions checkout can leave repository in detached HEAD state, causing push failures.

**Solution Pattern**:
```yaml
- name: Ensure correct branch
  run: |
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" = "HEAD" ] || [ -z "$CURRENT_BRANCH" ]; then
      echo "Detected detached HEAD, checking out main branch"
      git checkout -b main || git checkout main
    fi
    
    # Verify we're on the correct branch
    FINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$FINAL_BRANCH" != "main" ]; then
      echo "Error: Failed to checkout main branch"
      exit 1
    fi
```

### 3. Conditional Execution
**Problem**: Workflows running in unsupported contexts cause failures.

**Solution Pattern**:
```yaml
- name: Build and Deploy
  run: |
    # Skip if this is a draft PR
    if [ "${{ github.event.pull_request.draft }}" = "true" ]; then
      echo "Skipping deployment for draft PR"
      exit 0
    fi
    # ... rest of workflow
```

### 4. Comprehensive Error Handling
**Problem**: Workflows fail silently or with unhelpful error messages.

**Solution Pattern**:
```yaml
- name: Validate build output
  run: |
    if [ ! -d "dist" ]; then
      echo "Error: Build output directory 'dist' not found"
      exit 1
    fi
    
    if [ ! -f "dist/index.html" ]; then
      echo "Error: Main HTML file not found in build output"
      exit 1
    fi
    
    echo "Build validation successful"
```

## Workflow Architecture Patterns

### 1. Step Dependencies
**Pattern**: Each step should validate its prerequisites and gracefully handle missing data.

```yaml
- name: Deploy to Vercel
  if: steps.build.outcome == 'success'
  run: |
    # Additional validation inside the step
    if [ "${{ steps.build.outcome }}" != "success" ]; then
      echo "Skipping deployment - build failed"
      exit 0
    fi
    # ... deployment logic
```

### 2. Data Flow Validation
**Pattern**: Validate data at each step and provide meaningful error messages.

```yaml
- name: Extract environment variables
  run: |
    VERCEL_TOKEN="${{ secrets.VERCEL_TOKEN }}"
    VERCEL_PROJECT_ID="${{ secrets.VERCEL_PROJECT_ID }}"
    
    if [ -z "$VERCEL_TOKEN" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
      echo "Error: Missing required Vercel environment variables"
      exit 1
    fi
```

## Common Anti-Patterns to Avoid

### 1. Shell Escaping Anti-Patterns
```yaml
# ❌ DON'T: Direct shell interpretation
echo "${{ github.event.pull_request.body }}" > /tmp/pr_body.txt

# ❌ DON'T: Assume input is safe
echo "$PR_BODY" > /tmp/pr_body.txt

# ✅ DO: Safe character handling
printf '%s\n' '${{ github.event.pull_request.body }}' > /tmp/pr_body.txt
```

### 2. Git State Anti-Patterns
```yaml
# ❌ DON'T: Assume git state
git push origin main

# ❌ DON'T: Ignore detached HEAD
git checkout main

# ✅ DO: Verify and fix git state
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "HEAD" ]; then
  git checkout -b main
fi
```

### 3. Error Handling Anti-Patterns
```yaml
# ❌ DON'T: Ignore errors
npm run build || true

# ❌ DON'T: Generic error messages
echo "Error occurred"

# ✅ DO: Specific error handling
if ! npm run build; then
  echo "Error: Build failed"
  exit 1
fi
```

## Monitoring & Debugging

### 1. Comprehensive Logging
Add detailed logging at each step:

```yaml
- name: Debug information
  run: |
    echo "Current branch: $(git rev-parse --abbrev-ref HEAD)"
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Build directory contents:"
    ls -la dist/ || echo "No dist directory found"
```

### 2. Step Outcome Validation
Check step outcomes before proceeding:

```yaml
- name: Deploy to Vercel
  if: steps.build.outcome == 'success'
  run: |
    if [ "${{ steps.build.outcome }}" = "failure" ]; then
      echo "Error: Build step failed, cannot proceed with deployment"
      exit 1
    fi
    # ... deployment logic
```

## Best Practices

1. **Input Sanitization**: Never trust external data
2. **State Validation**: Always verify git and environment state
3. **Error Handling**: Fail fast with meaningful messages
4. **Conditional Execution**: Skip unsupported contexts
5. **Comprehensive Testing**: Validate all failure patterns

## Example Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npm run typecheck
        
      - name: Lint
        run: npm run lint
        
      - name: Test
        run: npm run test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        if: github.ref == 'refs/heads/main'
        run: |
          npx vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
```

By following these patterns, workflows can achieve 95%+ reliability even with complex, variable input data.
