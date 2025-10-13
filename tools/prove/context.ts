// Collects git diff, mode, env, logger once
// Builds shared context for all prove checks

import { config, type ProveConfig } from './config.js';
import { logger } from './logger.js';
import { getGitContext, type GitContext } from './utils/git.js';

export interface ProveContext {
  // Configuration
  cfg: ProveConfig;
  
  // Git information
  git: GitContext;
  
  // Environment
  env: NodeJS.ProcessEnv;
  isCI: boolean;
  
  // Logging
  log: typeof logger;
  
  // Mode information
  mode: 'functional' | 'non-functional';
  
  // Additional context
  startTime: number;
  workingDirectory: string;
}

/**
 * Resolve delivery mode from various sources
 * Priority: TASK.json → PR label → PR title tag → default
 */
async function resolveDeliveryMode(): Promise<'functional' | 'non-functional'> {
  try {
    // Try to read TASK.json first
    const fs = await import('fs/promises');
    try {
      const taskContent = await fs.readFile('tasks/TASK.json', 'utf-8');
      const taskData = JSON.parse(taskContent);
      if (taskData.mode === 'functional' || taskData.mode === 'non-functional') {
        logger.info(`Mode resolved from TASK.json: ${taskData.mode}`);
        return taskData.mode;
      }
    } catch (error) {
      // TASK.json doesn't exist or is invalid, continue to other methods
      logger.info('TASK.json not found or invalid, trying other methods');
    }

    // Try to get PR information from environment (GitHub Actions)
    const prLabels = process.env.GITHUB_PR_LABELS;
    if (prLabels) {
      const labels = prLabels.split(',').map(label => label.trim());
      if (labels.includes('mode:functional')) {
        logger.info('Mode resolved from PR label: functional');
        return 'functional';
      }
      if (labels.includes('mode:non-functional')) {
        logger.info('Mode resolved from PR label: non-functional');
        return 'non-functional';
      }
    }

    // Try to get from PR title
    const prTitle = process.env.GITHUB_PR_TITLE || process.env.PR_TITLE;
    if (prTitle) {
      if (prTitle.includes('[MODE:F]') || prTitle.includes('[MODE:functional]')) {
        logger.info('Mode resolved from PR title: functional');
        return 'functional';
      }
      if (prTitle.includes('[MODE:NF]') || prTitle.includes('[MODE:non-functional]')) {
        logger.info('Mode resolved from PR title: non-functional');
        return 'non-functional';
      }
    }

    // Default to functional
    logger.info('Mode resolved from default: functional');
    return 'functional';
  } catch (error) {
    logger.error('Failed to resolve delivery mode', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Default to functional on error
    return 'functional';
  }
}

/**
 * Build comprehensive prove context
 * @param baseRefFallback - Fallback for base reference
 * @returns Promise<ProveContext> - Complete prove context
 */
export async function buildContext(baseRefFallback: string = 'origin/main'): Promise<ProveContext> {
  try {
    logger.header('Building prove context...');
    const startTime = Date.now();

    // Build git context
    logger.info('Gathering git information...');
    const git = await getGitContext(baseRefFallback);

    // Resolve delivery mode
    logger.info('Resolving delivery mode...');
    const mode = await resolveDeliveryMode();

    // Determine if running in CI
    const isCI = !!(
      process.env.CI || 
      process.env.GITHUB_ACTIONS || 
      process.env.GITLAB_CI || 
      process.env.JENKINS_URL ||
      process.env.BUILDKITE ||
      process.env.CIRCLECI
    );

    // Get working directory
    const workingDirectory = process.cwd();

    const context: ProveContext = {
      cfg: config,
      git,
      env: process.env,
      isCI,
      log: logger,
      mode,
      startTime,
      workingDirectory,
    };

    // Log context summary
    logger.success('Prove context built successfully', {
      mode: context.mode,
      currentBranch: context.git.currentBranch,
      isMainBranch: context.git.isMainBranch,
      changedFilesCount: context.git.changedFiles.length,
      hasUncommittedChanges: context.git.hasUncommittedChanges,
      isCI: context.isCI,
      workingDirectory: context.workingDirectory,
      concurrency: context.cfg.runner.concurrency,
      thresholds: {
        diffCoverageFunctional: context.cfg.thresholds.diffCoverageFunctional,
        globalCoverage: context.cfg.thresholds.globalCoverage,
      },
      toggles: context.cfg.toggles,
    });

    return context;
  } catch (error) {
    logger.error('Failed to build prove context', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Get context summary for logging
 * @param context - Prove context
 * @returns string - Context summary
 */
export function getContextSummary(context: ProveContext): string {
  const {
    mode,
    git: { currentBranch, isMainBranch, changedFiles, hasUncommittedChanges },
    isCI,
    cfg: { runner: { concurrency }, thresholds: { diffCoverageFunctional } }
  } = context;

  return [
    `Mode: ${mode}`,
    `Branch: ${currentBranch}${isMainBranch ? ' (main)' : ''}`,
    `Files: ${changedFiles.length} changed`,
    `Uncommitted: ${hasUncommittedChanges ? 'yes' : 'no'}`,
    `CI: ${isCI ? 'yes' : 'no'}`,
    `Concurrency: ${concurrency}`,
    `Coverage: ${diffCoverageFunctional}%`
  ].join(' | ');
}

/**
 * Check if context is valid for prove execution
 * @param context - Prove context
 * @returns boolean - True if context is valid
 */
export function validateContext(context: ProveContext): boolean {
  try {
    // Check required fields
    if (!context.cfg) {
      logger.error('Context validation failed: missing config');
      return false;
    }

    if (!context.git) {
      logger.error('Context validation failed: missing git context');
      return false;
    }

    if (!context.log) {
      logger.error('Context validation failed: missing logger');
      return false;
    }

    if (!context.mode || !['functional', 'non-functional'].includes(context.mode)) {
      logger.error('Context validation failed: invalid mode');
      return false;
    }

    // Check git context validity
    if (!context.git.currentBranch) {
      logger.error('Context validation failed: missing current branch');
      return false;
    }

    if (!context.git.baseRef) {
      logger.error('Context validation failed: missing base ref');
      return false;
    }

    logger.success('Context validation passed');
    return true;
  } catch (error) {
    logger.error('Context validation failed', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return false;
  }
}

// Export singleton context (will be built when first imported)
let _context: ProveContext | null = null;

/**
 * Get the built context (singleton pattern)
 * @param baseRefFallback - Fallback for base reference
 * @returns Promise<ProveContext> - Built context
 */
export async function getContext(baseRefFallback: string = 'origin/main'): Promise<ProveContext> {
  if (!_context) {
    _context = await buildContext(baseRefFallback);
  }
  return _context;
}

/**
 * Reset context (useful for testing)
 */
export function resetContext(): void {
  _context = null;
}