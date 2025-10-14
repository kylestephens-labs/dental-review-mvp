// Orchestrates checks (serial + parallel)
// Skeleton implementation ready for check registration

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
// import { checkCommitSize } from './checks/commit-size.js'; // Temporarily disabled
import { checkCommitMsgConvention } from './checks/commit-msg-convention.js';
// import { checkFeatureFlagLint } from './checks/feature-flag-lint.js'; // Temporarily disabled
import { checkKillswitchRequired } from './checks/killswitch-required.js';

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
    
    // TEMPORARILY DISABLED: Run commit size check (critical - must be second)
    // TODO: Re-enable when prove quality gates implementation is complete
    /*
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
    */
    
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
    
    // Run kill-switch required check (critical - must be fourth)
    const killswitchStartTime = Date.now();
    const killswitchResult = await checkKillswitchRequired(context);
    const killswitchMs = Date.now() - killswitchStartTime;
    
    const killswitchCheckResult: CheckResult = {
      id: 'killswitch-required',
      ok: killswitchResult.ok,
      ms: killswitchMs,
      reason: killswitchResult.reason,
    };
    
    results.push(killswitchCheckResult);
    
    // If kill-switch check fails, stop here (fail-fast)
    if (!killswitchResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'killswitch-required',
        reason: killswitchResult.reason,
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
    
    // TEMPORARILY DISABLED: Run feature flag lint check (critical - must be fifth)
    // TODO: Re-enable when prove quality gates implementation is complete
    /*
    const featureFlagLintStartTime = Date.now();
    const featureFlagLintResult = await checkFeatureFlagLint(context);
    const featureFlagLintMs = Date.now() - featureFlagLintStartTime;
    
    const featureFlagLintCheckResult: CheckResult = {
      id: 'feature-flag-lint',
      ok: featureFlagLintResult.ok,
      ms: featureFlagLintMs,
      reason: featureFlagLintResult.reason,
    };
    
    results.push(featureFlagLintCheckResult);
    
    // If feature flag lint check fails, stop here (fail-fast)
    if (!featureFlagLintResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'feature-flag-lint',
        reason: featureFlagLintResult.reason,
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
    */
    
    // Run pre-conflict check (critical - must be fifth, skip in quick mode)
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
    
    // Run basic checks (env + lint + typecheck) - always run these
    logger.info('Running basic checks (env + lint + typecheck)...');
    
    // Run environment check
    const envCheckStartTime = Date.now();
    const envCheckResult = await checkEnvCheck(context);
    const envCheckMs = Date.now() - envCheckStartTime;
    
    const envCheckCheckResult: CheckResult = {
      id: 'env-check',
      ok: envCheckResult.ok,
      ms: envCheckMs,
      reason: envCheckResult.reason,
    };
    
    results.push(envCheckCheckResult);
    
    // If env check fails, stop here (fail-fast)
    if (!envCheckResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'env-check',
        reason: envCheckResult.reason,
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
    
    // Run tests
    const testsStartTime = Date.now();
    const testsResult = await checkTests(context);
    const testsMs = Date.now() - testsStartTime;
    
    const testsCheckResult: CheckResult = {
      id: 'tests',
      ok: testsResult.ok,
      ms: testsMs,
      reason: testsResult.reason,
    };
    
    results.push(testsCheckResult);
    
    // If tests fail, stop here (fail-fast)
    if (!testsResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'tests',
        reason: testsResult.reason,
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

    // Run coverage check (optional global check)
    const coverageStartTime = Date.now();
    const coverageResult = await checkCoverage(context);
    const coverageMs = Date.now() - coverageStartTime;

    const coverageCheckResult: CheckResult = {
      id: 'coverage',
      ok: coverageResult.ok,
      ms: coverageMs,
      reason: coverageResult.reason,
    };

    results.push(coverageCheckResult);

    // If coverage fails and fail-fast is enabled, stop here
    if (!coverageResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'coverage',
        reason: coverageResult.reason,
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

    // Run TDD check (functional mode only)
    const tddStartTime = Date.now();
    const tddResult = await checkTddChangedHasTests(context);
    const tddMs = Date.now() - tddStartTime;

    const tddCheckResult: CheckResult = {
      id: 'tdd-changed-has-tests',
      ok: tddResult.ok,
      ms: tddMs,
      reason: tddResult.reason,
    };

    results.push(tddCheckResult);

    // If TDD check fails and fail-fast is enabled, stop here
    if (!tddResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'tdd-changed-has-tests',
        reason: tddResult.reason,
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

    // Run diff coverage check (functional mode only)
    const diffCoverageStartTime = Date.now();
    const diffCoverageResult = await checkDiffCoverage(context);
    const diffCoverageMs = Date.now() - diffCoverageStartTime;

    const diffCoverageCheckResult: CheckResult = {
      id: 'diff-coverage',
      ok: diffCoverageResult.ok,
      ms: diffCoverageMs,
      reason: diffCoverageResult.reason,
    };

    results.push(diffCoverageCheckResult);

    // If diff coverage check fails and fail-fast is enabled, stop here
    if (!diffCoverageResult.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId: 'diff-coverage',
        reason: diffCoverageResult.reason,
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