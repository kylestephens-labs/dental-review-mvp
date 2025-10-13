import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface KillswitchRequiredResult {
  ok: boolean;
  reason?: string;
  details?: {
    isFeatureCommit: boolean;
    touchesProductionCode: boolean;
    hasKillSwitch: boolean;
    changedFiles: string[];
    killSwitchPatterns: string[];
  };
}

/**
 * Check if feature commits require kill switches
 * @param context - Prove context
 * @returns Promise<KillswitchRequiredResult> - Check result
 */
export async function checkKillswitchRequired(context: ProveContext): Promise<KillswitchRequiredResult> {
  logger.info('Checking kill-switch requirements for feature commits...');

  try {
    const { workingDirectory } = context;
    
    // Get files changed in the current commit only
    const changedFilesResult = await exec('git', ['diff', '--name-only', 'HEAD~1', 'HEAD'], {
      timeout: 10000,
      cwd: workingDirectory
    });
    
    if (!changedFilesResult.success) {
      return {
        ok: false,
        reason: `Failed to get changed files: ${changedFilesResult.stderr}`,
        details: {
          isFeatureCommit: false,
          touchesProductionCode: false,
          hasKillSwitch: false,
          changedFiles: [],
          killSwitchPatterns: []
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
          killSwitchPatterns: []
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
          killSwitchPatterns: []
        }
      };
    }

    logger.info('Feature commit detected, checking for production code changes', {
      commitMessage: commitMessage.substring(0, 50) + '...'
    });

    // Check if any changed files are production code
    const productionCodePatterns = [
      /^src\//,           // Frontend source code
      /^backend\/src\//,  // Backend source code
      /^api\//,           // API code
      /^lib\//,           // Library code
      /^components\//,    // React components
      /^pages\//,         // Next.js pages
      /^app\//,           // App directory
      /\.(ts|tsx|js|jsx)$/ // TypeScript/JavaScript files
    ];

    const productionFiles = changedFiles.filter(file => 
      productionCodePatterns.some(pattern => pattern.test(file))
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
          killSwitchPatterns: []
        }
      };
    }

    logger.info('Feature commit touches production code, checking for kill switches', {
      productionFiles: productionFiles
    });

    // Search for kill switch patterns in changed files
    const killSwitchPatterns = [
      /isEnabled\s*\(\s*['"`][^'"`]+['"`]\s*\)/g,  // Feature flag usage
      /KILL_SWITCH_/g,                             // Kill switch constants
      /featureFlag\s*[=:]/g,                       // Feature flag assignments
      /toggle\s*[=:]/g,                            // Toggle assignments
      /config\s*[=:].*enabled/g,                   // Config enabled flags
      /process\.env\.[A-Z_]+_ENABLED/g,            // Environment variable flags
      /import.*flags/g,                            // Flag imports
      /from.*flags/g                               // Flag imports
    ];

    const foundKillSwitches: string[] = [];

    for (const file of productionFiles) {
      try {
        const filePath = join(workingDirectory, file);
        const content = await readFile(filePath, 'utf-8');
        
        for (const pattern of killSwitchPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            foundKillSwitches.push(...matches);
          }
        }
      } catch (error) {
        logger.warn(`Failed to read file ${file}`, {
          error: error instanceof Error ? error.message : String(error)
        });
        continue;
      }
    }

    const hasKillSwitch = foundKillSwitches.length > 0;

    if (!hasKillSwitch) {
      const reason = `Feature commit touches production code but lacks kill switch. Found ${productionFiles.length} production files but no feature flags, toggles, or kill switches.`;
      
      logger.error('Kill-switch check failed', {
        isFeatureCommit: true,
        touchesProductionCode: true,
        hasKillSwitch: false,
        productionFiles: productionFiles,
        changedFiles: changedFiles
      });

      return {
        ok: false,
        reason,
        details: {
          isFeatureCommit: true,
          touchesProductionCode: true,
          hasKillSwitch: false,
          changedFiles: changedFiles,
          killSwitchPatterns: []
        }
      };
    }

    logger.success('Kill-switch check passed', {
      message: 'Feature commit includes kill switches',
      isFeatureCommit: true,
      touchesProductionCode: true,
      hasKillSwitch: true,
      killSwitchCount: foundKillSwitches.length,
      productionFiles: productionFiles
    });

    return {
      ok: true,
      details: {
        isFeatureCommit: true,
        touchesProductionCode: true,
        hasKillSwitch: true,
        changedFiles: changedFiles,
        killSwitchPatterns: foundKillSwitches
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
        killSwitchPatterns: []
      }
    };
  }
}
