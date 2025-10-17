import { describe, it, expect } from 'vitest';
import { extractPhaseFromCommitMessage, analyzeTestEvidence, detectRefactoringEvidence, detectTddPhase } from '../../utils/tddPhaseDetection.js';
import { TestEvidence } from '../../utils/testEvidence.js';
import { ProveContext } from '../../context.js';

describe('TDD Phase Detection - Step 1', () => {
  it('should extract red phase from commit message', () => {
    // This test will fail first (RED)
    const message = 'feat: add feature [T-2024-01-15-001] [MODE:F] [TDD:red]';
    const phase = extractPhaseFromCommitMessage(message);
    expect(phase).toBe('red');
  });
});

describe('TDD Phase Detection - Step 2', () => {
  it('should extract green phase from commit message', () => {
    // This test will fail because we only handle red phase
    const message = 'fix: resolve bug [T-2024-01-15-002] [MODE:F] [TDD:green]';
    const phase = extractPhaseFromCommitMessage(message);
    expect(phase).toBe('green');
  });
});

describe('TDD Phase Detection - Step 3', () => {
  it('should extract refactor phase from commit message', () => {
    // This test will pass because our regex already handles refactor
    const message = 'refactor: improve code [T-2024-01-15-003] [MODE:F] [TDD:refactor]';
    const phase = extractPhaseFromCommitMessage(message);
    expect(phase).toBe('refactor');
  });
});

describe('TDD Phase Detection - Step 4', () => {
  it('should return unknown for commit message without TDD marker', () => {
    const message = 'feat: add feature [T-2024-01-15-001] [MODE:F]';
    const phase = extractPhaseFromCommitMessage(message);
    expect(phase).toBe('unknown');
  });
});

describe('TDD Phase Detection - Step 5', () => {
  it('should detect red phase from failing tests', () => {
    // This test will fail because analyzeTestEvidence doesn't exist yet
    const evidence: TestEvidence[] = [
      {
        id: 'evidence-1',
        phase: 'red',
        timestamp: '2024-01-15T10:00:00Z',
        testResults: { passed: 0, failed: 2, total: 2 },
        changedFiles: ['src/test.ts'],
        commitHash: 'abc123'
      }
    ];

    const phase = analyzeTestEvidence(evidence);
    expect(phase).toBe('red');
  });
});

describe('TDD Phase Detection - Step 6', () => {
  it('should detect refactoring from code changes without test changes', () => {
    // This test will fail because detectRefactoringEvidence doesn't exist yet
    const changedFiles = ['src/refactored.ts', 'src/improved.ts'];
    const phase = detectRefactoringEvidence(changedFiles);
    expect(phase).toBe('refactor');
  });
});

describe('TDD Phase Detection - Step 7', () => {
  it('should detect phase from commit message first', async () => {
    // This test will fail because detectTddPhase doesn't exist yet
    const context: ProveContext = {
      cfg: {} as any,
      git: {
        currentBranch: 'main',
        baseRef: 'origin/main',
        changedFiles: ['src/test.ts'],
        hasUncommittedChanges: false,
        commitHash: 'abc123',
        commitMessage: 'feat: add feature [T-2024-01-15-001] [MODE:F] [TDD:red]'
      },
      env: {},
      isCI: false,
      log: {} as any,
      mode: 'functional',
      testEvidence: [],
      startTime: Date.now(),
      workingDirectory: '/test'
    };

    const phase = await detectTddPhase(context);
    expect(phase).toBe('red');
  });
});
