# Fix Toggle Group Component Missing Props

## Overview of the task
Fix TypeScript errors in the toggle group component where required props are missing. The component is missing the `type` property for `ToggleGroupMultipleProps` and `value` property for `ToggleGroupItemImplProps`.

### Files & Resources
- **Files Affected**: 
  - `src/components/ui/toggle-group.tsx` - Fix missing props
  - `src/components/ui/toggle.tsx` - Verify toggleVariants export works
  - `src/components/ui/toggle-variants.ts` - Verify export structure
- **Dependencies**: Fix UI component exports task should be completed first
- **External Resources**: 
  - [Radix UI Toggle Group Documentation](https://www.radix-ui.com/primitives/docs/components/toggle-group)
  - [Class Variance Authority Documentation](https://cva.style/docs)

#### - **Success**: 
- TypeScript compilation passes without toggle group errors
- Toggle group component renders with proper props
- `npm run typecheck` shows 0 errors for toggle-group.tsx
- Component can be used in other parts of the application

##### Anything else relevant a future cursor chat needs to know to be successful with delivering the given task
- The errors are on lines 17 and 31 of `src/components/ui/toggle-group.tsx`
- Need to add `type` prop to the ToggleGroup component (likely `"multiple"` or `"single"`)
- Need to add `value` prop to the ToggleGroupItem component
- Check the Radix UI documentation for proper prop usage
- This component uses `class-variance-authority` for styling variants
- The component should work with both single and multiple selection modes
- Test by importing and using the component in a simple test case
