// Feature flag lint check - validates flag registration and metadata
// Refactored to use shared utilities for better maintainability

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { FeatureFlagDetector } from './shared/feature-flag-detector.js';
import { UnifiedFlagRegistry } from './shared/flag-registry.js';
import { ErrorMessageBuilder, ErrorMessageUtils, type ErrorContext } from './shared/error-messages.js';

export interface FeatureFlagLintResult {
  ok: boolean;
  reason?: string;
  details?: {
    unregisteredFlags: string[];
    missingOwnerFlags: string[];
    missingExpiryFlags: string[];
    totalFlags: number;
    registeredFlags: number;
    telemetry: {
      filesProcessed: number;
      filesSkipped: number;
      detectionDuration: number;
      patternMatchCount: number;
      errorCount: number;
      memoryUsage: number;
      performanceMetrics: {
        ripgrepDuration?: number;
        alternativeMethodDuration?: number;
        flagLoadingDuration: number;
        validationDuration: number;
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

  try {
    const { workingDirectory } = context;
    const startTime = Date.now();
    const memoryStart = process.memoryUsage();
    
    // Use shared detector to find feature flag usages
    const detectionResult = await FeatureFlagDetector.detectFeatureFlagUsage(workingDirectory);
    const flagUsages = detectionResult.flagNames;
    
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

    logger.info(`Found ${flagUsages.length} feature flag usages: ${flagUsages.join(', ')}`);

    // Use unified registry to load all flags with timing
    const flagLoadingStart = Date.now();
    const registry = await UnifiedFlagRegistry.loadAllFlags(workingDirectory);
    const allFlags = registry.getAllFlags();
    const flagLoadingDuration = Date.now() - flagLoadingStart;

    logger.info(`Loaded ${Object.keys(allFlags).length} registered flags from all sources`);

    // Use unified validation to check flags with timing
    const validationStart = Date.now();
    const validationResult = registry.validateFlags(flagUsages);
    const validationDuration = Date.now() - validationStart;
    
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
      
      const reason = ErrorMessageBuilder.buildFlagLintError(errorContext);
      
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
          totalFlags: flagUsages.length,
          registeredFlags: Object.keys(allFlags).length,
          telemetry: {
            filesProcessed: detectionResult.metrics.filesProcessed,
            filesSkipped: detectionResult.metrics.filesSkipped,
            detectionDuration: Date.now() - startTime,
            patternMatchCount: detectionResult.metrics.patternMatchCount,
            errorCount: detectionResult.metrics.errorCount + validationResult.errors.length,
            memoryUsage: process.memoryUsage().heapUsed - memoryStart.heapUsed,
            performanceMetrics: {
              flagLoadingDuration: flagLoadingDuration,
              validationDuration: validationDuration,
              ...detectionResult.metrics.performanceMetrics
            }
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
        totalFlags: flagUsages.length,
        registeredFlags: Object.keys(allFlags).length,
        telemetry: {
          filesProcessed: detectionResult.metrics.filesProcessed,
          filesSkipped: detectionResult.metrics.filesSkipped,
          detectionDuration: Date.now() - startTime,
          patternMatchCount: detectionResult.metrics.patternMatchCount,
          errorCount: detectionResult.metrics.errorCount,
          memoryUsage: process.memoryUsage().heapUsed - memoryStart.heapUsed,
          performanceMetrics: {
            flagLoadingDuration: flagLoadingDuration,
            validationDuration: validationDuration,
            ...detectionResult.metrics.performanceMetrics
          }
        }
      }
    };

  } catch (error) {
    const errorContext: ErrorContext = {
      filePath: 'unknown'
    };
    
    const reason = ErrorMessageBuilder.buildGenericError(
      `Feature flag lint check failed: ${error instanceof Error ? error.message : String(error)}`,
      errorContext
    );
    
    logger.error('Feature flag lint check failed with error', {
      error: reason
    });

    return {
      ok: false,
      reason,
      details: {
        unregisteredFlags: [],
        missingOwnerFlags: [],
        missingExpiryFlags: [],
        totalFlags: 0,
        registeredFlags: 0,
        telemetry: {
          filesProcessed: 0,
          filesSkipped: 0,
          detectionDuration: 0,
          patternMatchCount: 0,
          errorCount: 1,
          memoryUsage: 0,
          performanceMetrics: {
            flagLoadingDuration: 0,
            validationDuration: 0
          }
        }
      }
    };
  }
}