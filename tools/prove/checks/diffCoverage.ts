// Check: diffCoverage.ts
// Enforces coverage thresholds on changed lines
// Calculates coverage for changed lines and compares against threshold

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { type CheckResult } from '../runner.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { type CoverageFile, type ChangedLine } from '../types/common.js';
import { CoverageAnalyzer } from '../utils/coverage.js';
import { GitAnalyzer } from '../utils/git.js';

export async function checkDiffCoverage(context: ProveContext): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    // Check if diff coverage check is enabled
    if (!context.cfg.toggles.diffCoverage) {
      logger.info('Diff coverage check disabled, skipping...');
      return {
        id: 'diff-coverage',
        ok: true,
        ms: Date.now() - startTime,
        details: { reason: 'Diff coverage check disabled via toggle' },
      };
    }

    // Only enforce for functional mode tasks
    if (context.mode !== 'functional') {
      logger.info('Diff coverage check skipped - not a functional task', { mode: context.mode });
      return {
        id: 'diff-coverage',
        ok: true,
        ms: Date.now() - startTime,
        details: { reason: 'Diff coverage check only applies to functional tasks' },
      };
    }

    logger.info('Checking diff coverage for functional task...');

    const changedFiles = context.git.changedFiles;
    
    if (changedFiles.length === 0) {
      logger.info('No files changed, diff coverage check passed');
      return {
        id: 'diff-coverage',
        ok: true,
        ms: Date.now() - startTime,
        details: { reason: 'No files changed' },
      };
    }

    // Get changed lines using shared utility
    const changedLines = await GitAnalyzer.getChangedLines(context.git.baseRef, 'HEAD', context.workingDirectory);
    
    if (changedLines.length === 0) {
      logger.info('No changed lines found, diff coverage check passed');
      return {
        id: 'diff-coverage',
        ok: true,
        ms: Date.now() - startTime,
        details: { reason: 'No changed lines found' },
      };
    }

    // Read coverage file
    const coverageFilePath = join(context.workingDirectory, context.cfg.paths.coverageFile);
    logger.info('Reading coverage file', { path: coverageFilePath });
    
    let coverageData: Record<string, CoverageFile>;
    try {
      const coverageContent = await readFile(coverageFilePath, 'utf-8');
      coverageData = JSON.parse(coverageContent);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to read coverage file', {
        file: coverageFilePath,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        id: 'diff-coverage',
        ok: false,
        ms: duration,
        reason: `Failed to read coverage file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Calculate coverage for changed lines using shared utility
    const coverageResults = CoverageAnalyzer.calculateChangedLinesCoverage(changedLines, coverageData, context.workingDirectory);
    
    const requiredCoverage = context.cfg.thresholds.diffCoverageFunctional;
    const actualCoverage = coverageResults.percentage;
    const duration = Date.now() - startTime;

    logger.info('Diff coverage analysis complete', {
      changedLines: coverageResults.totalLines,
      coveredLines: coverageResults.coveredLines,
      actualCoverage: actualCoverage.toFixed(2),
      requiredCoverage,
    });

    // Check if coverage meets threshold
    if (actualCoverage >= requiredCoverage) {
      logger.success('Diff coverage threshold met', {
        actualCoverage: actualCoverage.toFixed(2),
        requiredCoverage,
        duration,
      });

      return {
        id: 'diff-coverage',
        ok: true,
        ms: duration,
        details: {
          changedLines: coverageResults.totalLines,
          coveredLines: coverageResults.coveredLines,
          actualCoverage: actualCoverage.toFixed(2),
          requiredCoverage,
          threshold: 'passed',
          uncoveredLines: coverageResults.uncoveredLines,
        },
      };
    } else {
      logger.error('Diff coverage threshold not met', {
        actualCoverage: actualCoverage.toFixed(2),
        requiredCoverage,
        shortfall: (requiredCoverage - actualCoverage).toFixed(2),
        duration,
      });

      return {
        id: 'diff-coverage',
        ok: false,
        ms: duration,
        reason: `Diff coverage ${actualCoverage.toFixed(1)}% is below required threshold of ${requiredCoverage}%`,
        details: {
          changedLines: coverageResults.totalLines,
          coveredLines: coverageResults.coveredLines,
          actualCoverage: actualCoverage.toFixed(2),
          requiredCoverage,
          threshold: 'failed',
          shortfall: (requiredCoverage - actualCoverage).toFixed(2),
          uncoveredLines: coverageResults.uncoveredLines,
        },
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Diff coverage check failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return {
      id: 'diff-coverage',
      ok: false,
      ms: duration,
      reason: `Diff coverage check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// getChangedLines function moved to shared utility: GitAnalyzer.getChangedLines

// calculateChangedLinesCoverage function moved to shared utility: CoverageAnalyzer.calculateChangedLinesCoverage

/**
 * Check if a specific line is covered
 */
// isLineCovered function moved to shared utility: CoverageAnalyzer.isLineCovered
