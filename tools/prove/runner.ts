// Orchestrates checks (serial + parallel) with p-limit concurrency control
// Implements bounded parallelism for parallel checks while maintaining serial execution for critical checks

import pLimit from 'p-limit';
import { type ProveContext } from './context.js';
import { logger } from './logger.js';
import { checkTrunk } from './checks/trunk.js';
import { checkPreConflict } from './checks/preConflict.js';
import { checkLint } from './checks/lint.js';
import { checkTypecheck } from './checks/typecheck.js';
import { checkEnvCheck } from './checks/envCheck.js';
import { checkTests } from './checks/tests.js';
import { checkCoverage } from './checks/coverage.js';
import { checkTddChangedHasTests } from './checks/tddChangedHasTests.js';
import { checkDiffCoverage } from './checks/diffCoverage.js';
import { checkBuildWeb } from './checks/buildWeb.js';
import { checkBuildApi } from './checks/buildApi.js';
import { checkSizeBudget } from './checks/sizeBudget.js';
import { executeCheck, handleCheckFailure, CHECK_CONFIGS } from './checks/runner-helper.js';
import { type CheckResult as BaseCheckResult } from './checks/base.js';
import { CHECK_FUNCTIONS } from './checks/index.js';
import { checkCommitSize } from './checks/commit-size.js';
import { checkCommitMsgConvention } from './checks/commit-msg-convention.js';
import { checkFeatureFlagLint } from './checks/feature-flag-lint.js';
import { checkKillswitchRequired } from './checks/killswitch-required.js';
import { checkDeliveryMode } from './checks/deliveryMode.js';
import { checkSecurity } from './checks/security.js';
import { checkContracts } from './checks/contracts.js';
import { checkDbMigrations } from './checks/dbMigrations.js';

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
 * Get execution plan based on context and options
 * @param context - Prove context
 * @param quickMode - Whether to run in quick mode
 * @returns Object with critical and parallel check lists
 */
function getExecutionPlan(context: ProveContext, quickMode: boolean) {
  // Define critical checks that must run serially (fail-fast)
  const criticalChecks = [
    { id: 'trunk', fn: checkTrunk },
    { id: 'delivery-mode', fn: checkDeliveryMode },
    { id: 'commit-msg-convention', fn: checkCommitMsgConvention },
    { id: 'commit-size', fn: checkCommitSize },
    { id: 'killswitch-required', fn: checkKillswitchRequired },
  ];

  // Add pre-conflict check if not in quick mode
  if (!quickMode) {
    criticalChecks.push({ id: 'pre-conflict', fn: checkPreConflict });
  }

  // Define parallel checks that can run concurrently
  const parallelChecks: Array<{ id: string; fn: (context: ProveContext) => Promise<BaseCheckResult> }> = [
    { id: 'env-check', fn: checkEnvCheck },
    { id: 'lint', fn: checkLint },
    { id: 'typecheck', fn: checkTypecheck },
    { id: 'tests', fn: checkTests }, // Tests run in parallel with other checks
    { id: 'feature-flag-lint', fn: checkFeatureFlagLint },
  ];

  // Coverage-dependent checks that must wait for tests to complete
  const coverageDependentChecks: Array<{ id: string; fn: (context: ProveContext) => Promise<BaseCheckResult> }> = [];

  // Add mode-specific checks
  if (context.mode === 'functional') {
    parallelChecks.push(
      { id: 'tdd-changed-has-tests', fn: checkTddChangedHasTests }
    );
    // Move diff-coverage to coverage-dependent checks
    coverageDependentChecks.push({ id: 'diff-coverage', fn: checkDiffCoverage });
  }

  // Add coverage check if enabled and not in quick mode
  if (context.cfg.toggles.coverage && !quickMode) {
    // Move coverage to coverage-dependent checks
    coverageDependentChecks.push({ id: 'coverage', fn: checkCoverage });
  }

  // Add build checks if not in quick mode
  if (!quickMode) {
    parallelChecks.push(
      { id: 'build-web', fn: checkBuildWeb },
      { id: 'build-api', fn: checkBuildApi }
    );
  }

  // Add size budget check if enabled and not in quick mode
  if (context.cfg.toggles.sizeBudget && !quickMode) {
    parallelChecks.push({ id: 'size-budget', fn: checkSizeBudget });
  }

  // Add security check if enabled and not in quick mode
  if (context.cfg.toggles.security && !quickMode) {
    parallelChecks.push({ id: 'security', fn: checkSecurity });
  }

  // Add contracts check if enabled and not in quick mode
  if (context.cfg.toggles.contracts && !quickMode) {
    parallelChecks.push({ id: 'contracts', fn: checkContracts });
  }

  // Add DB migrations check if enabled and not in quick mode
  if (context.cfg.toggles.dbMigrations && !quickMode) {
    parallelChecks.push({ id: 'db-migrations', fn: checkDbMigrations });
  }

  return { criticalChecks, parallelChecks, coverageDependentChecks };
}

/**
 * Run all prove checks with proper serial/parallel execution using p-limit
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
    // Get execution plan
    const { criticalChecks, parallelChecks, coverageDependentChecks } = getExecutionPlan(context, quickMode);

    // Run critical checks serially (fail-fast)
    logger.info('Running critical checks serially...');
    for (const { id, fn } of criticalChecks) {
      const checkStartTime = Date.now();
      const checkResult = await fn(context);
      const checkMs = Date.now() - checkStartTime;
      
      const result: CheckResult = {
        id,
        ok: checkResult.ok,
        ms: checkMs,
        reason: checkResult.reason,
      };
      
      results.push(result);
      
      // Fail-fast on critical check failure
      if (!checkResult.ok && failFast) {
        logger.error('Critical check failed - stopping execution', {
          checkId: id,
          reason: checkResult.reason,
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

    // Run parallel checks with concurrency limit and proper fail-fast
    logger.info('Running parallel checks with concurrency limit...', {
      parallelChecks: parallelChecks.length,
      concurrency,
    });

    const limit = pLimit(concurrency);
    const parallelResults: CheckResult[] = [];
    let hasFailed = false;
    let firstFailure: CheckResult | null = null;

    // Create a queue of check functions to execute
    const checkQueue = [...parallelChecks];
    
    // Process checks with fail-fast behavior
    const processChecks = async (): Promise<void> => {
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < Math.min(concurrency, checkQueue.length); i++) {
        promises.push(processNextCheck());
      }
      
      await Promise.all(promises);
    };

    const processNextCheck = async (): Promise<void> => {
      while (checkQueue.length > 0 && !hasFailed) {
        const { id, fn } = checkQueue.shift()!;
        const checkStartTime = Date.now();
        
        try {
          const checkResult = await fn(context);
          const checkMs = Date.now() - checkStartTime;
          
          const result: CheckResult = {
            id,
            ok: checkResult.ok,
            ms: checkMs,
            reason: checkResult.reason,
          };
          
          parallelResults.push(result);
          
          // Check for failure and set fail-fast flag
          if (!checkResult.ok && failFast) {
            hasFailed = true;
            firstFailure = result;
            logger.error('Parallel check failed - stopping execution', {
              checkId: id,
              reason: checkResult.reason,
            });
            return;
          }
          
          // If not failed, process next check if available
          if (checkQueue.length > 0) {
            return processNextCheck();
          }
        } catch (error) {
          const checkMs = Date.now() - checkStartTime;
          const result: CheckResult = {
            id,
            ok: false,
            ms: checkMs,
            reason: error instanceof Error ? error.message : String(error),
          };
          
          parallelResults.push(result);
          
          if (failFast) {
            hasFailed = true;
            firstFailure = result;
            logger.error('Parallel check failed - stopping execution', {
              checkId: id,
              reason: result.reason,
            });
            return;
          }
        }
      }
    };

    await processChecks();
    results.push(...parallelResults);

    // Handle fail-fast scenario
    if (hasFailed && firstFailure) {
      const totalMs = Date.now() - startTime;
      const successCount = results.filter(r => r.ok).length;
      const failureCount = results.filter(r => !r.ok).length;

      logger.error('Checks failed', {
        total: results.length,
        passed: successCount,
        failed: failureCount,
        totalMs,
        firstFailure: firstFailure ? (firstFailure as CheckResult).id : undefined,
      });

      return results;
    }

    // Run coverage-dependent checks after tests complete
    if (coverageDependentChecks.length > 0) {
      logger.info('Running coverage-dependent checks...', {
        coverageDependentChecks: coverageDependentChecks.length,
      });

      for (const { id, fn } of coverageDependentChecks) {
        const checkStartTime = Date.now();
        const checkResult = await fn(context);
        const checkMs = Date.now() - checkStartTime;
        
        const result: CheckResult = {
          id,
          ok: checkResult.ok,
          ms: checkMs,
          reason: checkResult.reason,
        };
        
        results.push(result);
        
        // Check for failure and fail-fast if needed
        if (!checkResult.ok && failFast) {
          const totalMs = Date.now() - startTime;
          const successCount = results.filter(r => r.ok).length;
          const failureCount = results.filter(r => !r.ok).length;

          logger.error('Coverage-dependent check failed', {
            checkId: id,
            reason: checkResult.reason,
            total: results.length,
            passed: successCount,
            failed: failureCount,
            totalMs,
          });

          return results;
        }
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
      concurrencyUsed: Math.min(concurrency, parallelChecks.length),
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
      logger.info(`Running check: ${checkId}`);
      
      // Execute actual check based on checkId
      const checkFn = CHECK_FUNCTIONS[checkId as keyof typeof CHECK_FUNCTIONS];
      if (!checkFn) {
        throw new Error(`Check function not found for: ${checkId}`);
      }
      const result = await executeCheck(context, { id: checkId, name: checkId }, checkFn, false);
      
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
 * Run checks in parallel with concurrency limit using p-limit
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
  
  const limit = pLimit(concurrency);
  
  const parallelPromises = checkIds.map(checkId =>
    limit(async (): Promise<CheckResult> => {
      const startTime = Date.now();
      
      try {
        logger.info(`Running parallel check: ${checkId}`);
        
        // Execute actual check based on checkId
        const checkFn = CHECK_FUNCTIONS[checkId as keyof typeof CHECK_FUNCTIONS];
        if (!checkFn) {
          throw new Error(`Check function not found for: ${checkId}`);
        }
        const result = await executeCheck(context, { id: checkId, name: checkId }, checkFn, false);
        
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
    })
  );
  
  const results = await Promise.all(parallelPromises);
  
  logger.info('Parallel checks completed', {
    total: results.length,
    passed: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    concurrencyUsed: Math.min(concurrency, checkIds.length),
  });
  
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
  // Check registry is managed through CHECK_FUNCTIONS in checks/index.ts
  logger.info(`Check ${id} is available through CHECK_FUNCTIONS registry`);
}

/**
 * Get all registered checks
 * @returns string[] - Array of registered check IDs
 */
export function getRegisteredChecks(): string[] {
  // Return all available check IDs from the registry
  return Object.keys(CHECK_FUNCTIONS);
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
    logger.info(`Running check: ${checkId}`);
    
    // Execute actual check based on checkId
    const checkFn = CHECK_FUNCTIONS[checkId as keyof typeof CHECK_FUNCTIONS];
    if (!checkFn) {
      throw new Error(`Check function not found for: ${checkId}`);
    }
    const result = await executeCheck(context, { id: checkId, name: checkId }, checkFn, false);
    
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