// Shared test utilities and helpers for TDD testing
import { vi } from 'vitest';
import { ProveContext } from '../../context.js';

// Mock logger with all required methods
export const createMockLogger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  header: vi.fn()
});

// Create a base mock context for testing
export const createMockContext = (overrides: Partial<ProveContext> = {}): ProveContext => ({
  cfg: {
    toggles: { tdd: true, diffCoverage: false },
    thresholds: { diffCoverageFunctional: 85 }
  } as any,
  git: {
    currentBranch: 'main',
    baseRef: 'origin/main',
    changedFiles: ['src/components/Button.tsx'],
    hasUncommittedChanges: false,
    commitHash: 'abc123',
    commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
  } as any,
  env: {},
  isCI: false,
  log: createMockLogger(),
  mode: 'functional',
  testEvidence: [],
  startTime: Date.now(),
  workingDirectory: '/test',
  ...overrides
});

// Create TDD phase specific contexts
export const createRedPhaseContext = (overrides: Partial<ProveContext> = {}): ProveContext =>
  createMockContext({
    tddPhase: 'red',
    git: {
      ...createMockContext().git,
      changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
      commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
    },
    ...overrides
  });

export const createGreenPhaseContext = (overrides: Partial<ProveContext> = {}): ProveContext =>
  createMockContext({
    tddPhase: 'green',
    git: {
      ...createMockContext().git,
      changedFiles: ['src/components/Button.tsx'],
      commitMessage: 'fix: implement button functionality [T-2025-01-18-002] [MODE:F] [TDD:green]'
    },
    ...overrides
  });

export const createRefactorPhaseContext = (overrides: Partial<ProveContext> = {}): ProveContext =>
  createMockContext({
    tddPhase: 'refactor',
    git: {
      ...createMockContext().git,
      changedFiles: ['src/components/Button.tsx'],
      commitMessage: 'refactor: improve button component [T-2025-01-18-003] [MODE:F] [TDD:refactor]'
    },
    ...overrides
  });

// Test data factories
export const createTestResults = (passed: number, failed: number, total: number) => ({
  passed,
  failed,
  total
});

export const createTestEvidence = (phase: 'red' | 'green' | 'refactor', overrides: any = {}) => ({
  id: `evidence-${Date.now()}`,
  phase,
  timestamp: Date.now(),
  testResults: createTestResults(0, 2, 2),
  changedFiles: ['src/test.ts'],
  commitHash: 'abc123',
  ...overrides
});

// File pattern helpers
export const createTestFiles = (count: number) => 
  Array.from({ length: count }, (_, i) => `src/components/Button${i}.test.tsx`);

export const createSourceFiles = (count: number) => 
  Array.from({ length: count }, (_, i) => `src/components/Button${i}.tsx`);

export const createMixedFiles = (testCount: number, sourceCount: number) => [
  ...createTestFiles(testCount),
  ...createSourceFiles(sourceCount)
];

// Performance testing helpers
export const measurePerformance = async <T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> => {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
};

// Error simulation helpers
export const simulateFileSystemError = (errorType: 'permission' | 'disk' | 'notfound') => {
  const errors = {
    permission: new Error('EACCES: permission denied'),
    disk: new Error('ENOSPC: no space left on device'),
    notfound: new Error('ENOENT: no such file or directory')
  };
  return errors[errorType];
};

// Mock check results
export const createMockCheckResult = (ok: boolean, overrides: any = {}) => ({
  ok,
  id: 'mock-check',
  ms: 10,
  ...overrides
});

export const createMockTestCheckResult = (passed: number, failed: number, total: number) =>
  createMockCheckResult(true, {
    details: {
      testResults: createTestResults(passed, failed, total)
    }
  });

// Assertion helpers
export const expectPerformanceWithin = (duration: number, maxDuration: number) => {
  expect(duration).toBeLessThan(maxDuration);
};

export const expectTestResults = (actual: any, expected: { passed: number; failed: number; total: number }) => {
  expect(actual.passed).toBe(expected.passed);
  expect(actual.failed).toBe(expected.failed);
  expect(actual.total).toBe(expected.total);
};

// Cleanup helpers
export const setupTestEnvironment = () => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
};

export const teardownTestEnvironment = () => {
  vi.restoreAllMocks();
};
