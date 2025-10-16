# Fix UI Component Export Issues

## Overview of the task
Fix missing exports in UI components that are causing TypeScript compilation failures. The `buttonVariants` and `toggleVariants` functions exist in separate files but are not exported from their main component files, causing import errors in other UI components.

### Files & Resources
- **Files Affected**: 
  - `src/components/ui/button.tsx` - Add export for buttonVariants
  - `src/components/ui/button-variants.ts` - Verify export structure
  - `src/components/ui/toggle.tsx` - Add export for toggleVariants  
  - `src/components/ui/toggle-variants.ts` - Verify export structure
  - `src/components/ui/alert-dialog.tsx` - Verify import works
  - `src/components/ui/calendar.tsx` - Verify import works
  - `src/components/ui/pagination.tsx` - Verify import works
  - `src/components/ui/toggle-group.tsx` - Verify import works
- **Dependencies**: None - this is a standalone fix
- **External Resources**: None

#### - **Success**: 
- TypeScript compilation passes without errors related to missing exports
- All UI components can successfully import `buttonVariants` and `toggleVariants`
- `npm run typecheck` shows 0 errors for UI component files
- All affected components render without TypeScript errors

##### Anything else relevant a future cursor chat needs to know to be successful with delivering the given task
- The variants already exist in separate files (`button-variants.ts`, `toggle-variants.ts`) - just need to re-export them
- Use `export { buttonVariants } from './button-variants'` pattern
- Test by running `npm run typecheck` after changes
- Verify imports work by checking that components using these variants compile successfully
- This is a simple re-export fix, not a complex refactoring
