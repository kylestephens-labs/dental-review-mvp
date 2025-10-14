import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';

export async function checkTypecheck(context: ProveContext): Promise<{ ok: boolean; reason?: string; details?: unknown }> {
  logger.info('Running TypeScript type check...');
  
  try {
    const result = await exec('npm', ['run', 'typecheck'], {
      timeout: 120000, // 2 minute timeout
      cwd: context.workingDirectory
    });

    if (!result.success) {
      return {
        ok: false,
        reason: `TypeScript type check failed: ${result.stderr}`,
        details: { stderr: result.stderr, stdout: result.stdout }
      };
    }

    logger.success('TypeScript type check passed', { message: 'No type errors found' });
    return { ok: true };

  } catch (error) {
    return {
      ok: false,
      reason: `TypeScript type check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: error
    };
  }
}
