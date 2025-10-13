// Zod-backed config (thresholds, toggles, paths)
// Loads and validates configuration with fallbacks

import { z } from 'zod';
import { defaultConfig, type ProveConfig } from './prove.config.js';
import { logger } from './logger.js';

// Zod schema for configuration validation
const ConfigSchema = z.object({
  thresholds: z.object({
    diffCoverageFunctional: z.number().min(0).max(100),
    diffCoverageFunctionalRefactor: z.number().min(0).max(100),
    globalCoverage: z.number().min(0).max(100),
    maxWarnings: z.number().min(0),
  }),
  paths: z.object({
    srcGlobs: z.array(z.string()),
    testGlobs: z.array(z.string()),
    coverageFile: z.string(),
    proveReportFile: z.string(),
  }),
  git: z.object({
    baseRefFallback: z.string(),
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

type ConfigInput = z.infer<typeof ConfigSchema>;

// Load configuration from file or environment
function loadConfigFromFile(): Partial<ConfigInput> {
  try {
    // Try to load from prove.config.ts (already imported as defaultConfig)
    return defaultConfig;
  } catch (error) {
    logger.info('No custom config file found, using defaults');
    return {};
  }
}

// Load configuration from environment variables
function loadConfigFromEnv(): Partial<ConfigInput> {
  const envConfig: Partial<ConfigInput> = {};

  // Thresholds from environment
  if (process.env.PROVE_DIFF_COVERAGE_FUNCTIONAL) {
    envConfig.thresholds = {
      ...defaultConfig.thresholds,
      diffCoverageFunctional: parseInt(process.env.PROVE_DIFF_COVERAGE_FUNCTIONAL, 10),
    };
  }

  if (process.env.PROVE_GLOBAL_COVERAGE) {
    envConfig.thresholds = {
      ...envConfig.thresholds || defaultConfig.thresholds,
      globalCoverage: parseInt(process.env.PROVE_GLOBAL_COVERAGE, 10),
    };
  }

  // Toggles from environment
  if (process.env.PROVE_ENABLE_COVERAGE !== undefined) {
    envConfig.toggles = {
      ...defaultConfig.toggles,
      coverage: process.env.PROVE_ENABLE_COVERAGE === 'true',
    };
  }

  if (process.env.PROVE_ENABLE_DIFF_COVERAGE !== undefined) {
    envConfig.toggles = {
      ...envConfig.toggles || defaultConfig.toggles,
      diffCoverage: process.env.PROVE_ENABLE_DIFF_COVERAGE === 'true',
    };
  }

  // Runner concurrency from environment
  if (process.env.PROVE_CONCURRENCY) {
    envConfig.runner = {
      ...defaultConfig.runner,
      concurrency: parseInt(process.env.PROVE_CONCURRENCY, 10),
    };
  }

  return envConfig;
}

// Merge configurations with proper precedence
function mergeConfigs(
  defaults: ConfigInput,
  fileConfig: Partial<ConfigInput>,
  envConfig: Partial<ConfigInput>
): ConfigInput {
  return {
    ...defaults,
    ...fileConfig,
    ...envConfig,
    // Deep merge nested objects
    thresholds: {
      ...defaults.thresholds,
      ...fileConfig.thresholds,
      ...envConfig.thresholds,
    },
    paths: {
      ...defaults.paths,
      ...fileConfig.paths,
      ...envConfig.paths,
    },
    git: {
      ...defaults.git,
      ...fileConfig.git,
      ...envConfig.git,
    },
    runner: {
      ...defaults.runner,
      ...fileConfig.runner,
      ...envConfig.runner,
    },
    toggles: {
      ...defaults.toggles,
      ...fileConfig.toggles,
      ...envConfig.toggles,
    },
    modes: {
      ...defaults.modes,
      ...fileConfig.modes,
      ...envConfig.modes,
    },
    checkTimeouts: {
      ...defaults.checkTimeouts,
      ...fileConfig.checkTimeouts,
      ...envConfig.checkTimeouts,
    },
  };
}

// Load and validate configuration
export function loadConfig(): ProveConfig {
  try {
    const fileConfig = loadConfigFromFile();
    const envConfig = loadConfigFromEnv();
    const mergedConfig = mergeConfigs(defaultConfig, fileConfig, envConfig);

    // Validate the merged configuration
    const validatedConfig = ConfigSchema.parse(mergedConfig);

    logger.info('Configuration loaded successfully', {
      thresholds: validatedConfig.thresholds,
      toggles: validatedConfig.toggles,
      concurrency: validatedConfig.runner.concurrency,
    });

    return validatedConfig as ProveConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Configuration validation failed', {
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          received: e.received,
        })),
      });
    } else {
      logger.error('Failed to load configuration', { error: error instanceof Error ? error.message : String(error) });
    }
    throw error;
  }
}

// Export the loaded configuration
export const config = loadConfig();

// Export types for use in other modules
export type { ProveConfig };