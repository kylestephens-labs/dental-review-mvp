// TDD Red Phase: One failing test for TDD Red Phase validation
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkTddRedPhase } from '../../checks/tddRedPhase.js';
import type { ProveContext } from '../../context.js';

// Mock the test check function
vi.mock('../../checks/tests.js', () => ({
  checkTests: vi.fn()
}));

// Mock the diff coverage check function
vi.mock('../../checks/diffCoverage.js', () => ({
  checkDiffCoverage: vi.fn()
}));

describe('TDD Red Phase Validation', () => {
  let mockContext: ProveContext;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    mockContext = {
      cfg: {
        toggles: { tdd: true, diffCoverage: false },
        thresholds: { diffCoverageFunctional: 85 }
      } as any,
      git: {
        changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
        commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
      } as any,
      mode: 'functional',
      tddPhase: 'red',
      workingDirectory: '/test'
    } as any;
  });

  it('should validate that tests are written first in Red phase', async () => {
    // Mock checkTests to return success (tests exist and are failing)
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 0, failed: 2, total: 2 }
      }
    });

    const result = await checkTddRedPhase(mockContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-red-phase');
  });

  it('should fail when no test files are present in Red phase', async () => {
    const noTestContext = {
      ...mockContext,
      git: {
        ...mockContext.git,
        changedFiles: ['src/components/Button.tsx'] // Only source file, no test file
      }
    };

    const result = await checkTddRedPhase(noTestContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Tests must be written first in Red phase');
  });

  it('should fail when tests pass in Red phase', async () => {
    // Mock checkTests to return success with passing tests
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 2, failed: 0, total: 2 }
      }
    });

    const result = await checkTddRedPhase(mockContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Tests must fail initially in Red phase');
  });

  it('should validate test quality requirements in Red phase', async () => {
    // Mock checkTests to return success with failing tests
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 0, failed: 3, total: 3 }
      }
    });

    const result = await checkTddRedPhase(mockContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-red-phase');
  });

  it('should handle diff coverage enabled without failing', async () => {
    const diffCoverageContext = {
      ...mockContext,
      cfg: {
        ...mockContext.cfg,
        toggles: {
          ...mockContext.cfg.toggles,
          diffCoverage: true
        }
      }
    };

    // Mock checkTests to return success with failing tests
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 0, failed: 2, total: 2 }
      }
    });

    // Mock checkDiffCoverage to return success
    const { checkDiffCoverage } = await import('../../checks/diffCoverage.js');
    vi.mocked(checkDiffCoverage).mockResolvedValue({
      ok: true,
      details: { message: 'Coverage threshold met' }
    });

    const result = await checkTddRedPhase(diffCoverageContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-red-phase');
  });

  it('should handle diff coverage failure gracefully (informational only)', async () => {
    const diffCoverageContext = {
      ...mockContext,
      cfg: {
        ...mockContext.cfg,
        toggles: {
          ...mockContext.cfg.toggles,
          diffCoverage: true
        }
      }
    };

    // Mock checkTests to return success with failing tests
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 0, failed: 2, total: 2 }
      }
    });

    // Mock checkDiffCoverage to return failure
    const { checkDiffCoverage } = await import('../../checks/diffCoverage.js');
    vi.mocked(checkDiffCoverage).mockResolvedValue({
      ok: false,
      details: { message: 'Coverage threshold not met' }
    });

    const result = await checkTddRedPhase(diffCoverageContext);
    
    // Should still pass because coverage validation is informational only
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-red-phase');
  });

  it('should handle various test file patterns correctly', async () => {
    const mixedFilesContext = {
      ...mockContext,
      git: {
        ...mockContext.git,
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
    };

    // Mock checkTests to return success with failing tests
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 0, failed: 4, total: 4 }
      }
    });

    const result = await checkTddRedPhase(mixedFilesContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-red-phase');
  });

  it('should skip validation when not in Red phase', async () => {
    const nonRedContext = {
      ...mockContext,
      tddPhase: 'green' as const
    };

    const result = await checkTddRedPhase(nonRedContext);
    
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('Not in Red phase - skipping validation');
  });

  it('should validate minimum test coverage threshold in Red phase', async () => {
    // Mock checkTests to return success with failing tests
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 0, failed: 1, total: 1 }
      }
    });

    const result = await checkTddRedPhase(mockContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-red-phase');
  });

  it('should handle edge case with only test files changed', async () => {
    const testOnlyContext = {
      ...mockContext,
      git: {
        ...mockContext.git,
        changedFiles: ['src/components/Button.test.tsx'] // Only test file
      }
    };

    // Mock checkTests to return success with failing tests
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 0, failed: 1, total: 1 }
      }
    });

    const result = await checkTddRedPhase(testOnlyContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-red-phase');
  });

  it('should validate commit message format in Red phase', async () => {
    const invalidCommitContext = {
      ...mockContext,
      git: {
        ...mockContext.git,
        commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F]' // Missing TDD:red
      }
    };

    // Mock checkTests to return success with failing tests
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 0, failed: 2, total: 2 }
      }
    });

    const result = await checkTddRedPhase(invalidCommitContext);
    
    expect(result.ok).toBe(true); // Should still pass as commit message validation is separate
    expect(result.id).toBe('tdd-red-phase');
  });
});
