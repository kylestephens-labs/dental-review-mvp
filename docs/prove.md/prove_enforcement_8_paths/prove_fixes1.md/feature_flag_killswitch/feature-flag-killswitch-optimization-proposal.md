# Feature Flag & Kill-Switch Optimization Delivery Proposal

## **📋 Project Overview**

**Goal:** Optimize and integrate the feature flag lint check and kill-switch required check to create a robust, unified feature flag safety system that ensures both data integrity and production safety.

**Why:** Currently, the two checks operate independently with duplicate logic, limited pattern recognition, and no integration. This creates maintenance overhead, inconsistent validation, and missed safety opportunities.

**Success Criteria:** 
- Unified feature flag validation system
- Enhanced kill-switch detection with registration validation
- Improved developer experience with clear error messages
- Maintained prove check pass rate
- Reduced code duplication and improved maintainability

---

## **🎯 Task 0: Investigate Feature Flag Lint Disablement**

### **Overview**
Investigate why the feature flag lint check was disabled and add instrumentation to prevent future regressions.

### **Goal**
Understand the root cause of the feature flag lint check disablement and add telemetry to monitor its stability.

### **Why**
The feature flag lint check is currently commented out in the runner due to earlier instability. Re-enabling it without understanding the cause risks the same regression occurring.

### **Files to Create/Modify**
- `tools/prove/checks/feature-flag-lint.ts` - Add telemetry and logging
- `tools/prove/runner.ts` - Document disablement reason
- `docs/prove.md/prove_enforcement_8_paths/prove-overview.md` - Update check catalogue
- `docs/prove.md/prove_enforcement_8_paths/tasks.md` - Update tiny-steps plan

### **Investigation Steps**
```bash
# Check git history for disablement
git log --oneline -p tools/prove/runner.ts | grep -A5 -B5 "feature-flag-lint"

# Analyze prove-report.json for patterns
# Look for performance issues or failures

# Test current implementation in isolation
npm run prove:quick -- --check feature-flag-lint
```

### **Telemetry to Add**
- Count of files processed vs skipped
- Detection duration and performance metrics
- Pattern match counts and accuracy
- Error rates and failure modes
- Memory usage during execution

### **Testing & Validation**
```bash
# Test telemetry collection
npm run prove:quick
# Verify metrics appear in prove-report.json

# Test performance monitoring
# Run multiple times to establish baseline
# Monitor for performance regressions
```

### **Acceptance Criteria**
- [ ] Root cause of disablement documented
- [ ] Telemetry added to feature flag lint check
- [ ] Performance baseline established
- [ ] Documentation updated with findings
- [ ] prove-report.json includes new metrics

---

## **🎯 Task 1: Create Shared Pattern Detection Engine**

### **Overview**
Extract common pattern detection logic into a shared utility to eliminate duplication between checks.

### **Goal**
Create a single source of truth for feature flag pattern detection that both checks can use.

### **Why**
Currently, both checks have duplicate pattern detection logic with slight variations, making maintenance difficult and creating inconsistencies. This must be done before touching individual checks to avoid double refactors.

### **Files to Create/Modify**
- `tools/prove/checks/shared/feature-flag-detector.ts` - New shared detection engine
- `tools/prove/checks/shared/index.ts` - Export shared utilities

### **Shared Detection Engine**
```typescript
export class FeatureFlagDetector {
  static readonly PATTERNS = {
    useFeatureFlag: /useFeatureFlag\s*\(\s*['"`]([^'"`]+)['"`]/g,
    isEnabled: /isEnabled\s*\(\s*['"`]([^'"`]+)['"`]/g,
    isFeatureEnabled: /isFeatureEnabled\s*\(\s*['"`]([^'"`]+)['"`]/g,
    killSwitch: /KILL_SWITCH_/g,
    envVar: /process\.env\.[A-Z_]+_ENABLED/g,
    config: /config\s*[=:].*enabled/g,
    toggle: /toggle\s*[=:]/g,
    import: /import.*flags|from.*flags/g,
    rollout: /rolloutPercentage\s*:\s*\d+/g
  };

  static async detectPatterns(files: string[], patterns: RegExp[]): Promise<Map<string, string[]>> {
    // Unified detection logic with ripgrep and fallback
  }

  static filterComments(content: string): string {
    // Shared comment filtering logic
  }

  static async getDetectionMetrics(): Promise<DetectionMetrics> {
    // Return telemetry data for monitoring
  }
}
```

### **Testing & Validation**
```bash
# Test pattern detection accuracy
# Create test files with various flag patterns
# Verify all patterns are detected correctly

# Test performance
# Run detection on large codebase
# Verify no performance regression

# Test consistency
# Compare results between old and new detection
# Verify identical results
```

### **Acceptance Criteria**
- [ ] All existing patterns are detected correctly
- [ ] Performance is equal or better than current implementation
- [ ] Detection logic is easily maintainable
- [ ] Fallback mechanisms work correctly
- [ ] Telemetry data is collected and accessible
- [ ] Shared utility is properly exported

---

## **🎯 Task 2: Implement Unified Flag Registry System**

### **Goal**
Create a unified flag registry system that consolidates flag loading and validation from all sources.

### **Why**
Currently, flag loading logic is duplicated and inconsistent across checks, making it difficult to maintain and extend. This must be done before touching individual checks to avoid double refactors.

### **Files to Create/Modify**
- `tools/prove/checks/shared/flag-registry.ts` - New unified registry system
- `tools/prove/checks/shared/index.ts` - Export shared utilities

### **Unified Flag Registry**
```typescript
export class UnifiedFlagRegistry {
  private runtimeFlags: Record<string, unknown> = {};
  private frontendFlags: Record<string, unknown> = {};
  private backendFlags: Record<string, unknown> = {};

  static async loadAllFlags(workingDirectory: string): Promise<UnifiedFlagRegistry> {
    // Load from all sources in parallel
  }

  isRegistered(flagName: string): boolean {
    // Check if flag exists in any registry
  }

  getFlagMetadata(flagName: string): FlagMetadata | null {
    // Get complete metadata for flag
  }

  validateFlags(flags: string[]): ValidationResult {
    // Validate flag registration and metadata
  }

  async getRegistryMetrics(): Promise<RegistryMetrics> {
    // Return telemetry data for monitoring
  }
}
```

### **Testing & Validation**
```bash
# Test flag loading from all sources
# Verify runtime, frontend, and backend flags are loaded
# Test with missing flag files

# Test flag validation
# Test with valid and invalid flags
# Verify metadata validation works correctly

# Test performance
# Load flags multiple times
# Verify caching works correctly
```

### **Acceptance Criteria**
- [ ] Loads flags from all sources (runtime, frontend, backend)
- [ ] Provides unified interface for flag operations
- [ ] Validates flag registration and metadata
- [ ] Handles missing flag files gracefully
- [ ] Performance is acceptable for prove system
- [ ] Telemetry data is collected and accessible

---

## **🎯 Task 3: Re-enable Feature Flag Lint Check**

### **Overview**
Re-enable the feature flag lint check in the prove runner using the new shared utilities.

### **Goal**
Make the feature flag lint check active again so it validates flag registration and metadata across the codebase.

### **Why**
The feature flag lint check provides valuable validation for flag registration and metadata that complements the kill-switch check. Now that we have shared utilities, we can re-enable it safely.

### **Files to Create/Modify**
- `tools/prove/runner.ts` - Uncomment import and add to parallel checks
- `tools/prove/checks/feature-flag-lint.ts` - Refactor to use shared utilities
- `docs/prove.md/prove_enforcement_8_paths/prove-overview.md` - Update check catalogue
- `docs/prove.md/prove_enforcement_8_paths/tasks.md` - Update tiny-steps plan

### **Refactoring to Use Shared Utilities**
```typescript
import { FeatureFlagDetector } from './shared/feature-flag-detector.js';
import { UnifiedFlagRegistry } from './shared/flag-registry.js';

export async function checkFeatureFlagLint(context: ProveContext): Promise<FeatureFlagLintResult> {
  // Use shared detector instead of custom logic
  const flagUsages = await FeatureFlagDetector.detectPatterns(changedFiles, [
    FeatureFlagDetector.PATTERNS.useFeatureFlag,
    FeatureFlagDetector.PATTERNS.isEnabled,
    FeatureFlagDetector.PATTERNS.isFeatureEnabled
  ]);

  // Use unified registry instead of custom loading
  const registry = await UnifiedFlagRegistry.loadAllFlags(workingDirectory);
  
  // Rest of validation logic...
}
```

### **Testing & Validation**
```bash
# Test that feature flag lint runs
npm run prove:quick

# Verify it passes with current codebase
npm run prove

# Test with invalid flag usage (should fail)
# Add unregistered flag to test file, run prove, verify failure

# Test with valid flag usage (should pass)
# Ensure all current flags are properly registered

# Test performance with telemetry
# Monitor prove-report.json for metrics
```

### **Acceptance Criteria**
- [ ] Feature flag lint check runs in prove:quick mode
- [ ] Feature flag lint check runs in full prove mode
- [ ] Check passes with current codebase (no unregistered flags)
- [ ] Check fails appropriately when unregistered flags are used
- [ ] No performance degradation in prove system
- [ ] Uses shared utilities instead of custom logic
- [ ] Telemetry data is collected and accessible

---

## **🎯 Task 4: Enhance Kill-Switch Pattern Recognition**

### **Overview**
Expand the kill-switch check to detect more safety mechanisms and feature flag patterns using the shared utilities.

### **Goal**
Catch more kill-switch implementations to ensure comprehensive safety coverage for feature commits.

### **Why**
Current kill-switch check misses important patterns like `useFeatureFlag()`, `isFeatureEnabled()`, and environment variable flags, potentially allowing unsafe feature commits.

### **Files to Create/Modify**
- `tools/prove/checks/killswitch-required.ts` - Refactor to use shared utilities and add enhanced patterns

### **Enhanced Patterns Using Shared Detector**
```typescript
import { FeatureFlagDetector } from './shared/feature-flag-detector.js';

const enhancedKillSwitchPatterns = [
  // Existing patterns...
  FeatureFlagDetector.PATTERNS.isEnabled,
  FeatureFlagDetector.PATTERNS.killSwitch,
  
  // New patterns using shared detector:
  FeatureFlagDetector.PATTERNS.useFeatureFlag,
  FeatureFlagDetector.PATTERNS.isFeatureEnabled,
  FeatureFlagDetector.PATTERNS.envVar,
  FeatureFlagDetector.PATTERNS.config,
  FeatureFlagDetector.PATTERNS.import,
  FeatureFlagDetector.PATTERNS.rollout
];
```

### **Testing & Validation**
```bash
# Test with existing feature commits (should pass)
git log --oneline --grep="feat:" -5

# Test with new patterns
# Create test file with useFeatureFlag() pattern
# Create feature commit, verify kill-switch detects it

# Test pattern detection accuracy
# Create files with various flag patterns
# Verify all patterns are detected correctly

# Test performance with telemetry
# Monitor prove-report.json for metrics
```

### **Acceptance Criteria**
- [ ] Detects `useFeatureFlag()` patterns
- [ ] Detects `isFeatureEnabled()` patterns  
- [ ] Detects environment variable flags (`process.env.FEATURE_*`)
- [ ] Detects config-based flags (`config.features.*`)
- [ ] Detects flag imports (`import ... from ...flags`)
- [ ] Maintains detection of existing patterns
- [ ] No false positives on non-flag code
- [ ] Uses shared utilities instead of custom logic
- [ ] Telemetry data is collected and accessible

---

## **🎯 Task 5: Add Flag Registration Validation to Kill-Switch**

### **Overview**
Integrate flag registration validation into the kill-switch check to ensure detected flags are properly registered in the flag registry.

### **Goal**
Prevent feature commits from using unregistered flags as kill-switches, ensuring all safety mechanisms are properly defined.

### **Why**
Currently, kill-switch check only verifies presence of flag patterns but doesn't validate that those flags are registered. This could allow commits with invalid flags to pass.

### **Files to Create/Modify**
- `tools/prove/checks/killswitch-required.ts` - Add flag registration validation using shared utilities

### **Implementation Using Shared Utilities**
```typescript
import { UnifiedFlagRegistry } from './shared/flag-registry.js';

// After detecting kill-switch patterns:
const registry = await UnifiedFlagRegistry.loadAllFlags(workingDirectory);
const unregisteredFlags = foundKillSwitches.filter(flag => 
  !registry.isRegistered(flag)
);

if (unregisteredFlags.length > 0) {
  return {
    ok: false,
    reason: `Kill-switch flags not registered: ${unregisteredFlags.join(', ')}. Add to flag registry first.`
  };
}
```

### **Testing & Validation**
```bash
# Test with registered flags (should pass)
# Use existing flags in feature commit

# Test with unregistered flags (should fail)
# Create feature commit with unregistered flag
# Verify kill-switch check fails with clear message

# Test flag registry loading
# Verify all flag sources are loaded correctly
# Test with missing flag files (should handle gracefully)

# Test performance with telemetry
# Monitor prove-report.json for metrics
```

### **Acceptance Criteria**
- [ ] Validates kill-switch flags are registered
- [ ] Loads flags from all sources (runtime, frontend, backend)
- [ ] Provides clear error message for unregistered flags
- [ ] Handles missing flag files gracefully
- [ ] Maintains existing kill-switch functionality
- [ ] No performance impact on prove system
- [ ] Uses shared utilities instead of custom logic
- [ ] Telemetry data is collected and accessible

---

## **🎯 Task 6: Improve Error Messages and Developer Experience**

### **Overview**
Enhance error messages in both checks to provide specific, actionable guidance for developers on how to fix issues.

### **Goal**
Make it easy for developers to understand what's wrong and how to fix it when checks fail.

### **Why**
Current error messages are generic and don't provide specific guidance, making it difficult for developers to quickly resolve issues.

### **Files to Create/Modify**
- `tools/prove/checks/shared/error-messages.ts` - New shared error message utilities
- `tools/prove/checks/killswitch-required.ts` - Use shared error messages
- `tools/prove/checks/feature-flag-lint.ts` - Use shared error messages

### **Enhanced Error Messages**
```typescript
export class ErrorMessageBuilder {
  static buildKillSwitchError(patterns: string[], suggestions: string[]): string {
    return `Feature commit requires kill switch. Add one of:\n${suggestions.map(s => `- ${s}`).join('\n')}`;
  }

  static buildFlagLintError(unregistered: string[], missingOwner: string[], missingExpiry: string[]): string {
    const errors = [];
    if (unregistered.length > 0) errors.push(`Unregistered flags: ${unregistered.join(', ')}`);
    if (missingOwner.length > 0) errors.push(`Flags missing owner: ${missingOwner.join(', ')}`);
    if (missingExpiry.length > 0) errors.push(`Flags missing expiry: ${missingExpiry.join(', ')}`);
    return errors.join('; ');
  }

  static getSuggestions(pattern: string): string[] {
    const suggestions = {
      'useFeatureFlag': 'const { isEnabled } = useFeatureFlag("FLAG_NAME");',
      'isEnabled': 'if (isEnabled("FLAG_NAME")) { ... }',
      'envVar': 'process.env.FEATURE_NAME === "true"',
      'killSwitch': 'KILL_SWITCH_FEATURE_NAME constant',
      'config': 'config.features.featureName'
    };
    return suggestions[pattern] ? [suggestions[pattern]] : [];
  }
}
```

### **Testing & Validation**
```bash
# Test error message clarity
# Create various failure scenarios
# Verify error messages are specific and actionable

# Test suggestion accuracy
# Verify suggestions match detected patterns
# Test with different flag usage patterns

# Test developer workflow
# Follow error message guidance
# Verify fixes resolve the issues
```

### **Acceptance Criteria**
- [ ] Error messages are specific and actionable
- [ ] Suggestions match detected patterns
- [ ] Messages include file locations and line numbers
- [ ] Guidance is easy to follow and implement
- [ ] Error messages are consistent across checks
- [ ] No technical jargon in user-facing messages
- [ ] Uses shared utilities for consistency

---

## **🎯 Task 7: Add Rollout Validation**

### **Overview**
Add validation for gradual rollout configuration to ensure feature flags are properly configured for safe deployment.

### **Goal**
Ensure feature flags have proper rollout configuration for safe, gradual feature deployment.

### **Why**
Feature flags without proper rollout configuration can cause issues during deployment and make it difficult to safely roll out features.

### **Files to Create/Modify**
- `tools/prove/checks/shared/rollout-validator.ts` - New rollout validation utility
- `tools/prove/checks/feature-flag-lint.ts` - Add rollout validation
- `tools/prove/checks/killswitch-required.ts` - Add rollout validation

### **Rollout Validation**
```typescript
export class RolloutValidator {
  static validateRolloutConfig(flagDef: FlagDefinition): RolloutValidationResult {
    return {
      hasRolloutPercentage: /rolloutPercentage\s*:\s*\d+/.test(flagDef.content),
      hasEnvironmentConfig: /environments\s*:\s*\[/.test(flagDef.content),
      hasDefaultValue: /default\s*:\s*(true|false)/.test(flagDef.content),
      hasDescription: /description\s*:\s*['"`]/.test(flagDef.content)
    };
  }

  static validateGradualRollout(flags: string[]): GradualRolloutResult {
    // Validate that flags support gradual rollout
  }

  async getValidationMetrics(): Promise<RolloutMetrics> {
    // Return telemetry data for monitoring
  }
}
```

### **Testing & Validation**
```bash
# Test rollout validation
# Create flags with various rollout configurations
# Verify validation catches missing configurations

# Test gradual rollout validation
# Test with flags that support gradual rollout
# Test with flags that don't support gradual rollout

# Test integration with existing checks
# Verify rollout validation doesn't break existing functionality
```

### **Acceptance Criteria**
- [ ] Validates rollout percentage configuration
- [ ] Validates environment configuration
- [ ] Validates default value configuration
- [ ] Validates description presence
- [ ] Integrates with existing checks
- [ ] Provides clear error messages for missing configuration
- [ ] Telemetry data is collected and accessible

---

## **🎯 Task 8: Add Configuration and Documentation Updates**

### **Overview**
Update prove system configuration and documentation to reflect the new shared utilities and enhanced checks.

### **Goal**
Keep the canonical contract in sync with implementation changes and provide configuration options for new features.

### **Why**
The prove system documentation serves as source-of-truth checklists and must be updated whenever the runner changes to maintain consistency.

### **Files to Create/Modify**
- `tools/prove/prove.config.ts` - Add toggle guidance for new slow paths
- `docs/prove.md/prove_enforcement_8_paths/prove-overview.md` - Update check catalogue
- `docs/prove.md/prove_enforcement_8_paths/tasks.md` - Update tiny-steps plan
- `docs/prove.md/prove_enforcement_8_paths/architecture.md` - Update architecture documentation

### **Configuration Updates**
```typescript
// Add to prove.config.ts
export const proveConfig = {
  // ... existing config
  featureFlags: {
    enableTelemetry: true,
    enableRolloutValidation: true,
    enableSharedDetection: true,
    registryCacheTimeout: 30000, // 30 seconds
    detectionTimeout: 10000, // 10 seconds
  },
  killSwitch: {
    enableRegistrationValidation: true,
    enableEnhancedPatterns: true,
    enableSharedDetection: true
  }
};
```

### **Documentation Updates**
- Update check catalogue in prove-overview.md
- Update tiny-steps plan in tasks.md
- Update architecture documentation
- Add configuration guidance
- Add troubleshooting section

### **Testing & Validation**
```bash
# Test configuration options
# Verify toggles work correctly
# Test with different configuration values

# Test documentation accuracy
# Verify all changes are documented
# Test that documentation matches implementation

# Test prove system integration
# Run prove with new configuration
# Verify all checks work correctly
```

### **Acceptance Criteria**
- [ ] Configuration options are added for new features
- [ ] Documentation is updated to reflect changes
- [ ] Check catalogue is accurate and complete
- [ ] Tiny-steps plan is updated
- [ ] Architecture documentation is current
- [ ] Configuration guidance is clear and helpful
- [ ] All changes are properly documented

---

## **📊 Delivery Timeline**

### **Phase 1: Foundation (Week 1)**
- Task 0: Investigate Feature Flag Lint Disablement
- Task 1: Create Shared Pattern Detection Engine
- Task 2: Implement Unified Flag Registry System

### **Phase 2: Re-enable and Enhance (Week 2)**
- Task 3: Re-enable Feature Flag Lint Check
- Task 4: Enhance Kill-Switch Pattern Recognition
- Task 5: Add Flag Registration Validation to Kill-Switch

### **Phase 3: Polish and Document (Week 3)**
- Task 6: Improve Error Messages and Developer Experience
- Task 7: Add Rollout Validation
- Task 8: Add Configuration and Documentation Updates

## **🎯 Success Metrics**

### **Functional Metrics**
- [ ] Prove check maintains 100% pass rate
- [ ] Feature flag lint check is active and working
- [ ] Kill-switch check detects 100% of safety mechanisms
- [ ] Flag registration validation prevents unregistered flag usage
- [ ] Error messages are actionable and clear

### **Performance Metrics**
- [ ] No performance regression in prove system
- [ ] Pattern detection is faster through shared engine
- [ ] Flag registry loading is optimized
- [ ] Telemetry data is collected and accessible

### **Quality Metrics**
- [ ] Code duplication is eliminated
- [ ] Shared utilities are well-tested
- [ ] Error handling is robust
- [ ] Documentation is comprehensive
- [ ] Developer experience is improved

## **🚀 Next Steps**

1. **Review and approve** this delivery proposal
2. **Prioritize tasks** based on business needs
3. **Assign resources** and set timeline
4. **Begin implementation** with Phase 1 tasks
5. **Monitor progress** and adjust as needed

This delivery proposal provides a comprehensive roadmap for optimizing the feature flag and kill-switch system while maintaining prove check stability and improving developer experience.