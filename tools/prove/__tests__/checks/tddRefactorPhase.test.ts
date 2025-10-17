// TDD Red Phase: One failing test for TDD Refactor Phase validation
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkTddRefactorPhase } from '../../checks/tddRefactorPhase.js';
import type { ProveContext } from '../../context.js';

// Mock the test check function
vi.mock('../../checks/tests.js', () => ({
  checkTests: vi.fn()
}));

describe('TDD Refactor Phase Validation', () => {
  let mockContext: ProveContext;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    mockContext = {
      cfg: {
        toggles: { tdd: true },
        thresholds: { diffCoverageFunctional: 85 }
      } as any,
      git: {
        changedFiles: ['src/components/Button.tsx'],
        commitMessage: 'refactor: improve button component [T-2025-01-18-001] [MODE:F] [TDD:refactor]'
      } as any,
      mode: 'functional',
      tddPhase: 'refactor',
      workingDirectory: '/test'
    } as any;
  });

  it('should validate code quality improvements in Refactor phase', async () => {
    // Mock checkTests to return success
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 5, failed: 0, total: 5 }
      }
    });

    const result = await checkTddRefactorPhase(mockContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-refactor-phase');
  });

  it('should fail when no files are changed in Refactor phase', async () => {
    const noFilesContext = {
      ...mockContext,
      git: {
        ...mockContext.git,
        changedFiles: []
      }
    };

    const result = await checkTddRefactorPhase(noFilesContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Refactoring must have occurred in Refactor phase');
  });

  it('should fail when only test files are changed in Refactor phase', async () => {
    const testOnlyContext = {
      ...mockContext,
      git: {
        ...mockContext.git,
        changedFiles: ['src/__tests__/Button.test.tsx']
      }
    };

    const result = await checkTddRefactorPhase(testOnlyContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Refactoring must have occurred in Refactor phase');
  });

  it('should fail when commit message lacks refactoring indicators', async () => {
    const noRefactorContext = {
      cfg: {
        toggles: { tdd: true },
        thresholds: { diffCoverageFunctional: 85 }
      } as any,
      git: {
        changedFiles: ['src/components/Button.tsx'],
        commitMessage: 'feat: add new button [T-2025-01-18-001] [MODE:F]'
      } as any,
      mode: 'functional',
      tddPhase: 'refactor',
      workingDirectory: '/test'
    } as any;

    // Mock checkTests to return success for this test
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 5, failed: 0, total: 5 }
      }
    });

    const result = await checkTddRefactorPhase(noRefactorContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Refactoring must have occurred in Refactor phase');
  });

  it('should fail when tests fail after refactoring', async () => {
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: false,
      details: {
        testResults: { passed: 3, failed: 2, total: 5 },
        exitCode: 1
      }
    });

    const result = await checkTddRefactorPhase(mockContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Behavior must be preserved in Refactor phase');
  });

  it('should handle long file paths without failing', async () => {
    const longPathContext = {
      ...mockContext,
      git: {
        ...mockContext.git,
        changedFiles: [
          'src/components/patient/IntakeForm.tsx',
          'src/components/patient/medical-history/MedicalHistoryForm.tsx',
          'src/components/patient/appointment-scheduling/AppointmentScheduler.tsx'
        ],
        commitMessage: 'refactor: extract patient form components [T-2025-01-18-001] [MODE:F] [TDD:refactor]'
      }
    };

    // Mock checkTests to return success for behavior preservation
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 5, failed: 0, total: 5 }
      }
    });

    const result = await checkTddRefactorPhase(longPathContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-refactor-phase');
  });

  it('should fail when commit message lacks refactoring indicators in quality validation', async () => {
    const noRefactorContext = {
      ...mockContext,
      git: {
        ...mockContext.git,
        commitMessage: 'fix: bug fix [T-2025-01-18-001] [MODE:F]'
      }
    };

    // Mock checkTests to return success for behavior preservation
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 5, failed: 0, total: 5 }
      }
    });

    const result = await checkTddRefactorPhase(noRefactorContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Refactoring must have occurred in Refactor phase');
  });

  it('should skip validation when not in Refactor phase', async () => {
    const nonRefactorContext = {
      ...mockContext,
      tddPhase: 'green' as const
    };

    const result = await checkTddRefactorPhase(nonRefactorContext);
    
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('Not in Refactor phase - skipping validation');
  });
});
