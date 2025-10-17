// Centralize git info
// Provides git operations for prove quality gates

import { exec } from './exec.js';
import { logger } from '../logger.js';
import { type ChangedLine } from '../types/common.js';

export interface GitContext {
  currentBranch: string;
  baseRef: string;
  changedFiles: string[];
  isMainBranch: boolean;
  hasUncommittedChanges: boolean;
  lastCommitHash: string;
  baseCommitHash: string;
  commitHash: string;
  commitMessage: string;
}

export interface ChangedFile {
  path: string;
  status: 'A' | 'M' | 'D' | 'R' | 'C' | 'U' | '?';
  additions?: number;
  deletions?: number;
}

/**
 * Get the current git branch
 * @returns Promise<string> - Current branch name
 */
export async function getCurrentBranch(): Promise<string> {
  try {
    const result = await exec('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    
    if (!result.success) {
      throw new Error(`Failed to get current branch: ${result.stderr}`);
    }

    const branch = result.stdout.trim();
    logger.info(`Current branch: ${branch}`);
    return branch;
  } catch (error) {
    logger.error('Failed to get current branch', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Get the base reference for comparison
 * @param fallback - Fallback ref if origin/main doesn't exist
 * @returns Promise<string> - Base reference
 */
export async function getBaseRef(fallback: string = 'origin/main'): Promise<string> {
  try {
    // First try to get origin/main
    const originResult = await exec('git', ['rev-parse', '--verify', 'origin/main']);
    
    if (originResult.success) {
      const baseRef = originResult.stdout.trim();
      logger.info(`Using base ref: ${baseRef}`);
      return baseRef;
    }

    // Fallback to provided fallback
    logger.info(`origin/main not found, trying fallback: ${fallback}`);
    const fallbackResult = await exec('git', ['rev-parse', '--verify', fallback]);
    
    if (fallbackResult.success) {
      const baseRef = fallbackResult.stdout.trim();
      logger.info(`Using fallback ref: ${baseRef}`);
      return baseRef;
    }

    // Last resort: use HEAD~1
    logger.warn('No suitable base ref found, using HEAD~1');
    const headResult = await exec('git', ['rev-parse', '--verify', 'HEAD~1']);
    
    if (headResult.success) {
      const baseRef = headResult.stdout.trim();
      logger.info(`Using HEAD~1 as base ref: ${baseRef}`);
      return baseRef;
    }

    throw new Error('No suitable base reference found');
  } catch (error) {
    logger.error('Failed to get base reference', { 
      error: error instanceof Error ? error.message : String(error),
      fallback 
    });
    throw error;
  }
}

/**
 * Get list of changed files between base ref and current HEAD
 * @param baseRef - Base reference to compare against
 * @returns Promise<string[]> - Array of changed file paths
 */
export async function getChangedFiles(baseRef: string): Promise<string[]> {
  try {
    const result = await exec('git', ['diff', '--name-only', baseRef, 'HEAD']);
    
    if (!result.success) {
      throw new Error(`Failed to get changed files: ${result.stderr}`);
    }

    const files = result.stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    logger.info(`Found ${files.length} changed files`, { files: files.slice(0, 10) }); // Log first 10 files
    return files;
  } catch (error) {
    logger.error('Failed to get changed files', { 
      error: error instanceof Error ? error.message : String(error),
      baseRef 
    });
    throw error;
  }
}

/**
 * Get detailed information about changed files with status and diff stats
 * @param baseRef - Base reference to compare against
 * @returns Promise<ChangedFile[]> - Array of changed file details
 */
export async function getChangedFilesDetailed(baseRef: string): Promise<ChangedFile[]> {
  try {
    const result = await exec('git', ['diff', '--name-status', '--numstat', baseRef, 'HEAD']);
    
    if (!result.success) {
      throw new Error(`Failed to get detailed changed files: ${result.stderr}`);
    }

    const lines = result.stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const files: ChangedFile[] = [];
    
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const status = parts[0] as ChangedFile['status'];
        const path = parts[1];
        
        const file: ChangedFile = { path, status };
        
        // Parse numstat if available (additions deletions)
        if (parts.length >= 4 && parts[2] !== '-' && parts[3] !== '-') {
          file.additions = parseInt(parts[2], 10) || 0;
          file.deletions = parseInt(parts[3], 10) || 0;
        }
        
        files.push(file);
      }
    }

    logger.info(`Found ${files.length} changed files with details`, { 
      files: files.slice(0, 5).map(f => ({ path: f.path, status: f.status })) 
    });
    return files;
  } catch (error) {
    logger.error('Failed to get detailed changed files', { 
      error: error instanceof Error ? error.message : String(error),
      baseRef 
    });
    throw error;
  }
}

/**
 * Check if there are uncommitted changes
 * @returns Promise<boolean> - True if there are uncommitted changes
 */
export async function hasUncommittedChanges(): Promise<boolean> {
  try {
    const result = await exec('git', ['status', '--porcelain']);
    
    if (!result.success) {
      throw new Error(`Failed to check git status: ${result.stderr}`);
    }

    const hasChanges = result.stdout.trim().length > 0;
    logger.info(`Uncommitted changes: ${hasChanges}`);
    return hasChanges;
  } catch (error) {
    logger.error('Failed to check uncommitted changes', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Get the current commit hash
 * @returns Promise<string> - Current commit hash
 */
export async function getCurrentCommitHash(): Promise<string> {
  try {
    const result = await exec('git', ['rev-parse', 'HEAD']);
    
    if (!result.success) {
      throw new Error(`Failed to get current commit hash: ${result.stderr}`);
    }

    const hash = result.stdout.trim();
    logger.info(`Current commit: ${hash.substring(0, 8)}...`);
    return hash;
  } catch (error) {
    logger.error('Failed to get current commit hash', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Get the current commit message
 * @returns Promise<string> - Current commit message
 */
export async function getCommitMessage(): Promise<string> {
  try {
    const result = await exec('git', ['log', '-1', '--pretty=%B']);
    
    if (!result.success) {
      throw new Error(`Failed to get commit message: ${result.stderr}`);
    }

    const message = result.stdout.trim();
    logger.info(`Commit message: ${message.substring(0, 50)}...`);
    return message;
  } catch (error) {
    logger.error('Failed to get commit message', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return '';
  }
}

/**
 * Get the base commit hash
 * @param baseRef - Base reference
 * @returns Promise<string> - Base commit hash
 */
export async function getBaseCommitHash(baseRef: string): Promise<string> {
  try {
    const result = await exec('git', ['rev-parse', baseRef]);
    
    if (!result.success) {
      throw new Error(`Failed to get base commit hash: ${result.stderr}`);
    }

    const hash = result.stdout.trim();
    logger.info(`Base commit: ${hash.substring(0, 8)}...`);
    return hash;
  } catch (error) {
    logger.error('Failed to get base commit hash', { 
      error: error instanceof Error ? error.message : String(error),
      baseRef 
    });
    throw error;
  }
}

/**
 * Get comprehensive git context
 * @param baseRefFallback - Fallback for base reference
 * @returns Promise<GitContext> - Complete git context
 */
export async function getGitContext(baseRefFallback: string = 'origin/main'): Promise<GitContext> {
  try {
    logger.info('Building git context...');
    
    // Resolve base ref first to ensure consistency across all operations
    const baseRef = await getBaseRef(baseRefFallback);
    
    const [
      currentBranch,
      changedFiles,
      hasUncommittedChangesFlag,
      currentCommitHash,
      baseCommitHash
    ] = await Promise.all([
      getCurrentBranch(),
      getChangedFiles(baseRef),
      hasUncommittedChanges(),
      getCurrentCommitHash(),
      getBaseCommitHash(baseRef)
    ]);

    // Get commit message
    const commitMessage = await getCommitMessage();
    
    const context: GitContext = {
      currentBranch,
      baseRef,
      changedFiles,
      isMainBranch: currentBranch === 'main',
      hasUncommittedChanges: hasUncommittedChangesFlag,
      lastCommitHash: currentCommitHash,
      baseCommitHash,
      commitHash: currentCommitHash,
      commitMessage,
    };

    logger.success('Git context built successfully', {
      currentBranch,
      isMainBranch: context.isMainBranch,
      changedFilesCount: changedFiles.length,
      hasUncommittedChanges: context.hasUncommittedChanges,
    });

    return context;
  } catch (error) {
    logger.error('Failed to build git context', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Check if a file matches any of the given glob patterns
 * @param filePath - File path to check
 * @param patterns - Array of glob patterns
 * @returns boolean - True if file matches any pattern
 */
export function matchesGlobPatterns(filePath: string, patterns: string[]): boolean {
  // Simple glob matching - can be enhanced with minimatch if needed
  return patterns.some(pattern => {
    const regex = new RegExp(
      pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
    );
    return regex.test(filePath);
  });
}

/**
 * Filter changed files by glob patterns
 * @param files - Array of file paths
 * @param patterns - Array of glob patterns
 * @returns string[] - Filtered file paths
 */
export function filterFilesByPatterns(files: string[], patterns: string[]): string[] {
  return files.filter(file => matchesGlobPatterns(file, patterns));
}

/**
 * GitAnalyzer class for shared git analysis utilities
 * Consolidates git diff parsing and analysis logic
 */
export class GitAnalyzer {
  /**
   * Get changed lines using git diff
   */
  static async getChangedLines(baseRef: string, currentRef: string, workingDirectory: string): Promise<ChangedLine[]> {
    try {
      // Get diff between base and current commit
      const result = await exec('git', ['diff', '--unified=0', baseRef, currentRef], {
        cwd: workingDirectory,
        timeout: 30000,
      });

      if (!result.success) {
        logger.error('Failed to get git diff', { stderr: result.stderr });
        return [];
      }

      const diffOutput = result.stdout;
      const changedLines: ChangedLine[] = [];
      
      // Parse diff output to extract changed lines
      const lines = diffOutput.split('\n');
      let currentFile = '';
      
      for (const line of lines) {
        // File header: diff --git a/file b/file
        if (line.startsWith('diff --git')) {
          const match = line.match(/diff --git a\/(.+) b\/(.+)/);
          if (match) {
            // Strip the b/ prefix and use repo-relative path
            currentFile = match[2].replace(/^b\//, '');
          }
        }
        
        // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
        if (line.startsWith('@@')) {
          const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
          if (match && currentFile) {
            const oldStart = parseInt(match[1], 10);
            const oldCount = parseInt(match[2] || '1', 10);
            const newStart = parseInt(match[3], 10);
            const newCount = parseInt(match[4] || '1', 10);
            
            // Add changed lines
            for (let i = 0; i < newCount; i++) {
              changedLines.push({
                file: currentFile,
                line: newStart + i,
                type: 'added'
              });
            }
          }
        }
      }

      logger.info('Changed lines extracted', { 
        totalChangedLines: changedLines.length,
        files: [...new Set(changedLines.map(l => l.file))]
      });

      return changedLines;
    } catch (error) {
      logger.error('Error getting changed lines', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }
}
