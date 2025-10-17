// TDD Red Phase: One failing test for TDD Error Handling and Edge Cases
import { describe, it, expect, vi } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { buildContext } from '../context.js';
import { detectTddPhase } from '../utils/tddPhaseDetection.js';
import { writeTddPhase, readTddPhase, validateTddPhaseData } from '../utils/tdd-phase.js';
import { runChecks } from '../runner.js';
import { 
  createMockLogger, 
  setupTestEnvironment, 
  teardownTestEnvironment
} from './shared/test-helpers.js';

// Mock logger
vi.mock('../logger.js', () => ({
  logger: createMockLogger()
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
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('File System Error Handling', () => {
    const fileSystemErrorTestCases = [
      {
        name: 'should handle read permission errors gracefully',
        setup: () => {
          writeFileSync(tddPhaseFile, '{"phase":"red","timestamp":1234567890}');
          const originalReadFileSync = require('fs').readFileSync;
          vi.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
            throw new Error('EACCES: permission denied');
          });
          return () => vi.mocked(require('fs').readFileSync).mockRestore();
        },
        test: () => readTddPhase(testDir),
        expectedResult: undefined
      },
      {
        name: 'should handle write permission errors gracefully',
        setup: () => {
          const originalWriteFileSync = require('fs').writeFileSync;
          vi.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {
            throw new Error('EACCES: permission denied');
          });
          return () => vi.mocked(require('fs').writeFileSync).mockRestore();
        },
        test: () => writeTddPhase('red', testDir),
        shouldThrow: 'EACCES: permission denied'
      },
      {
        name: 'should handle disk space errors gracefully',
        setup: () => {
          const originalWriteFileSync = require('fs').writeFileSync;
          vi.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => {
            throw new Error('ENOSPC: no space left on device');
          });
          return () => vi.mocked(require('fs').writeFileSync).mockRestore();
        },
        test: () => writeTddPhase('red', testDir),
        shouldThrow: 'ENOSPC: no space left on device'
      }
    ];

    fileSystemErrorTestCases.forEach(({ name, setup, test, expectedResult, shouldThrow }) => {
      it(name, () => {
        const cleanup = setup();
        
        if (shouldThrow) {
          expect(() => test()).toThrow(shouldThrow);
        } else {
          const result = test();
          expect(result).toBe(expectedResult);
        }
        
        cleanup();
      });
    });

    const fileCorruptionTestCases = [
      {
        name: 'should handle corrupted TDD phase file gracefully',
        setup: () => {
          writeFileSync(tddPhaseFile, '{"phase":"red","timestamp":1234567890'); // Missing closing brace
        },
        test: () => readTddPhase(testDir),
        expectedResult: undefined
      },
      {
        name: 'should handle empty TDD phase file gracefully',
        setup: () => {
          writeFileSync(tddPhaseFile, '');
        },
        test: () => readTddPhase(testDir),
        expectedResult: undefined
      },
      {
        name: 'should handle TDD phase file with invalid JSON structure',
        setup: () => {
          writeFileSync(tddPhaseFile, '{"invalid": "structure"}');
        },
        test: () => readTddPhase(testDir),
        expectedResult: undefined
      }
    ];

    fileCorruptionTestCases.forEach(({ name, setup, test, expectedResult }) => {
      it(name, () => {
        setup();
        const result = test();
        expect(result).toBe(expectedResult);
      });
    });
  });

  describe('Data Validation Error Handling', () => {
    const dataValidationTestCases = [
      {
        name: 'should handle invalid phase values',
        data: { phase: 'invalid-phase', timestamp: Date.now() },
        expectedError: 'Invalid phase value'
      },
      {
        name: 'should handle missing required fields',
        data: { phase: 'red' }, // Missing timestamp
        expectedError: 'Missing or invalid timestamp'
      },
      {
        name: 'should handle non-object data',
        data: 'invalid string',
        expectedError: 'Invalid data structure'
      },
      {
        name: 'should handle null data',
        data: null,
        expectedError: 'Invalid data structure'
      },
      {
        name: 'should handle undefined data',
        data: undefined,
        expectedError: 'Invalid data structure'
      },
      {
        name: 'should handle invalid timestamp types',
        data: { phase: 'red', timestamp: 'invalid-timestamp' },
        expectedError: 'Missing or invalid timestamp'
      },
      {
        name: 'should handle negative timestamps',
        data: { phase: 'red', timestamp: -1234567890 },
        expectedError: 'Missing or invalid timestamp'
      }
    ];

    dataValidationTestCases.forEach(({ name, data, expectedError }) => {
      it(name, () => {
        const result = validateTddPhaseData(data);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });
  });

  describe('Phase Detection Error Handling', () => {
    const phaseDetectionErrorTestCases = [
      {
        name: 'should handle context with missing git information',
        contextModifier: (context: any) => ({
          ...context,
          git: { ...context.git, commitMessage: undefined }
        }),
        expectedPhase: 'unknown'
      },
      {
        name: 'should handle context with null git information',
        contextModifier: (context: any) => ({ ...context, git: null }),
        expectedPhase: 'unknown'
      },
      {
        name: 'should handle context with missing test evidence',
        contextModifier: (context: any) => ({
          ...context,
          git: { ...context.git, commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F]' },
          testEvidence: null
        }),
        expectedPhase: 'unknown'
      },
      {
        name: 'should handle malformed commit messages',
        contextModifier: (context: any) => ({
          ...context,
          git: { ...context.git, commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:' }
        }),
        expectedPhase: 'unknown'
      },
      {
        name: 'should handle extremely long commit messages',
        contextModifier: (context: any) => ({
          ...context,
          git: {
            ...context.git,
            commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:red] ' + 'x'.repeat(100000)
          }
        }),
        expectedPhase: 'red'
      },
      {
        name: 'should handle commit messages with special characters',
        contextModifier: (context: any) => ({
          ...context,
          git: {
            ...context.git,
            commitMessage: 'feat: add feature [T-2025-01-18-001] [MODE:F] [TDD:red] 🚀✨🎉'
          }
        }),
        expectedPhase: 'red'
      }
    ];

    phaseDetectionErrorTestCases.forEach(({ name, contextModifier, expectedPhase }) => {
      it(name, async () => {
        const context = await buildContext();
        const testContext = contextModifier(context);
        const phase = await detectTddPhase(testContext);
        expect(phase).toBe(expectedPhase);
      });
    });
  });

  describe('Check Execution Error Handling', () => {
    const checkExecutionErrorTestCases = [
      {
        name: 'should handle check function throwing errors',
        mockSetup: async () => {
          const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
          vi.mocked(checkTddRedPhase).mockRejectedValue(new Error('Check execution failed'));
        }
      },
      {
        name: 'should handle check function returning invalid results',
        mockSetup: async () => {
          const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
          vi.mocked(checkTddRedPhase).mockResolvedValue({
            // Missing required fields
            details: { message: 'Invalid result' }
          } as any);
        }
      },
      {
        name: 'should handle timeout errors in check execution',
        mockSetup: async () => {
          const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
          vi.mocked(checkTddRedPhase).mockImplementation(() => 
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 100)
            )
          );
        }
      }
    ];

    checkExecutionErrorTestCases.forEach(({ name, mockSetup }) => {
      it(name, async () => {
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

        await mockSetup();
        const result = await runChecks(redContext);
        expect(result.ok).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    const edgeCaseTestCases = [
      {
        name: 'should handle empty changed files array',
        contextModifier: (context: any) => ({
          ...context,
          tddPhase: 'red',
          git: {
            ...context.git,
            changedFiles: [],
            commitMessage: 'feat: add button component [T-2025-01-18-001] [MODE:F] [TDD:red]'
          }
        }),
        mockSetup: async () => {
          const { checkTddRedPhase } = await import('../checks/tddRedPhase.js');
          vi.mocked(checkTddRedPhase).mockResolvedValue({
            ok: false,
            id: 'tdd-red-phase',
            reason: 'Tests must be written first in Red phase'
          });
        },
        expectedResult: false
      },
      {
        name: 'should handle very long file paths',
        contextModifier: (context: any) => ({
          ...context,
          tddPhase: 'red',
          git: {
            ...context.git,
            changedFiles: [
              'src/components/patient/medical-history/forms/patient-information/contact-details/emergency-contact/phone-number/validation/phone-number-validator.test.tsx'
            ],
            commitMessage: 'feat: add phone number validator [T-2025-01-18-001] [MODE:F] [TDD:red]'
          }
        }),
        mockSetup: async () => {
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
        },
        expectedResult: true
      },
      {
        name: 'should handle files with special characters in names',
        contextModifier: (context: any) => ({
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
        }),
        mockSetup: async () => {
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
        },
        expectedResult: true
      }
    ];

    edgeCaseTestCases.forEach(({ name, contextModifier, mockSetup, expectedResult }) => {
      it(name, async () => {
        const context = await buildContext();
        const testContext = contextModifier(context);
        await mockSetup();
        const result = await runChecks(testContext);
        expect(result.ok).toBe(expectedResult);
      });
    });

    it('should handle concurrent file operations', async () => {
      const promises = Array.from({ length: 10 }, () => writeTddPhase('red', testDir));
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every(result => result.phase === 'red')).toBe(true);
    });

    it('should handle rapid phase transitions', async () => {
      const phases = ['red', 'green', 'refactor'];
      
      for (const phase of phases) {
        writeTddPhase(phase, testDir);
        const phaseData = readTddPhase(testDir);
        expect(phaseData?.phase).toBe(phase);
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
