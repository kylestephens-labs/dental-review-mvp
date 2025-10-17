// TDD Phase Detection Check
// This will be integrated with the prove runner

import { ProveContext } from '../context.js';
import { detectTddPhase } from '../utils/tddPhaseDetection.js';
import { logger } from '../logger.js';

export interface TddPhaseDetectionResult {
  phase: 'red' | 'green' | 'refactor' | 'unknown';
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface CheckResult {
  ok: boolean;
  reason: string;
  ms: number;
  phase?: 'red' | 'green' | 'refactor' | 'unknown';
  sources?: string[];
  confidence?: 'high' | 'medium' | 'low';
}

export async function checkTddPhaseDetection(context: ProveContext): Promise<CheckResult> {
  const startTime = Date.now();
  
  logger.info('Starting TDD phase detection', {
    commitMessage: context.git.commitMessage,
    testEvidenceCount: context.testEvidence?.length || 0,
    changedFilesCount: context.git.changedFiles.length
  });

  try {
    const phase = await detectTddPhase(context);
    
    // Determine sources and confidence
    const sources: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    // Check which sources contributed to the detection
    const commitPhase = context.git.commitMessage.match(/\[TDD:(red|green|refactor)\]/);
    if (commitPhase) {
      sources.push('commit_message');
      confidence = 'high';
    }
    
    if (context.testEvidence && context.testEvidence.length > 0) {
      sources.push('test_evidence');
      if (confidence === 'low') confidence = 'medium';
    }
    
    const hasNonTestFiles = context.git.changedFiles.some(file => 
      !file.includes('.test.') && !file.includes('.spec.') && 
      !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')
    );
    if (hasNonTestFiles) {
      sources.push('refactoring_evidence');
      if (confidence === 'low') confidence = 'medium';
    }
    
    const duration = Date.now() - startTime;
    
    logger.success('TDD phase detected', {
      phase,
      sources,
      confidence,
      duration
    });
    
    return {
      ok: true,
      reason: `TDD phase detected: ${phase} (${sources.join(', ')})`,
      ms: duration,
      phase,
      sources,
      confidence
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('TDD phase detection failed', {
      error: error instanceof Error ? error.message : String(error),
      duration
    });
    
    return {
      ok: false,
      reason: `TDD phase detection failed: ${error instanceof Error ? error.message : String(error)}`,
      ms: duration,
      phase: 'unknown',
      sources: [],
      confidence: 'low'
    };
  }
}
