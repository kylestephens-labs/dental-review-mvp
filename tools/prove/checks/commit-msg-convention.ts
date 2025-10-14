import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { exec } from '../utils/exec.js';

export interface CommitMsgConventionResult {
  ok: boolean;
  reason?: string;
  commitMessage?: string;
  parsed?: {
    type?: string;
    description?: string;
    taskId?: string;
    mode?: string;
  };
  details?: unknown;
}

/**
 * Enforce commit message convention
 * Format: (<feat|fix|chore|refactor|revert>): ... [T-YYYY-MM-DD-###] [MODE:F|NF]
 * @param context - Prove context
 * @returns Promise<CommitMsgConventionResult> - Check result
 */
export async function checkCommitMsgConvention(context: ProveContext): Promise<CommitMsgConventionResult> {
  logger.info('Checking commit message convention...');

  try {
    // Get the latest commit message
    const result = await exec('git', ['log', '-1', '--pretty=%B'], {
      timeout: 10000,
      cwd: context.workingDirectory
    });

    if (!result.success) {
      return {
        ok: false,
        reason: `Failed to get commit message: ${result.stderr}`,
        details: result
      };
    }

    const commitMessage = result.stdout.trim();
    
    if (!commitMessage) {
      return {
        ok: false,
        reason: 'No commit message found',
        commitMessage: ''
      };
    }

    logger.info('Analyzing commit message', { commitMessage });

    // Parse the commit message according to the convention
    const parsed = parseCommitMessage(commitMessage);

    if (!parsed.isValid) {
      const reason = `Commit message does not match convention. Expected format: (<feat|fix|chore|refactor|revert>): ... [T-YYYY-MM-DD-###] [MODE:F|NF]. Got: "${commitMessage}"`;
      
      logger.error('Commit message convention check failed', {
        commitMessage,
        reason,
        parsed: parsed.details
      });

      return {
        ok: false,
        reason,
        commitMessage,
        parsed: parsed.details
      };
    }

    logger.success('Commit message convention check passed', {
      commitMessage,
      parsed: parsed.details
    });

    return {
      ok: true,
      commitMessage,
      parsed: parsed.details
    };

  } catch (error) {
    const reason = `Commit message convention check failed: ${error instanceof Error ? error.message : String(error)}`;
    
    logger.error('Commit message convention check failed with error', {
      error: reason
    });

    return {
      ok: false,
      reason,
      details: error
    };
  }
}

/**
 * Parse commit message according to convention
 * Format: (<feat|fix|chore|refactor|revert>): ... [T-YYYY-MM-DD-###] [MODE:F|NF]
 */
function parseCommitMessage(message: string): { isValid: boolean; details: { type?: string; description?: string; taskId?: string; mode?: string } } {
  const details: { type?: string; description?: string; taskId?: string; mode?: string } = {};

  // Remove any leading/trailing whitespace and normalize line breaks
  const normalizedMessage = message.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into lines and take the first line (subject)
  const subject = normalizedMessage.split('\n')[0];

  // Regex pattern for the convention:
  // (<feat|fix|chore|refactor|revert>): ... [T-YYYY-MM-DD-###] [MODE:F|NF]
  const conventionPattern = /^(feat|fix|chore|refactor|revert):\s+(.+?)\s+\[T-(\d{4}-\d{2}-\d{2}-\d+)\]\s+\[MODE:(F|NF)\]$/;

  const match = subject.match(conventionPattern);

  if (!match) {
    return {
      isValid: false,
      details: {
        type: undefined,
        description: undefined,
        taskId: undefined,
        mode: undefined
      }
    };
  }

  // Extract components
  details.type = match[1];
  details.description = match[2];
  details.taskId = `T-${match[3]}`;
  details.mode = match[4];

  // Additional validation
  if (!details.type || !details.description || !details.taskId || !details.mode) {
    return {
      isValid: false,
      details
    };
  }

  // Validate task ID format (T-YYYY-MM-DD-###)
  const taskIdPattern = /^T-\d{4}-\d{2}-\d{2}-\d+$/;
  if (!taskIdPattern.test(details.taskId)) {
    return {
      isValid: false,
      details
    };
  }

  // Validate mode (F or NF)
  if (details.mode !== 'F' && details.mode !== 'NF') {
    return {
      isValid: false,
      details
    };
  }

  return {
    isValid: true,
    details
  };
}
