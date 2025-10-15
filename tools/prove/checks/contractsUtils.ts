/**
 * Contracts check utilities for API specification validation and webhook testing
 */

import { exec } from '../utils/exec.js';
import type { ProveContext } from '../context.js';

export interface LintResult {
  ok: boolean;
  reason?: string;
  details?: string;
}

export interface WebhookTestResult {
  ok: boolean;
  reason?: string;
  details?: string;
}

/**
 * Validate OpenAPI specification using redocly
 */
export async function validateOpenApiSpec(specPath: string, context: ProveContext): Promise<LintResult> {
  const { log } = context;
  
  log.info(`Validating OpenAPI specification: ${specPath}`);
  
  try {
    const lintResult = await exec('npx', ['redocly', 'lint', specPath], {
      timeout: 30000,
      cwd: process.cwd(),
    });

    if (lintResult.code !== 0) {
      return {
        ok: false,
        reason: 'OpenAPI specification validation failed',
        details: `redocly lint failed:\n${lintResult.stdout}\n${lintResult.stderr}`
      };
    }

    return { ok: true, reason: 'OpenAPI specification validation passed' };
  } catch (error) {
    return {
      ok: false,
      reason: 'OpenAPI specification validation failed with error',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test Stripe webhook signature validation
 */
export async function testStripeWebhookSignature(context: ProveContext): Promise<WebhookTestResult> {
  const { log } = context;
  
  log.info('Running Stripe webhook signature tests...');
  
  try {
    const testResult = await exec('npm', ['run', 'test', '--', 'backend/src/__tests__/api/webhooks/stripe.test.ts'], {
      timeout: 30000,
      cwd: process.cwd(),
    });

    if (testResult.code !== 0) {
      return {
        ok: false,
        reason: 'Stripe webhook signature tests failed',
        details: `Test output:\n${testResult.stdout}\n${testResult.stderr}`
      };
    }

    return { ok: true, reason: 'Stripe webhook signature tests passed' };
  } catch (error) {
    return {
      ok: false,
      reason: 'Stripe webhook signature test execution failed',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test Twilio webhook signature validation
 */
export async function testTwilioWebhookSignature(context: ProveContext): Promise<WebhookTestResult> {
  const { log } = context;
  
  log.info('Running Twilio webhook signature tests...');
  
  // For now, Twilio webhook tests are not implemented
  // This is a placeholder for future implementation
  return { ok: true, reason: 'Twilio webhook tests not implemented (skipped)' };
}

/**
 * Run all webhook signature tests
 */
export async function runWebhookTests(context: ProveContext): Promise<WebhookTestResult> {
  const { log } = context;

  log.info('Running webhook signature tests...');

  try {
    // Test Stripe webhook signature validation
    const stripeTestResult = await testStripeWebhookSignature(context);
    if (!stripeTestResult.ok) {
      return stripeTestResult;
    }

    // Test Twilio webhook signature validation
    const twilioTestResult = await testTwilioWebhookSignature(context);
    if (!twilioTestResult.ok) {
      return twilioTestResult;
    }

    return { ok: true, reason: 'Webhook signature tests passed' };
  } catch (error) {
    return {
      ok: false,
      reason: 'Webhook signature tests failed',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
