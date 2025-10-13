// Check: trunk.ts
// Enforce work on main branch only

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { getCurrentBranch } from '../utils/git.js';

export interface TrunkCheckResult {
  ok: boolean;
  reason?: string;
  currentBranch?: string;
}

/**
 * Enforce trunk-based development
 * Fails if current branch is not 'main'
 * @param context - Prove context
 * @returns Promise<TrunkCheckResult> - Check result
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function checkTrunk(_context: ProveContext): Promise<TrunkCheckResult> {
  
  try {
    logger.info('Checking trunk-based development...');
    
    // Get current branch
    const currentBranch = await getCurrentBranch();
    
    // Check if we're on main branch
    if (currentBranch !== 'main') {
      const reason = `Not on main branch. Current branch: ${currentBranch}. Trunk-based development requires work on main branch only.`;
      
      logger.error('Trunk check failed', {
        currentBranch,
        expectedBranch: 'main',
        reason,
      });
      
      return {
        ok: false,
        reason,
        currentBranch,
      };
    }
    
    // Success - we're on main branch
    logger.success('Trunk check passed', {
      currentBranch,
      message: 'Working on main branch as required by trunk-based development',
    });
    
    return {
      ok: true,
      currentBranch,
    };
    
  } catch (error) {
    const reason = `Failed to check current branch: ${error instanceof Error ? error.message : String(error)}`;
    
    logger.error('Trunk check failed with error', {
      error: reason,
      currentBranch: 'unknown',
    });
    
    return {
      ok: false,
      reason,
    };
  }
}
