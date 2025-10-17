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
      const reason = generateHelpfulErrorMessage(parsed, commitMessage);
      
      logger.error('Commit message convention check failed', {
        commitMessage,
        reason,
        parsed: parsed.details,
        level: parsed.level
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
 * Progressive validation: Basic format → Enhanced format → Full format
 * 
 * Level 1: Basic conventional commit (type: description)
 * Level 2: + Task ID [T-YYYY-MM-DD-###]
 * Level 3: + Mode [MODE:F|NF]
 * Level 4: + TDD phase [TDD:(red|green|refactor)]
 */
function parseCommitMessage(message: string): { 
  isValid: boolean; 
  level: number;
  details: { 
    type?: string; 
    description?: string; 
    taskId?: string; 
    mode?: string;
    tddPhase?: string;
  } 
} {
  const details: { type?: string; description?: string; taskId?: string; mode?: string; tddPhase?: string } = {};

  // Remove any leading/trailing whitespace and normalize line breaks
  const normalizedMessage = message.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into lines and take the first line (subject)
  const subject = normalizedMessage.split('\n')[0];

  // Level 1: Basic conventional commit format
  const basicPattern = /^(feat|fix|chore|refactor|revert|test):\s+(.+)$/;
  const basicMatch = subject.match(basicPattern);
  
  if (!basicMatch) {
    return {
      isValid: false,
      level: 0,
      details: {
        type: undefined,
        description: undefined,
        taskId: undefined,
        mode: undefined,
        tddPhase: undefined
      }
    };
  }

  // Extract basic components
  details.type = basicMatch[1];
  details.description = basicMatch[2];
  let level = 1;

  // Level 2: Check for task ID
  const taskIdPattern = /\[T-(\d{4}-\d{2}-\d{2}-\d+)\]/;
  const taskIdMatch = subject.match(taskIdPattern);
  if (taskIdMatch) {
    details.taskId = `T-${taskIdMatch[1]}`;
    level = 2;
  }

  // Level 3: Check for mode
  const modePattern = /\[MODE:(F|NF)\]/;
  const modeMatch = subject.match(modePattern);
  if (modeMatch) {
    details.mode = modeMatch[1];
    level = 3;
  }

  // Level 4: Check for TDD phase
  const tddPattern = /\[TDD:(red|green|refactor)\]/;
  const tddMatch = subject.match(tddPattern);
  if (tddMatch) {
    details.tddPhase = tddMatch[1];
    level = 4;
  }

  // Determine if valid based on context
  const isValid = determineValidity(level, details, subject);

  return {
    isValid,
    level,
    details
  };
}

/**
 * Determine if commit message is valid based on level and context
 */
function determineValidity(level: number, details: any, subject: string): boolean {
  // Level 1: Always valid (basic conventional commit)
  if (level === 1) {
    return true;
  }

  // Level 2+: Validate task ID format if present
  if (details.taskId) {
    const taskIdPattern = /^T-\d{4}-\d{2}-\d{2}-\d+$/;
    if (!taskIdPattern.test(details.taskId)) {
      return false;
    }
  }

  // Level 3+: Validate mode if present
  if (details.mode && details.mode !== 'F' && details.mode !== 'NF') {
    return false;
  }

  // Level 4+: Validate TDD phase if present
  if (details.tddPhase && !['red', 'green', 'refactor'].includes(details.tddPhase)) {
    return false;
  }

  // For functional tasks, require at least level 2 (task ID)
  // For non-functional tasks, level 1 is sufficient
  const isFunctionalTask = details.mode === 'F' || 
                          subject.toLowerCase().includes('feat') || 
                          subject.toLowerCase().includes('fix');
  
  if (isFunctionalTask && level < 2) {
    return false;
  }

  return true;
}

/**
 * Generate helpful error messages based on validation level
 */
function generateHelpfulErrorMessage(parsed: any, commitMessage: string): string {
  if (parsed.level === 0) {
    return `Invalid commit message format. Expected: "type: description"\n` +
           `Valid types: feat, fix, chore, refactor, revert, test\n` +
           `Example: "feat: add user authentication"\n` +
           `Got: "${commitMessage}"`;
  }

  if (parsed.level === 1) {
    const isFunctional = commitMessage.toLowerCase().includes('feat') || 
                        commitMessage.toLowerCase().includes('fix');
    
    if (isFunctional) {
      return `Functional commits require task ID. Add [T-YYYY-MM-DD-###] to your message.\n` +
             `Example: "feat: add user authentication [T-2025-01-18-001]"\n` +
             `Got: "${commitMessage}"`;
    }
  }

  if (parsed.level === 2) {
    return `Consider adding mode tag [MODE:F|NF] for better process tracking.\n` +
           `Example: "feat: add user authentication [T-2025-01-18-001] [MODE:F]"\n` +
           `Got: "${commitMessage}"`;
  }

  // Invalid format detected
  return `Commit message format error. Expected: "type: description [T-YYYY-MM-DD-###] [MODE:F|NF]"\n` +
         `Got: "${commitMessage}"`;
}
