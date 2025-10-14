// Helper utilities for running checks in the runner
// Reduces duplication and standardizes check execution patterns

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { type CheckResult as RunnerCheckResult } from '../runner.js';
import { type CheckResult } from './base.js';

export interface CheckExecutionConfig {
  id: string;
  name: string;
  skipInQuickMode?: boolean;
  failFast?: boolean;
  logSkipReason?: (reason: string) => void;
}

/**
 * Execute a single check with standardized timing and error handling
 */
export async function executeCheck(
  context: ProveContext,
  config: CheckExecutionConfig,
  checkFn: (context: ProveContext) => Promise<CheckResult>,
  quickMode: boolean = false
): Promise<RunnerCheckResult> {
  const startTime = Date.now();
  
  try {
    // Check if we should skip in quick mode
    if (quickMode && config.skipInQuickMode) {
      logger.info(`Skipping ${config.name} in quick mode`);
      return {
        id: config.id,
        ok: true,
        ms: Date.now() - startTime,
        reason: 'skipped (quick mode)'
      };
    }

    // Execute the check
    const result = await checkFn(context);
    const ms = Date.now() - startTime;

    const runnerResult: RunnerCheckResult = {
      id: config.id,
      ok: result.ok,
      ms,
      reason: result.reason,
    };

    // Handle skip reasons
    if (result.ok && result.reason?.includes('skipped')) {
      if (config.logSkipReason) {
        config.logSkipReason(result.reason);
      }
    }

    return runnerResult;

  } catch (error) {
    const ms = Date.now() - startTime;
    return {
      id: config.id,
      ok: false,
      ms,
      reason: `Check execution failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Handle check failure with fail-fast logic
 */
export function handleCheckFailure(
  checkId: string,
  reason: string,
  results: RunnerCheckResult[],
  failFast: boolean,
  startTime: number
): RunnerCheckResult[] | null {
  if (!failFast) {
    return null; // Continue execution
  }

  logger.error('Critical check failed - stopping execution', {
    checkId,
    reason,
  });
  
  const totalMs = Date.now() - startTime;
  const successCount = results.filter(r => r.ok).length;
  const failureCount = results.filter(r => !r.ok).length;

  logger.error('Checks failed', {
    total: results.length,
    passed: successCount,
    failed: failureCount,
    totalMs,
  });

  return results; // Stop execution
}

/**
 * Create standardized check execution configs
 */
export const CHECK_CONFIGS = {
  buildWeb: {
    id: 'build-web',
    name: 'Frontend build',
    skipInQuickMode: true,
    failFast: true,
    logSkipReason: (reason: string) => logger.info('Skipping build check in quick mode')
  },
  buildApi: {
    id: 'build-api',
    name: 'API build',
    skipInQuickMode: false,
    failFast: false,
    logSkipReason: (reason: string) => logger.info('API build check skipped - no server build configured')
  },
  sizeBudget: {
    id: 'size-budget',
    name: 'Size budget',
    skipInQuickMode: false,
    failFast: true,
    logSkipReason: (reason: string) => logger.info('Size budget check skipped - disabled in configuration')
  }
} as const;
