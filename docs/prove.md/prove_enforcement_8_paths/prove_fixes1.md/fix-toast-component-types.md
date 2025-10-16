# Fix Toast Component Type Mismatches

## Overview of the task
Fix TypeScript errors in the toast component tests where `altText` property doesn't exist and `id` property is missing from `ToasterToast` type. The tests are using incorrect properties and missing required fields.

### Files & Resources
- **Files Affected**: 
  - `src/__tests__/use-toast.test.ts` - Fix test type issues
  - `src/hooks/use-toast.ts` - Verify toast type definitions
  - `src/components/ui/toast.tsx` - Check toast component types
  - `src/components/ui/toaster.tsx` - Check toaster component types
- **Dependencies**: None - this is a standalone fix
- **External Resources**: 
  - [Sonner Toast Documentation](https://sonner.emilkowal.ski/)
  - [React Hook Form Toast Integration](https://react-hook-form.com/get-started#SchemaValidation)

#### - **Success**: 
- TypeScript compilation passes without toast-related errors
- All toast component tests pass
- `npm run typecheck` shows 0 errors for use-toast.test.ts
- `npm test src/__tests__/use-toast.test.ts` passes
- Toast functionality works correctly in the application

##### Anything else relevant a future cursor chat needs to know to be successful with delivering the given task
- The errors are in `src/__tests__/use-toast.test.ts` on lines 99, 118, and 144
- `altText` property doesn't exist in `ToastActionProps` - need to use correct property name
- `ToasterToast` type requires `id` property - need to add it to test toast objects
- Check the actual toast component implementation to understand correct prop names
- The tests are using `toast({ title: 'Test' })` but need `id` property
- May need to update test expectations to match actual toast API
- This is primarily a test fix, not a component logic change
