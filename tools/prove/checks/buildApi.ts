import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { createSkipResult, type CheckResult } from './base.js';

export async function checkBuildApi(context: ProveContext): Promise<CheckResult> {
  logger.info('Running backend build check...');
  
  // Stub implementation - no server build exists yet
  return createSkipResult({
    reason: 'skipped (no server build)',
    message: 'Backend build check is a placeholder until server build is implemented',
    status: 'not-applicable'
  });
}
