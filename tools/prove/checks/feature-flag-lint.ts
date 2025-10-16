// Feature flag lint check - validates flag registration and metadata
// Refactored to use shared utilities for better maintainability

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { FeatureFlagDetector } from './shared/feature-flag-detector.js';
import { UnifiedFlagRegistry } from './shared/flag-registry.js';
import { ErrorMessageBuilder, ErrorMessageUtils, type ErrorContext } from './shared/error-messages.js';
import { RolloutValidator, type FlagDefinition, type RolloutValidationResult } from './shared/rollout-validator.js';
import { ErrorHandler, ErrorType, ErrorSeverity, type ErrorDetails } from './shared/error-handler.js';

export interface FeatureFlagLintResult {
  ok: boolean;
  reason?: string;
  details?: {
    unregisteredFlags: string[];
    missingOwnerFlags: string[];
    missingExpiryFlags: string[];
    rolloutValidationErrors: string[];
    rolloutValidationWarnings: string[];
    totalFlags: number;
    registeredFlags: number;
    rolloutValidFlags: number;
    rolloutInvalidFlags: number;
    telemetry: {
      filesProcessed: number;
      filesSkipped: number;
      detectionDuration: number;
      patternMatchCount: number;
      errorCount: number;
      memoryUsage: number;
      rolloutValidationDuration: number;
      performanceMetrics: {
        ripgrepDuration?: number;
        alternativeMethodDuration?: number;
        flagLoadingDuration: number;
        validationDuration: number;
      };
      errorHandling: {
        totalErrors: number;
        errorsByType: Record<string, number>;
        errorsBySeverity: Record<string, number>;
        recoveryAttempts: number;
        recoverySuccesses: number;
      };
    };
  };
}

/**
 * Lint feature flag usage to ensure all flags are properly registered
 * @param context - Prove context
 * @returns Promise<FeatureFlagLintResult> - Check result
 */
export async function checkFeatureFlagLint(context: ProveContext): Promise<FeatureFlagLintResult> {
  logger.info('Checking feature flag usage and registration...');

  const { workingDirectory } = context;
  const startTime = Date.now();
  const memoryStart = process.memoryUsage();
  let errorStatistics = {
    totalErrors: 0,
    errorsByType: {} as Record<string, number>,
    errorsBySeverity: {} as Record<string, number>,
    recoveryAttempts: 0,
    recoverySuccesses: 0
  };

  try {
    // Use shared detector to find feature flag usages with error handling
    const detectionResult = await performDetectionWithErrorHandling(workingDirectory, errorStatistics);
    const flagUsages = detectionResult.flagUsages;
    const flagNames = detectionResult.flagNames;
    
    if (flagUsages.length === 0) {
      logger.info('No feature flag usages found');
      return {
        ok: true,
        details: {
          unregisteredFlags: [],
          missingOwnerFlags: [],
          missingExpiryFlags: [],
          totalFlags: 0,
          registeredFlags: 0,
          telemetry: {
            filesProcessed: detectionResult.metrics.filesProcessed,
            filesSkipped: detectionResult.metrics.filesSkipped,
            detectionDuration: detectionResult.metrics.detectionDuration,
            patternMatchCount: detectionResult.metrics.patternMatchCount,
            errorCount: detectionResult.metrics.errorCount,
            memoryUsage: detectionResult.metrics.memoryUsage,
            performanceMetrics: {
              flagLoadingDuration: 0,
              validationDuration: 0,
              ...detectionResult.metrics.performanceMetrics
            }
          }
        }
      };
    }

    logger.info(`Found ${flagUsages.length} feature flag usages: ${flagNames.join(', ')}`);

    // Use unified registry to load all flags with error handling
    const flagLoadingStart = Date.now();
    const registry = await performRegistryLoadingWithErrorHandling(workingDirectory, errorStatistics);
    const allFlags = registry.getAllFlags();
    const flagLoadingDuration = Date.now() - flagLoadingStart;

    logger.info(`Loaded ${Object.keys(allFlags).length} registered flags from all sources`);

    // Use unified validation to check flags with timing
    const validationStart = Date.now();
    const validationResult = registry.validateFlags(flagNames);
    const validationDuration = Date.now() - validationStart;

    // Add rollout validation with error handling
    const rolloutValidation = await performRolloutValidationWithErrorHandling(flagUsages, errorStatistics);
    
    if (!validationResult.isValid) {
      const unregisteredFlags = validationResult.missingFlags;
      const missingOwnerFlags: string[] = [];
      const missingExpiryFlags: string[] = [];

      // Categorize validation errors
      for (const error of validationResult.errors) {
        if (error.includes('missing required \'owner\'')) {
          const flagName = error.match(/Flag '([^']+)'/)?.[1];
          if (flagName) missingOwnerFlags.push(flagName);
        }
        if (error.includes('missing required \'expiry\'')) {
          const flagName = error.match(/Flag '([^']+)'/)?.[1];
          if (flagName) missingExpiryFlags.push(flagName);
        }
      }

      // Build enhanced error message with specific guidance
      const errorContext: ErrorContext = {
        unregisteredFlags: unregisteredFlags,
        missingOwner: missingOwnerFlags,
        missingExpiry: missingExpiryFlags,
        filePath: flagUsages[0]?.filePath // Show first file as example
      };
      
      let reason = ErrorMessageBuilder.buildFlagLintError(errorContext);
      
      // Add rollout validation errors if any
      if (rolloutValidation.rolloutValidationErrors.length > 0) {
        reason += `\n\n🚨 Rollout Validation Errors:\n${rolloutValidation.rolloutValidationErrors.map(error => `  • ${error}`).join('\n')}`;
      }
      
      if (rolloutValidation.rolloutValidationWarnings.length > 0) {
        reason += `\n\n⚠️ Rollout Validation Warnings:\n${rolloutValidation.rolloutValidationWarnings.map(warning => `  • ${warning}`).join('\n')}`;
      }
      
      logger.error('Feature flag lint check failed', {
        unregisteredFlags,
        missingOwnerFlags,
        missingExpiryFlags,
        totalFlags: flagUsages.length,
        registeredFlags: Object.keys(allFlags).length,
        validationErrors: validationResult.errors
      });

      return {
        ok: false,
        reason,
        details: {
          unregisteredFlags,
          missingOwnerFlags,
          missingExpiryFlags,
          rolloutValidationErrors: rolloutValidation.rolloutValidationErrors,
          rolloutValidationWarnings: rolloutValidation.rolloutValidationWarnings,
          totalFlags: flagUsages.length,
          registeredFlags: Object.keys(allFlags).length,
          rolloutValidFlags: rolloutValidation.rolloutValidFlags,
          rolloutInvalidFlags: rolloutValidation.rolloutInvalidFlags,
          telemetry: {
            filesProcessed: detectionResult.metrics.filesProcessed,
            filesSkipped: detectionResult.metrics.filesSkipped,
            detectionDuration: Date.now() - startTime,
            patternMatchCount: detectionResult.metrics.patternMatchCount,
            errorCount: detectionResult.metrics.errorCount + validationResult.errors.length,
            memoryUsage: process.memoryUsage().heapUsed - memoryStart.heapUsed,
            rolloutValidationDuration: rolloutValidation.rolloutValidationDuration,
            performanceMetrics: {
              flagLoadingDuration: flagLoadingDuration,
              validationDuration: validationDuration,
              ...detectionResult.metrics.performanceMetrics
            },
            errorHandling: errorStatistics
          }
        }
      };
    }

    // Log warnings if any
    if (validationResult.warnings.length > 0) {
      logger.warn('Feature flag warnings found', {
        warnings: validationResult.warnings
      });
    }

    logger.success('Feature flag lint check passed', {
      message: 'All feature flags are properly registered with required metadata',
      totalFlags: flagUsages.length,
      registeredFlags: Object.keys(allFlags).length,
      warnings: validationResult.warnings.length
    });

    return {
      ok: true,
      details: {
        unregisteredFlags: [],
        missingOwnerFlags: [],
        missingExpiryFlags: [],
        rolloutValidationErrors: rolloutValidation.rolloutValidationErrors,
        rolloutValidationWarnings: rolloutValidation.rolloutValidationWarnings,
        totalFlags: flagUsages.length,
        registeredFlags: Object.keys(allFlags).length,
        rolloutValidFlags: rolloutValidation.rolloutValidFlags,
        rolloutInvalidFlags: rolloutValidation.rolloutInvalidFlags,
        telemetry: {
          filesProcessed: detectionResult.metrics.filesProcessed,
          filesSkipped: detectionResult.metrics.filesSkipped,
          detectionDuration: Date.now() - startTime,
          patternMatchCount: detectionResult.metrics.patternMatchCount,
          errorCount: detectionResult.metrics.errorCount,
          memoryUsage: process.memoryUsage().heapUsed - memoryStart.heapUsed,
          rolloutValidationDuration: rolloutValidation.rolloutValidationDuration,
          performanceMetrics: {
            flagLoadingDuration: flagLoadingDuration,
            validationDuration: validationDuration,
            ...detectionResult.metrics.performanceMetrics
          },
          errorHandling: errorStatistics
        }
      }
    };

  } catch (error) {
    const errorDetails = ErrorHandler.handleError(
      error,
      { workingDirectory, operation: 'feature-flag-lint' },
      'lint-check'
    );
    
    errorStatistics.totalErrors++;
    errorStatistics.errorsByType[errorDetails.type] = (errorStatistics.errorsByType[errorDetails.type] || 0) + 1;
    errorStatistics.errorsBySeverity[errorDetails.severity] = (errorStatistics.errorsBySeverity[errorDetails.severity] || 0) + 1;
    
    const errorContext: ErrorContext = {
      filePath: errorDetails.context.filePath || 'unknown',
      workingDirectory: errorDetails.context.workingDirectory
    };
    
    const reason = ErrorMessageBuilder.buildGenericError(
      `Feature flag lint check failed: ${errorDetails.message}`,
      errorContext
    );
    
    logger.error('Feature flag lint check failed with error', {
      error: reason,
      errorType: errorDetails.type,
      severity: errorDetails.severity,
      suggestions: errorDetails.suggestions.slice(0, 3)
    });

    return {
      ok: false,
      reason,
      details: {
        unregisteredFlags: [],
        missingOwnerFlags: [],
        missingExpiryFlags: [],
        rolloutValidationErrors: [],
        rolloutValidationWarnings: [],
        totalFlags: 0,
        registeredFlags: 0,
        rolloutValidFlags: 0,
        rolloutInvalidFlags: 0,
        telemetry: {
          filesProcessed: 0,
          filesSkipped: 0,
          detectionDuration: 0,
          patternMatchCount: 0,
          errorCount: 1,
          memoryUsage: 0,
          rolloutValidationDuration: 0,
          performanceMetrics: {
            flagLoadingDuration: 0,
            validationDuration: 0
          },
          errorHandling: errorStatistics
        }
      }
    };
  }
}

/**
 * Perform detection with comprehensive error handling
 */
async function performDetectionWithErrorHandling(
  workingDirectory: string,
  errorStatistics: any
): Promise<{ flagUsages: any[]; flagNames: string[]; metrics: any }> {
  try {
    return await FeatureFlagDetector.detectFeatureFlagUsage(workingDirectory);
  } catch (error) {
    const errorDetails = ErrorHandler.handleError(
      error,
      { workingDirectory, operation: 'feature-flag-detection' },
      'detection'
    );
    
    errorStatistics.totalErrors++;
    errorStatistics.errorsByType[errorDetails.type] = (errorStatistics.errorsByType[errorDetails.type] || 0) + 1;
    errorStatistics.errorsBySeverity[errorDetails.severity] = (errorStatistics.errorsBySeverity[errorDetails.severity] || 0) + 1;
    
    // Attempt recovery
    const recoveryResult = await ErrorHandler.attemptRecovery(errorDetails);
    errorStatistics.recoveryAttempts++;
    if (recoveryResult.success) {
      errorStatistics.recoverySuccesses++;
    }
    
    // Return empty result if recovery fails
    return {
      flagUsages: [],
      flagNames: [],
      metrics: {
        filesProcessed: 0,
        filesSkipped: 0,
        detectionDuration: 0,
        patternMatchCount: 0,
        errorCount: 1,
        memoryUsage: 0,
        performanceMetrics: {}
      }
    };
  }
}

/**
 * Perform registry loading with error handling
 */
async function performRegistryLoadingWithErrorHandling(
  workingDirectory: string,
  errorStatistics: any
): Promise<UnifiedFlagRegistry> {
  try {
    return await UnifiedFlagRegistry.loadAllFlags(workingDirectory);
  } catch (error) {
    const errorDetails = ErrorHandler.handleError(
      error,
      { workingDirectory, operation: 'flag-registry-loading' },
      'registry'
    );
    
    errorStatistics.totalErrors++;
    errorStatistics.errorsByType[errorDetails.type] = (errorStatistics.errorsByType[errorDetails.type] || 0) + 1;
    errorStatistics.errorsBySeverity[errorDetails.severity] = (errorStatistics.errorsBySeverity[errorDetails.severity] || 0) + 1;
    
    // Attempt recovery
    const recoveryResult = await ErrorHandler.attemptRecovery(errorDetails);
    errorStatistics.recoveryAttempts++;
    if (recoveryResult.success) {
      errorStatistics.recoverySuccesses++;
    }
    
    throw error; // Re-throw if recovery fails
  }
}

/**
 * Perform rollout validation with error handling
 */
async function performRolloutValidationWithErrorHandling(
  flagUsages: any[],
  errorStatistics: any
): Promise<{
  rolloutValidationErrors: string[];
  rolloutValidationWarnings: string[];
  rolloutValidFlags: number;
  rolloutInvalidFlags: number;
  rolloutValidationDuration: number;
}> {
  const rolloutValidationStart = Date.now();
  const rolloutValidationErrors: string[] = [];
  const rolloutValidationWarnings: string[] = [];
  let rolloutValidFlags = 0;
  let rolloutInvalidFlags = 0;

  for (const flagUsage of flagUsages) {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(flagUsage.filePath, 'utf-8');
      const flagDefinitions = RolloutValidator.extractFlagDefinitions(content, flagUsage.filePath);
      
      for (const flagDef of flagDefinitions) {
        const rolloutValidation = RolloutValidator.validateRolloutConfig(flagDef);
        
        if (rolloutValidation.isValid) {
          rolloutValidFlags++;
        } else {
          rolloutInvalidFlags++;
          rolloutValidationErrors.push(...rolloutValidation.errors.map(error => 
            `${flagDef.name}: ${error}`
          ));
        }
        
        rolloutValidationWarnings.push(...rolloutValidation.warnings.map(warning => 
          `${flagDef.name}: ${warning}`
        ));
      }
    } catch (error) {
      const errorDetails = ErrorHandler.handleError(
        error,
        { filePath: flagUsage.filePath, operation: 'rollout-validation' },
        'rollout'
      );
      
      errorStatistics.totalErrors++;
      errorStatistics.errorsByType[errorDetails.type] = (errorStatistics.errorsByType[errorDetails.type] || 0) + 1;
      errorStatistics.errorsBySeverity[errorDetails.severity] = (errorStatistics.errorsBySeverity[errorDetails.severity] || 0) + 1;
      
      // Add error to validation errors
      rolloutValidationErrors.push(`Failed to validate ${flagUsage.filePath}: ${errorDetails.message}`);
    }
  }

  const rolloutValidationDuration = Date.now() - rolloutValidationStart;
  
  return {
    rolloutValidationErrors,
    rolloutValidationWarnings,
    rolloutValidFlags,
    rolloutInvalidFlags,
    rolloutValidationDuration
  };
}