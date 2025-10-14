// Check: diffCoverage.ts
// Enforces coverage thresholds on changed lines
// Calculates coverage for changed lines and compares against threshold

import { type ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { type CheckResult } from '../runner.js';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { exec } from '../utils/exec.js';

interface CoverageFile {
  statementMap: Record<string, any>;
  s: Record<string, number>;
  branchMap: Record<string, any>;
  b: Record<string, number[]>;
  fnMap: Record<string, any>;
  f: Record<string, number>;
}

interface ChangedLine {
  file: string;
  line: number;
  type: 'added' | 'modified' | 'deleted';
}

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

    // Get changed lines using git diff
    const changedLines = await getChangedLines(context);
    
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

    // Calculate coverage for changed lines
    const coverageResults = calculateChangedLinesCoverage(changedLines, coverageData, context);
    
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

/**
 * Get changed lines using git diff
 */
async function getChangedLines(context: ProveContext): Promise<ChangedLine[]> {
  try {
    // Get diff between base and current commit
    const result = await exec('git', ['diff', '--unified=0', context.git.baseRef, 'HEAD'], {
      cwd: context.workingDirectory,
      timeout: 30000,
    });

    if (!result.success) {
      logger.error('Failed to get git diff', { stderr: result.stderr });
      return [];
    }

    const diffOutput = result.stdout;
    const changedLines: ChangedLine[] = [];
    
    // Parse diff output to extract changed lines
    const lines = diffOutput.split('\n');
    let currentFile = '';
    
    for (const line of lines) {
      // File header: @@ -oldStart,oldCount +newStart,newCount @@
      if (line.startsWith('diff --git')) {
        const match = line.match(/diff --git a\/(.+) b\/(.+)/);
        if (match) {
          currentFile = match[2]; // Use the new file path
        }
      }
      
      // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (match && currentFile) {
          const oldStart = parseInt(match[1], 10);
          const oldCount = parseInt(match[2] || '1', 10);
          const newStart = parseInt(match[3], 10);
          const newCount = parseInt(match[4] || '1', 10);
          
          // Add changed lines
          for (let i = 0; i < newCount; i++) {
            changedLines.push({
              file: currentFile,
              line: newStart + i,
              type: 'added',
            });
          }
        }
      }
    }

    logger.info('Changed lines extracted', {
      totalChangedLines: changedLines.length,
      files: [...new Set(changedLines.map(l => l.file))],
    });

    return changedLines;
  } catch (error) {
    logger.error('Failed to get changed lines', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Calculate coverage for changed lines
 */
function calculateChangedLinesCoverage(
  changedLines: ChangedLine[],
  coverageData: Record<string, CoverageFile>,
  context: ProveContext
): {
  totalLines: number;
  coveredLines: number;
  percentage: number;
  uncoveredLines: ChangedLine[];
} {
  let totalLines = 0;
  let coveredLines = 0;
  const uncoveredLines: ChangedLine[] = [];

  // Group changed lines by file
  const linesByFile = new Map<string, ChangedLine[]>();
  for (const line of changedLines) {
    if (!linesByFile.has(line.file)) {
      linesByFile.set(line.file, []);
    }
    linesByFile.get(line.file)!.push(line);
  }

  // Process each file
  for (const [filePath, lines] of linesByFile) {
    // Normalize the file path to match Istanbul coverage data format
    // Git diff returns relative paths, but Istanbul uses absolute paths
    const normalizedPath = resolve(context.workingDirectory, filePath);
    
    // Try to find coverage data by absolute path first
    let coverage = coverageData[normalizedPath];
    
    // If not found, try to find by relative path (fallback)
    if (!coverage) {
      coverage = coverageData[filePath];
    }
    
    // If still not found, try to find by matching the end of the path
    if (!coverage) {
      const matchingKey = Object.keys(coverageData).find(key => 
        key.endsWith(filePath) || key.includes(filePath)
      );
      if (matchingKey) {
        coverage = coverageData[matchingKey];
      }
    }
    
    if (!coverage) {
      logger.warn('No coverage data found for file', { 
        file: filePath, 
        normalizedPath,
        availableKeys: Object.keys(coverageData).slice(0, 5) // Show first 5 keys for debugging
      });
      continue;
    }

    for (const line of lines) {
      totalLines++;
      
      // Check if the line is covered
      const isCovered = isLineCovered(line.line, coverage);
      
      if (isCovered) {
        coveredLines++;
      } else {
        uncoveredLines.push(line);
      }
    }
  }

  const percentage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 100;

  return {
    totalLines,
    coveredLines,
    percentage,
    uncoveredLines,
  };
}

/**
 * Check if a specific line is covered
 */
function isLineCovered(lineNumber: number, coverage: CoverageFile): boolean {
  // Check statement coverage
  for (const [stmtId, stmt] of Object.entries(coverage.statementMap || {})) {
    if (stmt && typeof stmt === 'object' && stmt.start && stmt.end) {
      if (lineNumber >= stmt.start.line && lineNumber <= stmt.end.line) {
        return (coverage.s[stmtId] || 0) > 0;
      }
    }
  }

  // Check function coverage
  for (const [fnId, fn] of Object.entries(coverage.fnMap || {})) {
    if (fn && typeof fn === 'object' && fn.loc && fn.loc.start && fn.loc.end) {
      if (lineNumber >= fn.loc.start.line && lineNumber <= fn.loc.end.line) {
        return (coverage.f[fnId] || 0) > 0;
      }
    }
  }

  // Check branch coverage
  for (const [branchId, branch] of Object.entries(coverage.branchMap || {})) {
    if (branch && typeof branch === 'object' && branch.line === lineNumber) {
      const branchHits = coverage.b[branchId] || [];
      return branchHits.some((hit: number) => hit > 0);
    }
  }

  return false;
}
