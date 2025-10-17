// TDD Phase Detection - Step 1: Refactored implementation

import { TestEvidence } from './testEvidence.js';
import { ProveContext } from '../context.js';

export type TddPhase = 'red' | 'green' | 'refactor' | 'unknown';

/**
 * Extract TDD phase from commit message
 * Looks for [TDD:phase] markers in commit messages
 */
export function extractPhaseFromCommitMessage(message: string): TddPhase {
  const tddMarkerMatch = message.match(/\[TDD:(red|green|refactor)\]/);
  if (tddMarkerMatch) {
    return tddMarkerMatch[1] as TddPhase;
  }
  return 'unknown';
}

/**
 * Analyze test evidence to detect TDD phase
 * Uses the most recent evidence to determine current phase
 */
export function analyzeTestEvidence(evidence: TestEvidence[]): TddPhase {
  if (evidence.length === 0) {
    return 'unknown';
  }
  
  // Sort evidence by timestamp and get most recent
  const sortedEvidence = [...evidence].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  const mostRecent = sortedEvidence[sortedEvidence.length - 1];
  return mostRecent.phase;
}

/**
 * Detect refactoring evidence from changed files
 * Only detects refactor when ALL changed files are non-test files
 */
export function detectRefactoringEvidence(changedFiles: string[]): TddPhase {
  if (changedFiles.length === 0) {
    return 'unknown';
  }
  
  // Check if files are test files (simple heuristic)
  const isTestFile = (file: string): boolean => {
    return file.includes('.test.') || 
           file.includes('.spec.') || 
           file.endsWith('.test.ts') || 
           file.endsWith('.spec.ts') ||
           file.includes('/test/') ||
           file.includes('/tests/') ||
           file.includes('__tests__') ||
           file.includes('test.ts') ||
           file.includes('spec.ts');
  };
  
  // Only detect refactor if ALL files are non-test files
  const allNonTestFiles = changedFiles.every(file => !isTestFile(file));
  
  if (allNonTestFiles) {
    return 'refactor';
  }
  
  return 'unknown';
}

/**
 * Main TDD phase detection function
 * Uses multiple sources with fallback priority:
 * 1. Commit message TDD markers
 * 2. Test evidence analysis
 * 3. Refactoring evidence detection
 */
export async function detectTddPhase(context: ProveContext): Promise<TddPhase> {
  // Priority 1: Try commit message first (most explicit)
  const commitPhase = extractPhaseFromCommitMessage(context.git.commitMessage);
  if (commitPhase !== 'unknown') {
    return commitPhase;
  }
  
  // Priority 2: Fallback to test evidence analysis
  const testPhase = analyzeTestEvidence(context.testEvidence || []);
  if (testPhase !== 'unknown') {
    return testPhase;
  }
  
  // Priority 3: Fallback to refactoring evidence detection
  const refactorPhase = detectRefactoringEvidence(context.git.changedFiles);
  if (refactorPhase !== 'unknown') {
    return refactorPhase;
  }
  
  // No evidence found
  return 'unknown';
}
