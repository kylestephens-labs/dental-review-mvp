// Central thresholds/toggles configuration
// Default configuration values for prove quality gates
// Enhanced with comprehensive validation and documentation

import { z } from 'zod';
import { logger } from './logger.js';

// Configuration validation schemas
const ConfigValidationSchema = z.object({
  thresholds: z.object({
    diffCoverageFunctional: z.number().min(0).max(100),
    diffCoverageFunctionalRefactor: z.number().min(0).max(100),
    globalCoverage: z.number().min(0).max(100),
    maxWarnings: z.number().min(0),
    maxCommitSize: z.number().min(1),
  }),
  paths: z.object({
    srcGlobs: z.array(z.string()).min(1),
    testGlobs: z.array(z.string()).min(1),
    coverageFile: z.string().min(1),
    proveReportFile: z.string().min(1),
  }),
  git: z.object({
    baseRefFallback: z.string().min(1),
    requireMainBranch: z.boolean(),
    enablePreConflictCheck: z.boolean(),
  }),
  runner: z.object({
    concurrency: z.number().min(1).max(20),
    timeout: z.number().min(1000),
    failFast: z.boolean(),
  }),
  toggles: z.object({
    coverage: z.boolean(),
    diffCoverage: z.boolean(),
    sizeBudget: z.boolean(),
    security: z.boolean(),
    contracts: z.boolean(),
    dbMigrations: z.boolean(),
  }),
  featureFlags: z.object({
    enableTelemetry: z.boolean(),
    enableRolloutValidation: z.boolean(),
    enableSharedDetection: z.boolean(),
    registryCacheTimeout: z.number().min(1000).max(300000),
    detectionTimeout: z.number().min(1000).max(60000),
    enableGradualRolloutValidation: z.boolean(),
    enableFlagRegistrationValidation: z.boolean(),
  }),
  killSwitch: z.object({
    enableRegistrationValidation: z.boolean(),
    enableEnhancedPatterns: z.boolean(),
    enableSharedDetection: z.boolean(),
    enableRolloutValidation: z.boolean(),
    enableErrorMessages: z.boolean(),
    patternDetectionTimeout: z.number().min(1000).max(30000),
  }),
  modes: z.object({
    functional: z.object({
      requireTdd: z.boolean(),
      requireDiffCoverage: z.boolean(),
      requireTests: z.boolean(),
    }),
    nonFunctional: z.object({
      requireProblemAnalysis: z.boolean(),
      requireProblemAnalysisMinLength: z.number().min(0),
      requireTdd: z.boolean(),
      requireDiffCoverage: z.boolean(),
      requireTests: z.boolean(),
    }),
  }),
  checkTimeouts: z.object({
    typecheck: z.number().min(1000),
    lint: z.number().min(1000),
    tests: z.number().min(1000),
    build: z.number().min(1000),
    coverage: z.number().min(1000),
  }),
});

export const defaultConfig = {
  // Thresholds
  thresholds: {
    diffCoverageFunctional: 85, // 85% coverage required for functional tasks
    diffCoverageFunctionalRefactor: 60, // 60% for refactor tasks
    globalCoverage: 25, // Global coverage threshold (adjusted for current state)
    maxWarnings: 0, // ESLint max warnings
    maxCommitSize: 1000, // Temporarily increased for re-enabling quality gates
  },

  // Paths
  paths: {
    srcGlobs: ['src/**/*.{ts,tsx,js,jsx}'],
    testGlobs: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}', 'tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    coverageFile: 'coverage/coverage-final.json',
    proveReportFile: 'prove-report.json',
  },

  // Git configuration
  git: {
    baseRefFallback: 'origin/main',
    requireMainBranch: true,
    enablePreConflictCheck: true,
  },

  // Runner configuration
  runner: {
    concurrency: 4, // Max parallel checks
    timeout: 300000, // 5 minutes timeout per check
    failFast: true, // Stop on first failure
  },

  // Feature toggles
  toggles: {
    coverage: true, // Enable global coverage check
    diffCoverage: true, // Enable diff coverage check
    sizeBudget: false, // Enable bundle size checks
    security: true, // Enable security scans
    contracts: true, // Enable API contract validation
    dbMigrations: false, // Enable database migration checks
    tdd: true, // Enable TDD check
  },

  // Feature flag configuration
  featureFlags: {
    enableTelemetry: true, // Enable telemetry collection for feature flags
    enableRolloutValidation: true, // Enable rollout configuration validation
    enableSharedDetection: true, // Use shared detection utilities
    registryCacheTimeout: 30000, // 30 seconds cache timeout for flag registry
    detectionTimeout: 10000, // 10 seconds timeout for pattern detection
    enableGradualRolloutValidation: true, // Enable gradual rollout safety checks
    enableFlagRegistrationValidation: true, // Enable flag registration validation
  },

  // Kill-switch configuration
  killSwitch: {
    enableRegistrationValidation: true, // Enable kill-switch flag registration validation
    enableEnhancedPatterns: true, // Enable enhanced pattern detection
    enableSharedDetection: true, // Use shared detection utilities
    enableRolloutValidation: true, // Enable rollout validation for kill-switches
    enableErrorMessages: true, // Enable enhanced error messages
    patternDetectionTimeout: 5000, // 5 seconds timeout for pattern detection
  },

  // Mode-specific settings
  modes: {
    functional: {
      requireTdd: true,
      requireDiffCoverage: true,
      requireTests: true,
    },
    nonFunctional: {
      requireProblemAnalysis: true,
      requireProblemAnalysisMinLength: 200,
      requireTdd: false,
      requireDiffCoverage: false,
      requireTests: false,
    },
  },

  // Check-specific timeouts (ms)
  checkTimeouts: {
    typecheck: 60000, // 1 minute
    lint: 30000, // 30 seconds
    tests: 120000, // 2 minutes
    build: 180000, // 3 minutes
    coverage: 60000, // 1 minute
  },
} as const;

export type ProveConfig = typeof defaultConfig;

/**
 * Validate configuration against schema
 */
export function validateConfig(config: ProveConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    ConfigValidationSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
    }
  }

  // Additional validation checks
  if (config.thresholds.diffCoverageFunctional < 80) {
    warnings.push('Consider higher coverage threshold for functional tasks (recommended: 80%+)');
  }

  if (config.thresholds.globalCoverage < 30) {
    warnings.push('Consider higher global coverage threshold (recommended: 30%+)');
  }

  if (config.runner.concurrency > 8) {
    warnings.push('High concurrency may impact performance (recommended: ≤8)');
  }

  if (config.runner.timeout > 300000) {
    warnings.push('Long timeouts may delay feedback (recommended: ≤300s)');
  }

  if (!config.toggles.security) {
    warnings.push('Security checks are disabled - consider enabling for better code quality');
  }

  if (config.thresholds.maxCommitSize > 500) {
    warnings.push('Large commit size may impact code review quality (recommended: ≤500 lines)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get configuration documentation
 */
export function getConfigDocumentation(): string {
  return `
# Prove Configuration Documentation

## Overview
This configuration defines the behavior and thresholds for the Prove Quality Gates system.

## Thresholds
- **Diff Coverage (Functional)**: ${defaultConfig.thresholds.diffCoverageFunctional}% - Coverage required for functional tasks
- **Diff Coverage (Refactor)**: ${defaultConfig.thresholds.diffCoverageFunctionalRefactor}% - Coverage required for refactor tasks
- **Global Coverage**: ${defaultConfig.thresholds.globalCoverage}% - Minimum global coverage threshold
- **Max Warnings**: ${defaultConfig.thresholds.maxWarnings} - Maximum ESLint warnings allowed
- **Max Commit Size**: ${defaultConfig.thresholds.maxCommitSize} lines - Maximum lines per commit

## Toggles
- **Coverage**: ${defaultConfig.toggles.coverage ? 'Enabled' : 'Disabled'} - Global coverage check
- **Diff Coverage**: ${defaultConfig.toggles.diffCoverage ? 'Enabled' : 'Disabled'} - Diff coverage check
- **Size Budget**: ${defaultConfig.toggles.sizeBudget ? 'Enabled' : 'Disabled'} - Bundle size checks
- **Security**: ${defaultConfig.toggles.security ? 'Enabled' : 'Disabled'} - Security scans
- **Contracts**: ${defaultConfig.toggles.contracts ? 'Enabled' : 'Disabled'} - API contract validation
- **DB Migrations**: ${defaultConfig.toggles.dbMigrations ? 'Enabled' : 'Disabled'} - Database migration checks

## Runner Configuration
- **Concurrency**: ${defaultConfig.runner.concurrency} - Maximum parallel checks
- **Timeout**: ${defaultConfig.runner.timeout}ms - Timeout per check
- **Fail Fast**: ${defaultConfig.runner.failFast ? 'Enabled' : 'Disabled'} - Stop on first failure

## Feature Flags
- **Telemetry**: ${defaultConfig.featureFlags.enableTelemetry ? 'Enabled' : 'Disabled'} - Telemetry collection
- **Rollout Validation**: ${defaultConfig.featureFlags.enableRolloutValidation ? 'Enabled' : 'Disabled'} - Rollout configuration validation
- **Shared Detection**: ${defaultConfig.featureFlags.enableSharedDetection ? 'Enabled' : 'Disabled'} - Shared detection utilities
- **Registry Cache Timeout**: ${defaultConfig.featureFlags.registryCacheTimeout}ms - Flag registry cache timeout
- **Detection Timeout**: ${defaultConfig.featureFlags.detectionTimeout}ms - Pattern detection timeout
- **Gradual Rollout Validation**: ${defaultConfig.featureFlags.enableGradualRolloutValidation ? 'Enabled' : 'Disabled'} - Gradual rollout safety checks
- **Flag Registration Validation**: ${defaultConfig.featureFlags.enableFlagRegistrationValidation ? 'Enabled' : 'Disabled'} - Flag registration validation

## Kill-Switch Configuration
- **Registration Validation**: ${defaultConfig.killSwitch.enableRegistrationValidation ? 'Enabled' : 'Disabled'} - Kill-switch flag registration validation
- **Enhanced Patterns**: ${defaultConfig.killSwitch.enableEnhancedPatterns ? 'Enabled' : 'Disabled'} - Enhanced pattern detection
- **Shared Detection**: ${defaultConfig.killSwitch.enableSharedDetection ? 'Enabled' : 'Disabled'} - Shared detection utilities
- **Rollout Validation**: ${defaultConfig.killSwitch.enableRolloutValidation ? 'Enabled' : 'Disabled'} - Rollout validation for kill-switches
- **Error Messages**: ${defaultConfig.killSwitch.enableErrorMessages ? 'Enabled' : 'Disabled'} - Enhanced error messages
- **Pattern Detection Timeout**: ${defaultConfig.killSwitch.patternDetectionTimeout}ms - Pattern detection timeout

## Mode-Specific Settings

### Functional Mode
- **Require TDD**: ${defaultConfig.modes.functional.requireTdd ? 'Yes' : 'No'} - Test-driven development required
- **Require Diff Coverage**: ${defaultConfig.modes.functional.requireDiffCoverage ? 'Yes' : 'No'} - Diff coverage required
- **Require Tests**: ${defaultConfig.modes.functional.requireTests ? 'Yes' : 'No'} - Tests required

### Non-Functional Mode
- **Require Problem Analysis**: ${defaultConfig.modes.nonFunctional.requireProblemAnalysis ? 'Yes' : 'No'} - Problem analysis required
- **Min Analysis Length**: ${defaultConfig.modes.nonFunctional.requireProblemAnalysisMinLength} characters - Minimum problem analysis length
- **Require TDD**: ${defaultConfig.modes.nonFunctional.requireTdd ? 'Yes' : 'No'} - Test-driven development required
- **Require Diff Coverage**: ${defaultConfig.modes.nonFunctional.requireDiffCoverage ? 'Yes' : 'No'} - Diff coverage required
- **Require Tests**: ${defaultConfig.modes.nonFunctional.requireTests ? 'Yes' : 'No'} - Tests required

## Check Timeouts
- **Typecheck**: ${defaultConfig.checkTimeouts.typecheck}ms - TypeScript type checking
- **Lint**: ${defaultConfig.checkTimeouts.lint}ms - ESLint checking
- **Tests**: ${defaultConfig.checkTimeouts.tests}ms - Test execution
- **Build**: ${defaultConfig.checkTimeouts.build}ms - Build process
- **Coverage**: ${defaultConfig.checkTimeouts.coverage}ms - Coverage analysis

## Environment Variables
You can override configuration values using environment variables:
- \`PROVE_DIFF_COVERAGE_FUNCTIONAL\` - Override functional diff coverage threshold
- \`PROVE_GLOBAL_COVERAGE\` - Override global coverage threshold
- \`PROVE_ENABLE_COVERAGE\` - Enable/disable coverage checks
- \`PROVE_ENABLE_DIFF_COVERAGE\` - Enable/disable diff coverage checks
- \`PROVE_ENABLE_SECURITY\` - Enable/disable security checks
- \`PROVE_ENABLE_CONTRACTS\` - Enable/disable contract validation
- \`PROVE_ENABLE_DB_MIGRATIONS\` - Enable/disable database migration checks
- \`PROVE_CONCURRENCY\` - Override runner concurrency
`;
}

/**
 * Initialize configuration with validation
 */
export function initializeConfig(): ProveConfig {
  const validation = validateConfig(defaultConfig);
  
  if (!validation.isValid) {
    logger.error('Configuration validation failed', { errors: validation.errors });
    throw new Error('Invalid configuration');
  }

  if (validation.warnings.length > 0) {
    logger.warn('Configuration warnings', { warnings: validation.warnings });
  }

  logger.info('Configuration initialized successfully', {
    thresholds: defaultConfig.thresholds,
    toggles: defaultConfig.toggles,
    concurrency: defaultConfig.runner.concurrency,
  });

  return defaultConfig;
}