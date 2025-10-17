// TDD Green Phase Validation
// Ensures tests pass and implementation is complete in Green phase

import { ProveContext } from '../context.js';
import { checkTests } from './tests.js';
import { checkDiffCoverage } from './diffCoverage.js';
import { logger } from '../logger.js';

export interface TddGreenPhaseResult {
  ok: boolean;
  id: string;
  ms: number;
  reason?: string;
  details?: {
    testResult?: any;
    implementationValidation?: any;
    coverageValidation?: any;
  };
}

/**
 * Validate that the Green phase of TDD is properly executed
 * Green phase requirements:
 * 1. Tests must pass
 * 2. Implementation must be complete
 * 3. Coverage thresholds must be met
 */
export async function checkTddGreenPhase(context: ProveContext): Promise<TddGreenPhaseResult> {
  const startTime = Date.now();
  
  logger.info('Starting TDD Green phase validation', {
    tddPhase: context.tddPhase,
    mode: context.mode,
    changedFilesCount: context.git.changedFiles.length
  });

  // Only run Green phase validation if we're in Green phase
  if (context.tddPhase !== 'green') {
    const duration = Date.now() - startTime;
    return {
      ok: true,
      id: 'tdd-green-phase',
      ms: duration,
      reason: 'Not in Green phase - skipping validation'
    };
  }

  try {
    // 1. Validate that tests pass
    logger.info('Validating tests pass in Green phase...');
    const testResult = await checkTests(context);
    
    if (!testResult.ok) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-green-phase',
        ms: duration,
        reason: 'Tests must pass in Green phase',
        details: {
          testResult: testResult.details
        }
      };
    }

    // 2. Validate implementation completeness
    logger.info('Validating implementation completeness...');
    const implementationValidation = await validateImplementationComplete(context);
    
    if (!implementationValidation.ok) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-green-phase',
        ms: duration,
        reason: 'Implementation must be complete in Green phase',
        details: {
          testResult: testResult.details,
          implementationValidation: implementationValidation.details
        }
      };
    }

    // 3. Validate coverage thresholds for Green phase (informational only)
    logger.info('Validating coverage thresholds for Green phase...');
    const coverageValidation = await validateCoverageThreshold(context);
    
    // Coverage validation is informational only - don't fail the check
    // The actual coverage validation happens in the dedicated diff-coverage check
    if (!coverageValidation.ok) {
      logger.warn('Coverage validation failed in Green phase', {
        reason: coverageValidation.details?.message,
        note: 'This is informational only - actual coverage validation happens after tests complete'
      });
    }

    const duration = Date.now() - startTime;
    
    logger.success('TDD Green phase validation passed', {
      duration,
      testResult: testResult.details?.testResults,
      implementationValidation: implementationValidation.details,
      coverageValidation: coverageValidation.details
    });

    return {
      ok: true,
      id: 'tdd-green-phase',
      ms: duration,
      reason: 'TDD Green phase validation passed',
      details: {
        testResult: testResult.details,
        implementationValidation: implementationValidation.details,
        coverageValidation: coverageValidation.details
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('TDD Green phase validation failed', {
      error: error instanceof Error ? error.message : String(error),
      duration
    });

    return {
      ok: false,
      id: 'tdd-green-phase',
      ms: duration,
      reason: `TDD Green phase validation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validate that implementation is complete
 * Checks that all changed files have corresponding functionality
 */
async function validateImplementationComplete(context: ProveContext): Promise<{ ok: boolean; details?: any }> {
  const changedFiles = context.git.changedFiles;
  
  if (changedFiles.length === 0) {
    return {
      ok: true,
      details: { message: 'No files changed - implementation validation skipped' }
    };
  }

  // Check if there are test files without corresponding source files
  const testFiles = changedFiles.filter(file => 
    file.includes('.test.') || 
    file.includes('.spec.') || 
    file.endsWith('.test.ts') || 
    file.endsWith('.spec.ts') ||
    file.includes('__tests__') ||
    file.includes('__mocks__')
  );

  const sourceFiles = changedFiles.filter(file => {
    // Exclude test files, spec files, stories, fixtures, and other non-source files
    const isTestFile = file.includes('.test.') || 
                      file.includes('.spec.') || 
                      file.endsWith('.test.ts') || 
                      file.endsWith('.spec.ts') ||
                      file.includes('__tests__') ||
                      file.includes('__mocks__');
    
    const isStoryFile = file.includes('.stories.') || file.endsWith('.stories.tsx');
    const isFixtureFile = file.includes('fixture') || file.includes('fixtures');
    const isConfigFile = file.includes('.config.') || file.endsWith('.config.js');
    const isTypeFile = file.endsWith('.d.ts');
    
    return !isTestFile && !isStoryFile && !isFixtureFile && !isConfigFile && !isTypeFile;
  });

  // For Green phase, we should have both test and source files
  if (testFiles.length > 0 && sourceFiles.length === 0) {
    return {
      ok: false,
      details: {
        message: 'Green phase requires implementation files alongside test files',
        testFiles,
        sourceFiles
      }
    };
  }

  return {
    ok: true,
    details: {
      message: 'Implementation completeness validated',
      testFiles: testFiles.length,
      sourceFiles: sourceFiles.length
    }
  };
}

/**
 * Validate coverage thresholds for Green phase
 * Uses diff coverage if available, otherwise skips
 */
async function validateCoverageThreshold(context: ProveContext): Promise<{ ok: boolean; details?: any }> {
  // Check if diff coverage is enabled
  if (!context.cfg.toggles.diffCoverage) {
    return {
      ok: true,
      details: { message: 'Diff coverage disabled - skipping coverage validation' }
    };
  }

  try {
    // Run diff coverage check
    const coverageResult = await checkDiffCoverage(context);
    
    if (!coverageResult.ok) {
      const threshold = context.cfg.thresholds.diffCoverageFunctional || 85;
      const actualCoverage = coverageResult.details?.coverage?.percentage || 'unknown';
      
      return {
        ok: false,
        details: {
          message: `Coverage threshold not met: ${actualCoverage}% < ${threshold}%`,
          threshold,
          actualCoverage,
          remediation: 'Add more tests to increase coverage or improve test quality',
          coverageResult: coverageResult.details
        }
      };
    }

    return {
      ok: true,
      details: {
        message: 'Coverage threshold validated',
        coverageResult: coverageResult.details
      }
    };

  } catch (error) {
    return {
      ok: false,
      details: {
        message: 'Coverage validation failed',
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}
