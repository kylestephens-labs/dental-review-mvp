import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { executeCommand, type CheckConfig, type CheckResult } from './base.js';

export async function checkBuildWeb(context: ProveContext): Promise<CheckResult> {
  logger.info('Running frontend build check...');
  
  const config: CheckConfig = {
    name: 'Frontend build',
    timeout: 300000, // 5 minute timeout for build
    skipInQuickMode: true, // Skip in quick mode
    requiresBuild: true
  };

  return executeCommand('npm', ['run', 'build'], context, config);
}
