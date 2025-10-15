import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateOpenApiSpec, 
  testStripeWebhookSignature, 
  testTwilioWebhookSignature,
  runWebhookTests,
  type LintResult,
  type WebhookTestResult
} from '../../checks/contractsUtils.js';
import type { ProveContext } from '../../context.js';

// Mock the exec utility
vi.mock('../../utils/exec.js', () => ({
  exec: vi.fn()
}));

const mockContext: ProveContext = {
  cfg: {
    thresholds: {
      diffCoverageFunctional: 85,
      diffCoverageFunctionalRefactor: 60,
      globalCoverage: 80,
      maxWarnings: 0,
      maxCommitSize: 300,
    },
    toggles: {
      coverage: true,
      diffCoverage: true,
      sizeBudget: false,
      security: false,
      contracts: true,
      dbMigrations: false,
    },
    checkTimeouts: {
      tests: 120000,
      typecheck: 120000,
      lint: 60000,
      build: 300000,
      security: 300000,
      contracts: 30000,
      dbMigrations: 120000,
    },
  },
  git: {
    currentBranch: 'main',
    isMainBranch: true,
    changedFiles: [],
    hasUncommittedChanges: false,
    baseRef: 'origin/main',
    prLabels: [],
    prTitle: '',
  },
  env: process.env,
  isCI: false,
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as any,
  mode: 'functional',
  startTime: Date.now(),
  workingDirectory: process.cwd(),
  taskJson: undefined,
};

describe('contractsUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateOpenApiSpec', () => {
    it('should pass when redocly lint succeeds', async () => {
      const { exec } = await import('../../utils/exec.js');
      (exec as any).mockResolvedValue({
        code: 0,
        stdout: 'No errors found',
        stderr: ''
      });

      const result = await validateOpenApiSpec('api-spec.yaml', mockContext);
      
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('OpenAPI specification validation passed');
      expect(exec).toHaveBeenCalledWith('npx', ['redocly', 'lint', 'api-spec.yaml'], {
        timeout: 30000,
        cwd: process.cwd(),
      });
    });

    it('should fail when redocly lint fails', async () => {
      const { exec } = await import('../../utils/exec.js');
      (exec as any).mockResolvedValue({
        code: 1,
        stdout: 'Error: Invalid OpenAPI spec',
        stderr: 'Validation failed'
      });

      const result = await validateOpenApiSpec('api-spec.yaml', mockContext);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('OpenAPI specification validation failed');
      expect(result.details).toContain('redocly lint failed:');
    });

    it('should handle exec errors', async () => {
      const { exec } = await import('../../utils/exec.js');
      (exec as any).mockRejectedValue(new Error('Command not found'));

      const result = await validateOpenApiSpec('api-spec.yaml', mockContext);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('OpenAPI specification validation failed with error');
      expect(result.details).toContain('Error: Command not found');
    });
  });

  describe('testStripeWebhookSignature', () => {
    it('should pass when Stripe tests succeed', async () => {
      const { exec } = await import('../../utils/exec.js');
      (exec as any).mockResolvedValue({
        code: 0,
        stdout: '✓ Stripe webhook tests passed',
        stderr: ''
      });

      const result = await testStripeWebhookSignature(mockContext);
      
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('Stripe webhook signature tests passed');
      expect(exec).toHaveBeenCalledWith('npm', ['run', 'test', '--', 'backend/src/__tests__/api/webhooks/stripe.test.ts'], {
        timeout: 30000,
        cwd: process.cwd(),
      });
    });

    it('should fail when Stripe tests fail', async () => {
      const { exec } = await import('../../utils/exec.js');
      (exec as any).mockResolvedValue({
        code: 1,
        stdout: '✗ Stripe webhook tests failed',
        stderr: 'AssertionError: Expected signature to be valid'
      });

      const result = await testStripeWebhookSignature(mockContext);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('Stripe webhook signature tests failed');
      expect(result.details).toContain('Test output:');
    });

    it('should handle exec errors', async () => {
      const { exec } = await import('../../utils/exec.js');
      (exec as any).mockRejectedValue(new Error('Test command failed'));

      const result = await testStripeWebhookSignature(mockContext);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('Stripe webhook signature test execution failed');
      expect(result.details).toContain('Error: Test command failed');
    });
  });

  describe('testTwilioWebhookSignature', () => {
    it('should skip Twilio tests (not implemented)', async () => {
      const result = await testTwilioWebhookSignature(mockContext);
      
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('Twilio webhook tests not implemented (skipped)');
    });
  });

  describe('runWebhookTests', () => {
    it('should pass when all webhook tests pass', async () => {
      const { exec } = await import('../../utils/exec.js');
      (exec as any).mockResolvedValue({
        code: 0,
        stdout: '✓ Stripe webhook tests passed',
        stderr: ''
      });

      const result = await runWebhookTests(mockContext);
      
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('Webhook signature tests passed');
    });

    it('should fail when Stripe tests fail', async () => {
      const { exec } = await import('../../utils/exec.js');
      (exec as any).mockResolvedValue({
        code: 1,
        stdout: '✗ Stripe webhook tests failed',
        stderr: 'Test failure'
      });

      const result = await runWebhookTests(mockContext);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('Stripe webhook signature tests failed');
    });

    it('should handle errors during webhook tests', async () => {
      const { exec } = await import('../../utils/exec.js');
      (exec as any).mockRejectedValue(new Error('Webhook test error'));

      const result = await runWebhookTests(mockContext);
      
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('Stripe webhook signature test execution failed');
      expect(result.details).toContain('Error: Webhook test error');
    });
  });
});
