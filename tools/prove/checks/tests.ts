// Check: tests.ts
// Goal: Run unit/integration tests using vitest
// Do: npm run test (vitest); surface stdout on fail.

import { type ProveContext } from '../context.js';
import { exec } from '../utils/exec.js';
import { logger } from '../logger.js';
import { captureTestEvidence, storeTestEvidence, TestResults } from '../utils/testEvidence.js';

/**
 * Parse test results from vitest output
 * @param stdout - Standard output from test execution
 * @param stderr - Standard error from test execution
 * @returns TestResults - Parsed test statistics
 */
function parseTestResults(stdout: string, stderr: string): TestResults {
  // Try to extract test statistics from vitest output
  // Look for patterns like "✓ 5 passed" or "✗ 2 failed"
  const passedMatch = stdout.match(/(\d+)\s+passed/);
  const failedMatch = stdout.match(/(\d+)\s+failed/) || stderr.match(/(\d+)\s+failed/);
  
  const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
  const total = passed + failed;
  
  // Extract duration if available
  const durationMatch = stdout.match(/Duration:\s+(\d+(?:\.\d+)?)ms/) || 
                       stdout.match(/took\s+(\d+(?:\.\d+)?)ms/);
  const duration = durationMatch ? parseFloat(durationMatch[1]) : undefined;
  
  return {
    passed,
    failed,
    total,
    duration
  };
}

export interface TestCheckResult {
  ok: boolean;
  reason?: string;
  details?: {
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
    testResults?: TestResults;
    evidenceId?: string;
  };
}

/**
 * Run the test suite using vitest
 * @param context - Prove context
 * @returns Promise<TestCheckResult> - Test execution result
 */
export async function checkTests(context: ProveContext): Promise<TestCheckResult> {
  const startTime = Date.now();
  
  // Run tests in both local and CI environments
  // This ensures the prove system can catch test regressions
  
  try {
    logger.info('Running test suite...');
    
    // Execute npm run test command with coverage flag
    const result = await exec('npm', ['run', 'test', '--', '--coverage'], {
      cwd: context.workingDirectory,
      timeout: context.cfg.checkTimeouts.tests,
    });
    
    const duration = Date.now() - startTime;
    
    // Parse test results from stdout for evidence capture
    const testResults = parseTestResults(result.stdout, result.stderr);
    
    // Capture test evidence for TDD phase detection
    let evidenceId: string | undefined;
    try {
      const evidence = await captureTestEvidence(
        context, 
        testResults, 
        context.tddPhase || 'unknown'
      );
      
      // Store evidence for later analysis
      await storeTestEvidence(evidence, '.prove/evidence.json');
      evidenceId = evidence.id;
      
      logger.info('Test evidence captured', {
        evidenceId: evidence.id,
        phase: evidence.phase,
        testResults: evidence.testResults
      });
    } catch (error) {
      logger.warn('Failed to capture test evidence', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Check if tests passed (exit code 0)
    if (result.success) {
      logger.success('All tests passed', {
        duration,
        testOutput: result.stdout,
        evidenceId
      });
      
      return {
        ok: true,
        details: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.code,
          duration,
          testResults,
          evidenceId
        },
      };
    } else {
      logger.error('Tests failed', {
        exitCode: result.code,
        duration,
        stdout: result.stdout,
        stderr: result.stderr,
        evidenceId
      });
      
      return {
        ok: false,
        reason: `Tests failed with exit code ${result.code}`,
        details: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.code,
          duration,
          testResults,
          evidenceId
        },
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Test execution failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
      details: {
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        duration,
      },
    };
  }
}
