// False positive analyzer for kill-switch pattern detection
// Analyzes and reduces false positives in feature flag pattern matching

import { logger } from '../../logger.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface FalsePositiveAnalysis {
  totalMatches: number;
  falsePositives: number;
  falsePositiveRate: number;
  truePositives: number;
  truePositiveRate: number;
  patterns: PatternAnalysis[];
  suggestions: string[];
  performance: {
    analysisDuration: number;
    filesAnalyzed: number;
    linesAnalyzed: number;
  };
}

export interface PatternAnalysis {
  pattern: string;
  matches: number;
  falsePositives: number;
  falsePositiveRate: number;
  commonFalsePositives: string[];
  suggestions: string[];
}

export interface FalsePositiveContext {
  filePath: string;
  lineNumber: number;
  content: string;
  pattern: string;
  reason: string;
  suggestion: string;
}

export class FalsePositiveAnalyzer {
  private static readonly FALSE_POSITIVE_INDICATORS = [
    // Comment patterns that should be ignored
    /^\s*\/\//,
    /^\s*\*/,
    /^\s*\/\*/,
    /^\s*#/,
    
    // Documentation patterns
    /Usage:/,
    /Example:/,
    /The ESLint rule/,
    /Each flag must have/,
    /The linter will enforce/,
    /TODO:/,
    /FIXME:/,
    /NOTE:/,
    
    // Test patterns that might be examples
    /test.*useFeatureFlag/,
    /spec.*useFeatureFlag/,
    /describe.*useFeatureFlag/,
    /it.*useFeatureFlag/,
    
    // String literals in comments or documentation
    /['"`].*useFeatureFlag.*['"`]/,
    /['"`].*isEnabled.*['"`]/,
    
    // Import statements that are just importing, not using
    /import.*useFeatureFlag.*from/,
    /import.*isEnabled.*from/,
    
    // Type definitions
    /type.*useFeatureFlag/,
    /interface.*useFeatureFlag/,
    /declare.*useFeatureFlag/,
    
    // Configuration files that might have examples
    /config.*example/,
    /config.*sample/,
    /config.*template/,
    
    // Error message files with example code
    /error-messages\.ts$/,
    /message\s*\+=\s*`/,
    /message\s*\+=\s*['"`]/,
    /Use\s+useFeatureFlag/,
    /Use\s+isEnabled/,
    /const\s+\{\s*isEnabled\s*\}\s*=\s*useFeatureFlag/,
    /if\s*\(\s*isEnabled\(/,
    /if\s*\(\s*isFeatureEnabled\(/,
    /const\s+enabled\s*=\s*isEnabled/,
    /const\s+enabled\s*=\s*isFeatureEnabled/
  ];

  private static readonly CONTEXT_PATTERNS = {
    // Patterns that indicate this is likely a real usage
    realUsage: [
      /if\s*\(\s*useFeatureFlag/,
      /if\s*\(\s*isEnabled/,
      /const\s+\w+\s*=\s*useFeatureFlag/,
      /const\s+\w+\s*=\s*isEnabled/,
      /return\s+useFeatureFlag/,
      /return\s+isEnabled/,
      /\w+\.\w+\s*=\s*useFeatureFlag/,
      /\w+\.\w+\s*=\s*isEnabled/
    ],
    
    // Patterns that indicate this is likely documentation/example
    documentation: [
      /\/\*[\s\S]*?useFeatureFlag[\s\S]*?\*\//,
      /\/\/.*useFeatureFlag/,
      /\/\*[\s\S]*?isEnabled[\s\S]*?\*\//,
      /\/\/.*isEnabled/,
      /Example:/,
      /Usage:/,
      /The ESLint rule/
    ]
  };

  /**
   * Analyze false positives in pattern detection results
   */
  static async analyzeFalsePositives(
    workingDirectory: string,
    files: string[],
    patterns: RegExp[]
  ): Promise<FalsePositiveAnalysis> {
    const startTime = Date.now();
    const analysis: FalsePositiveAnalysis = {
      totalMatches: 0,
      falsePositives: 0,
      falsePositiveRate: 0,
      truePositives: 0,
      truePositiveRate: 0,
      patterns: [],
      suggestions: [],
      performance: {
        analysisDuration: 0,
        filesAnalyzed: 0,
        linesAnalyzed: 0
      }
    };

    logger.info('Starting false positive analysis', {
      filesToAnalyze: files.length,
      patternsToAnalyze: patterns.length
    });

    try {
      // Analyze each pattern
      for (const pattern of patterns) {
        const patternAnalysis = await this.analyzePattern(
          workingDirectory,
          files,
          pattern
        );
        
        analysis.patterns.push(patternAnalysis);
        analysis.totalMatches += patternAnalysis.matches;
        analysis.falsePositives += patternAnalysis.falsePositives;
      }

      // Calculate overall metrics
      analysis.truePositives = analysis.totalMatches - analysis.falsePositives;
      analysis.falsePositiveRate = analysis.totalMatches > 0 
        ? (analysis.falsePositives / analysis.totalMatches) * 100 
        : 0;
      analysis.truePositiveRate = analysis.totalMatches > 0 
        ? (analysis.truePositives / analysis.totalMatches) * 100 
        : 0;

      // Generate suggestions
      analysis.suggestions = this.generateSuggestions(analysis);

      // Calculate performance metrics
      analysis.performance.analysisDuration = Date.now() - startTime;
      analysis.performance.filesAnalyzed = files.length;
      analysis.performance.linesAnalyzed = await this.countLines(workingDirectory, files);

      logger.info('False positive analysis completed', {
        totalMatches: analysis.totalMatches,
        falsePositives: analysis.falsePositives,
        falsePositiveRate: `${analysis.falsePositiveRate.toFixed(2)}%`,
        truePositives: analysis.truePositives,
        truePositiveRate: `${analysis.truePositiveRate.toFixed(2)}%`,
        analysisDuration: `${analysis.performance.analysisDuration}ms`
      });

      return analysis;

    } catch (error) {
      logger.error('False positive analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      analysis.performance.analysisDuration = Date.now() - startTime;
      return analysis;
    }
  }

  /**
   * Analyze a specific pattern for false positives
   */
  private static async analyzePattern(
    workingDirectory: string,
    files: string[],
    pattern: RegExp
  ): Promise<PatternAnalysis> {
    const analysis: PatternAnalysis = {
      pattern: pattern.source,
      matches: 0,
      falsePositives: 0,
      falsePositiveRate: 0,
      commonFalsePositives: [],
      suggestions: []
    };

    const falsePositiveContexts: FalsePositiveContext[] = [];

    for (const file of files) {
      try {
        const filePath = join(workingDirectory, file);
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const matches = line.matchAll(pattern);
          
          for (const match of matches) {
            analysis.matches++;
            
            const isFalsePositive = this.isFalsePositive(line, match[0], file);
            if (isFalsePositive) {
              analysis.falsePositives++;
              falsePositiveContexts.push({
                filePath: file,
                lineNumber: i + 1,
                content: line.trim(),
                pattern: pattern.source,
                reason: this.getFalsePositiveReason(line, match[0]),
                suggestion: this.getSuggestion(line, match[0])
              });
            }
          }
        }
      } catch (error) {
        logger.warn(`Failed to analyze file ${file}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Calculate pattern-specific metrics
    analysis.falsePositiveRate = analysis.matches > 0 
      ? (analysis.falsePositives / analysis.matches) * 100 
      : 0;

    // Identify common false positive patterns
    analysis.commonFalsePositives = this.identifyCommonFalsePositives(falsePositiveContexts);
    
    // Generate pattern-specific suggestions
    analysis.suggestions = this.generatePatternSuggestions(analysis, falsePositiveContexts);

    return analysis;
  }

  /**
   * Determine if a match is a false positive
   */
  private static isFalsePositive(line: string, match: string, filePath: string): boolean {
    // Check against false positive indicators
    for (const indicator of this.FALSE_POSITIVE_INDICATORS) {
      if (indicator.test(line)) {
        return true;
      }
    }

    // Check if it's in a documentation context
    for (const docPattern of this.CONTEXT_PATTERNS.documentation) {
      if (docPattern.test(line)) {
        return true;
      }
    }

    // Check if it's in an error message or example context
    if (line.includes('message +=') || 
        line.includes('Use useFeatureFlag') || 
        line.includes('Use isEnabled') ||
        line.includes('const { isEnabled } = useFeatureFlag') ||
        line.includes('const enabled = isEnabled') ||
        line.includes('const enabled = isFeatureEnabled')) {
      return true;
    }

    // Check if it's not in a real usage context
    const hasRealUsageContext = this.CONTEXT_PATTERNS.realUsage.some(pattern => 
      pattern.test(line)
    );

    if (!hasRealUsageContext) {
      // Additional heuristics for false positives
      if (this.isLikelyDocumentation(line, filePath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a line is likely documentation
   */
  private static isLikelyDocumentation(line: string, filePath: string): boolean {
    // Check file extension
    if (filePath.endsWith('.md') || filePath.endsWith('.txt') || filePath.endsWith('.rst')) {
      return true;
    }

    // Check for documentation markers
    const docMarkers = [
      'Usage:',
      'Example:',
      'The ESLint rule',
      'Each flag must have',
      'The linter will enforce',
      'TODO:',
      'FIXME:',
      'NOTE:'
    ];

    return docMarkers.some(marker => line.includes(marker));
  }

  /**
   * Get the reason why a match is a false positive
   */
  private static getFalsePositiveReason(line: string, match: string): string {
    if (/^\s*\/\//.test(line)) {
      return 'Match found in single-line comment';
    }
    
    if (/^\s*\*/.test(line)) {
      return 'Match found in multi-line comment';
    }
    
    if (/Usage:/.test(line) || /Example:/.test(line)) {
      return 'Match found in documentation/example text';
    }
    
    if (/import.*from/.test(line)) {
      return 'Match found in import statement (not actual usage)';
    }
    
    if (/type\s+\w+/.test(line) || /interface\s+\w+/.test(line)) {
      return 'Match found in type definition';
    }
    
    return 'Match appears to be in non-executable context';
  }

  /**
   * Get a suggestion for fixing false positives
   */
  private static getSuggestion(line: string, match: string): string {
    if (/^\s*\/\//.test(line)) {
      return 'Consider using more specific comment filtering patterns';
    }
    
    if (/Usage:/.test(line) || /Example:/.test(line)) {
      return 'Add documentation-specific exclusion patterns';
    }
    
    if (/import.*from/.test(line)) {
      return 'Exclude import statements from pattern matching';
    }
    
    return 'Review pattern specificity to reduce false matches';
  }

  /**
   * Identify common false positive patterns
   */
  private static identifyCommonFalsePositives(
    contexts: FalsePositiveContext[]
  ): string[] {
    const reasonCounts = new Map<string, number>();
    
    for (const context of contexts) {
      const count = reasonCounts.get(context.reason) || 0;
      reasonCounts.set(context.reason, count + 1);
    }

    return Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason]) => reason);
  }

  /**
   * Generate pattern-specific suggestions
   */
  private static generatePatternSuggestions(
    analysis: PatternAnalysis,
    contexts: FalsePositiveContext[]
  ): string[] {
    const suggestions: string[] = [];

    if (analysis.falsePositiveRate > 50) {
      suggestions.push('High false positive rate - consider making pattern more specific');
    }

    if (analysis.commonFalsePositives.includes('Match found in single-line comment')) {
      suggestions.push('Add comment line filtering to pattern matching');
    }

    if (analysis.commonFalsePositives.includes('Match found in documentation/example text')) {
      suggestions.push('Add documentation context detection');
    }

    if (analysis.commonFalsePositives.includes('Match found in import statement')) {
      suggestions.push('Exclude import statements from pattern matching');
    }

    return suggestions;
  }

  /**
   * Generate overall suggestions based on analysis
   */
  private static generateSuggestions(analysis: FalsePositiveAnalysis): string[] {
    const suggestions: string[] = [];

    if (analysis.falsePositiveRate > 30) {
      suggestions.push('Overall false positive rate is high - consider pattern optimization');
    }

    if (analysis.patterns.some(p => p.falsePositiveRate > 70)) {
      suggestions.push('Some patterns have very high false positive rates - review and optimize');
    }

    if (analysis.performance.analysisDuration > 5000) {
      suggestions.push('Analysis is taking too long - consider performance optimizations');
    }

    suggestions.push('Consider implementing pattern pre-filtering based on file context');
    suggestions.push('Add machine learning-based false positive detection');
    suggestions.push('Implement pattern confidence scoring');

    return suggestions;
  }

  /**
   * Count total lines in files
   */
  private static async countLines(
    workingDirectory: string,
    files: string[]
  ): Promise<number> {
    let totalLines = 0;
    
    for (const file of files) {
      try {
        const filePath = join(workingDirectory, file);
        const content = await readFile(filePath, 'utf-8');
        totalLines += content.split('\n').length;
      } catch {
        // Skip files that can't be read
      }
    }
    
    return totalLines;
  }

  /**
   * Get performance baseline for comparison
   */
  static async getPerformanceBaseline(
    workingDirectory: string,
    files: string[],
    patterns: RegExp[]
  ): Promise<{
    detectionTime: number;
    memoryUsage: number;
    patternCompilationTime: number;
  }> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Measure pattern compilation time
    const compilationStart = Date.now();
    for (const pattern of patterns) {
      new RegExp(pattern.source, pattern.flags);
    }
    const patternCompilationTime = Date.now() - compilationStart;

    // Run detection
    const detectionStart = Date.now();
    for (const file of files) {
      try {
        const filePath = join(workingDirectory, file);
        const content = await readFile(filePath, 'utf-8');
        
        for (const pattern of patterns) {
          content.match(pattern);
        }
      } catch {
        // Skip files that can't be read
      }
    }
    const detectionTime = Date.now() - detectionStart;

    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsage = endMemory - startMemory;

    return {
      detectionTime,
      memoryUsage,
      patternCompilationTime
    };
  }
}
