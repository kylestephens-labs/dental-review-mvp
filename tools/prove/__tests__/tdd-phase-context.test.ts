import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { buildContext } from '../context.js';

describe('TDD Phase Context Integration', () => {
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

  describe('TDD Phase Detection', () => {
    it('should detect red phase from .tdd-phase file', async () => {
      const phaseData = {
        phase: 'red',
        timestamp: Date.now(),
        commitHash: 'abc123'
      };
      writeFileSync(tddPhaseFile, JSON.stringify(phaseData));

      const context = await buildContext();
      
      expect(context.tddPhase).toBe('red');
      expect(context.tddPhaseTimestamp).toBe(phaseData.timestamp);
    });

    it('should detect green phase from .tdd-phase file', async () => {
      const phaseData = {
        phase: 'green',
        timestamp: Date.now(),
        commitHash: 'def456'
      };
      writeFileSync(tddPhaseFile, JSON.stringify(phaseData));

      const context = await buildContext();
      
      expect(context.tddPhase).toBe('green');
      expect(context.tddPhaseTimestamp).toBe(phaseData.timestamp);
    });

    it('should detect refactor phase from .tdd-phase file', async () => {
      const phaseData = {
        phase: 'refactor',
        timestamp: Date.now(),
        commitHash: 'ghi789'
      };
      writeFileSync(tddPhaseFile, JSON.stringify(phaseData));

      const context = await buildContext();
      
      expect(context.tddPhase).toBe('refactor');
      expect(context.tddPhaseTimestamp).toBe(phaseData.timestamp);
    });

    it('should return undefined when no TDD phase file exists', async () => {
      const context = await buildContext();
      
      expect(context.tddPhase).toBeUndefined();
      expect(context.tddPhaseTimestamp).toBeUndefined();
    });

    it('should handle invalid TDD phase file gracefully', async () => {
      writeFileSync(tddPhaseFile, 'invalid json');

      const context = await buildContext();
      
      expect(context.tddPhase).toBeUndefined();
      expect(context.tddPhaseTimestamp).toBeUndefined();
    });
  });

  describe('TDD Phase Validation', () => {
    it('should validate red phase', async () => {
      const phaseData = {
        phase: 'red',
        timestamp: Date.now(),
        commitHash: 'abc123'
      };
      writeFileSync(tddPhaseFile, JSON.stringify(phaseData));

      const context = await buildContext();
      
      expect(context.tddPhase).toBe('red');
      expect(['red', 'green', 'refactor']).toContain(context.tddPhase);
    });

    it('should validate green phase', async () => {
      const phaseData = {
        phase: 'green',
        timestamp: Date.now(),
        commitHash: 'def456'
      };
      writeFileSync(tddPhaseFile, JSON.stringify(phaseData));

      const context = await buildContext();
      
      expect(context.tddPhase).toBe('green');
      expect(['red', 'green', 'refactor']).toContain(context.tddPhase);
    });

    it('should validate refactor phase', async () => {
      const phaseData = {
        phase: 'refactor',
        timestamp: Date.now(),
        commitHash: 'ghi789'
      };
      writeFileSync(tddPhaseFile, JSON.stringify(phaseData));

      const context = await buildContext();
      
      expect(context.tddPhase).toBe('refactor');
      expect(['red', 'green', 'refactor']).toContain(context.tddPhase);
    });

    it('should handle invalid phase gracefully', async () => {
      const phaseData = {
        phase: 'invalid',
        timestamp: Date.now(),
        commitHash: 'jkl012'
      };
      writeFileSync(tddPhaseFile, JSON.stringify(phaseData));

      const context = await buildContext();
      
      expect(context.tddPhase).toBeUndefined();
    });
  });
});

