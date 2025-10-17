// TDD Process Sequence Validation
// Ensures proper Red → Green → Refactor order is followed in TDD

import { ProveContext } from '../context.js';
import { logger } from '../logger.js';
import { getTestEvidenceHistory } from '../utils/testEvidence.js';

export interface TddProcessSequenceResult {
  ok: boolean;
  id: string;
  ms: number;
  reason?: string;
  details?: {
    sequenceValidation?: any;
    phaseHistory?: any;
    violations?: any;
  };
}

/**
 * Validate that the TDD process sequence is properly followed
 * TDD process requirements:
 * 1. Red → Green → Refactor order must be maintained
 * 2. No phases should be skipped
 * 3. Each phase should have proper evidence
 */
export async function checkTddProcessSequence(context: ProveContext): Promise<TddProcessSequenceResult> {
  const startTime = Date.now();
  
  logger.info('Starting TDD Process sequence validation', {
    tddPhase: context.tddPhase,
    mode: context.mode,
    changedFilesCount: context.git.changedFiles.length
  });

  // Only run Process Sequence validation for functional tasks
  if (context.mode !== 'functional') {
    const duration = Date.now() - startTime;
    return {
      ok: true,
      id: 'tdd-process-sequence',
      ms: duration,
      reason: 'Not a functional task - skipping TDD process sequence validation'
    };
  }

  try {
    // Load test evidence to analyze phase history
    logger.info('Loading test evidence for sequence analysis...');
    const testEvidence = await getTestEvidenceHistory();
    
    // Handle evidence reset scenario - if no evidence exists, allow Red phase to start
    if (testEvidence.length === 0 && context.tddPhase === 'red') {
      logger.info('No test evidence found - allowing Red phase to start fresh TDD cycle');
      const duration = Date.now() - startTime;
      return {
        ok: true,
        id: 'tdd-process-sequence',
        ms: duration,
        reason: 'Starting fresh TDD cycle - no previous evidence found',
        details: {
          sequenceValidation: { message: 'Fresh TDD cycle started' },
          phaseHistory: [],
          isFreshStart: true
        }
      };
    }
    
    // Analyze the TDD process sequence
    logger.info('Analyzing TDD process sequence...');
    const sequenceAnalysis = await analyzeTddSequence(context, testEvidence);
    
    if (!sequenceAnalysis.ok) {
      const duration = Date.now() - startTime;
      return {
        ok: false,
        id: 'tdd-process-sequence',
        ms: duration,
        reason: sequenceAnalysis.reason,
        details: {
          sequenceValidation: sequenceAnalysis.details,
          phaseHistory: sequenceAnalysis.phaseHistory,
          violations: sequenceAnalysis.violations
        }
      };
    }

    const duration = Date.now() - startTime;
    
    logger.success('TDD Process sequence validation passed', {
      duration,
      currentPhase: context.tddPhase,
      phaseHistory: sequenceAnalysis.phaseHistory
    });

    return {
      ok: true,
      id: 'tdd-process-sequence',
      ms: duration,
      reason: 'TDD Process sequence validation passed',
      details: {
        sequenceValidation: sequenceAnalysis.details,
        phaseHistory: sequenceAnalysis.phaseHistory
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('TDD Process sequence validation failed', {
      error: error instanceof Error ? error.message : String(error),
      duration
    });

    return {
      ok: false,
      id: 'tdd-process-sequence',
      ms: duration,
      reason: `TDD Process sequence validation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Analyze the TDD process sequence for violations
 */
async function analyzeTddSequence(context: ProveContext, testEvidence: any[]): Promise<{
  ok: boolean;
  reason?: string;
  details?: any;
  phaseHistory?: any;
  violations?: any;
}> {
  const currentPhase = context.tddPhase;
  const phaseHistory = extractPhaseHistory(testEvidence);
  
  logger.info('Analyzing TDD sequence', {
    currentPhase,
    phaseHistory: phaseHistory.map(p => p.phase),
    evidenceCount: testEvidence.length
  });

  // Check for basic sequence violations
  const violations = detectSequenceViolations(phaseHistory, currentPhase);
  
  if (violations.length > 0) {
    return {
      ok: false,
      reason: 'TDD process sequence violations detected',
      details: {
        message: 'TDD process must follow Red → Green → Refactor order',
        violations: violations
      },
      phaseHistory: phaseHistory,
      violations: violations
    };
  }

  // Check for proper phase transitions
  const transitionValidation = validatePhaseTransitions(phaseHistory, currentPhase);
  
  if (!transitionValidation.ok) {
    return {
      ok: false,
      reason: transitionValidation.reason,
      details: {
        message: transitionValidation.message,
        currentPhase,
        expectedPhase: transitionValidation.expectedPhase
      },
      phaseHistory: phaseHistory,
      violations: transitionValidation.violations
    };
  }

  return {
    ok: true,
    details: {
      message: 'TDD process sequence is valid',
      currentPhase,
      phaseHistory: phaseHistory.map(p => p.phase)
    },
    phaseHistory: phaseHistory
  };
}

/**
 * Extract phase history from test evidence
 */
function extractPhaseHistory(testEvidence: any[]): Array<{ phase: string; timestamp: number; evidence: any }> {
  return testEvidence
    .map(evidence => ({
      phase: evidence.phase || 'unknown',
      timestamp: evidence.timestamp || Date.now(),
      evidence: evidence
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Detect sequence violations in the TDD process
 */
function detectSequenceViolations(phaseHistory: Array<{ phase: string; timestamp: number }>, currentPhase: string): string[] {
  const violations: string[] = [];
  const phases = phaseHistory.map(p => p.phase);
  
  // Check for skipping phases
  if (currentPhase === 'refactor' && !phases.includes('red')) {
    violations.push('Cannot reach Refactor phase without completing Red phase');
  }
  
  if (currentPhase === 'refactor' && !phases.includes('green')) {
    violations.push('Cannot reach Refactor phase without completing Green phase');
  }
  
  if (currentPhase === 'green' && !phases.includes('red')) {
    violations.push('Cannot reach Green phase without completing Red phase');
  }
  
  // Check for going backwards in sequence
  const lastPhase = phases[phases.length - 1];
  if (lastPhase && currentPhase === 'red' && (lastPhase === 'green' || lastPhase === 'refactor')) {
    violations.push('Cannot go back to Red phase after completing Green or Refactor phase');
  }
  
  if (lastPhase && currentPhase === 'green' && lastPhase === 'refactor') {
    violations.push('Cannot go back to Green phase after completing Refactor phase');
  }
  
  return violations;
}

/**
 * Validate phase transitions are appropriate
 */
function validatePhaseTransitions(phaseHistory: Array<{ phase: string; timestamp: number }>, currentPhase: string): {
  ok: boolean;
  reason?: string;
  message?: string;
  expectedPhase?: string;
  violations?: string[];
} {
  const phases = phaseHistory.map(p => p.phase);
  const lastPhase = phases[phases.length - 1];
  
  // If this is the first phase, it should be Red
  if (phases.length === 0 && currentPhase !== 'red') {
    return {
      ok: false,
      reason: 'TDD process must start with Red phase',
      message: 'First phase in TDD process must be Red (write failing test)',
      expectedPhase: 'red',
      violations: [`Expected Red phase, got ${currentPhase}`]
    };
  }
  
  // Validate transitions based on current phase
  switch (currentPhase) {
    case 'red':
      // Red can only be the first phase or after a complete cycle
      if (lastPhase && lastPhase !== 'refactor') {
        return {
          ok: false,
          reason: 'Invalid transition to Red phase',
          message: 'Red phase can only be the first phase or after completing a Refactor phase',
          expectedPhase: lastPhase === 'green' ? 'refactor' : 'green',
          violations: [`Cannot transition from ${lastPhase} to Red phase`]
        };
      }
      break;
      
    case 'green':
      // Green can only come after Red
      if (lastPhase && lastPhase !== 'red') {
        return {
          ok: false,
          reason: 'Invalid transition to Green phase',
          message: 'Green phase can only come after Red phase',
          expectedPhase: 'red',
          violations: [`Cannot transition from ${lastPhase} to Green phase`]
        };
      }
      break;
      
    case 'refactor':
      // Refactor can only come after Green
      if (lastPhase && lastPhase !== 'green') {
        return {
          ok: false,
          reason: 'Invalid transition to Refactor phase',
          message: 'Refactor phase can only come after Green phase',
          expectedPhase: 'green',
          violations: [`Cannot transition from ${lastPhase} to Refactor phase`]
        };
      }
      break;
  }
  
  return { ok: true };
}
