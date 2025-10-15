# Fix Supabase Client Test Mocking Issues

## Overview of the task
Fix Supabase client test mocking where the mock function calls return empty arrays instead of expected arguments. The tests expect string arguments but receive `undefined`, causing 3 test failures.

### Files & Resources
- **Files Affected**: 
  - `src/__tests__/supabase-client.test.ts` - Fix mock setup
  - `src/integrations/supabase/client.ts` - Verify client implementation
  - `src/test-setup.ts` - May need environment variable mocking
- **Dependencies**: None - this is a standalone fix
- **External Resources**: 
  - [Vitest Mocking Documentation](https://vitest.dev/guide/mocking.html)
  - [Supabase Client Documentation](https://supabase.com/docs/reference/javascript/creating-a-client)

#### - **Success**: 
- All 3 Supabase client test failures are resolved
- Mock function receives expected string arguments (URL and key)
- `npm test src/__tests__/supabase-client.test.ts` passes
- Tests properly verify client configuration
- Mock calls array contains expected arguments

##### Anything else relevant a future cursor chat needs to know to be successful with delivering the given task
- The issue is that `mockCreateClient.mock.calls[0]` returns empty array `[]` instead of `[url, key, config]`
- Environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` may not be available in test environment
- Need to mock environment variables or provide test values
- The mock is set up correctly but the actual client creation isn't calling it with expected args
- Check if environment variables are being loaded properly in test environment
- May need to add environment variable mocking to test setup
- The client uses `import.meta.env` which may need special handling in tests
