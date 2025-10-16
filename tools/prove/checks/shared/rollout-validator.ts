/**
 * Rollout validation utility for feature flags
 * Ensures feature flags have proper rollout configuration for safe deployment
 */

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
  /**
   * Validate rollout configuration for a single flag
   */
  static validateRolloutConfig(flagDef: FlagDefinition): RolloutValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for rollout percentage
    const hasRolloutPercentage = /rolloutPercentage\s*:\s*\d+/.test(flagDef.content);
    if (!hasRolloutPercentage) {
      errors.push(`Missing rollout percentage configuration`);
    }
    
    // Check for environment configuration
    const hasEnvironmentConfig = /environments\s*:\s*\[/.test(flagDef.content);
    if (!hasEnvironmentConfig) {
      errors.push(`Missing environment configuration`);
    }
    
    // Check for default value
    const hasDefaultValue = /default\s*:\s*(true|false)/.test(flagDef.content);
    if (!hasDefaultValue) {
      errors.push(`Missing default value configuration`);
    }
    
    // Check for description
    const hasDescription = /description\s*:\s*['"`]/.test(flagDef.content);
    if (!hasDescription) {
      warnings.push(`Missing description - recommended for rollout safety`);
    }
    
    // Check for owner
    const hasOwner = /owner\s*:\s*['"`]/.test(flagDef.content);
    if (!hasOwner) {
      warnings.push(`Missing owner - recommended for rollout accountability`);
    }
    
    // Check for expiry
    const hasExpiry = /expiry\s*:\s*['"`]/.test(flagDef.content);
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
   * Validate gradual rollout configuration for multiple flags
   */
  static validateGradualRollout(flags: FlagDefinition[]): GradualRolloutResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    let supportsGradualRollout = true;
    let rolloutPercentage = 0;
    let environmentCount = 0;
    let hasStagingConfig = false;
    let hasProductionConfig = false;
    
    for (const flag of flags) {
      const validation = this.validateRolloutConfig(flag);
      
      if (!validation.isValid) {
        supportsGradualRollout = false;
        errors.push(`Flag '${flag.name}' has invalid rollout configuration: ${validation.errors.join(', ')}`);
      }
      
      // Extract rollout percentage
      const rolloutMatch = flag.content.match(/rolloutPercentage\s*:\s*(\d+)/);
      if (rolloutMatch) {
        rolloutPercentage = Math.max(rolloutPercentage, parseInt(rolloutMatch[1]));
      }
      
      // Check environment configuration
      const envMatch = flag.content.match(/environments\s*:\s*\[([^\]]+)\]/);
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
   * Get validation metrics for monitoring
   */
  static async getValidationMetrics(flags: FlagDefinition[]): Promise<RolloutMetrics> {
    const startTime = Date.now();
    
    let validRolloutConfigs = 0;
    let invalidRolloutConfigs = 0;
    let gradualRolloutSupported = 0;
    let missingRolloutPercentage = 0;
    let missingEnvironmentConfig = 0;
    let missingDefaultValue = 0;
    let missingDescription = 0;
    let errorCount = 0;
    let warningCount = 0;
    
    for (const flag of flags) {
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
   * Extract flag definitions from file content
   */
  static extractFlagDefinitions(content: string, filePath: string): FlagDefinition[] {
    const flags: FlagDefinition[] = [];
    
    // Match various flag definition patterns
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
        const content = match[2];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        flags.push({
          name,
          content,
          filePath,
          lineNumber
        });
      }
    }
    
    return flags;
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
