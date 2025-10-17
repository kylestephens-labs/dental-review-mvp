import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * TDD Phase types
 */
export type TddPhase = 'red' | 'green' | 'refactor';

/**
 * TDD Phase data structure
 */
export interface TddPhaseData {
  phase: TddPhase;
  timestamp: number;
  commitHash?: string;
}

/**
 * TDD Phase validation result
 */
export interface TddPhaseValidationResult {
  isValid: boolean;
  data?: TddPhaseData;
  error?: string;
}

/**
 * TDD Phase file path resolver
 */
export function getTddPhaseFilePath(workingDirectory: string = process.cwd()): string {
  return join(workingDirectory, '.tdd-phase');
}

/**
 * Validate TDD phase data structure
 */
export function validateTddPhaseData(data: unknown): TddPhaseValidationResult {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid data structure' };
  }

  const phaseData = data as Record<string, unknown>;

  // Validate phase
  if (!phaseData.phase || typeof phaseData.phase !== 'string') {
    return { isValid: false, error: 'Missing or invalid phase' };
  }

  if (!['red', 'green', 'refactor'].includes(phaseData.phase)) {
    return { isValid: false, error: 'Invalid phase value' };
  }

  // Validate timestamp
  if (!phaseData.timestamp || typeof phaseData.timestamp !== 'number') {
    return { isValid: false, error: 'Missing or invalid timestamp' };
  }

  // Validate commitHash if present
  if (phaseData.commitHash && typeof phaseData.commitHash !== 'string') {
    return { isValid: false, error: 'Invalid commitHash' };
  }

  return {
    isValid: true,
    data: {
      phase: phaseData.phase as TddPhase,
      timestamp: phaseData.timestamp,
      commitHash: phaseData.commitHash as string | undefined
    }
  };
}

/**
 * Get current Git commit hash
 */
function getCurrentCommitHash(): string | undefined {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    // Silently fail in test environments
    return undefined;
  }
}

/**
 * Read TDD phase from file
 */
export function readTddPhase(workingDirectory: string = process.cwd()): TddPhaseData | undefined {
  const tddPhaseFile = getTddPhaseFilePath(workingDirectory);

  if (!existsSync(tddPhaseFile)) {
    return undefined;
  }

  try {
    const content = readFileSync(tddPhaseFile, 'utf-8');
    const rawData = JSON.parse(content);
    
    const validation = validateTddPhaseData(rawData);
    if (!validation.isValid) {
      // Silently fail for invalid data
      return undefined;
    }

    return validation.data;
  } catch (error) {
    // Silently fail for file read errors
    return undefined;
  }
}

/**
 * Write TDD phase to file
 */
export function writeTddPhase(
  phase: TddPhase, 
  workingDirectory: string = process.cwd()
): TddPhaseData {
  const tddPhaseFile = getTddPhaseFilePath(workingDirectory);
  
  const phaseData: TddPhaseData = {
    phase,
    timestamp: Date.now(),
    commitHash: getCurrentCommitHash()
  };
  
  try {
    writeFileSync(tddPhaseFile, JSON.stringify(phaseData, null, 2));
    return phaseData;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete TDD phase file
 */
export function deleteTddPhase(workingDirectory: string = process.cwd()): boolean {
  const tddPhaseFile = getTddPhaseFilePath(workingDirectory);
  
  try {
    if (existsSync(tddPhaseFile)) {
      unlinkSync(tddPhaseFile);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get TDD phase messages for display
 */
export function getTddPhaseMessage(phase: TddPhase): string {
  const messages: Record<TddPhase, string> = {
    red: 'TDD Red phase marked - Write failing tests before implementation',
    green: 'TDD Green phase marked - Make tests pass with minimal implementation',
    refactor: 'TDD Refactor phase marked - Improve code quality while preserving behavior'
  };
  
  return messages[phase];
}

/**
 * Format TDD phase for display
 */
export function formatTddPhaseDisplay(phaseData: TddPhaseData): string {
  const lines = [
    `Current TDD phase: ${phaseData.phase}`,
    `Timestamp: ${new Date(phaseData.timestamp).toISOString()}`
  ];
  
  if (phaseData.commitHash) {
    lines.push(`Commit: ${phaseData.commitHash}`);
  }
  
  return lines.join('\n');
}
