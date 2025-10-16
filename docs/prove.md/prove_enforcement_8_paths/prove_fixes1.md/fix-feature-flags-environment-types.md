# Fix Feature Flags Environment Type Mismatch

## Overview of the task
Fix TypeScript error where `"test"` environment is not assignable to the feature flags environment type. The type definition only includes `"development" | "staging" | "production"` but the code tries to use `"test"` environment.

### Files & Resources
- **Files Affected**: 
  - `src/lib/feature-flags.ts` - Fix environment type definition
  - `src/__tests__/feature-flags.test.ts` - Verify tests pass
  - `src/__tests__/env-check.test.ts` - May need environment updates
- **Dependencies**: None - this is a standalone fix
- **External Resources**: None

#### - **Success**: 
- TypeScript compilation passes without environment type errors
- Feature flags work correctly in test environment
- All 4 feature flag test failures are resolved
- `npm run typecheck` shows 0 errors for feature-flags.ts
- `npm test src/__tests__/feature-flags.test.ts` passes

##### Anything else relevant a future cursor chat needs to know to be successful with delivering the given task
- The issue is on line 173 of `src/lib/feature-flags.ts` where environment type is defined
- Need to add `"test"` to the environment union type: `('development' | 'staging' | 'production' | 'test')[]`
- Also check the `isFeatureEnabled` function where the type assertion happens
- The feature flags are currently returning `false` for all tests because environment type mismatch
- This is a simple type definition fix - no logic changes needed
- Test environment should be treated similar to development environment for feature flags
