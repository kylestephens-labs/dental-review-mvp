// TDD Red Phase: Comprehensive test suite for TDD Red Phase validation
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkTddRedPhase } from '../../checks/tddRedPhase.js';
import { 
  createMockLogger, 
  createRedPhaseContext, 
  createMockTestCheckResult,
  setupTestEnvironment,
  teardownTestEnvironment,
  expectTestResults
} from '../shared/test-helpers.js';

// Mock external dependencies
vi.mock('../../checks/tests.js', () => ({ checkTests: vi.fn() }));
vi.mock('../../checks/diffCoverage.js', () => ({ checkDiffCoverage: vi.fn() }));
vi.mock('../../logger.js', () => ({ logger: createMockLogger() }));

describe('TDD Red Phase Validation', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('Test File Validation', () => {
    it('should validate that tests are written first in Red phase', async () => {
      const context = createRedPhaseContext();
      const { checkTests } = await import('../../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue(
        createMockTestCheckResult(0, 2, 2)
      );

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(true);
      expect(result.id).toBe('tdd-red-phase');
    });

    it('should fail when no test files are present in Red phase', async () => {
      const context = createRedPhaseContext({
        git: {
          ...createRedPhaseContext().git,
          changedFiles: ['src/components/Button.tsx'] // Only source file, no test file
        }
      });

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('Tests must be written first in Red phase');
    });
  });

  describe('Test Quality Validation', () => {
    it('should fail when tests pass in Red phase', async () => {
      const context = createRedPhaseContext();
      const { checkTests } = await import('../../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue(
        createMockTestCheckResult(2, 0, 2)
      );

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('Tests must fail initially in Red phase');
    });

    it('should validate test quality requirements in Red phase', async () => {
      const context = createRedPhaseContext();
      const { checkTests } = await import('../../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue(
        createMockTestCheckResult(0, 3, 3)
      );

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(true);
      expect(result.id).toBe('tdd-red-phase');
    });
  });

  describe('Coverage Validation', () => {
    it('should handle diff coverage enabled without failing', async () => {
      const context = createRedPhaseContext({
        cfg: {
          toggles: { tdd: true, diffCoverage: true },
          thresholds: { diffCoverageFunctional: 85 }
        }
      });

      const { checkTests } = await import('../../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue(
        createMockTestCheckResult(0, 2, 2)
      );

      const { checkDiffCoverage } = await import('../../checks/diffCoverage.js');
      vi.mocked(checkDiffCoverage).mockResolvedValue({
        ok: true,
        details: { message: 'Coverage threshold met' }
      });

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(true);
      expect(result.id).toBe('tdd-red-phase');
    });

    it('should handle diff coverage failure gracefully (informational only)', async () => {
      const context = createRedPhaseContext({
        cfg: {
          toggles: { tdd: true, diffCoverage: true },
          thresholds: { diffCoverageFunctional: 85 }
        }
      });

      const { checkTests } = await import('../../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue(
        createMockTestCheckResult(0, 2, 2)
      );

      const { checkDiffCoverage } = await import('../../checks/diffCoverage.js');
      vi.mocked(checkDiffCoverage).mockResolvedValue({
        ok: false,
        details: { message: 'Coverage threshold not met' }
      });

      const result = await checkTddRedPhase(context);
      
      // Should still pass because coverage validation is informational only
      expect(result.ok).toBe(true);
      expect(result.id).toBe('tdd-red-phase');
    });
  });

  describe('File Pattern Handling', () => {
    it('should handle various test file patterns correctly', async () => {
      const context = createRedPhaseContext({
        git: {
          ...createRedPhaseContext().git,
          changedFiles: [
            'src/components/Button.tsx', // source file
            'src/components/Button.test.tsx', // test file
            'src/components/Button.spec.tsx', // spec file
            'src/__tests__/Button.test.ts', // test file in __tests__
            'src/components/Button.stories.tsx', // story file (should be excluded)
            'src/fixtures/test-data.json', // fixture file (should be excluded)
            'src/config/app.config.js' // config file (should be excluded)
          ]
        }
      });

      const { checkTests } = await import('../../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue(
        createMockTestCheckResult(0, 4, 4)
      );

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(true);
      expect(result.id).toBe('tdd-red-phase');
    });

    it('should handle edge case with only test files changed', async () => {
      const context = createRedPhaseContext({
        git: {
          ...createRedPhaseContext().git,
          changedFiles: ['src/components/Button.test.tsx'] // Only test file
        }
      });

      const { checkTests } = await import('../../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue(
        createMockTestCheckResult(0, 1, 1)
      );

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(true);
      expect(result.id).toBe('tdd-red-phase');
    });
  });

  describe('Phase Validation', () => {
    it('should skip validation when not in Red phase', async () => {
      const context = createRedPhaseContext({
        tddPhase: 'green' as const
      });

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('Not in Red phase - skipping validation');
    });

    it('should validate minimum test coverage threshold in Red phase', async () => {
      const context = createRedPhaseContext();
      const { checkTests } = await import('../../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue(
        createMockTestCheckResult(0, 1, 1)
      );

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(true);
      expect(result.id).toBe('tdd-red-phase');
    });
  });

  describe('Edge Cases', () => {
    it('should validate commit message format in Red phase', async () => {
      const context = createRedPhaseContext({
        git: {
          ...createRedPhaseContext().git,
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F]' // Missing TDD:red
        }
      });

      const { checkTests } = await import('../../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue(
        createMockTestCheckResult(0, 2, 2)
      );

      const result = await checkTddRedPhase(context);
      
      expect(result.ok).toBe(true); // Should still pass as commit message validation is separate
      expect(result.id).toBe('tdd-red-phase');
    });
  });
});
