import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';

export async function checkEnvCheck(context: ProveContext): Promise<{ ok: boolean; reason?: string; details?: unknown }> {
  logger.info('Running environment variable validation...');
  
  // Skip environment check in CI if secrets are not available
  if (context.isCI) {
    const hasRequiredSecrets = process.env.STRIPE_SECRET_KEY && 
                              process.env.DATABASE_URL && 
                              process.env.HMAC_SECRET_KEY;
    
    if (!hasRequiredSecrets) {
      logger.info('Skipping environment check in CI - secrets not configured', {
        message: 'Environment variables not set in GitHub Secrets. Skipping validation.',
        status: 'skipped'
      });
      return { 
        ok: true, 
        reason: 'skipped (secrets not configured in CI)',
        details: { 
          message: 'Environment check skipped in CI because required secrets are not configured in GitHub repository settings',
          status: 'skipped',
          isCI: true
        }
      };
    }
  }
  
  try {
    const result = await exec('npm', ['run', 'env:check'], {
      timeout: 60000, // 1 minute timeout
      cwd: context.workingDirectory
    });

    if (!result.success) {
      return {
        ok: false,
        reason: `Environment validation failed: ${result.stderr}`,
        details: { 
          stderr: result.stderr, 
          stdout: result.stdout,
          exitCode: result.code
        }
      };
    }

    logger.success('Environment validation passed', { 
      message: 'All required environment variables are present and valid',
      outputLength: result.stdout.length
    });
    return { ok: true };

  } catch (error) {
    return {
      ok: false,
      reason: `Environment validation failed: ${error instanceof Error ? error.message : String(error)}`,
      details: error
    };
  }
}
