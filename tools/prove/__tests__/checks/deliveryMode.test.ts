import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { checkDeliveryMode } from '../../checks/deliveryMode.js';
import { createDeliveryModeContext } from '../../checks/deliveryMode.js';
import type { ProveContext } from '../../context.js';

describe('deliveryMode check', () => {
  const mockContext: ProveContext = {
    workingDirectory: process.cwd(),
    mode: 'functional',
    cfg: {
      thresholds: {
        globalCoverage: 80,
        diffCoverage: 80
      },
      paths: {
        src: 'src',
        tests: 'tests',
        coverage: 'coverage'
      },
      git: {
        mainBranch: 'main',
        protectedBranches: ['main', 'develop']
      },
      runner: {
        parallel: true,
        timeout: 30000
      },
      toggles: {
        coverage: true,
        sizeBudget: false,
        security: false,
        contracts: false,
        dbMigrations: false
      },
      checkTimeouts: {
        tests: 30000,
        build: 60000,
        coverage: 30000
      }
    },
    taskJson: undefined,
    git: {
      branch: 'main',
      isMain: true,
      prLabels: [],
      prTitle: ''
    },
    env: process.env,
    isCI: false
  };

  beforeEach(() => {
    // Clean up any existing files
    if (existsSync('tasks/TASK.json')) {
      unlinkSync('tasks/TASK.json');
    }
    if (existsSync('tasks/PROBLEM_ANALYSIS.md')) {
      unlinkSync('tasks/PROBLEM_ANALYSIS.md');
    }
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync('tasks/TASK.json')) {
      unlinkSync('tasks/TASK.json');
    }
    if (existsSync('tasks/PROBLEM_ANALYSIS.md')) {
      unlinkSync('tasks/PROBLEM_ANALYSIS.md');
    }
  });

  it('should pass for functional mode', async () => {
    const context = { ...mockContext, mode: 'functional' };
    const result = await checkDeliveryMode(context);
    
    expect(result.ok).toBe(true);
    expect(result.id).toBe('delivery-mode');
    expect(result.reason).toContain('Functional mode resolved successfully');
  });

  it('should fail for non-functional mode without PROBLEM_ANALYSIS.md', async () => {
    // Create TASK.json with non-functional mode
    writeFileSync('tasks/TASK.json', JSON.stringify({
      mode: 'non-functional',
      updatedAt: '2025-01-18T00:00:00Z',
      source: 'test',
      note: 'test'
    }));

    const context = { ...mockContext, mode: 'non-functional' };
    const result = await checkDeliveryMode(context);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Problem analysis file not found');
  });

  it('should fail for non-functional mode with placeholder content', async () => {
    // Create TASK.json with non-functional mode
    writeFileSync('tasks/TASK.json', JSON.stringify({
      mode: 'non-functional',
      updatedAt: '2025-01-18T00:00:00Z',
      source: 'test',
      note: 'test'
    }));

    // Create PROBLEM_ANALYSIS.md with placeholder content
    writeFileSync('tasks/PROBLEM_ANALYSIS.md', `# Problem Analysis Template

## Analyze
- [REPLACE: Describe the current issue or situation]

## Identify Root Cause
- [REPLACE: What is the underlying cause?]

## Fix Directly
- [REPLACE: List the specific changes required]

## Validate
- [REPLACE: What tests will confirm the fix works?]`);

    const context = { ...mockContext, mode: 'non-functional' };
    const result = await checkDeliveryMode(context);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Problem analysis contains placeholder content');
  });

  it('should pass for non-functional mode with real content', async () => {
    // Create TASK.json with non-functional mode
    writeFileSync('tasks/TASK.json', JSON.stringify({
      mode: 'non-functional',
      updatedAt: '2025-01-18T00:00:00Z',
      source: 'test',
      note: 'test'
    }));

    // Create PROBLEM_ANALYSIS.md with real content
    writeFileSync('tasks/PROBLEM_ANALYSIS.md', `# Problem Analysis

## Analyze
The current issue is that the database connection is failing intermittently, causing 500 errors for users. This manifests as random timeouts during peak usage hours, affecting approximately 15% of user sessions.

## Identify Root Cause
The root cause is a connection pool exhaustion issue. The current pool size of 10 connections is insufficient for the current load, and connections are not being properly released back to the pool in error scenarios.

## Fix Directly
1. Increase connection pool size from 10 to 25
2. Add proper connection cleanup in error handlers
3. Implement connection health checks
4. Add monitoring for pool utilization

## Validate
1. Monitor connection pool metrics for 24 hours
2. Verify error rate drops below 1%
3. Run load tests to confirm pool can handle peak load
4. Check that connections are properly released in all scenarios`);

    const context = { ...mockContext, mode: 'non-functional' };
    const result = await checkDeliveryMode(context);
    
    expect(result.ok).toBe(true);
    expect(result.reason).toContain('Non-functional mode with adequate problem analysis');
  });

  it('should fail for non-functional mode with insufficient content', async () => {
    // Create TASK.json with non-functional mode
    writeFileSync('tasks/TASK.json', JSON.stringify({
      mode: 'non-functional',
      updatedAt: '2025-01-18T00:00:00Z',
      source: 'test',
      note: 'test'
    }));

    // Create PROBLEM_ANALYSIS.md with insufficient content
    writeFileSync('tasks/PROBLEM_ANALYSIS.md', `# Problem Analysis

## Analyze
Issue.

## Identify Root Cause
Cause.

## Fix Directly
Fix.

## Validate
Test.`);

    const context = { ...mockContext, mode: 'non-functional' };
    const result = await checkDeliveryMode(context);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Insufficient content length');
  });
});
