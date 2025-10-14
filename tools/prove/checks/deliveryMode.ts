import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
  const problemAnalysisPath = 'tasks/PROBLEM_ANALYSIS.md';
  
  if (!existsSync(problemAnalysisPath)) {
    return {
      ok: false,
      reason: 'Missing PROBLEM_ANALYSIS.md',
      details: 'Non-functional tasks require tasks/PROBLEM_ANALYSIS.md with ## Analyze, ## Fix, ## Validate sections'
    };
  }

  try {
    const content = readFileSync(problemAnalysisPath, 'utf8');
    
    // Check for required sections (updated to match PROBLEM_ANALYSIS.md template)
    const hasAnalyze = content.includes('## Analyze');
    const hasRootCause = content.includes('## Identify Root Cause');
    const hasFix = content.includes('## Fix Directly');
    const hasValidate = content.includes('## Validate');
    
    if (!hasAnalyze || !hasRootCause || !hasFix || !hasValidate) {
      const missing = [];
      if (!hasAnalyze) missing.push('## Analyze');
      if (!hasRootCause) missing.push('## Identify Root Cause');
      if (!hasFix) missing.push('## Fix Directly');
      if (!hasValidate) missing.push('## Validate');
      
      return {
        ok: false,
        reason: `Missing required sections: ${missing.join(', ')}`,
        details: 'Non-functional tasks require all four sections: ## Analyze, ## Identify Root Cause, ## Fix Directly, ## Validate'
      };
    }

    // Check minimum content length (200 chars trimmed)
    const trimmedContent = content.trim();
    if (trimmedContent.length < 200) {
      return {
        ok: false,
        reason: `Insufficient content length: ${trimmedContent.length} chars (minimum 200)`,
        details: 'Non-functional tasks require substantial analysis documentation (≥200 characters)'
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: 'Failed to read PROBLEM_ANALYSIS.md',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Main delivery mode check function
 */
export function checkDeliveryMode(context: DeliveryModeContext): DeliveryModeResult {
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
