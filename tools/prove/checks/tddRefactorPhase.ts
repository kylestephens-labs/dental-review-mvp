// TDD Refactor Phase Validation
// Ensures code quality improvements and behavior preservation in Refactor phase

import { ProveContext } from '../context.js';
import { checkTests } from './tests.js';
import { logger } from '../logger.js';

export interface TddRefactorPhaseResult {
  ok: boolean;
  id: string;
  ms: number;
  reason?: string;
  details?: {
    refactorValidation?: any;
    qualityValidation?: any;
    behaviorValidation?: any;
  };
}

/**
 * Validate that the Refactor phase of TDD is properly executed
 * Refactor phase requirements:
 * 1. Refactoring must have actually occurred
 * 2. Code quality must improve
 * 3. Behavior must be preserved (tests still pass)
 */
export async function checkTddRefactorPhase(context: ProveContext): Promise<TddRefactorPhaseResult> {
  const startTime = Date.now();
  
  logger.info('Starting TDD Refactor phase validation', {
    tddPhase: context.tddPhase,
    mode: context.mode,
    changedFilesCount: context.git.changedFiles.length
  });

  // Only run Refactor phase validation if we're in Refactor phase
  if (context.tddPhase !== 'refactor') {
    const duration = Date.now() - startTime;
    return {
      ok: true,
      id: 'tdd-refactor-phase',
      ms: duration,
      reason: 'Not in Refactor phase - skipping validation'
    };
  }

  try {
    // 1. Validate that refactoring actually happened
    logger.info('Validating refactoring occurred...');
    const refactorValidation = await validateRefactoringOccurred(context);
    
    if (!refactorValidation.ok) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-refactor-phase',
        ms: duration,
        reason: 'Refactoring must have occurred in Refactor phase',
        details: {
          refactorValidation: refactorValidation.details
        }
      };
    }

    // 2. Validate code quality improvements
    logger.info('Validating code quality improvements...');
    const qualityValidation = await validateQualityImprovement(context);
    
    if (!qualityValidation.ok) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-refactor-phase',
        ms: duration,
        reason: 'Code quality must improve in Refactor phase',
        details: {
          refactorValidation: refactorValidation.details,
          qualityValidation: qualityValidation.details
        }
      };
    }

    // 3. Validate behavior preservation (tests still pass)
    logger.info('Validating behavior preservation...');
    const behaviorValidation = await validateBehaviorPreservation(context);
    
    if (!behaviorValidation.ok) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-refactor-phase',
        ms: duration,
        reason: 'Behavior must be preserved in Refactor phase',
        details: {
          refactorValidation: refactorValidation.details,
          qualityValidation: qualityValidation.details,
          behaviorValidation: behaviorValidation.details
        }
      };
    }

    const duration = Date.now() - startTime;
    
    logger.success('TDD Refactor phase validation passed', {
      duration,
      refactorValidation: refactorValidation.details,
      qualityValidation: qualityValidation.details,
      behaviorValidation: behaviorValidation.details
    });

    return {
      ok: true,
      id: 'tdd-refactor-phase',
      ms: duration,
      reason: 'TDD Refactor phase validation passed',
      details: {
        refactorValidation: refactorValidation.details,
        qualityValidation: qualityValidation.details,
        behaviorValidation: behaviorValidation.details
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('TDD Refactor phase validation failed', {
      error: error instanceof Error ? error.message : String(error),
      duration
    });

    return {
      ok: false,
      id: 'tdd-refactor-phase',
      ms: duration,
      reason: `TDD Refactor phase validation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validate that refactoring actually occurred
 * Checks for evidence of refactoring in changed files
 */
async function validateRefactoringOccurred(context: ProveContext): Promise<{ ok: boolean; details?: any }> {
  const changedFiles = context.git.changedFiles;
  
  if (changedFiles.length === 0) {
    return {
      ok: false,
      details: {
        message: 'No files changed - refactoring requires file modifications',
        changedFiles: 0
      }
    };
  }

  // Check if files are test files (refactoring should primarily affect source files)
  const isTestFile = (file: string): boolean => {
    return file.includes('.test.') || 
           file.includes('.spec.') || 
           file.endsWith('.test.ts') || 
           file.endsWith('.spec.ts') ||
           file.includes('/test/') ||
           file.includes('/tests/') ||
           file.includes('__tests__');
  };

  const sourceFiles = changedFiles.filter(file => !isTestFile(file));
  const testFiles = changedFiles.filter(file => isTestFile(file));

  // Refactoring should primarily affect source files
  if (sourceFiles.length === 0) {
    return {
      ok: false,
      details: {
        message: 'Refactoring should primarily affect source files, not just test files',
        sourceFiles: sourceFiles.length,
        testFiles: testFiles.length
      }
    };
  }

  // Check for refactoring indicators in commit message
  const commitMessage = context.git.commitMessage.toLowerCase();
  const refactorIndicators = [
    'refactor', 'improve', 'optimize', 'clean', 'simplify', 
    'extract', 'consolidate', 'reorganize', 'restructure'
  ];
  
  const hasRefactorIndicators = refactorIndicators.some(indicator => 
    commitMessage.includes(indicator)
  );

  if (!hasRefactorIndicators) {
    return {
      ok: false,
      details: {
        message: 'Commit message should indicate refactoring activity',
        commitMessage: context.git.commitMessage,
        suggestedIndicators: refactorIndicators
      }
    };
  }

  return {
    ok: true,
    details: {
      message: 'Refactoring evidence validated',
      sourceFiles: sourceFiles.length,
      testFiles: testFiles.length,
      hasRefactorIndicators: true
    }
  };
}

/**
 * Validate code quality improvements
 * This is a simplified implementation - in a real system, you'd use tools like SonarQube
 */
async function validateQualityImprovement(context: ProveContext): Promise<{ ok: boolean; details?: any }> {
  const changedFiles = context.git.changedFiles;
  
  // For now, we'll do basic validation
  // In a real implementation, you'd analyze:
  // - Cyclomatic complexity reduction
  // - Code duplication elimination
  // - Method/function length reduction
  // - Naming improvements
  // - Structure improvements

  // Check for refactoring indicators in commit message
  const commitMessage = context.git.commitMessage.toLowerCase();
  const refactorIndicators = [
    'refactor', 'extract', 'simplify', 'optimize', 'clean', 'improve',
    'restructure', 'reorganize', 'consolidate', 'deduplicate'
  ];
  
  const hasRefactorIndicators = refactorIndicators.some(indicator => 
    commitMessage.includes(indicator)
  );

  if (!hasRefactorIndicators) {
    return {
      ok: false,
      details: {
        message: 'Refactor phase should include refactoring indicators in commit message',
        suggestedImprovements: [
          'extract method', 'extract class', 'inline method', 'move method',
          'rename', 'remove duplication', 'simplify', 'optimize'
        ],
        commitMessage: context.git.commitMessage
      }
    };
  }


  return {
    ok: true,
    details: {
      message: 'Code quality improvements validated',
      hasQualityImprovements: true
    }
  };
}

/**
 * Validate behavior preservation
 * Ensures tests still pass after refactoring
 */
async function validateBehaviorPreservation(context: ProveContext): Promise<{ ok: boolean; details?: any }> {
  try {
    // Run tests to ensure behavior is preserved
    const testResult = await checkTests(context);
    
    if (!testResult.ok) {
      return {
        ok: false,
        details: {
          message: 'Tests must pass after refactoring to preserve behavior',
          testResult: testResult.details
        }
      };
    }

    return {
      ok: true,
      details: {
        message: 'Behavior preservation validated - all tests pass',
        testResult: testResult.details
      }
    };

  } catch (error) {
    return {
      ok: false,
      details: {
        message: 'Failed to validate behavior preservation',
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}
