import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { ProveContext } from '../context.js';
import { logger } from '../logger.js';

/**
 * Test evidence data structure
 */
export interface TestEvidence {
  id: string;
  phase: 'red' | 'green' | 'refactor' | 'unknown';
  timestamp: string;
  testResults: {
    passed: number;
    failed: number;
    total: number;
    duration?: number;
  };
  changedFiles: string[];
  commitHash?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Test results from test execution
 */
export interface TestResults {
  passed: number;
  failed: number;
  total: number;
  duration?: number;
}

/**
 * Test evidence storage interface
 */
export interface TestEvidenceStorage {
  store(evidence: TestEvidence): Promise<void>;
  retrieve(): Promise<TestEvidence[]>;
  clear(): Promise<void>;
}

/**
 * Test evidence analyzer interface
 */
export interface TestEvidenceAnalyzer {
  analyzePhase(evidence: TestEvidence[]): 'red' | 'green' | 'refactor' | 'unknown';
  analyzePatterns(evidence: TestEvidence[]): TestPatterns;
}

/**
 * Test patterns detected from evidence
 */
export interface TestPatterns {
  redToGreenTransition?: boolean;
  greenToRefactorTransition?: boolean;
  testFailurePattern?: boolean;
  testSuccessPattern?: boolean;
  refactoringPattern?: boolean;
}

/**
 * Generate unique ID for test evidence
 */
function generateEvidenceId(): string {
  return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate test results
 */
function validateTestResults(testResults: TestResults): void {
  if (testResults.passed < 0 || testResults.failed < 0 || testResults.total < 0) {
    throw new Error('Invalid test results: negative values not allowed');
  }
  
  if (testResults.passed + testResults.failed !== testResults.total) {
    throw new Error('Invalid test results: passed + failed must equal total');
  }
}

/**
 * Validate TDD phase
 */
function validatePhase(phase: string): asserts phase is 'red' | 'green' | 'refactor' | 'unknown' {
  if (!['red', 'green', 'refactor', 'unknown'].includes(phase)) {
    throw new Error(`Invalid phase: ${phase}`);
  }
}

/**
 * Create test evidence from parameters
 */
export function createTestEvidence(params: {
  phase: 'red' | 'green' | 'refactor' | 'unknown';
  testResults: TestResults;
  changedFiles: string[];
  commitHash?: string;
  metadata?: Record<string, unknown>;
}): TestEvidence {
  validatePhase(params.phase);
  validateTestResults(params.testResults);

  return {
    id: generateEvidenceId(),
    phase: params.phase,
    timestamp: new Date().toISOString(),
    testResults: params.testResults,
    changedFiles: params.changedFiles,
    commitHash: params.commitHash,
    metadata: params.metadata
  };
}

/**
 * Capture test evidence from prove context and test results
 */
export async function captureTestEvidence(
  context: ProveContext,
  testResults: TestResults,
  phase: 'red' | 'green' | 'refactor'
): Promise<TestEvidence> {
  logger.info('Capturing test evidence', {
    phase,
    testResults,
    changedFiles: context.git.changedFiles.length,
    commitHash: context.git.commitHash
  });

  return createTestEvidence({
    phase,
    testResults,
    changedFiles: context.git.changedFiles,
    commitHash: context.git.commitHash,
    metadata: {
      mode: context.mode,
      isCI: context.isCI,
      workingDirectory: context.workingDirectory
    }
  });
}

/**
 * Test evidence storage implementation
 */
export class TestEvidenceStorage implements TestEvidenceStorage {
  private readonly evidencePath: string;

  constructor(evidencePath: string) {
    this.evidencePath = evidencePath;
  }

  /**
   * Store test evidence to file
   */
  async store(evidence: TestEvidence): Promise<void> {
    try {
      // Ensure directory exists
      const dir = dirname(this.evidencePath);
      await mkdir(dir, { recursive: true });

      // Read existing evidence
      let existingEvidence: TestEvidence[] = [];
      try {
        const content = await readFile(this.evidencePath, 'utf-8');
        existingEvidence = JSON.parse(content);
      } catch (error) {
        // File doesn't exist or is empty, start with empty array
        logger.info('No existing evidence file found, starting fresh');
      }

      // Add new evidence
      existingEvidence.push(evidence);

      // Keep only last 100 evidence entries to prevent file from growing too large
      if (existingEvidence.length > 100) {
        existingEvidence = existingEvidence.slice(-100);
      }

      // Write back to file
      await writeFile(this.evidencePath, JSON.stringify(existingEvidence, null, 2));

      logger.info('Test evidence stored', {
        evidenceId: evidence.id,
        phase: evidence.phase,
        totalEvidence: existingEvidence.length
      });
    } catch (error) {
      logger.error('Failed to store test evidence', {
        error: error instanceof Error ? error.message : String(error),
        evidenceId: evidence.id
      });
      throw error;
    }
  }

  /**
   * Retrieve test evidence from file
   */
  async retrieve(): Promise<TestEvidence[]> {
    try {
      const content = await readFile(this.evidencePath, 'utf-8');
      const evidence = JSON.parse(content);
      
      if (!Array.isArray(evidence)) {
        logger.warn('Invalid evidence file format, returning empty array');
        return [];
      }

      return evidence;
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        // File doesn't exist, return empty array
        return [];
      }
      
      logger.error('Failed to retrieve test evidence', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Clear all test evidence
   */
  async clear(): Promise<void> {
    try {
      await writeFile(this.evidencePath, '[]');
      logger.info('Test evidence cleared');
    } catch (error) {
      logger.error('Failed to clear test evidence', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

/**
 * Test evidence analyzer implementation
 */
export class TestEvidenceAnalyzer implements TestEvidenceAnalyzer {
  /**
   * Analyze TDD phase from evidence
   */
  analyzePhase(evidence: TestEvidence[]): 'red' | 'green' | 'refactor' | 'unknown' {
    if (evidence.length === 0) {
      return 'unknown';
    }

    // Get most recent evidence
    const mostRecent = evidence[evidence.length - 1];

    // Check for explicit phase markers
    if (mostRecent.phase) {
      return mostRecent.phase;
    }

    // Analyze test results patterns
    const hasFailures = mostRecent.testResults.failed > 0;
    const hasPasses = mostRecent.testResults.passed > 0;
    const allPassed = mostRecent.testResults.failed === 0 && mostRecent.testResults.passed > 0;

    if (hasFailures && !hasPasses) {
      return 'red';
    } else if (allPassed) {
      return 'green';
    } else if (hasPasses && hasFailures) {
      // Mixed results might indicate refactoring
      return 'refactor';
    }

    return 'unknown';
  }

  /**
   * Analyze test patterns from evidence
   */
  analyzePatterns(evidence: TestEvidence[]): TestPatterns {
    const patterns: TestPatterns = {};

    if (evidence.length < 2) {
      return patterns;
    }

    // Sort evidence by timestamp
    const sortedEvidence = [...evidence].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Check for red to green transition
    for (let i = 0; i < sortedEvidence.length - 1; i++) {
      const current = sortedEvidence[i];
      const next = sortedEvidence[i + 1];

      if (current.testResults.failed > 0 && next.testResults.failed === 0) {
        patterns.redToGreenTransition = true;
        break;
      }
    }

    // Check for green to refactor transition
    for (let i = 0; i < sortedEvidence.length - 1; i++) {
      const current = sortedEvidence[i];
      const next = sortedEvidence[i + 1];

      if (current.testResults.failed === 0 && next.testResults.failed === 0 && 
          current.changedFiles.length !== next.changedFiles.length) {
        patterns.greenToRefactorTransition = true;
        break;
      }
    }

    // Check for test failure pattern
    patterns.testFailurePattern = evidence.some(e => e.testResults.failed > 0);

    // Check for test success pattern
    patterns.testSuccessPattern = evidence.some(e => e.testResults.failed === 0 && e.testResults.passed > 0);

    // Check for refactoring pattern (code changes without test changes)
    patterns.refactoringPattern = evidence.some(e => 
      e.testResults.failed === 0 && 
      e.changedFiles.some(file => !file.includes('test') && !file.includes('spec'))
    );

    return patterns;
  }
}

/**
 * Store test evidence (convenience function)
 */
export async function storeTestEvidence(
  evidence: TestEvidence,
  evidencePath: string = '.prove/evidence.json'
): Promise<void> {
  const storage = new TestEvidenceStorage(evidencePath);
  await storage.store(evidence);
}

/**
 * Analyze test evidence (convenience function)
 */
export function analyzeTestEvidence(evidence: TestEvidence[]): {
  phase: 'red' | 'green' | 'refactor' | 'unknown';
  patterns: TestPatterns;
} {
  const analyzer = new TestEvidenceAnalyzer();
  return {
    phase: analyzer.analyzePhase(evidence),
    patterns: analyzer.analyzePatterns(evidence)
  };
}

/**
 * Get test evidence history (convenience function)
 */
export async function getTestEvidenceHistory(
  evidencePath: string = '.prove/evidence.json'
): Promise<TestEvidence[]> {
  const storage = new TestEvidenceStorage(evidencePath);
  return storage.retrieve();
}

/**
 * Clear test evidence history (convenience function)
 */
export async function clearTestEvidenceHistory(
  evidencePath: string = '.prove/evidence.json'
): Promise<void> {
  const storage = new TestEvidenceStorage(evidencePath);
  await storage.clear();
}
