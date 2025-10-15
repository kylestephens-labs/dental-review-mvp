/**
 * Central registry of all prove checks
 * This file serves as the single source of truth for check definitions
 * and is used by documentation generators
 */

import { checkTrunk } from './trunk.js';
import { checkDeliveryMode } from './deliveryMode.js';
import { checkCommitMsgConvention } from './commit-msg-convention.js';
import { checkKillswitchRequired } from './killswitch-required.js';
import { checkPreConflict } from './preConflict.js';
import { checkEnvCheck } from './envCheck.js';
import { checkLint } from './lint.js';
import { checkTypecheck } from './typecheck.js';
import { checkTests } from './tests.js';
import { checkTddChangedHasTests } from './tddChangedHasTests.js';
import { checkDiffCoverage } from './diffCoverage.js';
import { checkCoverage } from './coverage.js';
import { checkBuildWeb } from './buildWeb.js';
import { checkBuildApi } from './buildApi.js';
import { checkSizeBudget } from './sizeBudget.js';
import { checkSecurity } from './security.js';
import { checkContracts } from './contracts.js';
import { checkDbMigrations } from './dbMigrations.js';

export interface CheckDefinition {
  id: string;
  name: string;
  description: string;
  category: 'critical' | 'parallel' | 'mode-specific' | 'optional';
  quickMode: boolean;
  toggle?: string;
}

export const PROVE_CHECKS: Record<string, CheckDefinition> = {
  // Critical checks (run serially, fail-fast)
  trunk: {
    id: 'trunk',
    name: 'Trunk-Based Development',
    description: 'Verify working on main branch as required by trunk-based development',
    category: 'critical',
    quickMode: true,
  },
  'delivery-mode': {
    id: 'delivery-mode',
    name: 'Delivery Mode',
    description: 'Read tasks/TASK.json (plan) or branch naming convention. Functional tasks → enforce TDD; non-functional → require tasks/PROBLEM_ANALYSIS.md sections (Analyze/Fix/Validate, length check)',
    category: 'critical',
    quickMode: true,
  },
  'commit-msg-convention': {
    id: 'commit-msg-convention',
    name: 'Commit Message Convention',
    description: 'Validate conventional commit format with task ID and mode tags',
    category: 'critical',
    quickMode: true,
  },
  'killswitch-required': {
    id: 'killswitch-required',
    name: 'Kill-switch Required',
    description: 'Check for kill-switch on feature commits (commits with feat: prefix)',
    category: 'critical',
    quickMode: true,
  },
  'pre-conflict': {
    id: 'pre-conflict',
    name: 'Pre-conflict Merge Check',
    description: 'Verify no merge conflicts exist before proceeding',
    category: 'critical',
    quickMode: false,
  },

  // Parallel checks (run concurrently)
  'env-check': {
    id: 'env-check',
    name: 'Environment Variable Validation',
    description: 'Validate all required environment variables are present and properly formatted',
    category: 'parallel',
    quickMode: true,
  },
  lint: {
    id: 'lint',
    name: 'ESLint',
    description: 'Run ESLint with zero warnings policy',
    category: 'parallel',
    quickMode: true,
  },
  typecheck: {
    id: 'typecheck',
    name: 'TypeScript Type Check',
    description: 'Run TypeScript compiler to catch type errors',
    category: 'parallel',
    quickMode: true,
  },
  tests: {
    id: 'tests',
    name: 'Test Suite',
    description: 'Run Vitest test suite with coverage',
    category: 'parallel',
    quickMode: true,
  },

  // Mode-specific checks
  'tdd-changed-has-tests': {
    id: 'tdd-changed-has-tests',
    name: 'TDD Changed Files Have Tests',
    description: 'Ensure all changed files have corresponding test files (functional mode only)',
    category: 'mode-specific',
    quickMode: true,
  },
  'diff-coverage': {
    id: 'diff-coverage',
    name: 'Diff Coverage',
    description: 'Ensure changed lines meet coverage threshold (functional mode only)',
    category: 'mode-specific',
    quickMode: true,
  },

  // Optional checks (controlled by toggles)
  coverage: {
    id: 'coverage',
    name: 'Global Coverage',
    description: 'Ensure overall test coverage meets threshold',
    category: 'optional',
    quickMode: false,
    toggle: 'coverage',
  },
  'build-web': {
    id: 'build-web',
    name: 'Web Build',
    description: 'Build the web application to verify it compiles successfully',
    category: 'optional',
    quickMode: false,
  },
  'build-api': {
    id: 'build-api',
    name: 'API Build',
    description: 'Build the API to verify it compiles successfully',
    category: 'optional',
    quickMode: false,
  },
  'size-budget': {
    id: 'size-budget',
    name: 'Size Budget',
    description: 'Check that bundle size is within acceptable limits',
    category: 'optional',
    quickMode: false,
    toggle: 'sizeBudget',
  },
  security: {
    id: 'security',
    name: 'Security Audit',
    description: 'Run npm audit to check for high/critical vulnerabilities',
    category: 'optional',
    quickMode: false,
    toggle: 'security',
  },
  contracts: {
    id: 'contracts',
    name: 'API Contracts & Webhooks',
    description: 'Validate API specifications using redocly lint and run webhook signature tests',
    category: 'optional',
    quickMode: false,
    toggle: 'contracts',
  },
  'db-migrations': {
    id: 'db-migrations',
    name: 'Database Migrations',
    description: 'Validate database migrations by applying them to a Testcontainers PostgreSQL instance',
    category: 'optional',
    quickMode: false,
    toggle: 'dbMigrations',
  },
};

export const CHECK_FUNCTIONS = {
  trunk: checkTrunk,
  'delivery-mode': checkDeliveryMode,
  'commit-msg-convention': checkCommitMsgConvention,
  'killswitch-required': checkKillswitchRequired,
  'pre-conflict': checkPreConflict,
  'env-check': checkEnvCheck,
  lint: checkLint,
  typecheck: checkTypecheck,
  tests: checkTests,
  'tdd-changed-has-tests': checkTddChangedHasTests,
  'diff-coverage': checkDiffCoverage,
  coverage: checkCoverage,
  'build-web': checkBuildWeb,
  'build-api': checkBuildApi,
  'size-budget': checkSizeBudget,
  security: checkSecurity,
  contracts: checkContracts,
  'db-migrations': checkDbMigrations,
};

/**
 * Get checks by category
 */
export function getChecksByCategory(category: CheckDefinition['category']): CheckDefinition[] {
  return Object.values(PROVE_CHECKS).filter(check => check.category === category);
}

/**
 * Get critical checks (always run)
 */
export function getCriticalChecks(): CheckDefinition[] {
  return getChecksByCategory('critical');
}

/**
 * Get parallel checks (run concurrently)
 */
export function getParallelChecks(): CheckDefinition[] {
  return getChecksByCategory('parallel');
}

/**
 * Get mode-specific checks
 */
export function getModeSpecificChecks(): CheckDefinition[] {
  return getChecksByCategory('mode-specific');
}

/**
 * Get optional checks (controlled by toggles)
 */
export function getOptionalChecks(): CheckDefinition[] {
  return getChecksByCategory('optional');
}

/**
 * Get checks that run in quick mode
 */
export function getQuickModeChecks(): CheckDefinition[] {
  return Object.values(PROVE_CHECKS).filter(check => check.quickMode);
}

/**
 * Get checks that require a specific toggle
 */
export function getToggledChecks(toggle: string): CheckDefinition[] {
  return Object.values(PROVE_CHECKS).filter(check => check.toggle === toggle);
}
