// TDD Red Phase: One failing test for TDD Performance Testing
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { buildContext } from '../context.js';
import { detectTddPhase } from '../utils/tddPhaseDetection.js';
import { writeTddPhase, readTddPhase } from '../utils/tdd-phase.js';
import { runChecks } from '../runner.js';

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

// Mock all check functions for performance testing
vi.mock('../checks/tests.js', () => ({
  checkTests: vi.fn()
}));

vi.mock('../checks/diffCoverage.js', () => ({
  checkDiffCoverage: vi.fn()
}));

vi.mock('../checks/tddPhaseDetection.js', () => ({
  checkTddPhaseDetection: vi.fn()
}));

vi.mock('../checks/tddRedPhase.js', () => ({
  checkTddRedPhase: vi.fn()
}));

vi.mock('../checks/tddGreenPhase.js', () => ({
  checkTddGreenPhase: vi.fn()
}));

vi.mock('../checks/tddRefactorPhase.js', () => ({
  checkTddRefactorPhase: vi.fn()
}));

vi.mock('../checks/tddProcessSequence.js', () => ({
  checkTddProcessSequence: vi.fn()
}));

describe('TDD Performance Testing', () => {
  const testDir = process.cwd();
  const tddPhaseFile = join(testDir, '.tdd-phase');

  beforeEach(() => {
    // Clean up any existing TDD phase file
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
  });

  describe('Phase Detection Performance', () => {
    it('should detect phase from commit message quickly', async () => {
      const context = await buildContext();
      const commitContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add user authentication [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      const startTime = Date.now();
      const phase = await detectTddPhase(commitContext);
      const endTime = Date.now();

      expect(phase).toBe('red');
      expect(endTime - startTime).toBeLessThan(50); // Should complete in less than 50ms
    });

    it('should detect phase from .tdd-phase file quickly', async () => {
      writeTddPhase('green', testDir);
      
      const context = await buildContext();
      
      const startTime = Date.now();
      const phase = context.tddPhase;
      const endTime = Date.now();

      expect(phase).toBe('green');
      expect(endTime - startTime).toBeLessThan(10); // Should complete in less than 10ms
    });

    it('should handle large commit messages efficiently', async () => {
      const context = await buildContext();
      const largeMessage = 'feat: add user authentication [T-2025-01-18-001] [MODE:F] [TDD:red] ' +
        'This is a very long commit message that contains a lot of text and should not ' +
        'significantly impact the performance of phase detection. '.repeat(1000);
      
      const largeMessageContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: largeMessage
        }
      };

      const startTime = Date.now();
      const phase = await detectTddPhase(largeMessageContext);
      const endTime = Date.now();

      expect(phase).toBe('red');
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should handle multiple phase detection calls efficiently', async () => {
      const context = await buildContext();
      const phases = ['red', 'green', 'refactor'];
      const commitMessages = phases.map(phase => 
        `feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:${phase}]`
      );

      const startTime = Date.now();
      
      for (let i = 0; i < commitMessages.length; i++) {
        const phaseContext = {
          ...context,
          git: {
            ...context.git,
            commitMessage: commitMessages[i]
          }
        };
        const phase = await detectTddPhase(phaseContext);
        expect(phase).toBe(phases[i]);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(200); // Should complete all in less than 200ms
    });
  });

  describe('TDD Phase File Operations Performance', () => {
    it('should write TDD phase file quickly', () => {
      const startTime = Date.now();
      const phaseData = writeTddPhase('red');
      const endTime = Date.now();

      expect(phaseData.phase).toBe('red');
      expect(endTime - startTime).toBeLessThan(20); // Should complete in less than 20ms
    });

    it('should read TDD phase file quickly', () => {
      writeTddPhase('green', testDir);
      
      const startTime = Date.now();
      const phaseData = readTddPhase(testDir);
      const endTime = Date.now();

      expect(phaseData?.phase).toBe('green');
      expect(endTime - startTime).toBeLessThan(10); // Should complete in less than 10ms
    });

    it('should handle multiple file operations efficiently', () => {
      const phases = ['red', 'green', 'refactor'];
      
      const startTime = Date.now();
      
      phases.forEach(phase => {
        writeTddPhase(phase, testDir);
        const readData = readTddPhase(testDir);
        expect(readData?.phase).toBe(phase);
      });
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete all in less than 100ms
    });
  });

  describe('TDD Check Performance', () => {
    it('should run TDD Red phase check quickly', async () => {
      const context = await buildContext();
      const redContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase check to pass quickly
      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockResolvedValue({
        ok: true,
        id: 'tdd-red-phase',
        details: { message: 'Red phase validation passed' }
      });

      const { checkTests } = await import('../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue({
        ok: true,
        details: { testResults: { passed: 0, failed: 2, total: 2 } }
      });

      const startTime = Date.now();
      const result = await runChecks(redContext);
      const endTime = Date.now();

      expect(result.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in less than 500ms
    });

    it('should run TDD Green phase check quickly', async () => {
      const context = await buildContext();
      const greenContext = {
        ...context,
        tddPhase: 'green',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'fix: implement button functionality [T-2025-01-18-002] [MODE:F] [TDD:green]'
        }
      };

      // Mock Green phase check to pass quickly
      const { checkTddGreenPhase } = await import('../checks/tddGreenPhase.js');
      vi.mocked(checkTddGreenPhase).mockResolvedValue({
        ok: true,
        id: 'tdd-green-phase',
        details: { message: 'Green phase validation passed' }
      });

      const { checkTests } = await import('../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue({
        ok: true,
        details: { testResults: { passed: 2, failed: 0, total: 2 } }
      });

      const startTime = Date.now();
      const result = await runChecks(greenContext);
      const endTime = Date.now();

      expect(result.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in less than 500ms
    });

    it('should run TDD Refactor phase check quickly', async () => {
      const context = await buildContext();
      const refactorContext = {
        ...context,
        tddPhase: 'refactor',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'refactor: improve button component [T-2025-01-18-003] [MODE:F] [TDD:refactor]'
        }
      };

      // Mock Refactor phase check to pass quickly
      const { checkTddRefactorPhase } = await import('../checks/tddRefactorPhase.js');
      vi.mocked(checkTddRefactorPhase).mockResolvedValue({
        ok: true,
        id: 'tdd-refactor-phase',
        details: { message: 'Refactor phase validation passed' }
      });

      const { checkTests } = await import('../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue({
        ok: true,
        details: { testResults: { passed: 2, failed: 0, total: 2 } }
      });

      const startTime = Date.now();
      const result = await runChecks(refactorContext);
      const endTime = Date.now();

      expect(result.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in less than 500ms
    });
  });

  describe('TDD Process Sequence Performance', () => {
    it('should validate TDD process sequence quickly', async () => {
      const context = await buildContext();
      const sequenceContext = {
        ...context,
        tddPhase: 'green',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'fix: implement button functionality [T-2025-01-18-002] [MODE:F] [TDD:green]'
        }
      };

      // Mock process sequence check to pass quickly
      const { checkTddProcessSequence } = await import('../checks/tddProcessSequence.js');
      vi.mocked(checkTddProcessSequence).mockResolvedValue({
        ok: true,
        id: 'tdd-process-sequence',
        details: { message: 'Process sequence validation passed' }
      });

      const startTime = Date.now();
      const result = await runChecks(sequenceContext);
      const endTime = Date.now();

      expect(result.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in less than 500ms
    });

    it('should handle large test evidence history efficiently', async () => {
      const context = await buildContext();
      const largeEvidenceContext = {
        ...context,
        tddPhase: 'refactor',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'refactor: improve button component [T-2025-01-18-003] [MODE:F] [TDD:refactor]'
        },
        testEvidence: Array.from({ length: 1000 }, (_, i) => ({
          id: `evidence-${i}`,
          phase: i % 3 === 0 ? 'red' : i % 3 === 1 ? 'green' : 'refactor',
          timestamp: Date.now() - (1000 - i) * 1000,
          testResults: { passed: 5, failed: 0, total: 5 },
          changedFiles: ['src/test.ts'],
          commitHash: `abc${i}`
        }))
      };

      // Mock process sequence check to pass quickly
      const { checkTddProcessSequence } = await import('../checks/tddProcessSequence.js');
      vi.mocked(checkTddProcessSequence).mockResolvedValue({
        ok: true,
        id: 'tdd-process-sequence',
        details: { message: 'Process sequence validation passed' }
      });

      const startTime = Date.now();
      const result = await runChecks(largeEvidenceContext);
      const endTime = Date.now();

      expect(result.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not leak memory during multiple phase detections', async () => {
      const context = await buildContext();
      const phases = ['red', 'green', 'refactor'];
      
      // Run multiple phase detections
      for (let i = 0; i < 100; i++) {
        const phaseContext = {
          ...context,
          git: {
            ...context.git,
            commitMessage: `feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:${phases[i % 3]}]`
          }
        };
        await detectTddPhase(phaseContext);
      }

      // Memory usage should not grow significantly
      const memUsage = process.memoryUsage();
      expect(memUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    it('should handle concurrent phase detections efficiently', async () => {
      const context = await buildContext();
      const phases = ['red', 'green', 'refactor'];
      
      const startTime = Date.now();
      
      // Run concurrent phase detections
      const promises = phases.map(phase => {
        const phaseContext = {
          ...context,
          git: {
            ...context.git,
            commitMessage: `feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:${phase}]`
          }
        };
        return detectTddPhase(phaseContext);
      });
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toEqual(['red', 'green', 'refactor']);
      expect(endTime - startTime).toBeLessThan(200); // Should complete all in less than 200ms
    });
  });
});
