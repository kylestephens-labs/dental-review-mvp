/**
 * Rollout validation utility for feature flags
 * Ensures feature flags have proper rollout configuration for safe deployment
 */

import { RolloutCache } from './rollout-cache.js';
import { logger } from '../../logger.js';

export interface FlagDefinition {
  name: string;
  content: string;
  filePath: string;
  lineNumber?: number;
}

export interface RolloutValidationResult {
  hasRolloutPercentage: boolean;
  hasEnvironmentConfig: boolean;
  hasDefaultValue: boolean;
  hasDescription: boolean;
  hasOwner: boolean;
  hasExpiry: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GradualRolloutResult {
  supportsGradualRollout: boolean;
  rolloutPercentage: number;
  environmentCount: number;
  hasStagingConfig: boolean;
  hasProductionConfig: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RolloutMetrics {
  totalFlags: number;
  validRolloutConfigs: number;
  invalidRolloutConfigs: number;
  gradualRolloutSupported: number;
  missingRolloutPercentage: number;
  missingEnvironmentConfig: number;
  missingDefaultValue: number;
  missingDescription: number;
  validationDuration: number;
  errorCount: number;
  warningCount: number;
}

export class RolloutValidator {
  private static readonly COMPILED_PATTERNS = {
    rolloutPercentage: /rolloutPercentage\s*:\s*\d+/,
    environmentConfig: /environments\s*:\s*\[/,
    defaultValue: /default\s*:\s*(true|false)/,
    description: /description\s*:\s*['"`]/,
    owner: /owner\s*:\s*['"`]/,
    expiry: /expiry\s*:\s*['"`]/,
    gradualRollout: /gradualRollout\s*:\s*\{/,
    stages: /stages\s*:\s*\[/
  };

  /**
   * Initialize the validator with caching
   */
  static initialize(): void {
    RolloutCache.initialize({
      maxSize: 1000,
      defaultTtl: 300000, // 5 minutes
      cleanupInterval: 60000, // 1 minute
      enableMemoryOptimization: true,
      enableCompression: false
    });
    
    RolloutCache.preloadCommonPatterns();
    logger.info('Rollout validator initialized with caching');
  }

  /**
   * Validate rollout configuration for a single flag with caching
   */
  static validateRolloutConfig(flagDef: FlagDefinition): RolloutValidationResult {
    const startTime = Date.now();
    const contentHash = RolloutCache.generateContentHash(flagDef.content);
    
    // Check cache first
    const cached = RolloutCache.getValidationResult(flagDef.name, contentHash);
    if (cached) {
      logger.info('Using cached validation result', { 
        flagName: flagDef.name, 
        cacheHit: true 
      });
      return cached;
    }
    
    // Perform validation
    const result = this.performRolloutValidation(flagDef);
    
    // Cache the result
    RolloutCache.setValidationResult(flagDef.name, contentHash, result);
    
    const duration = Date.now() - startTime;
    logger.info('Rollout validation completed', { 
      flagName: flagDef.name, 
      duration, 
      cacheHit: false 
    });
    
    return result;
  }

  /**
   * Perform actual rollout validation (internal method)
   */
  private static performRolloutValidation(flagDef: FlagDefinition): RolloutValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Use compiled patterns for better performance
    const hasRolloutPercentage = this.COMPILED_PATTERNS.rolloutPercentage.test(flagDef.content);
    if (!hasRolloutPercentage) {
      errors.push(`Missing rollout percentage configuration`);
    }
    
    const hasEnvironmentConfig = this.COMPILED_PATTERNS.environmentConfig.test(flagDef.content);
    if (!hasEnvironmentConfig) {
      errors.push(`Missing environment configuration`);
    }
    
    const hasDefaultValue = this.COMPILED_PATTERNS.defaultValue.test(flagDef.content);
    if (!hasDefaultValue) {
      errors.push(`Missing default value configuration`);
    }
    
    const hasDescription = this.COMPILED_PATTERNS.description.test(flagDef.content);
    if (!hasDescription) {
      warnings.push(`Missing description - recommended for rollout safety`);
    }
    
    const hasOwner = this.COMPILED_PATTERNS.owner.test(flagDef.content);
    if (!hasOwner) {
      warnings.push(`Missing owner - recommended for rollout accountability`);
    }
    
    const hasExpiry = this.COMPILED_PATTERNS.expiry.test(flagDef.content);
    if (!hasExpiry) {
      warnings.push(`Missing expiry date - recommended for rollout timeline`);
    }
    
    const isValid = errors.length === 0;
    
    return {
      hasRolloutPercentage,
      hasEnvironmentConfig,
      hasDefaultValue,
      hasDescription,
      hasOwner,
      hasExpiry,
      isValid,
      errors,
      warnings
    };
  }

  /**
   * Validate gradual rollout configuration for multiple flags with caching
   */
  static validateGradualRollout(flags: FlagDefinition[]): GradualRolloutResult {
    const startTime = Date.now();
    const flagsHash = RolloutCache.generateFlagsHash(flags);
    
    // Check cache first
    const cached = RolloutCache.getGradualRolloutResult(flagsHash);
    if (cached) {
      logger.info('Using cached gradual rollout result', { 
        flagsCount: flags.length, 
        cacheHit: true 
      });
      return cached;
    }
    
    // Perform validation
    const result = this.performGradualRolloutValidation(flags);
    
    // Cache the result
    RolloutCache.setGradualRolloutResult(flagsHash, result);
    
    const duration = Date.now() - startTime;
    logger.info('Gradual rollout validation completed', { 
      flagsCount: flags.length, 
      duration, 
      cacheHit: false 
    });
    
    return result;
  }

  /**
   * Perform actual gradual rollout validation (internal method)
   */
  private static performGradualRolloutValidation(flags: FlagDefinition[]): GradualRolloutResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    let supportsGradualRollout = true;
    let rolloutPercentage = 0;
    let environmentCount = 0;
    let hasStagingConfig = false;
    let hasProductionConfig = false;
    
    // Use compiled patterns for better performance
    const rolloutPattern = this.COMPILED_PATTERNS.rolloutPercentage;
    const envPattern = /environments\s*:\s*\[([^\]]+)\]/;
    
    for (const flag of flags) {
      const validation = this.validateRolloutConfig(flag);
      
      if (!validation.isValid) {
        supportsGradualRollout = false;
        errors.push(`Flag '${flag.name}' has invalid rollout configuration: ${validation.errors.join(', ')}`);
      }
      
      // Extract rollout percentage using compiled pattern
      const rolloutMatch = rolloutPattern.exec(flag.content);
      if (rolloutMatch) {
        const percentage = parseInt(rolloutMatch[0].match(/\d+/)![0]);
        rolloutPercentage = Math.max(rolloutPercentage, percentage);
      }
      
      // Check environment configuration
      const envMatch = envPattern.exec(flag.content);
      if (envMatch) {
        const environments = envMatch[1].split(',').map(env => env.trim().replace(/['"`]/g, ''));
        environmentCount = Math.max(environmentCount, environments.length);
        
        hasStagingConfig = hasStagingConfig || environments.some(env => 
          env.toLowerCase().includes('staging') || env.toLowerCase().includes('dev')
        );
        
        hasProductionConfig = hasProductionConfig || environments.some(env => 
          env.toLowerCase().includes('production') || env.toLowerCase().includes('prod')
        );
      }
    }
    
    if (!hasStagingConfig) {
      warnings.push(`No staging environment configuration found - recommended for safe rollout`);
    }
    
    if (!hasProductionConfig) {
      warnings.push(`No production environment configuration found - required for gradual rollout`);
    }
    
    if (rolloutPercentage === 0) {
      errors.push(`No rollout percentage configured - gradual rollout requires percentage > 0`);
    }
    
    if (rolloutPercentage > 100) {
      errors.push(`Invalid rollout percentage: ${rolloutPercentage}% - must be between 0 and 100`);
    }
    
    const isValid = errors.length === 0;
    
    return {
      supportsGradualRollout,
      rolloutPercentage,
      environmentCount,
      hasStagingConfig,
      hasProductionConfig,
      isValid,
      errors,
      warnings
    };
  }

  /**
   * Get validation metrics for monitoring with caching
   */
  static async getValidationMetrics(flags: FlagDefinition[]): Promise<RolloutMetrics> {
    const startTime = Date.now();
    const flagsHash = RolloutCache.generateFlagsHash(flags);
    
    // Check cache first
    const cached = RolloutCache.getMetrics(flagsHash);
    if (cached) {
      logger.info('Using cached validation metrics', { 
        flagsCount: flags.length, 
        cacheHit: true 
      });
      return cached;
    }
    
    // Perform metrics calculation
    const metrics = this.performValidationMetrics(flags, startTime);
    
    // Cache the result
    RolloutCache.setMetrics(flagsHash, metrics);
    
    const duration = Date.now() - startTime;
    logger.info('Validation metrics completed', { 
      flagsCount: flags.length, 
      duration, 
      cacheHit: false 
    });
    
    return metrics;
  }

  /**
   * Perform actual validation metrics calculation (internal method)
   */
  private static performValidationMetrics(flags: FlagDefinition[], startTime: number): RolloutMetrics {
    let validRolloutConfigs = 0;
    let invalidRolloutConfigs = 0;
    let gradualRolloutSupported = 0;
    let missingRolloutPercentage = 0;
    let missingEnvironmentConfig = 0;
    let missingDefaultValue = 0;
    let missingDescription = 0;
    let errorCount = 0;
    let warningCount = 0;
    
    // Process flags in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < flags.length; i += batchSize) {
      const batch = flags.slice(i, i + batchSize);
      
      for (const flag of batch) {
        const validation = this.validateRolloutConfig(flag);
        
        if (validation.isValid) {
          validRolloutConfigs++;
        } else {
          invalidRolloutConfigs++;
        }
        
        if (validation.hasRolloutPercentage && validation.hasEnvironmentConfig && validation.hasDefaultValue) {
          gradualRolloutSupported++;
        }
        
        if (!validation.hasRolloutPercentage) missingRolloutPercentage++;
        if (!validation.hasEnvironmentConfig) missingEnvironmentConfig++;
        if (!validation.hasDefaultValue) missingDefaultValue++;
        if (!validation.hasDescription) missingDescription++;
        
        errorCount += validation.errors.length;
        warningCount += validation.warnings.length;
      }
    }
    
    const validationDuration = Date.now() - startTime;
    
    return {
      totalFlags: flags.length,
      validRolloutConfigs,
      invalidRolloutConfigs,
      gradualRolloutSupported,
      missingRolloutPercentage,
      missingEnvironmentConfig,
      missingDefaultValue,
      missingDescription,
      validationDuration,
      errorCount,
      warningCount
    };
  }

  /**
   * Extract flag definitions from file content with caching
   */
  static extractFlagDefinitions(content: string, filePath: string): FlagDefinition[] {
    const contentHash = RolloutCache.generateContentHash(content);
    
    // Check cache first
    const cached = RolloutCache.getFlagDefinition(contentHash);
    if (cached) {
      logger.info('Using cached flag definitions', { 
        filePath, 
        cacheHit: true 
      });
      return cached;
    }
    
    // Perform extraction
    const flags = this.performFlagExtraction(content, filePath);
    
    // Cache the result
    RolloutCache.setFlagDefinition(contentHash, flags[0] || {
      name: 'EMPTY',
      content: '',
      filePath,
      lineNumber: 1
    });
    
    logger.info('Flag definitions extracted', { 
      filePath, 
      flagsCount: flags.length, 
      cacheHit: false 
    });
    
    return flags;
  }

  /**
   * Perform actual flag extraction (internal method)
   */
  private static performFlagExtraction(content: string, filePath: string): FlagDefinition[] {
    const flags: FlagDefinition[] = [];
    
    // Use compiled patterns for better performance
    const patterns = [
      // Object-style definitions
      /const\s+(\w+)\s*=\s*\{([^}]+)\}/g,
      // Function-style definitions
      /function\s+(\w+)\s*\([^)]*\)\s*\{([^}]+)\}/g,
      // Arrow function definitions
      /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/g,
      // Export definitions
      /export\s+(?:const|function)\s+(\w+)\s*[=\{]([^}]+)\}/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        const flagContent = match[2];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        flags.push({
          name,
          content: flagContent,
          filePath,
          lineNumber
        });
      }
    }
    
    return flags;
  }

  /**
   * Get performance statistics for the rollout validator
   */
  static getPerformanceStats(): {
    cacheStats: any;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  } {
    const cacheStats = RolloutCache.getStats();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      cacheStats,
      memoryUsage,
      uptime
    };
  }

  /**
   * Shutdown the rollout validator and cleanup resources
   */
  static shutdown(): void {
    RolloutCache.shutdown();
    logger.info('Rollout validator shutdown complete');
  }

  /**
   * Validate rollout safety for production deployment
   */
  static validateRolloutSafety(flags: FlagDefinition[]): {
    isSafe: boolean;
    risks: string[];
    recommendations: string[];
  } {
    const risks: string[] = [];
    const recommendations: string[] = [];
    
    const gradualRollout = this.validateGradualRollout(flags);
    
    if (!gradualRollout.isValid) {
      risks.push('Invalid gradual rollout configuration detected');
      recommendations.push('Fix rollout configuration before production deployment');
    }
    
    if (gradualRollout.rolloutPercentage > 50) {
      risks.push('High rollout percentage detected - consider starting with lower percentage');
      recommendations.push('Start with 10-25% rollout and gradually increase');
    }
    
    if (!gradualRollout.hasStagingConfig) {
      risks.push('No staging environment configuration found');
      recommendations.push('Test rollout configuration in staging environment first');
    }
    
    if (gradualRollout.environmentCount < 2) {
      risks.push('Limited environment configuration - may not support gradual rollout');
      recommendations.push('Configure multiple environments for safe rollout');
    }
    
    const isSafe = risks.length === 0;
    
    return {
      isSafe,
      risks,
      recommendations
    };
  }

  /**
   * Generate rollout configuration template
   */
  static generateRolloutTemplate(flagName: string): string {
    return `const ${flagName} = {
  name: '${flagName}',
  description: 'Feature flag for ${flagName}',
  owner: 'team-name',
  expiry: '2024-12-31',
  rolloutPercentage: 0,
  default: false,
  environments: ['staging', 'production'],
  gradualRollout: {
    enabled: true,
    stages: [
      { percentage: 10, duration: '1d' },
      { percentage: 25, duration: '2d' },
      { percentage: 50, duration: '3d' },
      { percentage: 100, duration: '7d' }
    ]
  }
};`;
  }

  /**
   * Check if flag supports gradual rollout
   */
  static supportsGradualRollout(flagDef: FlagDefinition): boolean {
    const validation = this.validateRolloutConfig(flagDef);
    return validation.hasRolloutPercentage && 
           validation.hasEnvironmentConfig && 
           validation.hasDefaultValue;
  }

  /**
   * Get rollout configuration summary
   */
  static getRolloutSummary(flags: FlagDefinition[]): {
    totalFlags: number;
    gradualRolloutSupported: number;
    rolloutPercentage: number;
    environmentCount: number;
    safetyScore: number;
  } {
    const gradualRollout = this.validateGradualRollout(flags);
    const safety = this.validateRolloutSafety(flags);
    
    const safetyScore = safety.isSafe ? 100 : Math.max(0, 100 - (safety.risks.length * 20));
    
    return {
      totalFlags: flags.length,
      gradualRolloutSupported: gradualRollout.gradualRolloutSupported ? 1 : 0,
      rolloutPercentage: gradualRollout.rolloutPercentage,
      environmentCount: gradualRollout.environmentCount,
      safetyScore
    };
  }
}
