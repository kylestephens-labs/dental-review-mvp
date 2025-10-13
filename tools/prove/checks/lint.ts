import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';

export async function checkLint(context: ProveContext): Promise<{ ok: boolean; reason?: string; details?: unknown }> {
  logger.info('Running ESLint...');
  
  try {
    const result = await exec('npx', ['eslint', 'src/', '--ext', '.ts,.tsx,.js,.jsx', '--ignore-pattern', 'src/__tests__/*', '--ignore-pattern', 'src/impl-*', '--ignore-pattern', 'src/refactor-*', '--max-warnings', '0'], {
      timeout: 60000, // 1 minute timeout
      cwd: context.workingDirectory
    });

    if (!result.success) {
      return {
        ok: false,
        reason: `ESLint found errors: ${result.stderr}`,
        details: { stderr: result.stderr, stdout: result.stdout }
      };
    }

    logger.success('ESLint passed', { message: 'No linting errors found' });
    return { ok: true };

  } catch (error) {
    return {
      ok: false,
      reason: `ESLint check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: error
    };
  }
}
