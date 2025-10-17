// TDD Red Phase: One failing test for TDD Process Sequence validation
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkTddProcessSequence } from '../../checks/tddProcessSequence.js';
import type { ProveContext } from '../../context.js';

// Mock the test evidence utilities
vi.mock('../../utils/testEvidence.js', () => ({
  getTestEvidenceHistory: vi.fn()
}));

describe('TDD Process Sequence Validation', () => {
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
        commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:green]'
      } as any,
      mode: 'functional',
      tddPhase: 'green',
      workingDirectory: '/test'
    } as any;
  });

  it('should validate proper TDD process sequence starting with Red phase', async () => {
    // Mock getTestEvidenceHistory to return empty array for first test
    const { getTestEvidenceHistory } = await import('../../utils/testEvidence.js');
    vi.mocked(getTestEvidenceHistory).mockResolvedValue([]);

    // Set context to Red phase (first phase)
    const redContext = {
      ...mockContext,
      tddPhase: 'red' as const
    };

    const result = await checkTddProcessSequence(redContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-process-sequence');
  });

  it('should validate proper TDD process sequence with Red → Green transition', async () => {
    // Mock getTestEvidenceHistory to return Red phase history
    const { getTestEvidenceHistory } = await import('../../utils/testEvidence.js');
    vi.mocked(getTestEvidenceHistory).mockResolvedValue([
      { phase: 'red', timestamp: Date.now() - 1000 }
    ]);

    const result = await checkTddProcessSequence(mockContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-process-sequence');
  });

  it('should fail when skipping Red phase to go directly to Green', async () => {
    // Mock getTestEvidenceHistory to return empty array (no Red phase)
    const { getTestEvidenceHistory } = await import('../../utils/testEvidence.js');
    vi.mocked(getTestEvidenceHistory).mockResolvedValue([]);

    const result = await checkTddProcessSequence(mockContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('TDD process sequence violations detected');
  });

  it('should fail when skipping Green phase to go directly to Refactor', async () => {
    // Mock getTestEvidenceHistory to return only Red phase
    const { getTestEvidenceHistory } = await import('../../utils/testEvidence.js');
    vi.mocked(getTestEvidenceHistory).mockResolvedValue([
      { phase: 'red', timestamp: Date.now() - 1000 }
    ]);

    const refactorContext = {
      ...mockContext,
      tddPhase: 'refactor' as const
    };

    const result = await checkTddProcessSequence(refactorContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('TDD process sequence violations detected');
  });

  it('should fail when going backwards from Refactor to Green', async () => {
    // Mock getTestEvidenceHistory to return Red → Green → Refactor history
    const { getTestEvidenceHistory } = await import('../../utils/testEvidence.js');
    vi.mocked(getTestEvidenceHistory).mockResolvedValue([
      { phase: 'red', timestamp: Date.now() - 3000 },
      { phase: 'green', timestamp: Date.now() - 2000 },
      { phase: 'refactor', timestamp: Date.now() - 1000 }
    ]);

    const greenContext = {
      ...mockContext,
      tddPhase: 'green' as const
    };

    const result = await checkTddProcessSequence(greenContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('TDD process sequence violations detected');
  });

  it('should handle evidence reset scenario gracefully', async () => {
    // Mock getTestEvidenceHistory to return empty array (evidence reset)
    const { getTestEvidenceHistory } = await import('../../utils/testEvidence.js');
    vi.mocked(getTestEvidenceHistory).mockResolvedValue([]);

    // Set context to Red phase (first phase after reset)
    const redContext = {
      ...mockContext,
      tddPhase: 'red' as const
    };

    const result = await checkTddProcessSequence(redContext);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('tdd-process-sequence');
    expect(result.reason).toBe('Starting fresh TDD cycle - no previous evidence found');
    expect(result.details?.isFreshStart).toBe(true);
  });

  it('should fail when evidence is reset but trying to go to Green phase', async () => {
    // Mock getTestEvidenceHistory to return empty array (evidence reset)
    const { getTestEvidenceHistory } = await import('../../utils/testEvidence.js');
    vi.mocked(getTestEvidenceHistory).mockResolvedValue([]);

    // Set context to Green phase without Red phase evidence
    const greenContext = {
      ...mockContext,
      tddPhase: 'green' as const
    };

    const result = await checkTddProcessSequence(greenContext);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('TDD process sequence violations detected');
  });

  it('should skip validation for non-functional tasks', async () => {
    const nonFunctionalContext = {
      ...mockContext,
      mode: 'non-functional' as const
    };

    const result = await checkTddProcessSequence(nonFunctionalContext);
    
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('Not a functional task - skipping TDD process sequence validation');
  });
});
