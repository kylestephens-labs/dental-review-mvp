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

export { FalsePositiveAnalyzer } from './false-positive-analyzer.js';
export type { 
  FalsePositiveAnalysis, 
  PatternAnalysis, 
  FalsePositiveContext 
} from './false-positive-analyzer.js';

export { ValidationOptimizer } from './validation-optimizer.js';
export type { 
  ValidationOptimizationMetrics, 
  OptimizedFlagExtraction, 
  ValidationOptimizationConfig 
} from './validation-optimizer.js';

export { ErrorContextEnhancer } from './error-context-enhancer.js';
export type { 
  EnhancedErrorContext, 
  CodeSnippet, 
  QuickFix, 
  DocumentationLink, 
  TroubleshootingStep, 
  ErrorEnhancementMetrics 
} from './error-context-enhancer.js';

export { RolloutCache } from './rollout-cache.js';
export type { 
  CachedValidationResult, 
  CachedGradualRolloutResult, 
  CachedMetrics, 
  CachedFlagDefinition, 
  CacheStats, 
  CacheConfig 
} from './rollout-cache.js';
