// Centralized configuration validation utility
// Provides comprehensive validation, validation, and optimization for prove configuration

import { z } from 'zod';
import { logger } from '../logger.js';
import { type ProveConfig } from '../prove.config.js';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  performance: ValidationPerformance;
}

export interface ValidationError {
  path: string;
  message: string;
  received: any;
  expected: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fix?: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  current: any;
  suggestion: any;
  impact: 'performance' | 'security' | 'maintainability' | 'usability';
}

export interface ValidationSuggestion {
  path: string;
  message: string;
  current: any;
  recommended: any;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ValidationPerformance {
  validationTime: number;
  memoryUsage: number;
  complexityScore: number;
  optimizationOpportunities: number;
}

export interface ConfigValidationOptions {
  strictMode: boolean;
  includeWarnings: boolean;
  includeSuggestions: boolean;
  performanceAnalysis: boolean;
  securityAnalysis: boolean;
  maintainabilityAnalysis: boolean;
}

export class ConfigValidator {
  private static readonly DEFAULT_OPTIONS: ConfigValidationOptions = {
    strictMode: false,
    includeWarnings: true,
    includeSuggestions: true,
    performanceAnalysis: true,
    securityAnalysis: true,
    maintainabilityAnalysis: true,
  };

  /**
   * Comprehensive configuration schema with enhanced validation
   */
  private static readonly ENHANCED_CONFIG_SCHEMA = z.object({
    // Thresholds with enhanced validation
    thresholds: z.object({
      diffCoverageFunctional: z.number()
        .min(0, 'Coverage cannot be negative')
        .max(100, 'Coverage cannot exceed 100%')
        .refine(val => val >= 80, 'Consider higher coverage for functional tasks'),
      diffCoverageFunctionalRefactor: z.number()
        .min(0, 'Coverage cannot be negative')
        .max(100, 'Coverage cannot exceed 100%')
        .refine(val => val >= 50, 'Consider higher coverage for refactor tasks'),
      globalCoverage: z.number()
        .min(0, 'Coverage cannot be negative')
        .max(100, 'Coverage cannot exceed 100%')
        .refine(val => val >= 20, 'Consider higher global coverage'),
      maxWarnings: z.number()
        .min(0, 'Warnings cannot be negative')
        .refine(val => val === 0, 'Consider zero warnings for better code quality'),
      maxCommitSize: z.number()
        .min(1, 'Commit size must be at least 1 line')
        .max(1000, 'Consider smaller commits for better reviewability')
        .refine(val => val <= 500, 'Large commits may be difficult to review'),
    }),

    // Paths with enhanced validation
    paths: z.object({
      srcGlobs: z.array(z.string())
        .min(1, 'At least one source glob pattern required')
        .refine(globs => globs.every(glob => glob.includes('**')), 'Use recursive glob patterns'),
      testGlobs: z.array(z.string())
        .min(1, 'At least one test glob pattern required')
        .refine(globs => globs.some(glob => glob.includes('test') || glob.includes('spec')), 'Include test patterns'),
      coverageFile: z.string()
        .min(1, 'Coverage file path required')
        .refine(path => path.endsWith('.json'), 'Coverage file should be JSON format'),
      proveReportFile: z.string()
        .min(1, 'Prove report file path required')
        .refine(path => path.endsWith('.json'), 'Prove report should be JSON format'),
    }),

    // Git configuration with enhanced validation
    git: z.object({
      baseRefFallback: z.string()
        .min(1, 'Base ref fallback required')
        .refine(ref => ref.includes('/'), 'Use proper git ref format'),
      requireMainBranch: z.boolean(),
      enablePreConflictCheck: z.boolean(),
    }),

    // Runner configuration with enhanced validation
    runner: z.object({
      concurrency: z.number()
        .min(1, 'Concurrency must be at least 1')
        .max(20, 'High concurrency may impact performance')
        .refine(val => val <= 8, 'Consider lower concurrency for stability'),
      timeout: z.number()
        .min(1000, 'Timeout must be at least 1 second')
        .max(600000, 'Very long timeouts may indicate performance issues')
        .refine(val => val <= 300000, 'Consider shorter timeouts for better feedback'),
      failFast: z.boolean(),
    }),

    // Toggles with enhanced validation
    toggles: z.object({
      coverage: z.boolean(),
      diffCoverage: z.boolean(),
      sizeBudget: z.boolean(),
      security: z.boolean(),
      contracts: z.boolean(),
      dbMigrations: z.boolean(),
    }),

    // Feature flags with enhanced validation
    featureFlags: z.object({
      enableTelemetry: z.boolean(),
      enableRolloutValidation: z.boolean(),
      enableSharedDetection: z.boolean(),
      registryCacheTimeout: z.number()
        .min(1000, 'Cache timeout too short')
        .max(300000, 'Cache timeout too long')
        .refine(val => val >= 30000, 'Consider longer cache timeout for better performance'),
      detectionTimeout: z.number()
        .min(1000, 'Detection timeout too short')
        .max(60000, 'Detection timeout too long'),
      enableGradualRolloutValidation: z.boolean(),
      enableFlagRegistrationValidation: z.boolean(),
    }),

    // Kill-switch configuration with enhanced validation
    killSwitch: z.object({
      enableRegistrationValidation: z.boolean(),
      enableEnhancedPatterns: z.boolean(),
      enableSharedDetection: z.boolean(),
      enableRolloutValidation: z.boolean(),
      enableErrorMessages: z.boolean(),
      patternDetectionTimeout: z.number()
        .min(1000, 'Pattern detection timeout too short')
        .max(30000, 'Pattern detection timeout too long'),
    }),

    // Mode-specific settings with enhanced validation
    modes: z.object({
      functional: z.object({
        requireTdd: z.boolean(),
        requireDiffCoverage: z.boolean(),
        requireTests: z.boolean(),
      }),
      nonFunctional: z.object({
        requireProblemAnalysis: z.boolean(),
        requireProblemAnalysisMinLength: z.number()
          .min(100, 'Problem analysis should be more detailed')
          .max(2000, 'Problem analysis should be concise'),
        requireTdd: z.boolean(),
        requireDiffCoverage: z.boolean(),
        requireTests: z.boolean(),
      }),
    }),

    // Check timeouts with enhanced validation
    checkTimeouts: z.object({
      typecheck: z.number()
        .min(1000, 'Typecheck timeout too short')
        .max(300000, 'Typecheck timeout too long'),
      lint: z.number()
        .min(1000, 'Lint timeout too short')
        .max(120000, 'Lint timeout too long'),
      tests: z.number()
        .min(1000, 'Test timeout too short')
        .max(600000, 'Test timeout too long'),
      build: z.number()
        .min(1000, 'Build timeout too short')
        .max(900000, 'Build timeout too long'),
      coverage: z.number()
        .min(1000, 'Coverage timeout too short')
        .max(300000, 'Coverage timeout too long'),
    }),
  });

  /**
   * Validate configuration with comprehensive analysis
   */
  static validateConfig(
    config: ProveConfig,
    options: Partial<ConfigValidationOptions> = {}
  ): ValidationResult {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // Basic schema validation
      this.ENHANCED_CONFIG_SCHEMA.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...this.processZodErrors(error));
      }
    }

    // Additional validation checks
    if (opts.includeWarnings) {
      warnings.push(...this.validatePerformance(config));
      warnings.push(...this.validateSecurity(config));
      warnings.push(...this.validateMaintainability(config));
    }

    if (opts.includeSuggestions) {
      suggestions.push(...this.generateSuggestions(config));
    }

    const validationTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage().heapUsed - startMemory;
    const complexityScore = this.calculateComplexityScore(config);
    const optimizationOpportunities = this.countOptimizationOpportunities(config, warnings, suggestions);

    const performance: ValidationPerformance = {
      validationTime,
      memoryUsage,
      complexityScore,
      optimizationOpportunities,
    };

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      performance,
    };

    logger.info('Configuration validation completed', {
      isValid: result.isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
      suggestionCount: suggestions.length,
      validationTime,
      complexityScore,
    });

    return result;
  }

  /**
   * Process Zod validation errors into structured format
   */
  private static processZodErrors(error: z.ZodError): ValidationError[] {
    return error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      received: err.received,
      expected: err.expected,
      severity: this.determineSeverity(err.code, err.message),
      fix: this.generateFix(err),
    }));
  }

  /**
   * Determine error severity based on error type and message
   */
  private static determineSeverity(code: string, message: string): 'low' | 'medium' | 'high' | 'critical' {
    if (code === 'invalid_type' && message.includes('required')) {
      return 'critical';
    }
    if (code === 'too_small' || code === 'too_big') {
      return 'high';
    }
    if (code === 'custom') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate fix suggestions for validation errors
   */
  private static generateFix(error: z.ZodIssue): string | undefined {
    switch (error.code) {
      case 'invalid_type':
        return `Expected ${error.expected}, received ${error.received}`;
      case 'too_small':
        return `Value must be at least ${error.minimum}`;
      case 'too_big':
        return `Value must be at most ${error.maximum}`;
      default:
        return undefined;
    }
  }

  /**
   * Validate performance-related configuration
   */
  private static validatePerformance(config: ProveConfig): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check concurrency settings
    if (config.runner.concurrency > 8) {
      warnings.push({
        path: 'runner.concurrency',
        message: 'High concurrency may impact system performance',
        current: config.runner.concurrency,
        suggestion: 8,
        impact: 'performance',
      });
    }

    // Check timeout settings
    if (config.runner.timeout > 300000) {
      warnings.push({
        path: 'runner.timeout',
        message: 'Long timeouts may delay feedback',
        current: config.runner.timeout,
        suggestion: 300000,
        impact: 'performance',
      });
    }

    // Check cache timeout
    if (config.featureFlags.registryCacheTimeout < 30000) {
      warnings.push({
        path: 'featureFlags.registryCacheTimeout',
        message: 'Short cache timeout may impact performance',
        current: config.featureFlags.registryCacheTimeout,
        suggestion: 30000,
        impact: 'performance',
      });
    }

    return warnings;
  }

  /**
   * Validate security-related configuration
   */
  private static validateSecurity(config: ProveConfig): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check if security features are disabled
    if (!config.toggles.security) {
      warnings.push({
        path: 'toggles.security',
        message: 'Security checks are disabled',
        current: false,
        suggestion: true,
        impact: 'security',
      });
    }

    // Check git ref fallback
    if (config.git.baseRefFallback === 'origin/main') {
      warnings.push({
        path: 'git.baseRefFallback',
        message: 'Consider using a more specific ref for security',
        current: config.git.baseRefFallback,
        suggestion: 'refs/heads/main',
        impact: 'security',
      });
    }

    return warnings;
  }

  /**
   * Validate maintainability-related configuration
   */
  private static validateMaintainability(config: ProveConfig): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check coverage thresholds
    if (config.thresholds.globalCoverage < 30) {
      warnings.push({
        path: 'thresholds.globalCoverage',
        message: 'Low global coverage threshold may impact code quality',
        current: config.thresholds.globalCoverage,
        suggestion: 30,
        impact: 'maintainability',
      });
    }

    // Check commit size
    if (config.thresholds.maxCommitSize > 500) {
      warnings.push({
        path: 'thresholds.maxCommitSize',
        message: 'Large commit size may impact code review quality',
        current: config.thresholds.maxCommitSize,
        suggestion: 500,
        impact: 'maintainability',
      });
    }

    return warnings;
  }

  /**
   * Generate optimization suggestions
   */
  private static generateSuggestions(config: ProveConfig): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];

    // Suggest enabling useful features
    if (!config.toggles.contracts) {
      suggestions.push({
        path: 'toggles.contracts',
        message: 'Consider enabling API contract validation',
        current: false,
        recommended: true,
        reason: 'Helps maintain API consistency and catch breaking changes',
        priority: 'medium',
      });
    }

    if (!config.toggles.dbMigrations) {
      suggestions.push({
        path: 'toggles.dbMigrations',
        message: 'Consider enabling database migration checks',
        current: false,
        recommended: true,
        reason: 'Ensures database schema changes are properly validated',
        priority: 'low',
      });
    }

    // Suggest performance optimizations
    if (config.featureFlags.detectionTimeout > 10000) {
      suggestions.push({
        path: 'featureFlags.detectionTimeout',
        message: 'Consider reducing detection timeout for faster feedback',
        current: config.featureFlags.detectionTimeout,
        recommended: 10000,
        reason: 'Faster feedback improves developer experience',
        priority: 'medium',
      });
    }

    return suggestions;
  }

  /**
   * Calculate configuration complexity score
   */
  private static calculateComplexityScore(config: ProveConfig): number {
    let score = 0;
    
    // Count enabled toggles
    const enabledToggles = Object.values(config.toggles).filter(Boolean).length;
    score += enabledToggles * 2;
    
    // Count timeout configurations
    const timeoutCount = Object.keys(config.checkTimeouts).length;
    score += timeoutCount;
    
    // Count feature flag configurations
    const featureFlagCount = Object.keys(config.featureFlags).length;
    score += featureFlagCount;
    
    // Count kill-switch configurations
    const killSwitchCount = Object.keys(config.killSwitch).length;
    score += killSwitchCount;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Count optimization opportunities
   */
  private static countOptimizationOpportunities(
    config: ProveConfig,
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[]
  ): number {
    return warnings.filter(w => w.impact === 'performance').length +
           suggestions.filter(s => s.priority === 'high' || s.priority === 'medium').length;
  }

  /**
   * Validate configuration against best practices
   */
  static validateBestPractices(config: ProveConfig): {
    score: number;
    recommendations: string[];
    violations: string[];
  } {
    const recommendations: string[] = [];
    const violations: string[] = [];
    let score = 100;

    // Check coverage thresholds
    if (config.thresholds.diffCoverageFunctional < 80) {
      violations.push('Functional task coverage should be at least 80%');
      score -= 10;
    }

    if (config.thresholds.globalCoverage < 25) {
      violations.push('Global coverage should be at least 25%');
      score -= 5;
    }

    // Check security features
    if (!config.toggles.security) {
      recommendations.push('Enable security checks for better code quality');
      score -= 5;
    }

    // Check performance settings
    if (config.runner.concurrency > 8) {
      violations.push('High concurrency may impact performance');
      score -= 5;
    }

    // Check maintainability
    if (config.thresholds.maxCommitSize > 500) {
      violations.push('Large commit size may impact code review quality');
      score -= 5;
    }

    return {
      score: Math.max(score, 0),
      recommendations,
      violations,
    };
  }

  /**
   * Generate configuration documentation
   */
  static generateDocumentation(config: ProveConfig): string {
    const sections = [
      '# Prove Configuration Documentation',
      '',
      '## Overview',
      'This configuration defines the behavior and thresholds for the Prove Quality Gates system.',
      '',
      '## Thresholds',
      `- **Diff Coverage (Functional)**: ${config.thresholds.diffCoverageFunctional}%`,
      `- **Diff Coverage (Refactor)**: ${config.thresholds.diffCoverageFunctionalRefactor}%`,
      `- **Global Coverage**: ${config.thresholds.globalCoverage}%`,
      `- **Max Warnings**: ${config.thresholds.maxWarnings}`,
      `- **Max Commit Size**: ${config.thresholds.maxCommitSize} lines`,
      '',
      '## Toggles',
      Object.entries(config.toggles)
        .map(([key, value]) => `- **${key}**: ${value ? 'Enabled' : 'Disabled'}`)
        .join('\n'),
      '',
      '## Runner Configuration',
      `- **Concurrency**: ${config.runner.concurrency}`,
      `- **Timeout**: ${config.runner.timeout}ms`,
      `- **Fail Fast**: ${config.runner.failFast}`,
      '',
      '## Feature Flags',
      Object.entries(config.featureFlags)
        .map(([key, value]) => `- **${key}**: ${value}`)
        .join('\n'),
    ];

    return sections.join('\n');
  }

  /**
   * Export configuration to different formats
   */
  static exportConfig(config: ProveConfig, format: 'json' | 'yaml' | 'env'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(config, null, 2);
      case 'yaml':
        return this.toYaml(config);
      case 'env':
        return this.toEnv(config);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert configuration to YAML format
   */
  private static toYaml(config: ProveConfig): string {
    // Simple YAML conversion - in production, use a proper YAML library
    const lines: string[] = [];
    
    const convertObject = (obj: any, indent = 0): void => {
      const spaces = '  '.repeat(indent);
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          lines.push(`${spaces}${key}:`);
          convertObject(value, indent + 1);
        } else if (Array.isArray(value)) {
          lines.push(`${spaces}${key}:`);
          value.forEach(item => {
            lines.push(`${spaces}  - ${item}`);
          });
        } else {
          lines.push(`${spaces}${key}: ${value}`);
        }
      }
    };
    
    convertObject(config);
    return lines.join('\n');
  }

  /**
   * Convert configuration to environment variables format
   */
  private static toEnv(config: ProveConfig): string {
    const lines: string[] = [];
    
    const convertObject = (obj: any, prefix = 'PROVE'): void => {
      for (const [key, value] of Object.entries(obj)) {
        const envKey = `${prefix}_${key.toUpperCase()}`;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          convertObject(value, envKey);
        } else if (Array.isArray(value)) {
          lines.push(`${envKey}="${value.join(',')}"`);
        } else {
          lines.push(`${envKey}=${value}`);
        }
      }
    };
    
    convertObject(config);
    return lines.join('\n');
  }
}
