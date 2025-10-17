// TDD Red Phase: One failing test for TDD Performance Testing
import { describe, it, expect, vi } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { buildContext } from '../context.js';
import { detectTddPhase } from '../utils/tddPhaseDetection.js';
import { writeTddPhase, readTddPhase } from '../utils/tdd-phase.js';
import { runChecks } from '../runner.js';
import { 
  createMockLogger, 
  setupTestEnvironment, 
  teardownTestEnvironment,
  measurePerformance,
  expectPerformanceWithin
} from './shared/test-helpers.js';

// Mock logger
vi.mock('../logger.js', () => ({
  logger: createMockLogger()
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
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('Phase Detection Performance', () => {
    const performanceTestCases = [
      {
        name: 'should detect phase from commit message quickly',
        setup: async (context: any) => ({
          ...context,
          git: {
            ...context.git,
            commitMessage: 'feat: add user authentication [T-2025-01-18-001] [MODE:F] [TDD:red]'
          }
        }),
        test: async (context: any) => await detectTddPhase(context),
        expectedResult: 'red',
        maxDuration: 50
      },
      {
        name: 'should detect phase from .tdd-phase file quickly',
        setup: async (context: any) => {
          writeTddPhase('green', testDir);
          return context;
        },
        test: async (context: any) => context.tddPhase,
        expectedResult: 'green',
        maxDuration: 10
      },
      {
        name: 'should handle large commit messages efficiently',
        setup: async (context: any) => {
          const largeMessage = 'feat: add user authentication [T-2025-01-18-001] [MODE:F] [TDD:red] ' +
            'This is a very long commit message that contains a lot of text and should not ' +
            'significantly impact the performance of phase detection. '.repeat(1000);
          return {
            ...context,
            git: {
              ...context.git,
              commitMessage: largeMessage
            }
          };
        },
        test: async (context: any) => await detectTddPhase(context),
        expectedResult: 'red',
        maxDuration: 100
      }
    ];

    performanceTestCases.forEach(({ name, setup, test, expectedResult, maxDuration }) => {
      it(name, async () => {
        const context = await buildContext();
        const testContext = await setup(context);
        
        const duration = await measurePerformance(async () => {
          return await test(testContext);
        });
        
        expect(duration).toBeLessThan(maxDuration);
      });
    });

    it('should handle multiple phase detection calls efficiently', async () => {
      const context = await buildContext();
      const phases = ['red', 'green', 'refactor'];
      const commitMessages = phases.map(phase => 
        `feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:${phase}]`
      );

      const duration = await measurePerformance(async () => {
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
      });
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('TDD Phase File Operations Performance', () => {
    const fileOperationTestCases = [
      {
        name: 'should write TDD phase file quickly',
        test: () => writeTddPhase('red'),
        expectedResult: 'red',
        maxDuration: 20
      },
      {
        name: 'should read TDD phase file quickly',
        setup: () => writeTddPhase('green', testDir),
        test: () => readTddPhase(testDir),
        expectedResult: 'green',
        maxDuration: 10
      }
    ];

    fileOperationTestCases.forEach(({ name, setup, test, expectedResult, maxDuration }) => {
      it(name, () => {
        if (setup) setup();
        
        const duration = measurePerformance(() => {
          return test();
        });
        
        expect(duration).toBeLessThan(maxDuration);
      });
    });

    it('should handle multiple file operations efficiently', () => {
      const phases = ['red', 'green', 'refactor'];
      
      const duration = measurePerformance(() => {
        phases.forEach(phase => {
          writeTddPhase(phase, testDir);
          const readData = readTddPhase(testDir);
          expect(readData?.phase).toBe(phase);
        });
      });
      
      expect(duration).toBeLessThan(100);
    });
  });

  describe('TDD Check Performance', () => {
    const checkPerformanceTestCases = [
      {
        name: 'should run TDD Red phase check quickly',
        phase: 'red',
        commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]',
        changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
        testResults: { passed: 0, failed: 2, total: 2 },
        checkFunction: 'checkTddRedPhase',
        maxDuration: 500
      },
      {
        name: 'should run TDD Green phase check quickly',
        phase: 'green',
        commitMessage: 'fix: implement button functionality [T-2025-01-18-002] [MODE:F] [TDD:green]',
        changedFiles: ['src/components/Button.tsx'],
        testResults: { passed: 2, failed: 0, total: 2 },
        checkFunction: 'checkTddGreenPhase',
        maxDuration: 500
      },
      {
        name: 'should run TDD Refactor phase check quickly',
        phase: 'refactor',
        commitMessage: 'refactor: improve button component [T-2025-01-18-003] [MODE:F] [TDD:refactor]',
        changedFiles: ['src/components/Button.tsx'],
        testResults: { passed: 2, failed: 0, total: 2 },
        checkFunction: 'checkTddRefactorPhase',
        maxDuration: 500
      }
    ];

    checkPerformanceTestCases.forEach(({ name, phase, commitMessage, changedFiles, testResults, checkFunction, maxDuration }) => {
      it(name, async () => {
        const context = await buildContext();
        const phaseContext = {
          ...context,
          tddPhase: phase,
          git: {
            ...context.git,
            changedFiles,
            commitMessage
          }
        };

        // Mock phase-specific check
        const checkModule = await import(`../checks/tdd${phase.charAt(0).toUpperCase() + phase.slice(1)}Phase.js`);
        vi.mocked(checkModule[checkFunction]).mockResolvedValue({
          ok: true,
          id: `tdd-${phase}-phase`,
          details: { message: `${phase} phase validation passed` }
        });

        const { checkTests } = await import('../checks/tests.js');
        vi.mocked(checkTests).mockResolvedValue({
          ok: true,
          details: { testResults }
        });

        const duration = await measurePerformance(async () => {
          return await runChecks(phaseContext);
        });

        expect(duration).toBeLessThan(maxDuration);
      });
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

      const duration = await measurePerformance(async () => {
        return await runChecks(sequenceContext);
      });

      expect(duration).toBeLessThan(500);
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

      const duration = await measurePerformance(async () => {
        return await runChecks(largeEvidenceContext);
      });

      expect(duration).toBeLessThan(1000);
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
      expect(memUsage.heapUsed).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle concurrent phase detections efficiently', async () => {
      const context = await buildContext();
      const phases = ['red', 'green', 'refactor'];
      
      const duration = await measurePerformance(async () => {
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
        expect(results).toEqual(['red', 'green', 'refactor']);
      });
      
      expect(duration).toBeLessThan(200);
    });
  });
});
