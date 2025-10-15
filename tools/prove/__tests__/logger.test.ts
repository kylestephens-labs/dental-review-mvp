import { describe, it, expect } from 'vitest';
import { formatReport } from '../logger.js';

describe('formatReport helper', () => {
  it('should format report with all checks passing', () => {
    const checks = [
      { id: 'trunk', ok: true, ms: 100 },
      { id: 'lint', ok: true, ms: 200 },
      { id: 'tests', ok: true, ms: 300 }
    ];

    const result = formatReport({ mode: 'functional', checks, totalMs: 600 });

    expect(result).toEqual({
      mode: 'functional',
      checks,
      totalMs: 600,
      success: true
    });
  });

  it('should format report with some checks failing', () => {
    const checks = [
      { id: 'trunk', ok: true, ms: 100 },
      { id: 'lint', ok: false, ms: 200, reason: 'Lint errors found' },
      { id: 'tests', ok: true, ms: 300 }
    ];

    const result = formatReport({ mode: 'functional', checks, totalMs: 600 });

    expect(result).toEqual({
      mode: 'functional',
      checks,
      totalMs: 600,
      success: false
    });
  });

  it('should format report with non-functional mode', () => {
    const checks = [
      { id: 'delivery-mode', ok: true, ms: 50 },
      { id: 'env-check', ok: true, ms: 150 }
    ];

    const result = formatReport({ mode: 'non-functional', checks, totalMs: 200 });

    expect(result).toEqual({
      mode: 'non-functional',
      checks,
      totalMs: 200,
      success: true
    });
  });

  it('should handle empty checks array', () => {
    const checks: Array<{ id: string; ok: boolean; ms: number; reason?: string }> = [];

    const result = formatReport({ mode: 'functional', checks, totalMs: 0 });

    expect(result).toEqual({
      mode: 'functional',
      checks: [],
      totalMs: 0,
      success: true
    });
  });

  it('should calculate success correctly with mixed results', () => {
    const checks = [
      { id: 'check1', ok: true, ms: 100 },
      { id: 'check2', ok: false, ms: 200, reason: 'Failed' },
      { id: 'check3', ok: true, ms: 300 }
    ];

    const result = formatReport({ mode: 'functional', checks, totalMs: 600 });

    expect(result.success).toBe(false);
    expect(result.checks).toHaveLength(3);
    expect(result.checks[1].ok).toBe(false);
    expect(result.checks[1].reason).toBe('Failed');
  });
});
