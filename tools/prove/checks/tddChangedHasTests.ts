// Check: tddChangedHasTests.ts
// For functional tasks, code changes must include test changes
// Enforces TDD practice by requiring test changes when source code changes

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { type CheckResult } from '../runner.js';
import { minimatch } from 'minimatch';

export async function checkTddChangedHasTests(context: ProveContext): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    // Only enforce for functional mode tasks
    if (context.mode !== 'functional') {
      logger.info('TDD check skipped - not a functional task', { mode: context.mode });
      return {
        id: 'tdd-changed-has-tests',
        ok: true,
        ms: Date.now() - startTime,
        details: { reason: 'TDD check only applies to functional tasks' },
      };
    }

    logger.info('Checking TDD requirement for functional task...');

    const changedFiles = context.git.changedFiles;
    
    if (changedFiles.length === 0) {
      logger.info('No files changed, TDD check passed');
      return {
        id: 'tdd-changed-has-tests',
        ok: true,
        ms: Date.now() - startTime,
        details: { reason: 'No files changed' },
      };
    }

    // Check if any source files changed
    const srcGlobs = context.cfg.paths.srcGlobs;
    const testGlobs = context.cfg.paths.testGlobs;

    logger.info('Analyzing changed files', {
      changedFiles: changedFiles.length,
      srcGlobs,
      testGlobs,
    });

    const changedSrcFiles: string[] = [];
    const changedTestFiles: string[] = [];

    // Categorize changed files
    for (const file of changedFiles) {
      // Check if file matches source patterns
      const isSrcFile = srcGlobs.some(glob => minimatch(file, glob));
      if (isSrcFile) {
        changedSrcFiles.push(file);
      }

      // Check if file matches test patterns
      const isTestFile = testGlobs.some(glob => minimatch(file, glob));
      if (isTestFile) {
        changedTestFiles.push(file);
      }
    }

    logger.info('File categorization complete', {
      changedSrcFiles: changedSrcFiles.length,
      changedTestFiles: changedTestFiles.length,
      srcFiles: changedSrcFiles,
      testFiles: changedTestFiles,
    });

    // If no source files changed, TDD check passes
    if (changedSrcFiles.length === 0) {
      logger.info('No source files changed, TDD check passed');
      return {
        id: 'tdd-changed-has-tests',
        ok: true,
        ms: Date.now() - startTime,
        details: {
          reason: 'No source files changed',
          changedSrcFiles: 0,
          changedTestFiles: changedTestFiles.length,
        },
      };
    }

    // If source files changed but no test files changed, TDD check fails
    if (changedTestFiles.length === 0) {
      const duration = Date.now() - startTime;
      logger.error('TDD violation: Source files changed without corresponding test changes', {
        changedSrcFiles,
        changedTestFiles: 0,
        duration,
      });

      return {
        id: 'tdd-changed-has-tests',
        ok: false,
        ms: duration,
        reason: `TDD violation: ${changedSrcFiles.length} source file(s) changed without corresponding test changes`,
        details: {
          changedSrcFiles,
          changedTestFiles: [],
          srcGlobs,
          testGlobs,
          violation: 'Source changes without test changes',
        },
      };
    }

    // Both source and test files changed, TDD check passes
    const duration = Date.now() - startTime;
    logger.success('TDD requirement satisfied: Source and test files both changed', {
      changedSrcFiles: changedSrcFiles.length,
      changedTestFiles: changedTestFiles.length,
      duration,
    });

    return {
      id: 'tdd-changed-has-tests',
      ok: true,
      ms: duration,
      details: {
        changedSrcFiles,
        changedTestFiles,
        srcGlobs,
        testGlobs,
        satisfaction: 'Source and test files both changed',
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('TDD check failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return {
      id: 'tdd-changed-has-tests',
      ok: false,
      ms: duration,
      reason: `TDD check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
