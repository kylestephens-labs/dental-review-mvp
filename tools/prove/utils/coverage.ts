// Shared coverage analysis utilities
// Consolidates coverage parsing and calculation logic

import { type CoverageFile, type CoverageSummary, type CoverageResult, type ChangedLine } from '../types/common.js';
import { logger } from '../logger.js';
import { join, resolve, normalize } from 'path';

export class CoverageAnalyzer {
  /**
   * Parse Istanbul coverage data and calculate global coverage summary
   */
  static parseIstanbulCoverage(data: Record<string, CoverageFile>): CoverageSummary {
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;

    // Process each file's coverage data
    for (const [filePath, fileData] of Object.entries(data)) {
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

    return {
      statements: { pct: statementsCoverage },
      branches: { pct: branchesCoverage },
      functions: { pct: functionsCoverage },
      lines: { pct: linesCoverage },
    };
  }

  /**
   * Calculate coverage for changed lines
   */
  static calculateChangedLinesCoverage(
    changedLines: ChangedLine[],
    coverageData: Record<string, CoverageFile>,
    workingDirectory: string
  ): CoverageResult {
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
      // Build normalized path using proper path utilities for cross-platform compatibility
      const normalizedPath = normalize(resolve(workingDirectory, filePath));
      
      // Try to find coverage data by absolute path first
      let coverage = coverageData[normalizedPath];
      
      // If not found, try to find by relative path (fallback)
      if (!coverage) {
        coverage = coverageData[filePath];
      }
      
      // If still not found, try to find by matching the end of the path
      if (!coverage) {
        const matchingKey = Object.keys(coverageData).find(key => 
          normalize(key).endsWith(normalize(filePath)) || key.includes(filePath)
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
        // Count missing coverage as uncovered lines
        for (const line of lines) {
          totalLines++;
          uncoveredLines.push(line);
        }
        continue;
      }

      for (const line of lines) {
        totalLines++;
        
        // Use real line-to-hit mapping from Istanbul coverage
        const isCovered = this.isLineCovered(line.line, coverage);
        
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
   * Check if a specific line is covered using Istanbul's line coverage data
   */
  private static isLineCovered(lineNumber: number, coverage: CoverageFile): boolean {
    // Use Istanbul's line coverage data (coverage.l[lineNumber])
    // This is the most accurate way to check if a specific line is covered
    if (coverage.l && typeof coverage.l === 'object') {
      return (coverage.l[lineNumber] || 0) > 0;
    }
    
    // Fallback: check if any statement on this line is covered
    for (const [stmtId, stmt] of Object.entries(coverage.statementMap || {})) {
      if (stmt && typeof stmt === 'object' && stmt.start && stmt.end) {
        if (lineNumber >= stmt.start.line && lineNumber <= stmt.end.line) {
          return (coverage.s[stmtId] || 0) > 0;
        }
      }
    }
    
    return false;
  }
}
