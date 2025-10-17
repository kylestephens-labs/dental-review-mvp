// TDD Red Phase: One failing test for End-to-End TDD Workflow
import { describe, it, expect, vi } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { buildContext } from '../context.js';
import { runChecks } from '../runner.js';
import { 
  createMockLogger, 
  setupTestEnvironment, 
  teardownTestEnvironment,
  measurePerformance,
  expectPerformanceWithin
} from './shared/test-helpers.js';

const execAsync = promisify(exec);

// Mock logger
vi.mock('../logger.js', () => ({
  logger: createMockLogger()
}));

// Mock all check functions
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

describe('End-to-End TDD Workflow', () => {
  const testDir = process.cwd();
  const tddPhaseFile = join(testDir, '.tdd-phase');

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('Complete TDD Cycle: Red → Green → Refactor', () => {
    const tddCycleTestCases = [
      {
        name: 'Red Phase - Write failing tests',
        phase: 'red',
        commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]',
        changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
        testResults: { passed: 0, failed: 2, total: 2 },
        checkFunction: 'checkTddRedPhase'
      },
      {
        name: 'Green Phase - Make tests pass',
        phase: 'green',
        commitMessage: 'fix: implement button functionality [T-2025-01-18-002] [MODE:F] [TDD:green]',
        changedFiles: ['src/components/Button.tsx'],
        testResults: { passed: 2, failed: 0, total: 2 },
        checkFunction: 'checkTddGreenPhase'
      },
      {
        name: 'Refactor Phase - Improve code quality',
        phase: 'refactor',
        commitMessage: 'refactor: improve button component structure [T-2025-01-18-003] [MODE:F] [TDD:refactor]',
        changedFiles: ['src/components/Button.tsx'],
        testResults: { passed: 2, failed: 0, total: 2 },
        checkFunction: 'checkTddRefactorPhase'
      }
    ];

    it('should execute complete TDD cycle with proper phase transitions', async () => {
      for (const testCase of tddCycleTestCases) {
        const context = await buildContext();
        const phaseContext = {
          ...context,
          tddPhase: testCase.phase,
          git: {
            ...context.git,
            changedFiles: testCase.changedFiles,
            commitMessage: testCase.commitMessage
          }
        };

        // Mock phase-specific checks
        const checkModule = await import(`../checks/tdd${testCase.phase.charAt(0).toUpperCase() + testCase.phase.slice(1)}Phase.js`);
        vi.mocked(checkModule[testCase.checkFunction]).mockResolvedValue({
          ok: true,
          id: `tdd-${testCase.phase}-phase`,
          details: { message: `${testCase.phase} phase validation passed` }
        });

        const { checkTests } = await import('../checks/tests.js');
        vi.mocked(checkTests).mockResolvedValue({
          ok: true,
          details: { testResults: testCase.testResults }
        });

        const result = await runChecks(phaseContext);
        expect(result.ok).toBe(true);
      }
    });

    const sequenceViolationTestCases = [
      {
        name: 'should fail when skipping Red phase to go directly to Green',
        phase: 'green',
        commitMessage: 'fix: implement button functionality [T-2025-01-18-002] [MODE:F] [TDD:green]',
        changedFiles: ['src/components/Button.tsx']
      },
      {
        name: 'should fail when skipping Green phase to go directly to Refactor',
        phase: 'refactor',
        commitMessage: 'refactor: improve button component [T-2025-01-18-003] [MODE:F] [TDD:refactor]',
        changedFiles: ['src/components/Button.tsx']
      }
    ];

    sequenceViolationTestCases.forEach(({ name, phase, commitMessage, changedFiles }) => {
      it(name, async () => {
        const context = await buildContext();
        const skipContext = {
          ...context,
          tddPhase: phase,
          git: {
            ...context.git,
            changedFiles,
            commitMessage
          }
        };

        // Mock process sequence check to fail
        const { checkTddProcessSequence } = await import('../checks/tddProcessSequence.js');
        vi.mocked(checkTddProcessSequence).mockResolvedValue({
          ok: false,
          id: 'tdd-process-sequence',
          reason: 'TDD process sequence violations detected'
        });

        const result = await runChecks(skipContext);
        expect(result.ok).toBe(false);
      });
    });
  });

  describe('TDD Phase Commands Integration', () => {
    const commandTestCases = [
      {
        name: 'should work with npm run tdd:red command',
        command: 'npm run tdd:red',
        expectedPhase: 'red',
        expectedMessage: 'TDD Red phase marked'
      },
      {
        name: 'should work with npm run tdd:green command',
        command: 'npm run tdd:green',
        expectedPhase: 'green',
        expectedMessage: 'TDD Green phase marked'
      },
      {
        name: 'should work with npm run tdd:refactor command',
        command: 'npm run tdd:refactor',
        expectedPhase: 'refactor',
        expectedMessage: 'TDD Refactor phase marked'
      }
    ];

    commandTestCases.forEach(({ name, command, expectedPhase, expectedMessage }) => {
      it(name, async () => {
        const { stdout } = await execAsync(command, { cwd: testDir });
        
        expect(existsSync(tddPhaseFile)).toBe(true);
        expect(stdout).toContain(expectedMessage);
        
        const phaseContent = JSON.parse(readFileSync(tddPhaseFile, 'utf8'));
        expect(phaseContent.phase).toBe(expectedPhase);
        expect(phaseContent.timestamp).toBeDefined();
      });
    });

    it('should work with npm run prove:tdd command', async () => {
      // Set up red phase first
      await execAsync('npm run tdd:red', { cwd: testDir });
      
      // Mock all checks to pass
      const { checkTests } = await import('../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue({
        ok: true,
        details: { testResults: { passed: 0, failed: 2, total: 2 } }
      });

      const { checkTddPhaseDetection } = await import('../checks/tddPhaseDetection.js');
      vi.mocked(checkTddPhaseDetection).mockResolvedValue({
        ok: true,
        id: 'tdd-phase-detection',
        details: { phase: 'red' }
      });

      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockResolvedValue({
        ok: true,
        id: 'tdd-red-phase',
        details: { message: 'Red phase validation passed' }
      });

      const { checkTddProcessSequence } = await import('../checks/tddProcessSequence.js');
      vi.mocked(checkTddProcessSequence).mockResolvedValue({
        ok: true,
        id: 'tdd-process-sequence',
        details: { message: 'Process sequence validation passed' }
      });

      // This should not throw an error
      await expect(execAsync('npm run prove:tdd', { cwd: testDir })).resolves.not.toThrow();
    });
  });

  describe('TDD Workflow Error Handling', () => {
    it('should handle test failures in Green phase gracefully', async () => {
      const greenContext = await buildContext();
      const failingGreenContext = {
        ...greenContext,
        tddPhase: 'green',
        git: {
          ...greenContext.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'fix: implement button functionality [T-2025-01-18-002] [MODE:F] [TDD:green]'
        }
      };

      // Mock Green phase check to fail
      const { checkTddGreenPhase } = await import('../checks/tddGreenPhase.js');
      vi.mocked(checkTddGreenPhase).mockResolvedValue({
        ok: false,
        id: 'tdd-green-phase',
        reason: 'Tests must pass in Green phase'
      });

      const { checkTests } = await import('../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue({
        ok: false,
        details: { testResults: { passed: 1, failed: 1, total: 2 } }
      });

      const result = await runChecks(failingGreenContext);
      expect(result.ok).toBe(false);
    });

    it('should handle refactoring without behavior preservation', async () => {
      const refactorContext = await buildContext();
      const brokenRefactorContext = {
        ...refactorContext,
        tddPhase: 'refactor',
        git: {
          ...refactorContext.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'refactor: improve button component [T-2025-01-18-003] [MODE:F] [TDD:refactor]'
        }
      };

      // Mock Refactor phase check to fail
      const { checkTddRefactorPhase } = await import('../checks/tddRefactorPhase.js');
      vi.mocked(checkTddRefactorPhase).mockResolvedValue({
        ok: false,
        id: 'tdd-refactor-phase',
        reason: 'Behavior must be preserved in Refactor phase'
      });

      const { checkTests } = await import('../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue({
        ok: false,
        details: { testResults: { passed: 1, failed: 1, total: 2 } }
      });

      const result = await runChecks(brokenRefactorContext);
      expect(result.ok).toBe(false);
    });
  });

  describe('TDD Workflow Performance', () => {
    it('should complete TDD phase detection quickly', async () => {
      const context = await buildContext();
      const performanceContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock all checks to pass quickly
      const { checkTddPhaseDetection } = await import('../checks/tddPhaseDetection.js');
      vi.mocked(checkTddPhaseDetection).mockResolvedValue({
        ok: true,
        id: 'tdd-phase-detection',
        details: { phase: 'red' }
      });

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

      const duration = await measurePerformance(async () => {
        return await runChecks(performanceContext);
      });
      
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('TDD Workflow with Multiple Files', () => {
    it('should handle TDD workflow with multiple source and test files', async () => {
      const context = await buildContext();
      const multiFileContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: [
            'src/components/Button.tsx',
            'src/components/Button.test.tsx',
            'src/components/Input.tsx',
            'src/components/Input.test.tsx',
            'src/utils/helpers.ts',
            'src/utils/helpers.test.ts'
          ],
          commitMessage: 'feat: add form components [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase check to pass
      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockResolvedValue({
        ok: true,
        id: 'tdd-red-phase',
        details: { message: 'Red phase validation passed' }
      });

      const { checkTests } = await import('../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue({
        ok: true,
        details: { testResults: { passed: 0, failed: 6, total: 6 } }
      });

      const result = await runChecks(multiFileContext);
      expect(result.ok).toBe(true);
    });
  });
});
