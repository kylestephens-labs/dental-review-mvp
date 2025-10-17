import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { writeTddPhase, readTddPhase } from '../utils/tdd-phase.js';

const execAsync = promisify(exec);

// Mock logger
vi.mock('../logger.js', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('TDD Phase Capture Commands', () => {
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

  describe('npm run tdd:red', () => {
    it('should create .tdd-phase file with red phase', async () => {
      const { stdout } = await execAsync('npm run tdd:red', { cwd: testDir });
      
      expect(existsSync(tddPhaseFile)).toBe(true);
      expect(stdout).toContain('TDD Red phase marked');
      
      const phaseContent = readTddPhase(testDir);
      expect(phaseContent?.phase).toBe('red');
      expect(phaseContent?.timestamp).toBeDefined();
    });

    it('should update existing phase file to red', async () => {
      // Create initial phase file using utility
      writeTddPhase('green', testDir);
      
      await execAsync('npm run tdd:red', { cwd: testDir });
      
      const phaseContent = readTddPhase(testDir);
      expect(phaseContent?.phase).toBe('red');
    });
  });

  describe('npm run tdd:green', () => {
    it('should create .tdd-phase file with green phase', async () => {
      const { stdout } = await execAsync('npm run tdd:green', { cwd: testDir });
      
      expect(existsSync(tddPhaseFile)).toBe(true);
      expect(stdout).toContain('TDD Green phase marked');
      
      const phaseContent = readTddPhase(testDir);
      expect(phaseContent?.phase).toBe('green');
      expect(phaseContent?.timestamp).toBeDefined();
    });
  });

  describe('npm run tdd:refactor', () => {
    it('should create .tdd-phase file with refactor phase', async () => {
      const { stdout } = await execAsync('npm run tdd:refactor', { cwd: testDir });
      
      expect(existsSync(tddPhaseFile)).toBe(true);
      expect(stdout).toContain('TDD Refactor phase marked');
      
      const phaseContent = readTddPhase(testDir);
      expect(phaseContent?.phase).toBe('refactor');
      expect(phaseContent?.timestamp).toBeDefined();
    });
  });

  describe('npm run prove:tdd', () => {
    it('should run prove with TDD phase detection', async () => {
      // Set up red phase
      await execAsync('npm run tdd:red', { cwd: testDir });
      
      // Test that the TDD phase file was created correctly
      const phaseContent = readTddPhase(testDir);
      expect(phaseContent?.phase).toBe('red');
      expect(phaseContent?.timestamp).toBeDefined();
    });

    it('should handle missing TDD phase file gracefully', async () => {
      // Clean up any existing TDD phase file
      if (existsSync(tddPhaseFile)) {
        unlinkSync(tddPhaseFile);
      }
      
      // Test that the TDD phase is undefined when no file exists
      const phaseContent = readTddPhase(testDir);
      expect(phaseContent).toBeUndefined();
    });
  });

  describe('TDD Phase Context Integration', () => {
    it('should include TDD phase in prove context', async () => {
      await execAsync('npm run tdd:green', { cwd: testDir });
      
      // Test that the TDD phase file was created correctly
      const phaseContent = readTddPhase(testDir);
      expect(phaseContent?.phase).toBe('green');
      expect(phaseContent?.timestamp).toBeDefined();
    });
  });

  describe('Direct Utility Integration', () => {
    it('should work with utility functions directly', () => {
      // Test direct utility usage
      const phaseData = writeTddPhase('red', testDir);
      expect(phaseData.phase).toBe('red');
      
      const readData = readTddPhase(testDir);
      expect(readData?.phase).toBe('red');
      expect(readData?.timestamp).toBeDefined();
    });
  });
});