import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface FeatureFlagLintResult {
  ok: boolean;
  reason?: string;
  details?: {
    unregisteredFlags: string[];
    missingOwnerFlags: string[];
    missingExpiryFlags: string[];
    totalFlags: number;
    registeredFlags: number;
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

    // Find all feature flag usage in the codebase
    const flagUsages = await findFeatureFlagUsages(workingDirectory);
    logger.info(`Found ${flagUsages.length} feature flag usages`, { flagUsages });

    // Load registered flags from both frontend and backend
    const frontendFlags = await loadFrontendFlags(workingDirectory);
    const backendFlags = await loadBackendFlags(workingDirectory);
    
    const allRegisteredFlags = { ...frontendFlags, ...backendFlags };
    const registeredFlagNames = new Set(Object.keys(allRegisteredFlags));

    logger.info(`Loaded ${Object.keys(allRegisteredFlags).length} registered flags`, {
      frontend: Object.keys(frontendFlags).length,
      backend: Object.keys(backendFlags).length
    });

    // Check for unregistered flags
    const unregisteredFlags = flagUsages.filter(flag => !registeredFlagNames.has(flag));
    
    // Check for flags missing required fields
    const missingOwnerFlags: string[] = [];
    const missingExpiryFlags: string[] = [];

    for (const [flagName, flagDef] of Object.entries(allRegisteredFlags)) {
      if (!flagDef.owner) {
        missingOwnerFlags.push(flagName);
      }
      if (!flagDef.expiry) {
        missingExpiryFlags.push(flagName);
      }
    }

    const hasErrors = unregisteredFlags.length > 0 || missingOwnerFlags.length > 0 || missingExpiryFlags.length > 0;

    if (hasErrors) {
      const reason = [
        unregisteredFlags.length > 0 ? `Unregistered flags: ${unregisteredFlags.join(', ')}` : null,
        missingOwnerFlags.length > 0 ? `Flags missing owner: ${missingOwnerFlags.join(', ')}` : null,
        missingExpiryFlags.length > 0 ? `Flags missing expiry: ${missingExpiryFlags.join(', ')}` : null
      ].filter(Boolean).join('; ');

      logger.error('Feature flag lint check failed', {
        unregisteredFlags,
        missingOwnerFlags,
        missingExpiryFlags,
        totalFlags: flagUsages.length,
        registeredFlags: registeredFlagNames.size
      });

      return {
        ok: false,
        reason,
        details: {
          unregisteredFlags,
          missingOwnerFlags,
          missingExpiryFlags,
          totalFlags: flagUsages.length,
          registeredFlags: registeredFlagNames.size
        }
      };
    }

    logger.success('Feature flag lint check passed', {
      message: 'All feature flags are properly registered with owner and expiry',
      totalFlags: flagUsages.length,
      registeredFlags: registeredFlagNames.size
    });

    return {
      ok: true,
      details: {
        unregisteredFlags: [],
        missingOwnerFlags: [],
        missingExpiryFlags: [],
        totalFlags: flagUsages.length,
        registeredFlags: registeredFlagNames.size
      }
    };

  } catch (error) {
    const reason = `Feature flag lint check failed: ${error instanceof Error ? error.message : String(error)}`;
    
    logger.error('Feature flag lint check failed with error', {
      error: reason
    });

    return {
      ok: false,
      reason,
      details: error
    };
  }
}

/**
 * Find all feature flag usages in the codebase
 */
async function findFeatureFlagUsages(workingDirectory: string): Promise<string[]> {
  try {
    // Search for isEnabled('FLAG_NAME') patterns, excluding test files and comments
    const result = await exec('grep', [
      '-r',
      '--include=*.ts',
      '--include=*.tsx',
      '--include=*.js',
      '--include=*.jsx',
      '--exclude-dir=node_modules',
      '--exclude-dir=.git',
      '--exclude-dir=dist',
      '--exclude-dir=build',
      '--exclude-dir=__tests__',
      '--exclude=*.test.*',
      '--exclude=*.spec.*',
      '-v', // Exclude lines that start with comment markers
      '^\\s*//',
      '-E',
      "isEnabled\\s*\\(\\s*['\"`]([^'\"`]+)['\"`]",
      '.'
    ], {
      timeout: 30000,
      cwd: workingDirectory
    });

    if (!result.success) {
      // If grep fails, try a different approach
      return await findFeatureFlagUsagesAlternative(workingDirectory);
    }

    // Extract flag names from the grep output
    const flagNames = new Set<string>();
    const lines = result.stdout.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const match = line.match(/isEnabled\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (match && match[1]) {
        flagNames.add(match[1]);
      }
    }

    return Array.from(flagNames);

  } catch (error) {
    logger.warn('Failed to use grep for feature flag detection, trying alternative method', {
      error: error instanceof Error ? error.message : String(error)
    });
    return await findFeatureFlagUsagesAlternative(workingDirectory);
  }
}

/**
 * Alternative method to find feature flag usages using file reading
 */
async function findFeatureFlagUsagesAlternative(workingDirectory: string): Promise<string[]> {
  const flagNames = new Set<string>();
  
  try {
    // This is a simplified approach - in a real implementation, you'd want to
    // recursively search through all TypeScript/JavaScript files
    const result = await exec('find', [
      '.',
      '-name',
      '*.ts',
      '-o',
      '-name',
      '*.tsx',
      '-o',
      '-name',
      '*.js',
      '-o',
      '-name',
      '*.jsx'
    ], {
      timeout: 30000,
      cwd: workingDirectory
    });

    if (!result.success) {
      return [];
    }

    const files = result.stdout.split('\n').filter(file => file.trim());
    
    for (const file of files.slice(0, 10)) { // Limit to first 10 files for performance
      try {
        const content = await readFile(join(workingDirectory, file), 'utf-8');
        const matches = content.match(/isEnabled\s*\(\s*['"`]([^'"`]+)['"`]/g);
        if (matches) {
          for (const match of matches) {
            const flagMatch = match.match(/isEnabled\s*\(\s*['"`]([^'"`]+)['"`]/);
            if (flagMatch && flagMatch[1]) {
              flagNames.add(flagMatch[1]);
            }
          }
        }
      } catch {
        // Skip files that can't be read
        continue;
      }
    }

    return Array.from(flagNames);

  } catch (error) {
    logger.warn('Alternative feature flag detection also failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}

/**
 * Load frontend flags from frontend/src/flags.ts
 */
async function loadFrontendFlags(workingDirectory: string): Promise<Record<string, unknown>> {
  try {
    const flagsPath = join(workingDirectory, 'frontend', 'src', 'flags.ts');
    const content = await readFile(flagsPath, 'utf-8');
    
    // Extract FRONTEND_FLAGS object using regex
    const match = content.match(/export const FRONTEND_FLAGS[^=]*=\s*{([\s\S]*?)};/);
    if (!match) {
      return {};
    }

    // This is a simplified parser - in a real implementation, you'd want to use
    // a proper TypeScript parser to extract the object
    const flags: Record<string, unknown> = {};
    
    // Look for flag definitions in the content
    const flagMatches = content.matchAll(/(\w+):\s*{[\s\S]*?name:\s*['"`](\w+)['"`][\s\S]*?owner:\s*['"`]([^'"`]+)['"`][\s\S]*?expiry:\s*['"`]([^'"`]+)['"`][\s\S]*?default:\s*(true|false)/g);
    
    for (const match of flagMatches) {
      const [, , name, owner, expiry, defaultVal] = match;
      flags[name] = {
        name,
        owner,
        expiry,
        default: defaultVal === 'true'
      };
    }

    return flags;

  } catch (error) {
    logger.warn('Failed to load frontend flags', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {};
  }
}

/**
 * Load backend flags from backend/src/flags.ts
 */
async function loadBackendFlags(workingDirectory: string): Promise<Record<string, unknown>> {
  try {
    const flagsPath = join(workingDirectory, 'backend', 'src', 'flags.ts');
    const content = await readFile(flagsPath, 'utf-8');
    
    // Extract BACKEND_FLAGS object using regex
    const match = content.match(/export const BACKEND_FLAGS[^=]*=\s*{([\s\S]*?)};/);
    if (!match) {
      return {};
    }

    // This is a simplified parser - in a real implementation, you'd want to use
    // a proper TypeScript parser to extract the object
    const flags: Record<string, unknown> = {};
    
    // Look for flag definitions in the content
    const flagMatches = content.matchAll(/(\w+):\s*{[\s\S]*?name:\s*['"`](\w+)['"`][\s\S]*?owner:\s*['"`]([^'"`]+)['"`][\s\S]*?expiry:\s*['"`]([^'"`]+)['"`][\s\S]*?default:\s*(true|false)/g);
    
    for (const match of flagMatches) {
      const [, , name, owner, expiry, defaultVal] = match;
      flags[name] = {
        name,
        owner,
        expiry,
        default: defaultVal === 'true'
      };
    }

    return flags;

  } catch (error) {
    logger.warn('Failed to load backend flags', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {};
  }
}
