// Check: preConflict.ts
// Dry-merge with origin/main to detect conflicts

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';

export interface PreConflictCheckResult {
  ok: boolean;
  reason?: string;
  conflicts?: string[];
}

/**
 * Perform dry merge with origin/main to detect conflicts
 * @param context - Prove context
 * @returns Promise<PreConflictCheckResult> - Check result
 */
export async function checkPreConflict(context: ProveContext): Promise<PreConflictCheckResult> {
  const startTime = Date.now();
  
  try {
    logger.info('Checking for merge conflicts with origin/main...');
    
    // Step 1: Fetch latest changes from origin
    logger.info('Fetching latest changes from origin...');
    const fetchResult = await exec('git', ['fetch', '--prune'], {
      cwd: context.workingDirectory,
      timeout: 30000, // 30 second timeout for fetch
    });
    
    if (!fetchResult.success) {
      const reason = `Failed to fetch from origin: ${fetchResult.stderr}`;
      logger.error('Pre-conflict check failed - fetch error', {
        reason,
        stderr: fetchResult.stderr,
      });
      
      return {
        ok: false,
        reason,
      };
    }
    
    logger.success('Successfully fetched from origin');
    
    // Step 2: Perform dry merge with origin/main
    logger.info('Performing dry merge with origin/main...');
    const mergeResult = await exec('git', ['merge', '--no-commit', '--no-ff', 'origin/main'], {
      cwd: context.workingDirectory,
      timeout: 60000, // 60 second timeout for merge
    });
    
    if (!mergeResult.success) {
      // Merge failed - this indicates conflicts
      const reason = `Merge conflicts detected with origin/main: ${mergeResult.stderr}`;
      
      // Try to get more details about the conflicts
      const statusResult = await exec('git', ['status', '--porcelain'], {
        cwd: context.workingDirectory,
        timeout: 10000,
      });
      
      const conflicts: string[] = [];
      if (statusResult.success) {
        const conflictFiles = statusResult.stdout
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('UU') || line.startsWith('AA') || line.startsWith('DD'))
          .map(line => line.substring(3)); // Remove the status prefix
        
        conflicts.push(...conflictFiles);
      }
      
      logger.error('Pre-conflict check failed - merge conflicts detected', {
        reason,
        conflicts,
        stderr: mergeResult.stderr,
      });
      
      // CRITICAL: Abort the merge immediately to avoid leaving repo in conflicted state
      const abortResult = await exec('git', ['merge', '--abort'], {
        cwd: context.workingDirectory,
        timeout: 10000,
      });
      
      if (!abortResult.success) {
        logger.warn('Failed to abort merge after conflict detection', {
          stderr: abortResult.stderr,
        });
      } else {
        logger.info('Successfully aborted merge after conflict detection');
      }
      
      return {
        ok: false,
        reason,
        conflicts,
      };
    }
    
    // Step 3: Merge succeeded - abort the merge to keep working directory clean
    logger.info('Dry merge successful - aborting merge to keep working directory clean...');
    const abortResult = await exec('git', ['merge', '--abort'], {
      cwd: context.workingDirectory,
      timeout: 10000,
    });
    
    if (!abortResult.success) {
      logger.warn('Failed to abort merge, but this is not critical', {
        stderr: abortResult.stderr,
      });
    } else {
      logger.success('Successfully aborted merge');
    }
    
    // Success - no conflicts detected
    logger.success('Pre-conflict check passed', {
      message: 'No merge conflicts detected with origin/main',
      duration: Date.now() - startTime,
    });
    
    return {
      ok: true,
    };
    
  } catch (error) {
    const reason = `Pre-conflict check failed with error: ${error instanceof Error ? error.message : String(error)}`;
    
    logger.error('Pre-conflict check failed with exception', {
      error: reason,
      duration: Date.now() - startTime,
    });
    
    // Try to clean up any partial merge state
    try {
      await exec('git', ['merge', '--abort'], {
        cwd: context.workingDirectory,
        timeout: 5000,
      });
    } catch (cleanupError) {
      logger.warn('Failed to clean up merge state', {
        error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
      });
    }
    
    return {
      ok: false,
      reason,
    };
  }
}
