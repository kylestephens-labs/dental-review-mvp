// TDD Red Phase: One failing test for TDD Error Handling and Edge Cases
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { buildContext } from '../context.js';
import { detectTddPhase } from '../utils/tddPhaseDetection.js';
import { writeTddPhase, readTddPhase, validateTddPhaseData } from '../utils/tdd-phase.js';
import { runChecks } from '../runner.js';

// Mock logger
vi.mock('../logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    header: vi.fn()
  }
}));

// Mock all check functions
vi.mock('../checks/tests.js', () => ({
  checkTests: vi.fn()
}));

vi.mock('../checks/diffCoverage.js', () => ({
  checkDiffCoverage: vi.fn()
}));

vi.mock('../checks/tddPhaseDetection.js', () => ({
  checkTddPhaseDetection: vi.fn()
}));

vi.mock('../checks/tddRedPhase.js', () => ({
  checkTddRedPhase: vi.fn()
}));

vi.mock('../checks/tddGreenPhase.js', () => ({
  checkTddGreenPhase: vi.fn()
}));

vi.mock('../checks/tddRefactorPhase.js', () => ({
  checkTddRefactorPhase: vi.fn()
}));

vi.mock('../checks/tddProcessSequence.js', () => ({
  checkTddProcessSequence: vi.fn()
}));

describe('TDD Error Handling and Edge Cases', () => {
  const testDir = process.cwd();
  const tddPhaseFile = join(testDir, '.tdd-phase');

  beforeEach(() => {
    // Clean up any existing TDD phase file
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
  });

  describe('File System Error Handling', () => {
    it('should handle read permission errors gracefully', async () => {
      // Create a file that can't be read
      writeFileSync(tddPhaseFile, '{"phase":"red","timestamp":1234567890}');
      
      // Mock fs.readFileSync to throw permission error
      const originalReadFileSync = require('fs').readFileSync;
      vi.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const result = readTddPhase(testDir);
      expect(result).toBeUndefined();

      // Restore original function
      vi.mocked(require('fs').readFileSync).mockRestore();
    });

    it('should handle write permission errors gracefully', () => {
      // Mock fs.writeFileSync to throw permission error
      const originalWriteFileSync = require('fs').writeFileSync;
      vi.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      expect(() => writeTddPhase('red', testDir)).toThrow('EACCES: permission denied');

      // Restore original function
      vi.mocked(require('fs').writeFileSync).mockRestore();
    });

    it('should handle disk space errors gracefully', () => {
      // Mock fs.writeFileSync to throw disk space error
      const originalWriteFileSync = require('fs').writeFileSync;
      vi.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {
        throw new Error('ENOSPC: no space left on device');
      });

      expect(() => writeTddPhase('red', testDir)).toThrow('ENOSPC: no space left on device');

      // Restore original function
      vi.mocked(require('fs').writeFileSync).mockRestore();
    });

    it('should handle corrupted TDD phase file gracefully', () => {
      // Write corrupted JSON
      writeFileSync(tddPhaseFile, '{"phase":"red","timestamp":1234567890'); // Missing closing brace
      
      const result = readTddPhase(testDir);
      expect(result).toBeUndefined();
    });

    it('should handle empty TDD phase file gracefully', () => {
      // Write empty file
      writeFileSync(tddPhaseFile, '');
      
      const result = readTddPhase(testDir);
      expect(result).toBeUndefined();
    });

    it('should handle TDD phase file with invalid JSON structure', () => {
      // Write invalid JSON structure
      writeFileSync(tddPhaseFile, '{"invalid": "structure"}');
      
      const result = readTddPhase(testDir);
      expect(result).toBeUndefined();
    });
  });

  describe('Data Validation Error Handling', () => {
    it('should handle invalid phase values', () => {
      const invalidData = {
        phase: 'invalid-phase',
        timestamp: Date.now()
      };

      const result = validateTddPhaseData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid phase value');
    });

    it('should handle missing required fields', () => {
      const incompleteData = {
        phase: 'red'
        // Missing timestamp
      };

      const result = validateTddPhaseData(incompleteData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing or invalid timestamp');
    });

    it('should handle non-object data', () => {
      const result = validateTddPhaseData('invalid string');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid data structure');
    });

    it('should handle null data', () => {
      const result = validateTddPhaseData(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid data structure');
    });

    it('should handle undefined data', () => {
      const result = validateTddPhaseData(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid data structure');
    });

    it('should handle invalid timestamp types', () => {
      const invalidTimestampData = {
        phase: 'red',
        timestamp: 'invalid-timestamp'
      };

      const result = validateTddPhaseData(invalidTimestampData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing or invalid timestamp');
    });

    it('should handle negative timestamps', () => {
      const negativeTimestampData = {
        phase: 'red',
        timestamp: -1234567890
      };

      const result = validateTddPhaseData(negativeTimestampData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing or invalid timestamp');
    });
  });

  describe('Phase Detection Error Handling', () => {
    it('should handle context with missing git information', async () => {
      const context = await buildContext();
      const incompleteContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: undefined
        }
      };

      const phase = await detectTddPhase(incompleteContext);
      expect(phase).toBe('unknown');
    });

    it('should handle context with null git information', async () => {
      const context = await buildContext();
      const nullGitContext = {
        ...context,
        git: null
      };

      const phase = await detectTddPhase(nullGitContext);
      expect(phase).toBe('unknown');
    });

    it('should handle context with missing test evidence', async () => {
      const context = await buildContext();
      const noEvidenceContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F]'
        },
        testEvidence: null
      };

      const phase = await detectTddPhase(noEvidenceContext);
      expect(phase).toBe('unknown');
    });

    it('should handle malformed commit messages', async () => {
      const context = await buildContext();
      const malformedContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:'
        }
      };

      const phase = await detectTddPhase(malformedContext);
      expect(phase).toBe('unknown');
    });

    it('should handle extremely long commit messages', async () => {
      const context = await buildContext();
      const longMessage = 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:red] ' + 'x'.repeat(100000);
      const longMessageContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: longMessage
        }
      };

      const phase = await detectTddPhase(longMessageContext);
      expect(phase).toBe('red');
    });

    it('should handle commit messages with special characters', async () => {
      const context = await buildContext();
      const specialCharContext = {
        ...context,
        git: {
          ...context.git,
          commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:red] 🚀✨🎉'
        }
      };

      const phase = await detectTddPhase(specialCharContext);
      expect(phase).toBe('red');
    });
  });

  describe('Check Execution Error Handling', () => {
    it('should handle check function throwing errors', async () => {
      const context = await buildContext();
      const redContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase check to throw error
      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockRejectedValue(new Error('Check execution failed'));

      const result = await runChecks(redContext);
      expect(result.ok).toBe(false);
    });

    it('should handle check function returning invalid results', async () => {
      const context = await buildContext();
      const redContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase check to return invalid result
      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockResolvedValue({
        // Missing required fields
        details: { message: 'Invalid result' }
      } as any);

      const result = await runChecks(redContext);
      expect(result.ok).toBe(false);
    });

    it('should handle timeout errors in check execution', async () => {
      const context = await buildContext();
      const redContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase check to timeout
      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await runChecks(redContext);
      expect(result.ok).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty changed files array', async () => {
      const context = await buildContext();
      const emptyFilesContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: [],
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase check to handle empty files
      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockResolvedValue({
        ok: false,
        id: 'tdd-red-phase',
        reason: 'Tests must be written first in Red phase'
      });

      const result = await runChecks(emptyFilesContext);
      expect(result.ok).toBe(false);
    });

    it('should handle very long file paths', async () => {
      const context = await buildContext();
      const longPathContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: [
            'src/components/patient/medical-history/forms/patient-information/contact-details/emergency-contact/phone-number/validation/phone-number-validator.test.tsx'
          ],
          commitMessage: 'feat: add phone number validator [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase check to pass
      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockResolvedValue({
        ok: true,
        id: 'tdd-red-phase',
        details: { message: 'Red phase validation passed' }
      });

      const { checkTests } = await import('../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue({
        ok: true,
        details: { testResults: { passed: 0, failed: 1, total: 1 } }
      });

      const result = await runChecks(longPathContext);
      expect(result.ok).toBe(true);
    });

    it('should handle files with special characters in names', async () => {
      const context = await buildContext();
      const specialCharContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: [
            'src/components/Button-Component.test.tsx',
            'src/components/Button_Component.test.tsx',
            'src/components/Button.Component.test.tsx'
          ],
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase check to pass
      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockResolvedValue({
        ok: true,
        id: 'tdd-red-phase',
        details: { message: 'Red phase validation passed' }
      });

      const { checkTests } = await import('../checks/tests.js');
      vi.mocked(checkTests).mockResolvedValue({
        ok: true,
        details: { testResults: { passed: 0, failed: 3, total: 3 } }
      });

      const result = await runChecks(specialCharContext);
      expect(result.ok).toBe(true);
    });

    it('should handle concurrent file operations', async () => {
      // Test concurrent write operations
      const promises = Array.from({ length: 10 }, (_, i) => 
        writeTddPhase('red', testDir)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every(result => result.phase === 'red')).toBe(true);
    });

    it('should handle rapid phase transitions', async () => {
      const phases = ['red', 'green', 'refactor'];
      
      for (let i = 0; i < phases.length; i++) {
        writeTddPhase(phases[i], testDir);
        const phaseData = readTddPhase(testDir);
        expect(phaseData?.phase).toBe(phases[i]);
      }
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory during error conditions', async () => {
      const context = await buildContext();
      const errorContext = {
        ...context,
        tddPhase: 'red',
        git: {
          ...context.git,
          changedFiles: ['src/components/Button.tsx', 'src/components/Button.test.tsx'],
          commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
        }
      };

      // Mock Red phase check to throw error
      const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
      vi.mocked(checkTddRedPhase).mockRejectedValue(new Error('Memory leak test'));

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Run multiple error conditions
      for (let i = 0; i < 100; i++) {
        await runChecks(errorContext);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
