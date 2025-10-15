// Check: coverage.ts
// Enforces global coverage percentage thresholds
// Optional global check that can be toggled on/off

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { type CheckResult } from '../runner.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { type CoverageFile, type CoverageSummary } from '../types/common.js';
import { CoverageAnalyzer } from '../utils/coverage.js';

export async function checkCoverage(context: ProveContext): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    // Run coverage check in both local and CI environments
    // This ensures the prove system can catch coverage regressions

    // Check if coverage check is enabled
    if (!context.cfg.toggles.coverage) {
      logger.info('Coverage check disabled, skipping...');
      return {
        id: 'coverage',
        ok: true,
        ms: Date.now() - startTime,
        details: { reason: 'Coverage check disabled via toggle' },
      };
    }

    logger.info('Checking global coverage thresholds...');

    // Read coverage file
    logger.info('Context details', { 
      workingDirectory: context.workingDirectory, 
      coverageFile: context.cfg.paths.coverageFile 
    });
    const coverageFilePath = join(context.workingDirectory, context.cfg.paths.coverageFile);
    logger.info('Reading coverage file', { path: coverageFilePath });
    let coverageData: CoverageSummary;

    try {
      const coverageContent = await readFile(coverageFilePath, 'utf-8');
      const rawCoverageData = JSON.parse(coverageContent);
      
    // Calculate coverage using shared utility
    coverageData = CoverageAnalyzer.parseIstanbulCoverage(rawCoverageData);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to read coverage file', {
        file: coverageFilePath,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        id: 'coverage',
        ok: false,
        ms: duration,
        reason: `Failed to read coverage file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Extract global coverage metrics
    const statementsCoverage = coverageData.statements.pct;
    const branchesCoverage = coverageData.branches.pct;
    const functionsCoverage = coverageData.functions.pct;
    const linesCoverage = coverageData.lines.pct;

    // Calculate average coverage
    const averageCoverage = (statementsCoverage + branchesCoverage + functionsCoverage + linesCoverage) / 4;

    const requiredCoverage = context.cfg.thresholds.globalCoverage;
    const duration = Date.now() - startTime;

    logger.info('Coverage analysis complete', {
      statements: statementsCoverage,
      branches: branchesCoverage,
      functions: functionsCoverage,
      lines: linesCoverage,
      average: averageCoverage,
      required: requiredCoverage,
    });

    // Check if coverage meets threshold
    if (averageCoverage >= requiredCoverage) {
      logger.success('Global coverage threshold met', {
        average: averageCoverage,
        required: requiredCoverage,
        duration,
      });

      return {
        id: 'coverage',
        ok: true,
        ms: duration,
        details: {
          statements: statementsCoverage,
          branches: branchesCoverage,
          functions: functionsCoverage,
          lines: linesCoverage,
          average: averageCoverage,
          required: requiredCoverage,
          threshold: 'passed',
        },
      };
    } else {
      logger.error('Global coverage threshold not met', {
        average: averageCoverage,
        required: requiredCoverage,
        shortfall: requiredCoverage - averageCoverage,
        duration,
      });

      return {
        id: 'coverage',
        ok: false,
        ms: duration,
        reason: `Global coverage ${averageCoverage.toFixed(1)}% is below required threshold of ${requiredCoverage}%`,
        details: {
          statements: statementsCoverage,
          branches: branchesCoverage,
          functions: functionsCoverage,
          lines: linesCoverage,
          average: averageCoverage,
          required: requiredCoverage,
          threshold: 'failed',
          shortfall: requiredCoverage - averageCoverage,
        },
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Coverage check failed', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    return {
      id: 'coverage',
      ok: false,
      ms: duration,
      reason: `Coverage check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
