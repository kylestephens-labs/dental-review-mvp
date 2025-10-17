// TDD Red Phase: One failing test for TDD Phase Detection Integration
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { buildContext } from '../context.js';
import { detectTddPhase } from '../utils/tddPhaseDetection.js';
import { writeTddPhase, readTddPhase } from '../utils/tdd-phase.js';
import type { ProveContext } from '../context.js';

// Mock logger
vi.mock('../logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    header: vi.fn()
  }
}));

describe('TDD Phase Detection Integration', () => {
  const testDir = process.cwd();
  const tddPhaseFile = join(testDir, '.tdd-phase');

  beforeEach(() => {
    // Clean up any existing TDD phase file
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
  });

  describe('Phase Detection from Commit Messages', () => {
    it('should detect red phase from commit message with TDD marker', async () => {
      const context = await buildContext();
      const redContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add user authentication [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      const phase = await detectTddPhase(redContext);
      expect(phase).toBe('red');
    });

    it('should detect green phase from commit message with TDD marker', async () => {
      const context = await buildContext();
      const greenContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'fix: implement login functionality [T-2025-01-18-002] [MODE:F] [TDD:green]'
        }
      };

      const phase = await detectTddPhase(greenContext);
      expect(phase).toBe('green');
    });

    it('should detect refactor phase from commit message with TDD marker', async () => {
      const context = await buildContext();
      const refactorContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'refactor: improve code structure [T-2025-01-18-003] [MODE:F] [TDD:refactor]'
        }
      };

      const phase = await detectTddPhase(refactorContext);
      expect(phase).toBe('refactor');
    });

    it('should return unknown for commit message without TDD marker', async () => {
      const context = await buildContext();
      const unknownContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F]'
        }
      };

      const phase = await detectTddPhase(unknownContext);
      expect(phase).toBe('unknown');
    });
  });

  describe('Phase Detection from .tdd-phase File', () => {
    it('should detect red phase from .tdd-phase file', async () => {
      writeTddPhase('red', testDir);
      
      const context = await buildContext();
      expect(context.tddPhase).toBe('red');
    });

    it('should detect green phase from .tdd-phase file', async () => {
      writeTddPhase('green', testDir);
      
      const context = await buildContext();
      expect(context.tddPhase).toBe('green');
    });

    it('should detect refactor phase from .tdd-phase file', async () => {
      writeTddPhase('refactor', testDir);
      
      const context = await buildContext();
      expect(context.tddPhase).toBe('refactor');
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
      // Create .tdd-phase file with red phase
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
      expect(phase).toBe('green'); // Should prioritize commit message
    });

    it('should fall back to .tdd-phase file when commit message has no TDD marker', async () => {
      // Create .tdd-phase file with red phase
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
      expect(phase).toBe('red'); // Should fall back to .tdd-phase file
    });
  });

  describe('Phase Detection Edge Cases', () => {
    it('should handle empty commit message', async () => {
      const context = await buildContext();
      const emptyContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: ''
        }
      };

      const phase = await detectTddPhase(emptyContext);
      expect(phase).toBe('unknown');
    });

    it('should handle malformed TDD marker in commit message', async () => {
      const context = await buildContext();
      const malformedContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:invalid]'
        }
      };

      const phase = await detectTddPhase(malformedContext);
      expect(phase).toBe('unknown');
    });

    it('should handle case-insensitive TDD markers', async () => {
      const context = await buildContext();
      const caseInsensitiveContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:RED]'
        }
      };

      const phase = await detectTddPhase(caseInsensitiveContext);
      expect(phase).toBe('red');
    });

    it('should handle TDD marker with extra spaces', async () => {
      const context = await buildContext();
      const spacedContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD: red ]'
        }
      };

      const phase = await detectTddPhase(spacedContext);
      expect(phase).toBe('red');
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

      const startTime = Date.now();
      const phase = await detectTddPhase(largeMessageContext);
      const endTime = Date.now();
      
      expect(phase).toBe('red');
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
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
      expect(phase).toBe('red'); // Should use the first valid marker
    });
  });

  describe('Phase Detection with Test Evidence', () => {
    it('should detect phase from test evidence when no other indicators', async () => {
      const context = await buildContext();
      const evidenceContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F]'
        },
        testEvidence: [
          {
            id: 'evidence-1',
            phase: 'red',
            timestamp: Date.now(),
            testResults: { passed: 0, failed: 2, total: 2 },
            changedFiles: ['src/test.ts'],
            commitHash: 'abc123'
          }
        ]
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
        testEvidence: [
          {
            id: 'evidence-1',
            phase: 'red',
            timestamp: Date.now(),
            testResults: { passed: 0, failed: 2, total: 2 },
            changedFiles: ['src/test.ts'],
            commitHash: 'abc123'
          }
        ]
      };

      const phase = await detectTddPhase(priorityContext);
      expect(phase).toBe('green'); // Should prioritize commit message
    });
  });

  describe('Phase Detection Error Handling', () => {
    it('should handle context with missing git information', async () => {
      const context = await buildContext();
      const incompleteContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: undefined
        }
      };

      const phase = await detectTddPhase(incompleteContext);
      expect(phase).toBe('unknown');
    });

    it('should handle context with missing test evidence', async () => {
      const context = await buildContext();
      const noEvidenceContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F]'
        },
        testEvidence: undefined
      };

      const phase = await detectTddPhase(noEvidenceContext);
      expect(phase).toBe('unknown');
    });
  });
});
