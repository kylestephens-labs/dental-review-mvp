// TDD Red Phase: One failing test for TDD Green Phase validation
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkTddGreenPhase } from '../../checks/tddGreenPhase.js';
import type { ProveContext } from '../../context.js';

// Mock the test check function
vi.mock('../../checks/tests.js', () => ({
  checkTests: vi.fn()
}));

// Mock the diff coverage check function
vi.mock('../../checks/diffCoverage.js', () => ({
  checkDiffCoverage: vi.fn()
}));

describe('TDD Green Phase Validation', () => {
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
        changedFiles: ['src/components/Button.tsx'],
        commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:green]'
      } as any,
      mode: 'functional',
      tddPhase: 'green',
      workingDirectory: '/test'
    } as any;
  });

  it('should validate that tests pass in Green phase', async () => {
    // Mock checkTests to return success
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 5, failed: 0, total: 5 }
      }
    });

    const result = await checkTddGreenPhase(mockContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-green-phase');
  });

  it('should fail when tests fail in Green phase', async () => {
    // Mock checkTests to return failure
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: false,
      details: {
        testResults: { passed: 3, failed: 2, total: 5 },
        exitCode: 1
      }
    });

    const result = await checkTddGreenPhase(mockContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Tests must pass in Green phase');
    expect(result.id).toBe('tdd-green-phase');
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

    // Mock checkTests to return success
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 5, failed: 0, total: 5 }
      }
    });

    // Mock checkDiffCoverage to return success
    const { checkDiffCoverage } = await import('../../checks/diffCoverage.js');
    vi.mocked(checkDiffCoverage).mockResolvedValue({
      ok: true,
      details: { message: 'Coverage threshold met' }
    });

    const result = await checkTddGreenPhase(diffCoverageContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-green-phase');
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

    // Mock checkTests to return success
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 5, failed: 0, total: 5 }
      }
    });

    // Mock checkDiffCoverage to return failure
    const { checkDiffCoverage } = await import('../../checks/diffCoverage.js');
    vi.mocked(checkDiffCoverage).mockResolvedValue({
      ok: false,
      details: { message: 'Coverage threshold not met' }
    });

    const result = await checkTddGreenPhase(diffCoverageContext);
    
    // Should still pass because coverage validation is informational only
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-green-phase');
  });

  it('should handle various file patterns correctly', async () => {
    const mixedFilesContext = {
      ...mockContext,
      git: {
        ...mockContext.git,
        changedFiles: [
          'src/components/Button.tsx', // source file
          'src/components/Button.test.tsx', // test file
          'src/components/Button.stories.tsx', // story file (should be excluded)
          'src/__tests__/utils.test.ts', // test file in __tests__
          'src/fixtures/test-data.json', // fixture file (should be excluded)
          'src/config/app.config.js', // config file (should be excluded)
          'src/types/index.d.ts' // type file (should be excluded)
        ]
      }
    };

    // Mock checkTests to return success
    const { checkTests } = await import('../../checks/tests.js');
    vi.mocked(checkTests).mockResolvedValue({
      ok: true,
      details: {
        testResults: { passed: 5, failed: 0, total: 5 }
      }
    });

    const result = await checkTddGreenPhase(mixedFilesContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-green-phase');
  });

  it('should skip validation when not in Green phase', async () => {
    const nonGreenContext = {
      ...mockContext,
      tddPhase: 'red' as const
    };

    const result = await checkTddGreenPhase(nonGreenContext);
    
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('Not in Green phase - skipping validation');
  });
});
