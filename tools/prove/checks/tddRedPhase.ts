// TDD Red Phase Validation
// Ensures tests are written first and failing in Red phase

import { ProveContext } from '../context.js';
import { checkTests } from './tests.js';
import { checkDiffCoverage } from './diffCoverage.js';
import { logger } from '../logger.js';

export interface TddRedPhaseResult {
  ok: boolean;
  id: string;
  ms: number;
  reason?: string;
  details?: {
    testResult?: any;
    testFileValidation?: any;
    coverageValidation?: any;
  };
}

/**
 * Validate that the Red phase of TDD is properly executed
 * Red phase requirements:
 * 1. Tests must be written first
 * 2. Tests must fail initially
 * 3. Test quality meets requirements
 * 4. Minimum test coverage threshold
 */
export async function checkTddRedPhase(context: ProveContext): Promise<TddRedPhaseResult> {
  const startTime = Date.now();
  
  logger.info('Starting TDD Red phase validation', {
    tddPhase: context.tddPhase,
    mode: context.mode,
    changedFilesCount: context.git.changedFiles.length
  });

  // Only run Red phase validation if we're in Red phase
  if (context.tddPhase !== 'red') {
    const duration = Date.now() - startTime;
    return {
      ok: true,
      id: 'tdd-red-phase',
      ms: duration,
      reason: 'Not in Red phase - skipping validation'
    };
  }

  try {
    // 1. Validate that test files are present
    logger.info('Validating test files are present in Red phase...');
    const testFileValidation = await validateTestFilesPresent(context);
    
    if (!testFileValidation.ok) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-red-phase',
        ms: duration,
        reason: 'Tests must be written first in Red phase',
        details: {
          testFileValidation: testFileValidation.details
        }
      };
    }

    // 2. Validate that tests fail initially
    logger.info('Validating tests fail initially in Red phase...');
    const testResult = await checkTests(context);
    
    if (!testResult.ok) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-red-phase',
        ms: duration,
        reason: 'Tests must fail initially in Red phase',
        details: {
          testFileValidation: testFileValidation.details,
          testResult: testResult.details
        }
      };
    }

    // Check if tests are actually failing (Red phase requirement)
    const testResults = testResult.details?.testResults;
    if (testResults && testResults.failed === 0) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-red-phase',
        ms: duration,
        reason: 'Tests must fail initially in Red phase',
        details: {
          testFileValidation: testFileValidation.details,
          testResult: testResult.details
        }
      };
    }

    // 3. Validate test quality requirements
    logger.info('Validating test quality requirements...');
    const testQualityValidation = await validateTestQuality(context, testResults);
    
    if (!testQualityValidation.ok) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-red-phase',
        ms: duration,
        reason: 'Test quality requirements not met in Red phase',
        details: {
          testFileValidation: testFileValidation.details,
          testResult: testResult.details,
          testQualityValidation: testQualityValidation.details
        }
      };
    }

    // 4. Validate coverage thresholds for Red phase (informational only)
    logger.info('Validating coverage thresholds for Red phase...');
    const coverageValidation = await validateCoverageThreshold(context);
    
    // Coverage validation is informational only - don't fail the check
    // The actual coverage validation happens in the dedicated diff-coverage check
    if (!coverageValidation.ok) {
      logger.warn('Coverage validation failed in Red phase', {
        reason: coverageValidation.details?.message,
        note: 'This is informational only - actual coverage validation happens after tests complete'
      });
    }

    const duration = Date.now() - startTime;
    
    logger.success('TDD Red phase validation passed', {
      duration,
      testFileValidation: testFileValidation.details,
      testResult: testResult.details?.testResults,
      testQualityValidation: testQualityValidation.details,
      coverageValidation: coverageValidation.details
    });

    return {
      ok: true,
      id: 'tdd-red-phase',
      ms: duration,
      reason: 'TDD Red phase validation passed',
      details: {
        testFileValidation: testFileValidation.details,
        testResult: testResult.details,
        testQualityValidation: testQualityValidation.details,
        coverageValidation: coverageValidation.details
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('TDD Red phase validation failed', {
      error: error instanceof Error ? error.message : String(error),
      duration
    });

    return {
      ok: false,
      id: 'tdd-red-phase',
      ms: duration,
      reason: `TDD Red phase validation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validate that test files are present
 * Checks that there are test files for the changed source files
 */
async function validateTestFilesPresent(context: ProveContext): Promise<{ ok: boolean; details?: any }> {
  const changedFiles = context.git.changedFiles;
  
  if (changedFiles.length === 0) {
    return {
      ok: true,
      details: { message: 'No files changed - test file validation skipped' }
    };
  }

  // Identify test files and source files
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

  // For Red phase, we need test files
  if (testFiles.length === 0) {
    return {
      ok: false,
      details: {
        message: 'Red phase requires test files to be written first',
        sourceFiles,
        testFiles: [],
        remediation: 'Write failing tests before implementing functionality'
      }
    };
  }

  return {
    ok: true,
    details: {
      message: 'Test files present in Red phase',
      testFiles: testFiles.length,
      sourceFiles: sourceFiles.length
    }
  };
}

/**
 * Validate test quality requirements
 * Ensures tests meet minimum quality standards
 */
async function validateTestQuality(context: ProveContext, testResults: any): Promise<{ ok: boolean; details?: any }> {
  if (!testResults) {
    return {
      ok: false,
      details: {
        message: 'Test results not available for quality validation'
      }
    };
  }

  const { passed, failed, total } = testResults;

  // Basic quality checks
  if (total === 0) {
    return {
      ok: false,
      details: {
        message: 'No tests found - Red phase requires at least one test',
        testResults
      }
    };
  }

  // In Red phase, we expect tests to fail, but we should have some tests
  if (failed === 0) {
    return {
      ok: false,
      details: {
        message: 'Tests must fail initially in Red phase',
        testResults,
        remediation: 'Write tests that fail before implementing functionality'
      }
    };
  }

  // Ensure we have a reasonable number of tests
  if (total < 1) {
    return {
      ok: false,
      details: {
        message: 'Red phase requires at least one test',
        testResults
      }
    };
  }

  return {
    ok: true,
    details: {
      message: 'Test quality requirements met',
      testResults,
      qualityMetrics: {
        totalTests: total,
        failingTests: failed,
        passingTests: passed,
        failureRate: total > 0 ? (failed / total) * 100 : 0
      }
    }
  };
}

/**
 * Validate coverage thresholds for Red phase
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
