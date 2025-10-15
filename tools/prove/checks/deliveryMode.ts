import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { ProveContext } from '../context.js';
import type { CheckResult } from '../runner.js';
import { readProblemAnalysis } from '../validation/problemAnalysis.js';

export interface DeliveryModeContext {
  taskJson?: {
    mode: 'functional' | 'non-functional';
    updatedAt: string;
    source: string;
    note: string;
  };
  prLabels?: string[];
  prTitle?: string;
  env: NodeJS.ProcessEnv;
}

export interface DeliveryModeResult {
  ok: boolean;
  mode: 'functional' | 'non-functional';
  reason?: string;
  details?: string;
}

/**
 * Resolves delivery mode using priority chain:
 * 1. PROVE_MODE env var (fast-path for orchestrators)
 * 2. tasks/TASK.json (canonical artifact)
 * 3. PR labels (mode:functional|mode:non-functional)
 * 4. PR title tags ([MODE:F]|[MODE:NF])
 * 5. Default to functional
 */
export function resolveMode(context: DeliveryModeContext): 'functional' | 'non-functional' {
  // 1. PROVE_MODE env var (fast-path for orchestrators)
  if (context.env.PROVE_MODE) {
    const mode = context.env.PROVE_MODE.toLowerCase();
    if (mode === 'functional' || mode === 'non-functional') {
      return mode;
    }
  }

  // 2. tasks/TASK.json (canonical artifact)
  if (context.taskJson?.mode) {
    return context.taskJson.mode;
  }

  // 3. PR labels (fallback)
  if (context.prLabels?.includes('mode:functional')) {
    return 'functional';
  }
  if (context.prLabels?.includes('mode:non-functional')) {
    return 'non-functional';
  }

  // 4. PR title tags (fallback)
  if (context.prTitle?.includes('[MODE:F]')) {
    return 'functional';
  }
  if (context.prTitle?.includes('[MODE:NF]')) {
    return 'non-functional';
  }

  // 5. Default to functional
  return 'functional';
}

/**
 * Validates that non-functional tasks have adequate problem analysis documentation
 */
function validateProblemAnalysis(): { ok: boolean; reason?: string; details?: string } {
  return readProblemAnalysis();
}

/**
 * Convert ProveContext to DeliveryModeContext
 */
function convertToDeliveryModeContext(context: ProveContext): DeliveryModeContext {
  return {
    taskJson: context.taskJson,
    prLabels: context.git.prLabels,
    prTitle: context.git.prTitle,
    env: context.env
  };
}

/**
 * Main delivery mode check function - wrapper for ProveContext
 */
export async function checkDeliveryMode(context: ProveContext): Promise<CheckResult> {
  // Use the context's mode instead of resolving it again
  const mode = context.mode;
  
  // For functional tasks, just confirm mode (TDD outcomes enforced elsewhere)
  if (mode === 'functional') {
    return {
      id: 'delivery-mode',
      ok: true,
      ms: 0, // Will be set by runner
      reason: 'Functional mode resolved successfully'
    };
  }

  // For non-functional tasks, require adequate problem analysis
  const analysisResult = validateProblemAnalysis();
  
  if (!analysisResult.ok) {
    return {
      id: 'delivery-mode',
      ok: false,
      ms: 0, // Will be set by runner
      reason: analysisResult.reason,
      details: analysisResult.details
    };
  }

  return {
    id: 'delivery-mode',
    ok: true,
    ms: 0, // Will be set by runner
    reason: 'Non-functional mode with adequate problem analysis'
  };
}

/**
 * Internal delivery mode check function
 */
function checkDeliveryModeInternal(context: DeliveryModeContext): DeliveryModeResult {
  const mode = resolveMode(context);
  
  // For functional tasks, just resolve mode (TDD outcomes enforced elsewhere)
  if (mode === 'functional') {
    return {
      ok: true,
      mode: 'functional',
      reason: 'Functional mode resolved successfully'
    };
  }

  // For non-functional tasks, require adequate problem analysis
  const analysisResult = validateProblemAnalysis();
  
  if (!analysisResult.ok) {
    return {
      ok: false,
      mode: 'non-functional',
      reason: analysisResult.reason,
      details: analysisResult.details
    };
  }

  return {
    ok: true,
    mode: 'non-functional',
    reason: 'Non-functional mode with adequate problem analysis'
  };
}

/**
 * Load TASK.json from filesystem with strict validation
 */
export function loadTaskJson(): DeliveryModeContext['taskJson'] | undefined {
  const taskJsonPath = 'tasks/TASK.json';
  
  if (!existsSync(taskJsonPath)) {
    return undefined;
  }
  
  try {
    const content = readFileSync(taskJsonPath, 'utf8');
    const parsed = JSON.parse(content);
    
    // Validate required fields
    if (!parsed.mode) {
      throw new Error('Missing required field: mode');
    }
    
    // Validate mode value is one of the expected values
    if (parsed.mode !== 'functional' && parsed.mode !== 'non-functional') {
      throw new Error(`Invalid mode value: "${parsed.mode}". Must be "functional" or "non-functional"`);
    }
    
    // Validate other fields exist (but allow empty strings)
    if (typeof parsed.updatedAt !== 'string') {
      throw new Error('Invalid updatedAt field: must be a string');
    }
    if (typeof parsed.source !== 'string') {
      throw new Error('Invalid source field: must be a string');
    }
    if (typeof parsed.note !== 'string') {
      throw new Error('Invalid note field: must be a string');
    }
    
    return {
      mode: parsed.mode,
      updatedAt: parsed.updatedAt,
      source: parsed.source,
      note: parsed.note
    };
  } catch (error) {
    // Re-throw with context about the file path
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load tasks/TASK.json: ${message}`);
  }
}

/**
 * Create context for delivery mode check
 */
export function createDeliveryModeContext(overrides: Partial<DeliveryModeContext> = {}): DeliveryModeContext {
  let taskJson: DeliveryModeContext['taskJson'] | undefined;
  
  try {
    taskJson = loadTaskJson();
  } catch (error) {
    // If TASK.json is malformed, we should fail the entire check
    // This ensures we don't silently fall back to wrong mode
    throw error;
  }
  
  return {
    taskJson,
    prLabels: [],
    prTitle: '',
    env: process.env,
    ...overrides
  };
}
