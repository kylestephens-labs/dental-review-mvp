// Shared utilities for prove checks
// Exports common detection engines and utilities to reduce duplication

export { FeatureFlagDetector } from './feature-flag-detector.js';
export type { 
  DetectionMetrics, 
  PatternDetectionResult 
} from './feature-flag-detector.js';

export { UnifiedFlagRegistry } from './flag-registry.js';
export type { 
  FlagMetadata, 
  ValidationResult, 
  RegistryMetrics 
} from './flag-registry.js';

export { ErrorMessageBuilder, ErrorMessageUtils } from './error-messages.js';
export type { ErrorContext } from './error-messages.js';

export { RolloutValidator } from './rollout-validator.js';
export type { 
  FlagDefinition, 
  RolloutValidationResult, 
  GradualRolloutResult, 
  RolloutMetrics 
} from './rollout-validator.js';
