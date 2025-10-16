# Fix Coverage Generation System

## Overview of the task
Fix the coverage generation system where `coverage/coverage-final.json` file is not being created, causing the diff coverage check to fail. This blocks the prove system from functioning properly.

### Files & Resources
- **Files Affected**: 
  - `vitest.config.ts` - Verify coverage configuration
  - `tools/prove/checks/coverage.ts` - Fix coverage file path handling
  - `tools/prove/checks/diffCoverage.ts` - Fix coverage file reading
  - `package.json` - Verify coverage dependencies
  - `coverage/` directory - Ensure it gets created
- **Dependencies**: Fix test failures first (coverage depends on tests passing)
- **External Resources**: 
  - [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
  - [V8 Coverage Provider](https://vitest.dev/guide/coverage.html#coverage-provider-v8)

#### - **Success**: 
- Coverage directory and files are generated successfully
- `coverage/coverage-final.json` file exists after running tests
- Diff coverage check passes in prove system
- `npm run test -- --coverage` generates coverage files
- Prove system can read coverage data for diff coverage calculations

##### Anything else relevant a future cursor chat needs to know to be successful with delivering the given task
- Coverage generation depends on tests passing - fix test failures first
- The coverage configuration in `vitest.config.ts` looks correct but may need adjustment
- Check if `@vitest/coverage-v8` package is properly installed
- Coverage files are generated in `./coverage` directory as configured
- The prove system expects `coverage/coverage-final.json` specifically
- May need to ensure coverage directory is created before running tests
- Check if there are any file permission issues preventing coverage file creation
- Verify that the coverage provider is properly configured in vitest config
