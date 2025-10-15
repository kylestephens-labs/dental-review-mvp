import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';

export async function checkEnvCheck(context: ProveContext): Promise<{ ok: boolean; reason?: string; details?: unknown }> {
  logger.info('Running environment variable validation...');
  
  try {
    const result = await exec('npm', ['run', 'env:check'], {
      timeout: 60000, // 1 minute timeout
      cwd: context.workingDirectory
    });

    if (!result.success) {
      logger.error('Environment check failed', {
        stderr: result.stderr,
        stdout: result.stdout,
        exitCode: result.code
      });
      
      return {
        ok: false,
        reason: `Environment validation failed with exit code ${result.code}`,
        details: {
          stderr: result.stderr,
          stdout: result.stdout,
          exitCode: result.code
        }
      };
    }

    logger.info('Environment check passed');
    return {
      ok: true,
      reason: 'Environment validation successful',
      details: {
        stdout: result.stdout,
        stderr: result.stderr
      }
    };

  } catch (error) {
    logger.error('Environment check failed with error', { error });
    
    return {
      ok: false,
      reason: `Environment check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}