// Check: coverage.ts
// Enforces global coverage percentage thresholds
// Optional global check that can be toggled on/off

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { type CheckResult } from '../runner.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface CoverageFile {
  statementMap: Record<string, any>;
  s: Record<string, number>;
  branchMap: Record<string, any>;
  b: Record<string, number[]>;
  fnMap: Record<string, any>;
  f: Record<string, number>;
}

interface CoverageSummary {
  statements: { pct: number };
  branches: { pct: number };
  functions: { pct: number };
  lines: { pct: number };
}

export async function checkCoverage(context: ProveContext): Promise<CheckResult> {
  const startTime = Date.now();

  try {
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
      
      // Calculate coverage from Istanbul format
      let totalStatements = 0;
      let coveredStatements = 0;
      let totalBranches = 0;
      let coveredBranches = 0;
      let totalFunctions = 0;
      let coveredFunctions = 0;
      let totalLines = 0;
      let coveredLines = 0;

      // Process each file's coverage data
      for (const [filePath, fileData] of Object.entries(rawCoverageData)) {
        if (typeof fileData === 'object' && fileData !== null) {
          const coverage = fileData as CoverageFile;
          
          // Calculate statements coverage
          const statementKeys = Object.keys(coverage.s || {});
          totalStatements += statementKeys.length;
          coveredStatements += statementKeys.filter(key => coverage.s[key] > 0).length;
          
          // Calculate branches coverage
          const branchKeys = Object.keys(coverage.b || {});
          totalBranches += branchKeys.length;
          coveredBranches += branchKeys.filter(key => {
            const branchHits = coverage.b[key] || [];
            return branchHits.some((hit: number) => hit > 0);
          }).length;
          
          // Calculate functions coverage
          const functionKeys = Object.keys(coverage.f || {});
          totalFunctions += functionKeys.length;
          coveredFunctions += functionKeys.filter(key => coverage.f[key] > 0).length;
          
          // Calculate lines coverage (approximate from statements)
          const lineMap = new Set<string>();
          Object.values(coverage.statementMap || {}).forEach((stmt: any) => {
            if (stmt && typeof stmt === 'object' && stmt.start && stmt.end) {
              for (let line = stmt.start.line; line <= stmt.end.line; line++) {
                lineMap.add(`${filePath}:${line}`);
              }
            }
          });
          totalLines += lineMap.size;
          coveredLines += Array.from(lineMap).filter(lineKey => {
            const [file, line] = lineKey.split(':');
            const lineNum = parseInt(line, 10);
            return Object.values(coverage.statementMap || {}).some((stmt: any) => {
              if (stmt && typeof stmt === 'object' && stmt.start && stmt.end) {
                return lineNum >= stmt.start.line && lineNum <= stmt.end.line && 
                       coverage.s[Object.keys(coverage.s || {}).find(key => coverage.statementMap[key] === stmt) || ''] > 0;
              }
              return false;
            });
          }).length;
        }
      }

      // Calculate percentages
      const statementsCoverage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
      const branchesCoverage = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;
      const functionsCoverage = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
      const linesCoverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;

      coverageData = {
        statements: { pct: statementsCoverage },
        branches: { pct: branchesCoverage },
        functions: { pct: functionsCoverage },
        lines: { pct: linesCoverage },
      };
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
