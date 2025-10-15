// API contracts validation check
// Validates OpenAPI specification and webhook signatures

import type { ProveContext } from '../context.js';
import { validateOpenApiSpec, runWebhookTests } from './contractsUtils.js';

export async function checkContracts(context: ProveContext): Promise<{ ok: boolean; reason?: string; details?: string }> {
  const { cfg, log } = context;

  // Skip if contracts toggle is disabled
  if (!cfg.toggles.contracts) {
    log.info('Contracts check skipped (toggle disabled)');
    return { ok: true, reason: 'Contracts check disabled' };
  }

  log.info('Running API contracts validation...');

  try {
    // Validate OpenAPI specification
    const specPath = 'api-spec.yaml';
    const lintResult = await validateOpenApiSpec(specPath, context);
    if (!lintResult.ok) {
      return lintResult;
    }

    // Run webhook signature tests
    const webhookTestResult = await runWebhookTests(context);
    if (!webhookTestResult.ok) {
      return webhookTestResult;
    }

    log.info('API contracts validation passed');
    return { ok: true, reason: 'API contracts validation passed' };

  } catch (error) {
    log.error('Contracts check failed with error', { error: error instanceof Error ? error.message : String(error) });
    return {
      ok: false,
      reason: 'Contracts check failed with error',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

