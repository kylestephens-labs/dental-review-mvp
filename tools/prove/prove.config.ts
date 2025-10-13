// Central thresholds/toggles configuration
// Default configuration values for prove quality gates

export const defaultConfig = {
  // Thresholds
  thresholds: {
    diffCoverageFunctional: 85, // 85% coverage required for functional tasks
    diffCoverageFunctionalRefactor: 60, // 60% for refactor tasks
    globalCoverage: 80, // Global coverage threshold (optional)
    maxWarnings: 0, // ESLint max warnings
    maxCommitSize: 300, // Max lines of code per commit
  },

  // Paths
  paths: {
    srcGlobs: ['src/**/*.{ts,tsx,js,jsx}'],
    testGlobs: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}', 'tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    coverageFile: 'coverage/coverage-final.json',
    proveReportFile: 'prove-report.json',
  },

  // Git configuration
  git: {
    baseRefFallback: 'origin/main',
    requireMainBranch: true,
    enablePreConflictCheck: true,
  },

  // Runner configuration
  runner: {
    concurrency: 4, // Max parallel checks
    timeout: 300000, // 5 minutes timeout per check
    failFast: true, // Stop on first failure
  },

  // Feature toggles
  toggles: {
    coverage: true, // Enable global coverage check
    diffCoverage: true, // Enable diff coverage check
    sizeBudget: false, // Enable bundle size checks
    security: false, // Enable security scans
    contracts: false, // Enable API contract validation
    dbMigrations: false, // Enable database migration checks
  },

  // Mode-specific settings
  modes: {
    functional: {
      requireTdd: true,
      requireDiffCoverage: true,
      requireTests: true,
    },
    nonFunctional: {
      requireProblemAnalysis: true,
      requireProblemAnalysisMinLength: 200,
      requireTdd: false,
      requireDiffCoverage: false,
      requireTests: false,
    },
  },

  // Check-specific timeouts (ms)
  checkTimeouts: {
    typecheck: 60000, // 1 minute
    lint: 30000, // 30 seconds
    tests: 120000, // 2 minutes
    build: 180000, // 3 minutes
    coverage: 60000, // 1 minute
  },
} as const;

export type ProveConfig = typeof defaultConfig;