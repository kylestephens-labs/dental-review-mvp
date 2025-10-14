// Runner utilities to DRY up timing and fail-fast logic
// Small helper functions without changing the core runner structure

import { type ProveContext } from '../context.js';
import { type CheckResult } from '../runner.js';
import { logger } from '../logger.js';

export class RunnerUtils {
  /**
   * Execute a check with timing and error handling
   * DRYs up the repetitive timing/fail-fast logic in runner.ts
   */
  static async runCheck(
    checkId: string,
    checkFn: (context: ProveContext) => Promise<CheckResult>,
    context: ProveContext
  ): Promise<CheckResult> {
    const startTime = Date.now();
    
    try {
      const result = await checkFn(context);
      const duration = Date.now() - startTime;
      
      return {
        ...result,
        id: checkId,
        ms: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Check ${checkId} failed unexpectedly`, {
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      
      return {
        id: checkId,
        ok: false,
        ms: duration,
        reason: `${checkId} check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Handle fail-fast logic for a failed check
   * DRYs up the repetitive fail-fast handling in runner.ts
   */
  static handleFailure(
    checkId: string,
    result: CheckResult,
    results: CheckResult[],
    startTime: number,
    failFast: boolean
  ): CheckResult[] | null {
    if (!result.ok && failFast) {
      logger.error('Critical check failed - stopping execution', {
        checkId,
        reason: result.reason,
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

      return results; // Return current results to stop execution
    }

    return null; // Continue execution
  }
}
