# Fix Environment Variable Test Setup

## Overview of the task
Fix environment variable test setup where `process.exit` mocking isn't working correctly and environment variables aren't properly set in test environment. This affects 2 test failures in environment validation tests.

### Files & Resources
- **Files Affected**: 
  - `src/__tests__/env-check.test.ts` - Fix process.exit mocking
  - `src/__tests__/test-task-*.test.ts` - Fix environment variable setup
  - `src/env-check.ts` - Verify environment validation logic
  - `src/test-setup.ts` - Add environment variable mocking
  - `vitest.config.ts` - Verify test environment configuration
- **Dependencies**: None - this is a standalone fix
- **External Resources**: 
  - [Vitest Environment Variables](https://vitest.dev/guide/environment.html)
  - [Node.js Process Mocking](https://nodejs.org/api/process.html)

#### - **Success**: 
- Both environment variable test failures are resolved
- `process.exit` mocking works correctly in tests
- Environment variables are properly set in test environment
- `npm test src/__tests__/env-check.test.ts` passes
- `npm test src/__tests__/test-task-*.test.ts` passes
- Environment validation works in both test and production

##### Anything else relevant a future cursor chat needs to know to be successful with delivering the given task
- The `process.exit` mock throws an error but the test expects it not to throw
- Environment variables may not be loaded properly in test environment
- Need to mock `process.exit` to not actually exit during tests
- May need to set up test environment variables in `vitest.config.ts`
- The `env-check.ts` file loads from `.env` file which may not exist in tests
- Consider using `vi.stubGlobal` for `process.exit` mocking
- Environment variables should be set before running tests, not during test execution
