// Shared types and interfaces for prove quality gates
// Consolidates duplicated type definitions across checks

export interface CoverageFile {
  statementMap: Record<string, any>;
  s: Record<string, number>;
  branchMap: Record<string, any>;
  b: Record<string, number[]>;
  fnMap: Record<string, any>;
  f: Record<string, number>;
}

export interface ChangedLine {
  file: string;
  line: number;
  type: 'added' | 'modified' | 'deleted';
}

export interface CoverageSummary {
  statements: { pct: number };
  branches: { pct: number };
  functions: { pct: number };
  lines: { pct: number };
}

export interface CoverageResult {
  totalLines: number;
  coveredLines: number;
  percentage: number;
  uncoveredLines: ChangedLine[];
}
