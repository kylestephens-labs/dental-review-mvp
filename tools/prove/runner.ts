// Orchestrates checks (serial + parallel)
// Skeleton implementation ready for check registration

import { type ProveContext } from './context.js';
import { logger } from './logger.js';
import { checkTrunk } from './checks/trunk.js';
import { checkPreConflict } from './checks/preConflict.js';
import { checkLint } from './checks/lint.js';
import { checkTypecheck } from './checks/typecheck.js';
import { checkCommitSize } from './checks/commit-size.js';
import { checkCommitMsgConvention } from './checks/commit-msg-convention.js';

export interface CheckResult {
  id: string;
  ok: boolean;
  ms: number;
  reason?: string;
  details?: unknown;
}

export interface RunnerOptions {
  concurrency?: number;
  timeout?: number;
  failFast?: boolean;
  quickMode?: boolean;
}

/**
 * Run all prove checks
 * @param context - Prove context
 * @param options - Runner options
 * @returns Promise<CheckResult[]> - Results of all checks
 */
export async function runAll(
  context: ProveContext,
  options: RunnerOptions = {}
): Promise<CheckResult[]> {
  const {
    concurrency = context.cfg.runner.concurrency,
    timeout = context.cfg.runner.timeout,
    failFast = true,
    quickMode = false,
  } = options;

  logger.header('Running prove checks...');
  logger.info('Runner configuration', {
    concurrency,
    timeout,
    failFast,
    mode: context.mode,
  });

  const startTime = Date.now();
  const results: CheckResult[] = [];

  try {
    // Run trunk check (critical - must be first)
    logger.info('Running critical checks...');
    
    const trunkStartTime = Date.now();
    const trunkResult = await checkTrunk(context);
    const trunkMs = Date.now() - trunkStartTime;
    
    const trunkCheckResult: CheckResult = {
      id: 'trunk',
      ok: trunkResult.ok,
      ms: trunkMs,
      reason: trunkResult.reason,
    };
    
    results.push(trunkCheckResult);
    
    // If trunk check fails, stop here (fail-fast)
    if (!trunkResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'trunk',
        reason: trunkResult.reason,
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

      return results;
    }
    
    // Run commit size check (critical - must be second)
    const commitSizeStartTime = Date.now();
    const commitSizeResult = await checkCommitSize(context);
    const commitSizeMs = Date.now() - commitSizeStartTime;
    
    const commitSizeCheckResult: CheckResult = {
      id: 'commit-size',
      ok: commitSizeResult.ok,
      ms: commitSizeMs,
      reason: commitSizeResult.reason,
    };
    
    results.push(commitSizeCheckResult);
    
    // If commit size check fails, stop here (fail-fast)
    if (!commitSizeResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'commit-size',
        reason: commitSizeResult.reason,
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

      return results;
    }
    
    // Run commit message convention check (critical - must be third)
    const commitMsgStartTime = Date.now();
    const commitMsgResult = await checkCommitMsgConvention(context);
    const commitMsgMs = Date.now() - commitMsgStartTime;
    
    const commitMsgCheckResult: CheckResult = {
      id: 'commit-msg-convention',
      ok: commitMsgResult.ok,
      ms: commitMsgMs,
      reason: commitMsgResult.reason,
    };
    
    results.push(commitMsgCheckResult);
    
    // If commit message convention check fails, stop here (fail-fast)
    if (!commitMsgResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'commit-msg-convention',
        reason: commitMsgResult.reason,
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

      return results;
    }
    
    // Run pre-conflict check (critical - must be fourth, skip in quick mode)
    if (!quickMode) {
      const preConflictStartTime = Date.now();
      const preConflictResult = await checkPreConflict(context);
      const preConflictMs = Date.now() - preConflictStartTime;
      
      const preConflictCheckResult: CheckResult = {
        id: 'pre-conflict',
        ok: preConflictResult.ok,
        ms: preConflictMs,
        reason: preConflictResult.reason,
      };
      
      results.push(preConflictCheckResult);
      
      // If pre-conflict check fails, stop here (fail-fast)
      if (!preConflictResult.ok && failFast) {
        logger.error('Critical check failed - stopping execution', {
          checkId: 'pre-conflict',
          reason: preConflictResult.reason,
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

        return results;
      }
    } else {
      logger.info('Skipping pre-conflict check in quick mode');
    }
    
    // Run quick mode checks (lint + typecheck)
    if (quickMode) {
      logger.info('Running quick mode checks...');
      
      // Run lint check
      const lintStartTime = Date.now();
      const lintResult = await checkLint(context);
      const lintMs = Date.now() - lintStartTime;
      
      const lintCheckResult: CheckResult = {
        id: 'lint',
        ok: lintResult.ok,
        ms: lintMs,
        reason: lintResult.reason,
      };
      
      results.push(lintCheckResult);
      
      // If lint check fails, stop here (fail-fast)
      if (!lintResult.ok && failFast) {
        logger.error('Critical check failed - stopping execution', {
          checkId: 'lint',
          reason: lintResult.reason,
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

        return results;
      }
      
      // Run typecheck
      const typecheckStartTime = Date.now();
      const typecheckResult = await checkTypecheck(context);
      const typecheckMs = Date.now() - typecheckStartTime;
      
      const typecheckCheckResult: CheckResult = {
        id: 'typecheck',
        ok: typecheckResult.ok,
        ms: typecheckMs,
        reason: typecheckResult.reason,
      };
      
      results.push(typecheckCheckResult);
      
      // If typecheck fails, stop here (fail-fast)
      if (!typecheckResult.ok && failFast) {
        logger.error('Critical check failed - stopping execution', {
          checkId: 'typecheck',
          reason: typecheckResult.reason,
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

        return results;
      }
    }
    
    const totalMs = Date.now() - startTime;
    const successCount = results.filter(r => r.ok).length;
    const failureCount = results.filter(r => !r.ok).length;

    logger.success('All checks completed', {
      total: results.length,
      passed: successCount,
      failed: failureCount,
      totalMs,
    });

    return results;
  } catch (error) {
    logger.error('Runner failed', {
      error: error instanceof Error ? error.message : String(error),
      totalMs: Date.now() - startTime,
    });
    throw error;
  }
}

/**
 * Run checks in serial (one after another)
 * @param context - Prove context
 * @param checkIds - Array of check IDs to run
 * @returns Promise<CheckResult[]> - Results of serial checks
 */
export async function runSerial(
  context: ProveContext,
  checkIds: string[]
): Promise<CheckResult[]> {
  logger.info('Running checks in serial', { checkIds });
  
  const results: CheckResult[] = [];
  
  for (const checkId of checkIds) {
    const startTime = Date.now();
    
    try {
      // TODO: Implement actual check execution
      logger.info(`Running check: ${checkId}`);
      
      // Placeholder implementation
      const result: CheckResult = {
        id: checkId,
        ok: true,
        ms: Date.now() - startTime,
        reason: 'Skeleton implementation',
      };
      
      results.push(result);
      
      if (!result.ok && context.cfg.runner.failFast) {
        logger.error(`Check failed: ${checkId}`, result);
        break;
      }
    } catch (error) {
      const result: CheckResult = {
        id: checkId,
        ok: false,
        ms: Date.now() - startTime,
        reason: error instanceof Error ? error.message : String(error),
      };
      
      results.push(result);
      
      if (context.cfg.runner.failFast) {
        logger.error(`Check failed: ${checkId}`, result);
        break;
      }
    }
  }
  
  return results;
}

/**
 * Run checks in parallel with concurrency limit
 * @param context - Prove context
 * @param checkIds - Array of check IDs to run
 * @param concurrency - Maximum concurrent checks
 * @returns Promise<CheckResult[]> - Results of parallel checks
 */
export async function runParallel(
  context: ProveContext,
  checkIds: string[],
  concurrency: number = context.cfg.runner.concurrency
): Promise<CheckResult[]> {
  logger.info('Running checks in parallel', { 
    checkIds, 
    concurrency 
  });
  
  // TODO: Implement p-limit for concurrency control
  // For now, just run all checks sequentially as placeholder
  const results: CheckResult[] = [];
  
  for (const checkId of checkIds) {
    const startTime = Date.now();
    
    try {
      // TODO: Implement actual check execution
      logger.info(`Running parallel check: ${checkId}`);
      
      // Placeholder implementation
      const result: CheckResult = {
        id: checkId,
        ok: true,
        ms: Date.now() - startTime,
        reason: 'Skeleton implementation',
      };
      
      results.push(result);
    } catch (error) {
      const result: CheckResult = {
        id: checkId,
        ok: false,
        ms: Date.now() - startTime,
        reason: error instanceof Error ? error.message : String(error),
      };
      
      results.push(result);
    }
  }
  
  return results;
}

/**
 * Register a check function
 * @param id - Check ID
 * @param checkFn - Check function
 */
export function registerCheck(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _checkFn: (context: ProveContext) => Promise<CheckResult>
): void {
  // TODO: Implement check registry
  logger.info(`Registering check: ${id}`);
}

/**
 * Get all registered checks
 * @returns string[] - Array of registered check IDs
 */
export function getRegisteredChecks(): string[] {
  // TODO: Implement check registry
  return [];
}

/**
 * Run a specific check by ID
 * @param context - Prove context
 * @param checkId - Check ID to run
 * @returns Promise<CheckResult> - Check result
 */
export async function runCheck(
  context: ProveContext,
  checkId: string
): Promise<CheckResult> {
  const startTime = Date.now();
  
  try {
    // TODO: Implement actual check execution
    logger.info(`Running check: ${checkId}`);
    
    // Placeholder implementation
    const result: CheckResult = {
      id: checkId,
      ok: true,
      ms: Date.now() - startTime,
      reason: 'Skeleton implementation',
    };
    
    return result;
  } catch (error) {
    const result: CheckResult = {
      id: checkId,
      ok: false,
      ms: Date.now() - startTime,
      reason: error instanceof Error ? error.message : String(error),
    };
    
    return result;
  }
}