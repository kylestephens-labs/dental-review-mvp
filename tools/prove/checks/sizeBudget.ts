import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { 
  createSkipResult, 
  createSuccessResult, 
  createFailureResult,
  isToggleEnabled,
  ensureBuildExists,
  type CheckResult 
} from './base.js';

export async function checkSizeBudget(context: ProveContext, buildAlreadyExists: boolean = false): Promise<CheckResult> {
  logger.info('Running bundle size budget check...');
  
  // Check if size budget is enabled
  if (!isToggleEnabled(context, 'sizeBudget')) {
    return createSkipResult({
      reason: 'skipped (size budget disabled)',
      message: 'Bundle size budget check is disabled in configuration',
      status: 'disabled'
    });
  }

  try {
    // Only ensure build exists if it wasn't already built
    if (!buildAlreadyExists) {
      logger.info('Ensuring build exists for size analysis...');
      const buildResult = await ensureBuildExists(context);
      if (!buildResult.ok) {
        return createFailureResult(
          'Bundle size budget check',
          `Build failed before size check: ${buildResult.reason}`,
          buildResult.details
        );
      }
    } else {
      logger.info('Using existing build for size analysis...');
    }

    // Run size-limit check
    logger.info('Running size-limit analysis...');
    const { exec } = await import('../utils/exec.js');
    const result = await exec('npm', ['run', 'size-limit'], {
      timeout: 120000, // 2 minute timeout for size analysis
      cwd: context.workingDirectory
    });

    if (!result.success) {
      return createFailureResult(
        'Bundle size budget check',
        `Bundle size budget exceeded: ${result.stderr}`,
        { 
          stderr: result.stderr, 
          stdout: result.stdout,
          exitCode: result.code
        }
      );
    }

    return createSuccessResult('Bundle size budget check passed', {
      message: 'All bundles within size limits',
      stdout: result.stdout
    });

  } catch (error) {
    return createFailureResult(
      'Bundle size budget check',
      error instanceof Error ? error.message : String(error),
      error
    );
  }
}
