// Zod-backed config (thresholds, toggles, paths)
// Loads and validates configuration with fallbacks

import { z } from 'zod';
import { defaultConfig, type ProveConfig } from './prove.config.js';
import { logger } from './logger.js';
import { ThresholdsSchema } from './config/schemas/thresholds.js';
import { PathsSchema } from './config/schemas/paths.js';
import { TogglesSchema } from './config/schemas/toggles.js';
import { FeatureFlagsSchema } from './config/schemas/feature-flags.js';
import { KillSwitchSchema } from './config/schemas/kill-switch.js';
import { GitSchema } from './config/schemas/git.js';
import { RunnerSchema } from './config/schemas/runner.js';
import { ModesSchema } from './config/schemas/modes.js';
import { CheckTimeoutsSchema } from './config/schemas/check-timeouts.js';

// Enhanced Zod schema for configuration validation using modular schemas
const ConfigSchema = z.object({
  thresholds: ThresholdsSchema,
  paths: PathsSchema,
  git: GitSchema,
  runner: RunnerSchema,
  toggles: TogglesSchema,
  featureFlags: FeatureFlagsSchema,
  killSwitch: KillSwitchSchema,
  modes: ModesSchema,
  checkTimeouts: CheckTimeoutsSchema,
});

type ConfigInput = z.infer<typeof ConfigSchema>;

// Load configuration from file or environment
function loadConfigFromFile(): Partial<ConfigInput> {
  try {
    // Try to load from prove.config.ts (already imported as defaultConfig)
    return defaultConfig;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
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

  if (process.env.PROVE_ENABLE_SECURITY !== undefined) {
    envConfig.toggles = {
      ...envConfig.toggles || defaultConfig.toggles,
      security: process.env.PROVE_ENABLE_SECURITY === 'true',
    };
  }

  if (process.env.PROVE_ENABLE_CONTRACTS !== undefined) {
    envConfig.toggles = {
      ...envConfig.toggles || defaultConfig.toggles,
      contracts: process.env.PROVE_ENABLE_CONTRACTS === 'true',
    };
  }

  if (process.env.PROVE_ENABLE_DB_MIGRATIONS !== undefined) {
    envConfig.toggles = {
      ...envConfig.toggles || defaultConfig.toggles,
      dbMigrations: process.env.PROVE_ENABLE_DB_MIGRATIONS === 'true',
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

// Merge configurations with proper precedence and deep merging
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
    featureFlags: {
      ...defaults.featureFlags,
      ...fileConfig.featureFlags,
      ...envConfig.featureFlags,
    },
    killSwitch: {
      ...defaults.killSwitch,
      ...fileConfig.killSwitch,
      ...envConfig.killSwitch,
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