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
