// TDD Red Phase: One failing test for End-to-End TDD Workflow
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { buildContext } from '../context.js';
import { runChecks } from '../runner.js';

const execAsync = promisify(exec);

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

  describe('Complete TDD Cycle: Red → Green → Refactor', () => {
    it('should execute complete TDD cycle with proper phase transitions', async () => {
      // Step 1: Red Phase - Write failing tests
      const redContext = await buildContext();
      const redPhaseContext = {
        ...redContext,
        tddPhase: 'red',
        git: {
          ...redContext.git,
          changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase checks
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

      const redResult = await runChecks(redPhaseContext);
      expect(redResult.ok).toBe(true);

      // Step 2: Green Phase - Make tests pass
      const greenContext = await buildContext();
      const greenPhaseContext = {
        ...greenContext,
        tddPhase: 'green',
        git: {
          ...greenContext.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'fix: implement button functionality [T-2025-01-18-002] [MODE:F] [TDD:green]'
        }
      };

      // Mock Green phase checks
      const { checkTddGreenPhase } = await import('../checks/tddGreenPhase.js');
      vi.mocked(checkTddGreenPhase).mockResolvedValue({
        ok: true,
        id: 'tdd-green-phase',
        details: { message: 'Green phase validation passed' }
      });

      vi.mocked(checkTests).mockResolvedValue({
        ok: true,
        details: { testResults: { passed: 2, failed: 0, total: 2 } }
      });

      const greenResult = await runChecks(greenPhaseContext);
      expect(greenResult.ok).toBe(true);

      // Step 3: Refactor Phase - Improve code quality
      const refactorContext = await buildContext();
      const refactorPhaseContext = {
        ...refactorContext,
        tddPhase: 'refactor',
        git: {
          ...refactorContext.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'refactor: improve button component structure [T-2025-01-18-003] [MODE:F] [TDD:refactor]'
        }
      };

      // Mock Refactor phase checks
      const { checkTddRefactorPhase } = await import('../checks/tddRefactorPhase.js');
      vi.mocked(checkTddRefactorPhase).mockResolvedValue({
        ok: true,
        id: 'tdd-refactor-phase',
        details: { message: 'Refactor phase validation passed' }
      });

      vi.mocked(checkTests).mockResolvedValue({
        ok: true,
        details: { testResults: { passed: 2, failed: 0, total: 2 } }
      });

      const refactorResult = await runChecks(refactorPhaseContext);
      expect(refactorResult.ok).toBe(true);
    });

    it('should fail when skipping Red phase to go directly to Green', async () => {
      const greenContext = await buildContext();
      const skipRedContext = {
        ...greenContext,
        tddPhase: 'green',
        git: {
          ...greenContext.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'fix: implement button functionality [T-2025-01-18-002] [MODE:F] [TDD:green]'
        }
      };

      // Mock process sequence check to fail
      const { checkTddProcessSequence } = await import('../checks/tddProcessSequence.js');
      vi.mocked(checkTddProcessSequence).mockResolvedValue({
        ok: false,
        id: 'tdd-process-sequence',
        reason: 'TDD process sequence violations detected'
      });

      const result = await runChecks(skipRedContext);
      expect(result.ok).toBe(false);
    });

    it('should fail when skipping Green phase to go directly to Refactor', async () => {
      const refactorContext = await buildContext();
      const skipGreenContext = {
        ...refactorContext,
        tddPhase: 'refactor',
        git: {
          ...refactorContext.git,
          changedFiles: ['src/components/Button.tsx'],
          commitMessage: 'refactor: improve button component [T-2025-01-18-003] [MODE:F] [TDD:refactor]'
        }
      };

      // Mock process sequence check to fail
      const { checkTddProcessSequence } = await import('../checks/tddProcessSequence.js');
      vi.mocked(checkTddProcessSequence).mockResolvedValue({
        ok: false,
        id: 'tdd-process-sequence',
        reason: 'TDD process sequence violations detected'
      });

      const result = await runChecks(skipGreenContext);
      expect(result.ok).toBe(false);
    });
  });

  describe('TDD Phase Commands Integration', () => {
    it('should work with npm run tdd:red command', async () => {
      const { stdout } = await execAsync('npm run tdd:red', { cwd: testDir });
      
      expect(existsSync(tddPhaseFile)).toBe(true);
      expect(stdout).toContain('TDD Red phase marked');
      
      const phaseContent = JSON.parse(readFileSync(tddPhaseFile, 'utf8'));
      expect(phaseContent.phase).toBe('red');
      expect(phaseContent.timestamp).toBeDefined();
    });

    it('should work with npm run tdd:green command', async () => {
      const { stdout } = await execAsync('npm run tdd:green', { cwd: testDir });
      
      expect(existsSync(tddPhaseFile)).toBe(true);
      expect(stdout).toContain('TDD Green phase marked');
      
      const phaseContent = JSON.parse(readFileSync(tddPhaseFile, 'utf8'));
      expect(phaseContent.phase).toBe('green');
      expect(phaseContent.timestamp).toBeDefined();
    });

    it('should work with npm run tdd:refactor command', async () => {
      const { stdout } = await execAsync('npm run tdd:refactor', { cwd: testDir });
      
      expect(existsSync(tddPhaseFile)).toBe(true);
      expect(stdout).toContain('TDD Refactor phase marked');
      
      const phaseContent = JSON.parse(readFileSync(tddPhaseFile, 'utf8'));
      expect(phaseContent.phase).toBe('refactor');
      expect(phaseContent.timestamp).toBeDefined();
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

      const startTime = Date.now();
      
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

      const result = await runChecks(performanceContext);
      const endTime = Date.now();
      
      expect(result.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
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
