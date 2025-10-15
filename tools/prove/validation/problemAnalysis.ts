import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ProblemAnalysisResult {
  ok: boolean;
  reason?: string;
  details?: string;
}

/**
 * Read and validate problem analysis content
 */
export function readProblemAnalysis(): ProblemAnalysisResult {
  const problemAnalysisPath = 'tasks/PROBLEM_ANALYSIS.md';

  if (!existsSync(problemAnalysisPath)) {
    return {
      ok: false,
      reason: 'Problem analysis file not found',
      details: `Expected file at: ${problemAnalysisPath}`
    };
  }

  try {
    const content = readFileSync(problemAnalysisPath, 'utf8');
    return validateSections(content);
  } catch (error) {
    return {
      ok: false,
      reason: 'Failed to read problem analysis file',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validate that problem analysis has required sections and real content
 */
export function validateSections(content: string): ProblemAnalysisResult {
  const requiredSections = [
    '## Analyze',
    '## Identify Root Cause', 
    '## Fix Directly',
    '## Validate'
  ];

  // Check for required sections
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      return {
        ok: false,
        reason: `Missing required section: ${section}`,
        details: 'Non-functional tasks require all four analysis sections'
      };
    }
  }

  // Check for placeholder content that should be replaced
  const hasPlaceholders = content.includes('[REPLACE:') || 
                         content.includes('Test problem description') ||
                         content.includes('Test root cause analysis') ||
                         content.includes('Test fix description') ||
                         content.includes('Test validation steps');
  
  if (hasPlaceholders) {
    return {
      ok: false,
      reason: 'Problem analysis contains placeholder content',
      details: 'Non-functional tasks require actual problem analysis. Replace all [REPLACE: ...] placeholders and test content with real analysis.'
    };
  }

  // Check minimum content length (200 chars trimmed)
  const trimmedContent = content.trim();
  if (trimmedContent.length < 200) {
    return {
      ok: false,
      reason: `Insufficient content length: ${trimmedContent.length} chars (minimum 200)`,
      details: 'Non-functional tasks require substantial analysis documentation (≥200 characters)'
    };
  }

  return { ok: true };
}
