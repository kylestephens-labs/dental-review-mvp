# Fix Testing Library Setup and Missing Matchers

## Overview of the task
Set up proper testing library configuration to enable DOM testing matchers like `toBeInTheDocument`, `toHaveAttribute`, `toHaveClass`, and `toHaveTextContent`. Currently 23 test failures are caused by missing testing library extensions.

### Files & Resources
- **Files Affected**: 
  - `src/test-setup.ts` - Add testing library setup
  - `vitest.config.ts` - Verify test configuration
  - `package.json` - Verify @testing-library/jest-dom dependency
  - `src/__tests__/App.test.tsx` - Verify matchers work
  - `src/__tests__/Index.test.tsx` - Verify matchers work
  - `src/__tests__/NotFound.test.tsx` - Verify matchers work
- **Dependencies**: None - this is a standalone fix
- **External Resources**: 
  - [Testing Library Jest DOM Documentation](https://github.com/testing-library/jest-dom)
  - [Vitest Testing Library Integration](https://vitest.dev/guide/testing.html#testing-library)

#### - **Success**: 
- All 23 test failures related to missing matchers are resolved
- `toBeInTheDocument`, `toHaveAttribute`, `toHaveClass`, `toHaveTextContent` matchers work
- `npm test` shows 0 failures for App, Index, and NotFound test files
- Test setup is properly configured for future test files

##### Anything else relevant a future cursor chat needs to know to be successful with delivering the given task
- The `@testing-library/jest-dom` package is likely already installed - check package.json first
- Add `import '@testing-library/jest-dom'` to `src/test-setup.ts`
- May need to add `setupFiles: ['./src/test-setup.ts']` to vitest config if not already present
- Test the fix by running specific failing test files: `npm test src/__tests__/App.test.tsx`
- This is a configuration fix, not a code logic change
- All existing test logic should remain the same - just enable the matchers
