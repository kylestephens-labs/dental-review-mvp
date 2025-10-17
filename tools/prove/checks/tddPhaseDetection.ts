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

export async function checkTddPhaseDetection(context: ProveContext): Promise<TddPhaseDetectionResult> {
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
    
    const result: TddPhaseDetectionResult = {
      phase,
      sources,
      confidence
    };
    
    logger.success('TDD phase detected', {
      phase,
      sources,
      confidence
    });
    
    return result;
    
  } catch (error) {
    logger.error('TDD phase detection failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      phase: 'unknown',
      sources: [],
      confidence: 'low'
    };
  }
}
