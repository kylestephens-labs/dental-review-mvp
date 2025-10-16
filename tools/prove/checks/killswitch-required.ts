import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';
import { FeatureFlagDetector, UnifiedFlagRegistry, ErrorMessageBuilder, ErrorMessageUtils, type ErrorContext, RolloutValidator, type FlagDefinition } from './shared/index.js';

export interface KillswitchRequiredResult {
  ok: boolean;
  reason?: string;
  details?: {
    isFeatureCommit: boolean;
    touchesProductionCode: boolean;
    hasKillSwitch: boolean;
    changedFiles: string[];
    killSwitchPatterns: string[];
    detectedPatterns: string[];
    registeredFlags: string[];
    unregisteredFlags: string[];
    rolloutValidationErrors: string[];
    rolloutValidationWarnings: string[];
    rolloutValidFlags: number;
    rolloutInvalidFlags: number;
    metrics?: {
      detectionDuration: number;
      patternMatchCount: number;
      filesProcessed: number;
      rolloutValidationDuration: number;
    };
  };
}

/**
 * Check if feature commits require kill switches using enhanced pattern detection
 * @param context - Prove context
 * @returns Promise<KillswitchRequiredResult> - Check result
 */
export async function checkKillswitchRequired(context: ProveContext): Promise<KillswitchRequiredResult> {
  logger.info('Checking kill-switch requirements for feature commits...');

  try {
    const { workingDirectory } = context;
    
    // Get files changed using the proper base reference from context
    const { git: { baseRef } } = context;
    
    // Handle edge case: if this is the first commit (no HEAD~1), check against empty tree
    let changedFilesResult;
    try {
      // First try the normal diff against baseRef
      changedFilesResult = await exec('git', ['diff', '--name-only', baseRef, 'HEAD'], {
        timeout: 10000,
        cwd: workingDirectory
      });
      
      // If that fails (e.g., baseRef doesn't exist), try against empty tree for first commit
      if (!changedFilesResult.success && baseRef.includes('HEAD~1')) {
        logger.info('Base reference not found, checking against empty tree (first commit)');
        changedFilesResult = await exec('git', ['diff', '--name-only', '4b825dc642cb6eb9a060e54bf8d69288fbee4904', 'HEAD'], {
          timeout: 10000,
          cwd: workingDirectory
        });
      }
    } catch (error) {
      // If all else fails, try to get all files in the current commit
      logger.warn('Failed to get diff, trying to get all files in current commit');
      changedFilesResult = await exec('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], {
        timeout: 10000,
        cwd: workingDirectory
      });
    }
    
    if (!changedFilesResult.success) {
      return {
        ok: false,
        reason: `Failed to get changed files: ${changedFilesResult.stderr}`,
        details: {
          isFeatureCommit: false,
          touchesProductionCode: false,
          hasKillSwitch: false,
          changedFiles: [],
          killSwitchPatterns: [],
          detectedPatterns: [],
          registeredFlags: [],
          unregisteredFlags: []
        }
      };
    }
    
    const changedFiles = changedFilesResult.stdout.trim().split('\n').filter(file => file.trim());

    // Get the latest commit message
    const commitResult = await exec('git', ['log', '-1', '--pretty=%B'], {
      timeout: 10000,
      cwd: workingDirectory
    });

    if (!commitResult.success) {
      return {
        ok: false,
        reason: `Failed to get commit message: ${commitResult.stderr}`,
        details: {
          isFeatureCommit: false,
          touchesProductionCode: false,
          hasKillSwitch: false,
          changedFiles: [],
          killSwitchPatterns: [],
          detectedPatterns: [],
          registeredFlags: [],
          unregisteredFlags: []
        }
      };
    }

    const commitMessage = commitResult.stdout.trim();
    
    // Check if this is a feature commit
    const isFeatureCommit = /^feat:/.test(commitMessage);
    
    if (!isFeatureCommit) {
      logger.info('Not a feature commit, skipping kill-switch check', {
        commitMessage: commitMessage.substring(0, 50) + '...'
      });
      
      return {
        ok: true,
        details: {
          isFeatureCommit: false,
          touchesProductionCode: false,
          hasKillSwitch: false,
          changedFiles: changedFiles,
          killSwitchPatterns: [],
          detectedPatterns: [],
          registeredFlags: [],
          unregisteredFlags: []
        }
      };
    }

    logger.info('Feature commit detected, checking for production code changes', {
      commitMessage: commitMessage.substring(0, 50) + '...'
    });

    // Use shared production code patterns from FeatureFlagDetector
    const productionFiles = changedFiles.filter(file => 
      FeatureFlagDetector.PATTERNS.productionCode.some(pattern => pattern.test(file))
    );

    const touchesProductionCode = productionFiles.length > 0;

    if (!touchesProductionCode) {
      logger.info('Feature commit does not touch production code, skipping kill-switch check', {
        changedFiles: changedFiles
      });
      
      return {
        ok: true,
        details: {
          isFeatureCommit: true,
          touchesProductionCode: false,
          hasKillSwitch: false,
          changedFiles: changedFiles,
          killSwitchPatterns: [],
          detectedPatterns: [],
          registeredFlags: [],
          unregisteredFlags: []
        }
      };
    }

    logger.info('Feature commit touches production code, checking for kill switches', {
      productionFiles: productionFiles
    });

    // Enhanced kill switch patterns using shared detector
    const enhancedKillSwitchPatterns = [
      // Existing patterns
      FeatureFlagDetector.PATTERNS.isEnabled,
      FeatureFlagDetector.PATTERNS.killSwitch,
      
      // New enhanced patterns
      FeatureFlagDetector.PATTERNS.useFeatureFlag,
      FeatureFlagDetector.PATTERNS.isFeatureEnabled,
      FeatureFlagDetector.PATTERNS.envVar,
      FeatureFlagDetector.PATTERNS.config,
      FeatureFlagDetector.PATTERNS.toggle,
      FeatureFlagDetector.PATTERNS.import,
      FeatureFlagDetector.PATTERNS.rollout
    ];

    // Use shared detector for pattern detection
    const detectionResult = await FeatureFlagDetector.detectKillSwitchPatterns(
      workingDirectory,
      productionFiles,
      enhancedKillSwitchPatterns
    );

    const foundKillSwitches = detectionResult.killSwitchPatterns;
    const hasKillSwitch = foundKillSwitches.length > 0;

    // Load flag registry for validation
    let registeredFlags: string[] = [];
    let unregisteredFlags: string[] = [];
    let registry: UnifiedFlagRegistry | null = null;
    
    try {
      registry = await UnifiedFlagRegistry.loadAllFlags(workingDirectory);
      
      // Enhanced flag extraction from various kill-switch patterns
      const flagNames = new Set<string>();
      for (const pattern of foundKillSwitches) {
        // Extract flag names from various patterns
        const flagNameMatch = pattern.match(/['"`]([^'"`]+)['"`]/);
        if (flagNameMatch) {
          flagNames.add(flagNameMatch[1]);
        }
        
        // Extract from KILL_SWITCH_ patterns
        const killSwitchMatch = pattern.match(/KILL_SWITCH_([A-Z_]+)/);
        if (killSwitchMatch) {
          flagNames.add(killSwitchMatch[1]);
        }
        
        // Extract from environment variable patterns
        const envVarMatch = pattern.match(/process\.env\.([A-Z_]+_ENABLED)/);
        if (envVarMatch) {
          flagNames.add(envVarMatch[1]);
        }
        
        // Extract from config patterns
        const configMatch = pattern.match(/config\s*[=:].*\.([a-zA-Z_]+)/);
        if (configMatch) {
          flagNames.add(configMatch[1]);
        }
        
        // Extract from toggle patterns
        const toggleMatch = pattern.match(/toggle\s*[=:].*\.([a-zA-Z_]+)/);
        if (toggleMatch) {
          flagNames.add(toggleMatch[1]);
        }
      }
      
      // Validate flags against registry
      const flagNamesArray = Array.from(flagNames);
      const validationResult = registry.validateFlags(flagNamesArray);
      
      registeredFlags = flagNamesArray.filter(flag => registry!.isRegistered(flag));
      unregisteredFlags = validationResult.missingFlags;
      
      logger.info('Flag validation completed', {
        totalFlags: flagNamesArray.length,
        registeredFlags: registeredFlags.length,
        unregisteredFlags: unregisteredFlags.length,
        validationErrors: validationResult.errors.length,
        extractedFlags: flagNamesArray
      });
      
    } catch (error) {
      logger.warn('Failed to load flag registry for validation', {
        error: error instanceof Error ? error.message : String(error)
      });
      // If registry loading fails, we can't validate flags, so we'll continue without validation
      // This maintains backward compatibility while providing enhanced validation when possible
    }

    // Add rollout validation for kill-switch flags
    const rolloutValidationStart = Date.now();
    const rolloutValidationErrors: string[] = [];
    const rolloutValidationWarnings: string[] = [];
    let rolloutValidFlags = 0;
    let rolloutInvalidFlags = 0;

    // Extract flag definitions from production files and validate rollout configuration
    for (const filePath of productionFiles) {
      try {
        const fs = await import('fs/promises');
        const content = await fs.readFile(filePath, 'utf-8');
        const flagDefinitions = RolloutValidator.extractFlagDefinitions(content, filePath);
        
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
        logger.warn(`Failed to read file for rollout validation: ${filePath}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const rolloutValidationDuration = Date.now() - rolloutValidationStart;

    if (!hasKillSwitch) {
      // Build enhanced error message with suggestions
      const errorContext: ErrorContext = {
        filePath: productionFiles[0], // Show first production file as example
        detectedPatterns: [],
        suggestions: ErrorMessageBuilder.getKillSwitchSuggestions('useFeatureFlag')
      };
      
      const reason = ErrorMessageBuilder.buildKillSwitchError(errorContext);
      
      logger.error('Kill-switch check failed', {
        isFeatureCommit: true,
        touchesProductionCode: true,
        hasKillSwitch: false,
        productionFiles: productionFiles,
        changedFiles: changedFiles,
        metrics: detectionResult.metrics
      });

      return {
        ok: false,
        reason,
        details: {
          isFeatureCommit: true,
          touchesProductionCode: true,
          hasKillSwitch: false,
          changedFiles: changedFiles,
          killSwitchPatterns: [],
          detectedPatterns: [],
          registeredFlags: [],
          unregisteredFlags: [],
          rolloutValidationErrors,
          rolloutValidationWarnings,
          rolloutValidFlags,
          rolloutInvalidFlags,
          metrics: {
            ...detectionResult.metrics,
            rolloutValidationDuration
          }
        }
      };
    }

    // Check if any detected flags are unregistered (fail the check)
    if (unregisteredFlags.length > 0) {
      // Build enhanced error message for unregistered flags
      const errorContext: ErrorContext = {
        unregisteredFlags: unregisteredFlags,
        filePath: productionFiles[0], // Show first production file as example
        detectedPatterns: foundKillSwitches
      };
      
      const reason = ErrorMessageBuilder.buildFlagRegistrationError(errorContext);
      
      logger.error('Kill-switch check failed - unregistered flags detected', {
        unregisteredFlags: unregisteredFlags,
        registeredFlags: registeredFlags,
        totalFlags: unregisteredFlags.length + registeredFlags.length
      });

      return {
        ok: false,
        reason,
        details: {
          isFeatureCommit: true,
          touchesProductionCode: true,
          hasKillSwitch: true,
          changedFiles: changedFiles,
          killSwitchPatterns: foundKillSwitches,
          detectedPatterns: foundKillSwitches,
          registeredFlags: registeredFlags,
          unregisteredFlags: unregisteredFlags,
          rolloutValidationErrors,
          rolloutValidationWarnings,
          rolloutValidFlags,
          rolloutInvalidFlags,
          metrics: {
            ...detectionResult.metrics,
            rolloutValidationDuration
          }
        }
      };
    }

    // Log success with flag validation details
    if (registry && registeredFlags.length > 0) {
      logger.success('Kill-switch check passed - all flags properly registered', {
        message: 'Feature commit includes kill switches with valid flag registration',
        isFeatureCommit: true,
        touchesProductionCode: true,
        hasKillSwitch: true,
        killSwitchCount: foundKillSwitches.length,
        productionFiles: productionFiles,
        registeredFlags: registeredFlags.length,
        unregisteredFlags: unregisteredFlags.length,
        validatedFlags: registeredFlags,
        metrics: detectionResult.metrics
      });
    } else {
      logger.success('Kill-switch check passed', {
        message: 'Feature commit includes kill switches',
        isFeatureCommit: true,
        touchesProductionCode: true,
        hasKillSwitch: true,
        killSwitchCount: foundKillSwitches.length,
        productionFiles: productionFiles,
        registeredFlags: registeredFlags.length,
        unregisteredFlags: unregisteredFlags.length,
        metrics: detectionResult.metrics
      });
    }

    return {
      ok: true,
      details: {
        isFeatureCommit: true,
        touchesProductionCode: true,
        hasKillSwitch: true,
        changedFiles: changedFiles,
        killSwitchPatterns: foundKillSwitches,
        detectedPatterns: foundKillSwitches,
        registeredFlags: registeredFlags,
        unregisteredFlags: unregisteredFlags,
        rolloutValidationErrors,
        rolloutValidationWarnings,
        rolloutValidFlags,
        rolloutInvalidFlags,
        metrics: {
          ...detectionResult.metrics,
          rolloutValidationDuration
        }
      }
    };

  } catch (error) {
    const reason = `Kill-switch check failed: ${error instanceof Error ? error.message : String(error)}`;
    
    logger.error('Kill-switch check failed with error', {
      error: reason
    });

    return {
      ok: false,
      reason,
      details: {
        isFeatureCommit: false,
        touchesProductionCode: false,
        hasKillSwitch: false,
        changedFiles: [],
        killSwitchPatterns: [],
        detectedPatterns: [],
        registeredFlags: [],
        unregisteredFlags: []
      }
    };
  }
}
