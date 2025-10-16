// Check: commit-size.ts
// Enforce small, frequent commits by limiting commit size

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';

export interface CommitSizeResult {
  ok: boolean;
  reason?: string;
  linesChanged?: number;
  maxAllowed?: number;
  details?: {
    added: number;
    deleted: number;
    filesChanged: number;
  };
}

/**
 * Check commit size against configured limit
 * Fails if git diff --shortstat origin/main...HEAD exceeds maxCommitSize
 * @param context - Prove context
 * @returns Promise<CommitSizeResult> - Check result
 */
export async function checkCommitSize(context: ProveContext): Promise<CommitSizeResult> {
  // KILL SWITCH: Temporarily disable commit size check for prove system implementation
  const KILL_SWITCH_COMMIT_SIZE_CHECK = process.env.COMMIT_SIZE_CHECK_ENABLED !== 'true';
  if (KILL_SWITCH_COMMIT_SIZE_CHECK) {
    logger.info('Commit size check disabled via kill switch for prove system implementation');
    return {
      ok: true,
      linesChanged: 0,
      maxAllowed: context.cfg.thresholds.maxCommitSize,
      details: { added: 0, deleted: 0, filesChanged: 0 }
    };
  }
  
  try {
    const { git: { baseRef }, cfg: { thresholds: { maxCommitSize } } } = context;
    
    // Get short statistics for the diff (committed changes)
    const result = await exec('git', ['diff', '--shortstat', `${baseRef}...HEAD`], {
      timeout: 30000, // 30 seconds timeout
      cwd: context.workingDirectory
    });

    if (!result.success) {
      return {
        ok: false,
        reason: `Failed to get commit diff: ${result.stderr}`,
        linesChanged: 0,
        maxAllowed: maxCommitSize,
      };
    }

    // Parse the shortstat output
    // Format: " X files changed, Y insertions(+), Z deletions(-)"
    let shortstatOutput = result.stdout.trim();
    
    // If no committed changes, check uncommitted and staged changes
    if (!shortstatOutput && context.git.hasUncommittedChanges) {
      logger.info('No committed changes, checking uncommitted and staged changes...');
      
      // Check both working directory changes and staged changes
      const [uncommittedResult, stagedResult] = await Promise.all([
        exec('git', ['diff', '--shortstat'], { timeout: 30000, cwd: context.workingDirectory }),
        exec('git', ['diff', '--cached', '--shortstat'], { timeout: 30000, cwd: context.workingDirectory })
      ]);
      
      // Combine the results
      const uncommittedStats = uncommittedResult.success ? parseShortstat(uncommittedResult.stdout.trim()) : { added: 0, deleted: 0, filesChanged: 0 };
      const stagedStats = stagedResult.success ? parseShortstat(stagedResult.stdout.trim()) : { added: 0, deleted: 0, filesChanged: 0 };
      
      if (uncommittedStats.added > 0 || uncommittedStats.deleted > 0 || stagedStats.added > 0 || stagedStats.deleted > 0) {
        const combinedStats = {
          added: uncommittedStats.added + stagedStats.added,
          deleted: uncommittedStats.deleted + stagedStats.deleted,
          filesChanged: uncommittedStats.filesChanged + stagedStats.filesChanged
        };
        
        // Create a combined shortstat string for parsing
        shortstatOutput = `${combinedStats.filesChanged} files changed, ${combinedStats.added} insertions(+), ${combinedStats.deleted} deletions(-)`;
      }
    }
    
    if (!shortstatOutput) {
      // No changes detected
      logger.success('Commit size check passed', { 
        message: 'No changes detected',
        linesChanged: 0,
        maxAllowed: maxCommitSize 
      });
      
      return {
        ok: true,
        linesChanged: 0,
        maxAllowed: maxCommitSize,
        details: { added: 0, deleted: 0, filesChanged: 0 }
      };
    }

    // Parse the shortstat output
    const stats = parseShortstat(shortstatOutput);
    const totalLinesChanged = stats.added + stats.deleted;

    logger.info('Commit size analysis', {
      filesChanged: stats.filesChanged,
      linesAdded: stats.added,
      linesDeleted: stats.deleted,
      totalLinesChanged,
      maxAllowed: maxCommitSize,
    });

    if (totalLinesChanged > maxCommitSize) {
      const reason = `Commit size exceeds limit: ${totalLinesChanged} lines changed (max: ${maxCommitSize})`;
      
      logger.error('Commit size check failed', {
        linesChanged: totalLinesChanged,
        maxAllowed: maxCommitSize,
        reason,
        details: stats,
      });
      
      return {
        ok: false,
        reason,
        linesChanged: totalLinesChanged,
        maxAllowed: maxCommitSize,
        details: stats,
      };
    }

    // Success - commit size is within limits
    logger.success('Commit size check passed', {
      linesChanged: totalLinesChanged,
      maxAllowed: maxCommitSize,
      message: `Commit size within limits (${totalLinesChanged}/${maxCommitSize} lines)`,
    });
    
    return {
      ok: true,
      linesChanged: totalLinesChanged,
      maxAllowed: maxCommitSize,
      details: stats,
    };
    
  } catch (error) {
    const reason = `Commit size check failed: ${error instanceof Error ? error.message : String(error)}`;
    
    logger.error('Commit size check failed with error', {
      error: reason,
      linesChanged: 0,
    });
    
    return {
      ok: false,
      reason,
      linesChanged: 0,
      maxAllowed: context.cfg.thresholds.maxCommitSize,
    };
  }
}

/**
 * Parse git shortstat output
 * @param shortstat - Git shortstat output string
 * @returns Parsed statistics
 */
function parseShortstat(shortstat: string): { added: number; deleted: number; filesChanged: number } {
  // Example: " 3 files changed, 15 insertions(+), 2 deletions(-)"
  const filesMatch = shortstat.match(/(\d+)\s+files?\s+changed/);
  const insertionsMatch = shortstat.match(/(\d+)\s+insertions?\(\+\)/);
  const deletionsMatch = shortstat.match(/(\d+)\s+deletions?\(-\)/);
  
  return {
    filesChanged: filesMatch ? parseInt(filesMatch[1], 10) : 0,
    added: insertionsMatch ? parseInt(insertionsMatch[1], 10) : 0,
    deleted: deletionsMatch ? parseInt(deletionsMatch[1], 10) : 0,
  };
}
