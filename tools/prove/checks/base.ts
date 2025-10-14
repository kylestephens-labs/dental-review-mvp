// Base utilities for prove checks
// Provides common patterns and utilities to reduce duplication

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';

export interface CheckResult {
  ok: boolean;
  reason?: string;
  details?: unknown;
}

export interface CheckConfig {
  name: string;
  timeout?: number;
  skipInQuickMode?: boolean;
  requiresBuild?: boolean;
}

export interface SkipConfig {
  reason: string;
  message: string;
  status: 'skipped' | 'disabled' | 'not-applicable';
}

/**
 * Create a standardized skip result
 */
export function createSkipResult(config: SkipConfig): CheckResult {
  logger.info(`${config.message}`);
  return {
    ok: true,
    reason: config.reason,
    details: {
      message: config.message,
      status: config.status
    }
  };
}

/**
 * Create a standardized success result
 */
export function createSuccessResult(message: string, details?: unknown): CheckResult {
  logger.success(message, details);
  return { 
    ok: true,
    details: details
  };
}

/**
 * Create a standardized failure result
 */
export function createFailureResult(
  checkName: string, 
  reason: string, 
  details?: unknown
): CheckResult {
  return {
    ok: false,
    reason: `${checkName} failed: ${reason}`,
    details
  };
}

/**
 * Execute a command with standardized error handling
 */
export async function executeCommand(
  command: string,
  args: string[],
  context: ProveContext,
  config: CheckConfig
): Promise<CheckResult> {
  try {
    const result = await exec(command, args, {
      timeout: config.timeout || 300000, // 5 minute default
      cwd: context.workingDirectory
    });

    if (!result.success) {
      return createFailureResult(config.name, result.stderr, {
        stderr: result.stderr,
        stdout: result.stdout,
        exitCode: result.code
      });
    }

    return createSuccessResult(`${config.name} passed`, {
      message: 'Command completed successfully',
      stdout: result.stdout
    });

  } catch (error) {
    return createFailureResult(
      config.name,
      error instanceof Error ? error.message : String(error),
      error
    );
  }
}

/**
 * Check if a toggle is enabled
 */
export function isToggleEnabled(context: ProveContext, toggleName: keyof typeof context.cfg.toggles): boolean {
  return context.cfg.toggles[toggleName];
}

/**
 * Ensure build exists before running checks that require it
 */
export async function ensureBuildExists(context: ProveContext): Promise<CheckResult> {
  logger.info('Ensuring build exists...');
  
  const buildConfig: CheckConfig = {
    name: 'Build',
    timeout: 300000, // 5 minutes
    requiresBuild: true
  };

  return executeCommand('npm', ['run', 'build'], context, buildConfig);
}

/**
 * Check if we should skip this check in quick mode
 */
export function shouldSkipInQuickMode(config: CheckConfig, quickMode: boolean): boolean {
  return quickMode && (config.skipInQuickMode ?? false);
}
