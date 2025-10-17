// TDD Phase Detection Integration: Comprehensive test suite for phase detection
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { buildContext } from '../context.js';
import { detectTddPhase } from '../utils/tddPhaseDetection.js';
import { writeTddPhase, readTddPhase } from '../utils/tdd-phase.js';
import { 
  createMockLogger, 
  setupTestEnvironment, 
  teardownTestEnvironment,
  measurePerformance,
  expectPerformanceWithin
} from './shared/test-helpers.js';

// Mock external dependencies
vi.mock('../logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    header: vi.fn(),
  }
}));

vi.mock('../checks/tests.js', () => ({
  checkTests: vi.fn()
}));

vi.mock('../checks/diffCoverage.js', () => ({
  checkDiffCoverage: vi.fn()
}));

vi.mock('../runner.js', () => ({
  runChecks: vi.fn()
}));

describe('TDD Phase Detection Integration', () => {
  const testDir = process.cwd();
  const tddPhaseFile = join(testDir, '.tdd-phase');

  beforeEach(() => {
    setupTestEnvironment();
    // Clean up any existing TDD phase file
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
  });

  afterEach(() => {
    teardownTestEnvironment();
    // Clean up after each test
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
  });

  describe('Phase Detection from Commit Messages', () => {
    const testCases = [
      {
        name: 'should detect red phase from commit message with TDD marker',
        commitMessage: 'feat: add user authentication [T-2025-01-18-001] [MODE:F] [TDD:red]',
        expectedPhase: 'red'
      },
      {
        name: 'should detect green phase from commit message with TDD marker',
        commitMessage: 'fix: implement login functionality [T-2025-01-18-002] [MODE:F] [TDD:green]',
        expectedPhase: 'green'
      },
      {
        name: 'should detect refactor phase from commit message with TDD marker',
        commitMessage: 'refactor: improve code structure [T-2025-01-18-003] [MODE:F] [TDD:refactor]',
        expectedPhase: 'refactor'
      },
      {
        name: 'should return unknown for commit message without TDD marker',
        commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F]',
        expectedPhase: 'unknown'
      }
    ];

    testCases.forEach(({ name, commitMessage, expectedPhase }) => {
      it(name, async () => {
        const context = await buildContext();
        const testContext = {
          ...context,
          git: {
            ...context.git,
            commitMessage
          }
        };

        const phase = await detectTddPhase(testContext);
        expect(phase).toBe(expectedPhase);
      });
    });
  });

  describe('Phase Detection from .tdd-phase File', () => {
    const fileTestCases = [
      {
        name: 'should detect red phase from .tdd-phase file',
        phase: 'red',
        expectedPhase: 'red'
      },
      {
        name: 'should detect green phase from .tdd-phase file',
        phase: 'green',
        expectedPhase: 'green'
      },
      {
        name: 'should detect refactor phase from .tdd-phase file',
        phase: 'refactor',
        expectedPhase: 'refactor'
      }
    ];

    fileTestCases.forEach(({ name, phase, expectedPhase }) => {
      it(name, async () => {
        writeTddPhase(phase, testDir);
        const context = await buildContext();
        expect(context.tddPhase).toBe(expectedPhase);
      });
    });

    it('should return undefined when no .tdd-phase file exists', async () => {
      const context = await buildContext();
      expect(context.tddPhase).toBeUndefined();
    });

    it('should handle invalid .tdd-phase file gracefully', async () => {
      writeFileSync(tddPhaseFile, 'invalid json');
      const context = await buildContext();
      expect(context.tddPhase).toBeUndefined();
    });
  });

  describe('Phase Detection Priority', () => {
    it('should prioritize commit message over .tdd-phase file', async () => {
      writeTddPhase('red', testDir);
      const context = await buildContext();
      const mixedContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:green]'
        }
      };

      const phase = await detectTddPhase(mixedContext);
      expect(phase).toBe('green');
    });

    it('should fall back to .tdd-phase file when commit message has no TDD marker', async () => {
      writeTddPhase('red', testDir);
      const context = await buildContext();
      const fallbackContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F]'
        }
      };

      const phase = await detectTddPhase(fallbackContext);
      expect(phase).toBe('red');
    });
  });

  describe('Phase Detection Edge Cases', () => {
    const edgeCaseTestCases = [
      {
        name: 'should handle empty commit message',
        commitMessage: '',
        expectedPhase: 'unknown'
      },
      {
        name: 'should handle malformed TDD marker in commit message',
        commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:invalid]',
        expectedPhase: 'unknown'
      },
      {
        name: 'should handle case-insensitive TDD markers',
        commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:RED]',
        expectedPhase: 'red'
      },
      {
        name: 'should handle TDD marker with extra spaces',
        commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD: red ]',
        expectedPhase: 'red'
      }
    ];

    edgeCaseTestCases.forEach(({ name, commitMessage, expectedPhase }) => {
      it(name, async () => {
        const context = await buildContext();
        const testContext = {
          ...context,
          git: {
            ...context.git,
            commitMessage
          }
        };

        const phase = await detectTddPhase(testContext);
        expect(phase).toBe(expectedPhase);
      });
    });
  });

  describe('Phase Detection Performance', () => {
    it('should detect phase quickly for large commit messages', async () => {
      const context = await buildContext();
      const largeMessageContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:red] ' + 
            'This is a very long commit message that contains a lot of text ' +
            'and should not significantly impact the performance of phase detection. '.repeat(100)
        }
      };

      const duration = await measurePerformance(async () => {
        return await detectTddPhase(largeMessageContext);
      });
      
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple TDD markers in commit message', async () => {
      const context = await buildContext();
      const multipleMarkersContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:red] [TDD:green]'
        }
      };

      const phase = await detectTddPhase(multipleMarkersContext);
      expect(phase).toBe('red');
    });
  });

  describe('Phase Detection with Test Evidence', () => {
    const testEvidence = [
      {
        id: 'evidence-1',
        phase: 'red',
        timestamp: Date.now(),
        testResults: { passed: 0, failed: 2, total: 2 },
        changedFiles: ['src/test.ts'],
        commitHash: 'abc123'
      }
    ];

    it('should detect phase from test evidence when no other indicators', async () => {
      const context = await buildContext();
      const evidenceContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F]'
        },
        testEvidence
      };

      const phase = await detectTddPhase(evidenceContext);
      expect(phase).toBe('red');
    });

    it('should prioritize commit message over test evidence', async () => {
      const context = await buildContext();
      const priorityContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:green]'
        },
        testEvidence
      };

      const phase = await detectTddPhase(priorityContext);
      expect(phase).toBe('green');
    });
  });

  describe('Phase Detection Error Handling', () => {
    const errorTestCases = [
      {
        name: 'should handle context with missing git information',
        contextModifier: (context: any) => ({
          ...context,
          git: { ...context.git, commitMessage: undefined }
        }),
        expectedPhase: 'unknown'
      },
      {
        name: 'should handle context with missing test evidence',
        contextModifier: (context: any) => ({
          ...context,
          git: { ...context.git, commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F]' },
          testEvidence: undefined
        }),
        expectedPhase: 'unknown'
      }
    ];

    errorTestCases.forEach(({ name, contextModifier, expectedPhase }) => {
      it(name, async () => {
        const context = await buildContext();
        const testContext = contextModifier(context);
        const phase = await detectTddPhase(testContext);
        expect(phase).toBe(expectedPhase);
      });
    });
  });
});
