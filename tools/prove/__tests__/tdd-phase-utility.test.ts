import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  writeTddPhase,
  readTddPhase,
  deleteTddPhase,
  validateTddPhaseData,
  getTddPhaseMessage,
  formatTddPhaseDisplay,
  getTddPhaseFilePath,
  type TddPhase,
  type TddPhaseData
} from '../utils/tdd-phase.js';

// Mock child_process
vi.mock('child_process', () => ({
  default: {
    execSync: vi.fn(() => 'abc123def456')
  },
  execSync: vi.fn(() => 'abc123def456')
}));

// Mock logger
vi.mock('../logger.js', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('TDD Phase Utility', () => {
  const testDir = process.cwd();
  const tddPhaseFile = join(testDir, '.tdd-phase');

  beforeEach(() => {
    // Clean up any existing TDD phase file
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
    }
  });

  describe('getTddPhaseFilePath', () => {
    it('should return correct file path', () => {
      const path = getTddPhaseFilePath();
      expect(path).toBe(join(process.cwd(), '.tdd-phase'));
    });

    it('should return correct file path for custom directory', () => {
      const customDir = '/custom/path';
      const path = getTddPhaseFilePath(customDir);
      expect(path).toBe(join(customDir, '.tdd-phase'));
    });
  });

  describe('validateTddPhaseData', () => {
    it('should validate correct TDD phase data', () => {
      const validData = {
        phase: 'red',
        timestamp: Date.now(),
        commitHash: 'abc123'
      };

      const result = validateTddPhaseData(validData);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid phase', () => {
      const invalidData = {
        phase: 'invalid',
        timestamp: Date.now()
      };

      const result = validateTddPhaseData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid phase value');
    });

    it('should reject missing timestamp', () => {
      const invalidData = {
        phase: 'red'
      };

      const result = validateTddPhaseData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing or invalid timestamp');
    });

    it('should reject non-object data', () => {
      const result = validateTddPhaseData('invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid data structure');
    });
  });

  describe('writeTddPhase', () => {
    it('should write TDD phase data to file', () => {
      const phaseData = writeTddPhase('red');
      
      expect(existsSync(tddPhaseFile)).toBe(true);
      expect(phaseData.phase).toBe('red');
      expect(phaseData.timestamp).toBeDefined();
      expect(phaseData.commitHash).toBe('abc123def456');
    });

    it('should write different phases correctly', () => {
      const phases: TddPhase[] = ['red', 'green', 'refactor'];
      
      phases.forEach(phase => {
        const phaseData = writeTddPhase(phase);
        expect(phaseData.phase).toBe(phase);
      });
    });

    // TODO: Test error handling when mocking is more stable
    // it('should handle file write errors', () => {
    //   // This test requires complex mocking that may not work in all environments
    // });
  });

  describe('readTddPhase', () => {
    it('should read TDD phase data from file', () => {
      const testData: TddPhaseData = {
        phase: 'green',
        timestamp: Date.now(),
        commitHash: 'def456ghi789'
      };

      writeFileSync(tddPhaseFile, JSON.stringify(testData, null, 2));
      
      const result = readTddPhase();
      expect(result).toEqual(testData);
    });

    it('should return undefined if file does not exist', () => {
      const result = readTddPhase();
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid JSON', () => {
      writeFileSync(tddPhaseFile, 'invalid json');
      
      const result = readTddPhase();
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid data structure', () => {
      writeFileSync(tddPhaseFile, JSON.stringify({ invalid: 'data' }));
      
      const result = readTddPhase();
      expect(result).toBeUndefined();
    });
  });

  describe('deleteTddPhase', () => {
    it('should delete TDD phase file', () => {
      writeTddPhase('red');
      expect(existsSync(tddPhaseFile)).toBe(true);
      
      const result = deleteTddPhase();
      expect(result).toBe(true);
      expect(existsSync(tddPhaseFile)).toBe(false);
    });

    it('should return false if file does not exist', () => {
      const result = deleteTddPhase();
      expect(result).toBe(false);
    });
  });

  describe('getTddPhaseMessage', () => {
    it('should return correct messages for each phase', () => {
      const messages = {
        red: 'TDD Red phase marked - Write failing tests before implementation',
        green: 'TDD Green phase marked - Make tests pass with minimal implementation',
        refactor: 'TDD Refactor phase marked - Improve code quality while preserving behavior'
      };

      Object.entries(messages).forEach(([phase, expectedMessage]) => {
        expect(getTddPhaseMessage(phase as TddPhase)).toBe(expectedMessage);
      });
    });
  });

  describe('formatTddPhaseDisplay', () => {
    it('should format TDD phase data for display', () => {
      const phaseData: TddPhaseData = {
        phase: 'refactor',
        timestamp: 1640995200000, // 2022-01-01T00:00:00.000Z
        commitHash: 'abc123def456'
      };

      const result = formatTddPhaseDisplay(phaseData);
      expect(result).toContain('Current TDD phase: refactor');
      expect(result).toContain('Timestamp: 2022-01-01T00:00:00.000Z');
      expect(result).toContain('Commit: abc123def456');
    });

    it('should format TDD phase data without commit hash', () => {
      const phaseData: TddPhaseData = {
        phase: 'red',
        timestamp: 1640995200000
      };

      const result = formatTddPhaseDisplay(phaseData);
      expect(result).toContain('Current TDD phase: red');
      expect(result).toContain('Timestamp: 2022-01-01T00:00:00.000Z');
      expect(result).not.toContain('Commit:');
    });
  });
});
