// Shared feature flag detection engine
// Provides unified pattern detection logic for all prove checks

import { exec } from '../../utils/exec.js';
import { logger } from '../../logger.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PerformanceMonitor, PerformanceMetrics } from './performance-monitor.js';
import { PatternCache } from './pattern-cache.js';

export interface DetectionMetrics {
  filesProcessed: number;
  filesSkipped: number;
  detectionDuration: number;
  patternMatchCount: number;
  errorCount: number;
  memoryUsage: number;
  performanceMetrics: {
    ripgrepDuration?: number;
    alternativeMethodDuration?: number;
    fileReadingDuration: number;
    patternMatchingDuration: number;
  };
  // Enhanced performance tracking
  performanceMonitor?: PerformanceMetrics;
  regressionDetected?: boolean;
  baselineComparison?: {
    durationVsBaseline: number;
    memoryVsBaseline: number;
    operationsVsBaseline: number;
  };
  // Pattern cache metrics
  patternCacheMetrics?: {
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    averageCompilationTime: number;
    totalPatterns: number;
  };
}

export interface FlagUsage {
  filePath: string;
  lineNumber: number;
  flagName: string;
  pattern: string;
}

export interface PatternDetectionResult {
  flagNames: string[];
  killSwitchPatterns: string[];
  flagUsages: FlagUsage[];
  metrics: DetectionMetrics;
}

export class FeatureFlagDetector {
  private static patternsInitialized = false;
  private static cachedPatterns: {
    useFeatureFlag: RegExp;
    isEnabled: RegExp;
    isFeatureEnabled: RegExp;
    killSwitch: RegExp;
    envVar: RegExp;
    config: RegExp;
    toggle: RegExp;
    import: RegExp;
    rollout: RegExp;
    flagConfig: RegExp;
    frontendFlags: RegExp;
    backendFlags: RegExp;
    flagDefinition: RegExp;
    productionCode: RegExp[];
  } | null = null;

  // Pattern source strings for caching - optimized for performance and accuracy
  private static readonly PATTERN_SOURCES = {
    // Feature flag usage patterns - optimized to reduce false positives
    useFeatureFlag: '(?:^|[^a-zA-Z_])useFeatureFlag\\s*\\(\\s*[\'"`]([^\'"`]+)[\'"`](?=\\s*[;,)])',
    isEnabled: '(?:^|[^a-zA-Z_])isEnabled\\s*\\(\\s*[\'"`]([^\'"`]+)[\'"`](?=\\s*[;,)])',
    isFeatureEnabled: '(?:^|[^a-zA-Z_])isFeatureEnabled\\s*\\(\\s*[\'"`]([^\'"`]+)[\'"`](?=\\s*[;,)])',
    
    // Kill switch patterns - simplified for better performance
    killSwitch: '(?:^|[^a-zA-Z_])KILL_SWITCH_[A-Z_]+',
    envVar: '(?:^|[^a-zA-Z_])process\\.env\\.[A-Z_]+_ENABLED',
    config: '(?:^|[^a-zA-Z_])config\\s*[=:].*enabled',
    toggle: '(?:^|[^a-zA-Z_])toggle\\s*[=:]',
    import: '(?:^|[^a-zA-Z_])import.*flags|from.*flags(?=\\s*[;\\n])',
    rollout: '(?:^|[^a-zA-Z_])rolloutPercentage\\s*:\\s*\\d+',
    
    // Feature flag configuration patterns - optimized
    flagConfig: 'export const featureFlagConfig[^=]*=\\s*{([\\s\\S]*?)};',
    frontendFlags: 'export const FRONTEND_FLAGS[^=]*=\\s*{([\\s\\S]*?)};',
    backendFlags: 'export const BACKEND_FLAGS[^=]*=\\s*{([\\s\\S]*?)};',
    flagDefinition: '(\\w+):\\s*{',
    
    // Production code patterns - optimized for better matching
    productionCode: [
      '^src/',           // Frontend source code
      '^backend/src/',  // Backend source code
      '^api/',           // API code
      '^lib/',           // Library code
      '^components/',    // React components
      '^pages/',         // Next.js pages
      '^app/',           // App directory
      '\\.(ts|tsx|js|jsx)$' // TypeScript/JavaScript files
    ]
  };

  /**
   * Initialize patterns with caching
   */
  static initializePatterns(): void {
    if (this.patternsInitialized) {
      return;
    }

    logger.info('Initializing feature flag patterns with caching...');
    
    // Warm up the pattern cache
    PatternCache.warmup();
    
    // Get cached patterns
    this.cachedPatterns = {
      useFeatureFlag: PatternCache.getPattern(this.PATTERN_SOURCES.useFeatureFlag, 'gm'),
      isEnabled: PatternCache.getPattern(this.PATTERN_SOURCES.isEnabled, 'gm'),
      isFeatureEnabled: PatternCache.getPattern(this.PATTERN_SOURCES.isFeatureEnabled, 'gm'),
      killSwitch: PatternCache.getPattern(this.PATTERN_SOURCES.killSwitch, 'gm'),
      envVar: PatternCache.getPattern(this.PATTERN_SOURCES.envVar, 'gm'),
      config: PatternCache.getPattern(this.PATTERN_SOURCES.config, 'gm'),
      toggle: PatternCache.getPattern(this.PATTERN_SOURCES.toggle, 'gm'),
      import: PatternCache.getPattern(this.PATTERN_SOURCES.import, 'gm'),
      rollout: PatternCache.getPattern(this.PATTERN_SOURCES.rollout, 'gm'),
      flagConfig: PatternCache.getPattern(this.PATTERN_SOURCES.flagConfig),
      frontendFlags: PatternCache.getPattern(this.PATTERN_SOURCES.frontendFlags),
      backendFlags: PatternCache.getPattern(this.PATTERN_SOURCES.backendFlags),
      flagDefinition: PatternCache.getPattern(this.PATTERN_SOURCES.flagDefinition, 'g'),
      productionCode: PatternCache.getPatterns(this.PATTERN_SOURCES.productionCode, 'gm')
    };

    this.patternsInitialized = true;
    
    const cacheMetrics = PatternCache.getMetrics();
    logger.info('Pattern initialization complete', {
      totalPatterns: cacheMetrics.totalPatterns,
      hitRate: `${cacheMetrics.hitRate.toFixed(2)}%`,
      averageCompilationTime: `${cacheMetrics.averageCompilationTime.toFixed(2)}ms`
    });
  }

  /**
   * Get patterns (lazy initialization)
   */
  static get PATTERNS() {
    if (!this.patternsInitialized) {
      this.initializePatterns();
    }
    return this.cachedPatterns!;
  }

  /**
   * Detect feature flag usage patterns in files using ripgrep with fallback
   */
  static async detectFeatureFlagUsage(
    workingDirectory: string,
    patterns: RegExp[] = [
      this.PATTERNS.useFeatureFlag,
      this.PATTERNS.isEnabled,
      this.PATTERNS.isFeatureEnabled
    ]
  ): Promise<PatternDetectionResult> {
    // Start performance monitoring
    const performanceMetrics = PerformanceMonitor.startOperation('feature-flag-detection');
    
    const metrics: DetectionMetrics = {
      filesProcessed: 0,
      filesSkipped: 0,
      detectionDuration: 0,
      patternMatchCount: 0,
      errorCount: 0,
      memoryUsage: 0,
      performanceMetrics: {
        fileReadingDuration: 0,
        patternMatchingDuration: 0
      },
      performanceMonitor: performanceMetrics,
      regressionDetected: false
    };

    try {
      // Try ripgrep first for better performance
      const ripgrepResult = await this.detectWithRipgrep(workingDirectory, patterns, metrics);
      if (ripgrepResult) {
        // Record operations and complete performance monitoring
        PerformanceMonitor.recordOperation(performanceMetrics);
        const finalMetrics = PerformanceMonitor.endOperation(performanceMetrics, 'feature-flag-detection');
        
        metrics.performanceMonitor = finalMetrics;
        metrics.regressionDetected = finalMetrics.regression.durationRegression || 
                                   finalMetrics.regression.memoryRegression || 
                                   finalMetrics.regression.performanceRegression;
        
        // Add pattern cache metrics
        const cacheMetrics = PatternCache.getMetrics();
        metrics.patternCacheMetrics = {
          cacheHits: cacheMetrics.cacheHits,
          cacheMisses: cacheMetrics.cacheMisses,
          hitRate: cacheMetrics.hitRate,
          averageCompilationTime: cacheMetrics.averageCompilationTime,
          totalPatterns: cacheMetrics.totalPatterns
        };
        
        // Log performance metrics
        PerformanceMonitor.logPerformanceMetrics('feature-flag-detection', finalMetrics);
        
        return ripgrepResult;
      }

      // Fallback to file reading method
      logger.warn('Ripgrep failed, using alternative file reading method');
      const alternativeResult = await this.detectWithFileReading(workingDirectory, patterns, metrics);
      
      // Record operations and complete performance monitoring
      PerformanceMonitor.recordOperation(performanceMetrics);
      const finalMetrics = PerformanceMonitor.endOperation(performanceMetrics, 'feature-flag-detection');
      
      metrics.performanceMonitor = finalMetrics;
      metrics.regressionDetected = finalMetrics.regression.durationRegression || 
                                 finalMetrics.regression.memoryRegression || 
                                 finalMetrics.regression.performanceRegression;
      
      // Add pattern cache metrics
      const cacheMetrics = PatternCache.getMetrics();
      metrics.patternCacheMetrics = {
        cacheHits: cacheMetrics.cacheHits,
        cacheMisses: cacheMetrics.cacheMisses,
        hitRate: cacheMetrics.hitRate,
        averageCompilationTime: cacheMetrics.averageCompilationTime,
        totalPatterns: cacheMetrics.totalPatterns
      };
      
      // Log performance metrics
      PerformanceMonitor.logPerformanceMetrics('feature-flag-detection', finalMetrics);
      
      return alternativeResult;

    } catch (error) {
      metrics.errorCount++;
      PerformanceMonitor.recordError(performanceMetrics);
      
      const finalMetrics = PerformanceMonitor.endOperation(performanceMetrics, 'feature-flag-detection');
      metrics.performanceMonitor = finalMetrics;
      metrics.regressionDetected = true; // Errors indicate regression
      
      logger.error('Feature flag detection failed', {
        error: error instanceof Error ? error.message : String(error),
        metrics
      });

      return {
        flagNames: [],
        killSwitchPatterns: [],
        flagUsages: [],
        metrics
      };
    }
  }

  /**
   * Detect kill switch patterns in specific files
   */
  static async detectKillSwitchPatterns(
    workingDirectory: string,
    files: string[],
    patterns: RegExp[] = [
      this.PATTERNS.isEnabled,
      this.PATTERNS.killSwitch,
      this.PATTERNS.envVar,
      this.PATTERNS.config,
      this.PATTERNS.toggle,
      this.PATTERNS.import
    ]
  ): Promise<PatternDetectionResult> {
    // Start performance monitoring
    const performanceMetrics = PerformanceMonitor.startOperation('kill-switch-detection');
    
    const metrics: DetectionMetrics = {
      filesProcessed: files.length,
      filesSkipped: 0,
      detectionDuration: 0,
      patternMatchCount: 0,
      errorCount: 0,
      memoryUsage: 0,
      performanceMetrics: {
        fileReadingDuration: 0,
        patternMatchingDuration: 0
      },
      performanceMonitor: performanceMetrics,
      regressionDetected: false
    };

    const killSwitchPatterns: string[] = [];
    const flagUsages: FlagUsage[] = [];
    const fileReadingStart = Date.now();

    try {
      for (const file of files) {
        // Skip files that should be excluded
        if (this.shouldSkipFile(file)) {
          metrics.filesSkipped++;
          continue;
        }
        
        try {
          const filePath = join(workingDirectory, file);
          
          // Check if file exists before trying to read it
          try {
            await readFile(filePath, 'utf-8');
          } catch (error) {
            if (error instanceof Error && error.code === 'ENOENT') {
              logger.warn(`File not found, skipping: ${file}`);
              metrics.filesSkipped++;
              continue;
            }
            throw error;
          }
          
          const content = await readFile(filePath, 'utf-8');
          
          const filteredContent = this.filterComments(content);
          const patternMatchingStart = Date.now();
          const lines = content.split('\n');
          
          for (const pattern of patterns) {
            const matches = filteredContent.matchAll(pattern);
            for (const match of matches) {
              killSwitchPatterns.push(match[0]);
              
              // Find line number for this match
              const matchIndex = match.index || 0;
              const beforeMatch = content.substring(0, matchIndex);
              const lineNumber = beforeMatch.split('\n').length;
              
              // Extract flag name if possible
              const flagName = match[1] || match[0];
              
              flagUsages.push({
                filePath: file,
                lineNumber,
                flagName,
                pattern: pattern.source
              });
            }
          }
          
          metrics.performanceMetrics.patternMatchingDuration += Date.now() - patternMatchingStart;
          
        } catch (error) {
          metrics.filesSkipped++;
          logger.warn(`Failed to read file ${file}`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      metrics.performanceMetrics.fileReadingDuration = Date.now() - fileReadingStart;
      metrics.patternMatchCount = killSwitchPatterns.length;
      
      // Record operations and complete performance monitoring
      PerformanceMonitor.recordOperation(performanceMetrics);
      const finalMetrics = PerformanceMonitor.endOperation(performanceMetrics, 'kill-switch-detection');
      
      metrics.performanceMonitor = finalMetrics;
      metrics.regressionDetected = finalMetrics.regression.durationRegression || 
                                 finalMetrics.regression.memoryRegression || 
                                 finalMetrics.regression.performanceRegression;
      
      // Add pattern cache metrics
      const cacheMetrics = PatternCache.getMetrics();
      metrics.patternCacheMetrics = {
        cacheHits: cacheMetrics.cacheHits,
        cacheMisses: cacheMetrics.cacheMisses,
        hitRate: cacheMetrics.hitRate,
        averageCompilationTime: cacheMetrics.averageCompilationTime,
        totalPatterns: cacheMetrics.totalPatterns
      };
      
      // Log performance metrics
      PerformanceMonitor.logPerformanceMetrics('kill-switch-detection', finalMetrics);

      return {
        flagNames: [],
        killSwitchPatterns,
        flagUsages,
        metrics
      };

    } catch (error) {
      metrics.errorCount++;
      PerformanceMonitor.recordError(performanceMetrics);
      
      const finalMetrics = PerformanceMonitor.endOperation(performanceMetrics, 'kill-switch-detection');
      metrics.performanceMonitor = finalMetrics;
      metrics.regressionDetected = true; // Errors indicate regression
      
      logger.error('Kill switch pattern detection failed', {
        error: error instanceof Error ? error.message : String(error),
        metrics
      });

      return {
        flagNames: [],
        killSwitchPatterns: [],
        flagUsages: [],
        metrics
      };
    }
  }

  /**
   * Detect patterns using ripgrep for better performance
   */
  private static async detectWithRipgrep(
    workingDirectory: string,
    patterns: RegExp[],
    metrics: DetectionMetrics
  ): Promise<PatternDetectionResult | null> {
    const ripgrepStart = Date.now();
    
    try {
      // Build ripgrep pattern from the provided patterns
      const ripgrepPattern = this.buildRipgrepPattern(patterns);
      
      const result = await exec('rg', [
        '--no-heading',
        '--no-line-number', 
        '--glob', '*.ts',
        '--glob', '*.tsx',
        '--glob', '*.js',
        '--glob', '*.jsx',
        '--glob', '!node_modules/**',
        '--glob', '!dist/**',
        '--glob', '!build/**',
        '--glob', '!docs/**',
        '--glob', '!**/__tests__/**',
        '--glob', '!**/*.test.*',
        '--glob', '!**/*.spec.*',
        '--glob', '!coverage/**',
        '--glob', '!playwright-report/**',
        '--glob', '!test-results/**',
        ripgrepPattern,
        '.'
      ], {
        timeout: 30000,
        cwd: workingDirectory
      });

      metrics.performanceMetrics.ripgrepDuration = Date.now() - ripgrepStart;

      if (!result.success) {
        return null;
      }

      // Extract flag names and structured data from ripgrep output
      const flagNames = new Set<string>();
      const flagUsages: FlagUsage[] = [];
      const lines = result.stdout.split('\n').filter(line => line.trim());
      
      logger.info(`Processing ${lines.length} lines from ripgrep output`);
      
      for (const line of lines) {
        const parts = line.split(':');
        if (parts.length < 3) continue;
        
        const filePath = parts[0];
        const lineNumber = parseInt(parts[1], 10) || 0;
        const codePart = parts.slice(2).join(':');
        
        if (this.isCommentLine(codePart)) {
          continue;
        }
        
        // Additional comment filtering for common patterns (check original line)
        if (line.includes('* Usage:') || 
            line.includes('* The ESLint rule') ||
            line.includes('* Each flag must have') ||
            line.includes('* The linter will enforce')) {
          continue;
        }
        
        for (const pattern of patterns) {
          // Create a new regex without global flag for matching
          const nonGlobalPattern = new RegExp(pattern.source, pattern.flags.replace('g', ''));
          const match = codePart.match(nonGlobalPattern);
          if (match && match[1]) {
            const flagName = match[1];
            flagNames.add(flagName);
            flagUsages.push({
              filePath,
              lineNumber,
              flagName,
              pattern: pattern.source
            });
          }
        }
      }
      
      metrics.patternMatchCount = flagNames.size;
      logger.info(`Extracted ${flagNames.size} unique flags: ${Array.from(flagNames).join(', ')}`);

      return {
        flagNames: Array.from(flagNames),
        killSwitchPatterns: [],
        flagUsages,
        metrics
      };

    } catch (error) {
      logger.warn('Ripgrep detection failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Detect patterns using file reading as fallback
   */
  private static async detectWithFileReading(
    workingDirectory: string,
    patterns: RegExp[],
    metrics: DetectionMetrics
  ): Promise<PatternDetectionResult> {
    const alternativeStart = Date.now();
    const flagNames = new Set<string>();
    const flagUsages: FlagUsage[] = [];
    
    try {
      // Find all TypeScript/JavaScript files recursively
      const result = await exec('find', [
        '.',
        '-name',
        '*.ts',
        '-o',
        '-name',
        '*.tsx',
        '-o',
        '-name',
        '*.js',
        '-o',
        '-name',
        '*.jsx'
      ], {
        timeout: 30000,
        cwd: workingDirectory
      });

      if (!result.success) {
        return {
          flagNames: [],
          killSwitchPatterns: [],
          flagUsages: [],
          metrics
        };
      }

      const files = result.stdout.split('\n').filter(file => file.trim());
      metrics.filesProcessed = files.length;
      
      // Process all files
      for (const file of files) {
        // Skip test files and other excluded directories
        if (this.shouldSkipFile(file)) {
          metrics.filesSkipped++;
          continue;
        }
        
        try {
          const filePath = join(workingDirectory, file);
          
          // Check if file exists before trying to read it
          let content: string;
          try {
            content = await readFile(filePath, 'utf-8');
          } catch (error) {
            if (error instanceof Error && error.code === 'ENOENT') {
              logger.warn(`File not found, skipping: ${file}`);
              metrics.filesSkipped++;
              continue;
            }
            throw error;
          }
          
          const filteredContent = this.filterComments(content);
          const lines = content.split('\n');
          
          for (const pattern of patterns) {
            const matches = filteredContent.matchAll(pattern);
            for (const match of matches) {
              if (match[1]) {
                const flagName = match[1];
                flagNames.add(flagName);
                
                // Find line number for this match
                const matchIndex = match.index || 0;
                const beforeMatch = content.substring(0, matchIndex);
                const lineNumber = beforeMatch.split('\n').length;
                
                flagUsages.push({
                  filePath: file,
                  lineNumber,
                  flagName,
                  pattern: pattern.source
                });
              }
            }
          }
        } catch {
          metrics.filesSkipped++;
          continue;
        }
      }

      metrics.performanceMetrics.alternativeMethodDuration = Date.now() - alternativeStart;
      metrics.patternMatchCount = flagNames.size;
      
      return {
        flagNames: Array.from(flagNames),
        killSwitchPatterns: [],
        flagUsages,
        metrics
      };

    } catch (error) {
      logger.warn('Alternative detection method failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        flagNames: [],
        killSwitchPatterns: [],
        flagUsages: [],
        metrics
      };
    }
  }

  /**
   * Build ripgrep pattern from regex patterns
   */
  private static buildRipgrepPattern(patterns: RegExp[]): string {
    // For feature flag patterns, use a simpler approach
    // that matches the working pattern from the original implementation
    return '(useFeatureFlag|isEnabled|isFeatureEnabled)\\s*\\(\\s*[\'"`]([^\'"`]+)[\'"`]';
  }

  /**
   * Filter out comment lines and false positive patterns from content
   */
  static filterComments(content: string): string {
    const lines = content.split('\n').filter(line => {
      const trimmed = line.trim();
      
      // Basic comment filtering
      if (trimmed.startsWith('//') || 
          trimmed.startsWith('*') || 
          trimmed.startsWith('/*') ||
          trimmed.startsWith('#') ||
          trimmed.startsWith('<!--')) {
        return false;
      }
      
      // Documentation and example filtering
      if (line.includes('* Usage:') ||
          line.includes('* The ESLint rule') ||
          line.includes('* Each flag must have') ||
          line.includes('* The linter will enforce') ||
          line.includes('Example:') ||
          line.includes('Usage:') ||
          line.includes('TODO:') ||
          line.includes('FIXME:') ||
          line.includes('NOTE:')) {
        return false;
      }
      
      // Import statement filtering (not actual usage)
      if (trimmed.startsWith('import ') && 
          (trimmed.includes('useFeatureFlag') || 
           trimmed.includes('isEnabled') || 
           trimmed.includes('isFeatureEnabled'))) {
        return false;
      }
      
      // Type definition filtering
      if (trimmed.startsWith('type ') || 
          trimmed.startsWith('interface ') || 
          trimmed.startsWith('declare ')) {
        return false;
      }
      
      // Configuration example filtering
      if (line.includes('config') && 
          (line.includes('example') || 
           line.includes('sample') || 
           line.includes('template'))) {
        return false;
      }
      
      return true;
    });
    
    return lines.join('\n');
  }

  /**
   * Check if a line is a comment or false positive
   */
  private static isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    
    // Basic comment patterns
    if (trimmed.startsWith('//') || 
        trimmed.startsWith('*') || 
        trimmed.startsWith('/*') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('<!--')) {
      return true;
    }
    
    // Documentation and example patterns
    if (line.includes('* Usage:') ||
        line.includes('* The ESLint rule') ||
        line.includes('* Each flag must have') ||
        line.includes('* The linter will enforce') ||
        line.includes('Example:') ||
        line.includes('Usage:') ||
        line.includes('TODO:') ||
        line.includes('FIXME:') ||
        line.includes('NOTE:')) {
      return true;
    }
    
    // Import statement patterns (not actual usage)
    if (trimmed.startsWith('import ') && 
        (trimmed.includes('useFeatureFlag') || 
         trimmed.includes('isEnabled') || 
         trimmed.includes('isFeatureEnabled'))) {
      return true;
    }
    
    // Type definition patterns
    if (trimmed.startsWith('type ') || 
        trimmed.startsWith('interface ') || 
        trimmed.startsWith('declare ')) {
      return true;
    }
    
    // Configuration example patterns
    if (line.includes('config') && 
        (line.includes('example') || 
         line.includes('sample') || 
         line.includes('template'))) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if a file should be skipped
   */
  private static shouldSkipFile(file: string): boolean {
    return file.includes('__tests__') || 
           file.includes('.test.') || 
           file.includes('.spec.') ||
           file.includes('node_modules') ||
           file.includes('dist') ||
           file.includes('build') ||
           file.includes('docs') ||
           file.includes('coverage') ||
           file.includes('playwright-report') ||
           file.includes('test-results') ||
           file.includes('error-messages.ts') || // Skip error message files with example text
           file.includes('README') ||
           file.includes('.md') ||
           file.endsWith('error-messages.ts'); // Also check for exact filename match
  }

  /**
   * Get detection metrics for monitoring
   */
  static async getDetectionMetrics(): Promise<DetectionMetrics> {
    return {
      filesProcessed: 0,
      filesSkipped: 0,
      detectionDuration: 0,
      patternMatchCount: 0,
      errorCount: 0,
      memoryUsage: 0,
      performanceMetrics: {
        fileReadingDuration: 0,
        patternMatchingDuration: 0
      }
    };
  }

  /**
   * Analyze false positives in detection results
   */
  static async analyzeFalsePositives(
    workingDirectory: string,
    files: string[],
    patterns: RegExp[]
  ): Promise<{
    analysis: import('./false-positive-analyzer.js').FalsePositiveAnalysis;
    optimizedPatterns: RegExp[];
  }> {
    const { FalsePositiveAnalyzer } = await import('./false-positive-analyzer.js');
    
    // Run false positive analysis
    const analysis = await FalsePositiveAnalyzer.analyzeFalsePositives(
      workingDirectory,
      files,
      patterns
    );

    // Generate optimized patterns based on analysis
    const optimizedPatterns = this.generateOptimizedPatterns(patterns, analysis);

    logger.info('False positive analysis completed', {
      totalMatches: analysis.totalMatches,
      falsePositives: analysis.falsePositives,
      falsePositiveRate: `${analysis.falsePositiveRate.toFixed(2)}%`,
      suggestions: analysis.suggestions.length
    });

    return {
      analysis,
      optimizedPatterns
    };
  }

  /**
   * Generate optimized patterns based on false positive analysis
   */
  private static generateOptimizedPatterns(
    originalPatterns: RegExp[],
    analysis: import('./false-positive-analyzer.js').FalsePositiveAnalysis
  ): RegExp[] {
    // For now, return original patterns
    // In a more sophisticated implementation, we could:
    // - Adjust pattern specificity based on false positive rates
    // - Add additional filtering based on common false positive patterns
    // - Implement pattern confidence scoring
    
    if (analysis.falsePositiveRate > 50) {
      logger.warn('High false positive rate detected', {
        rate: `${analysis.falsePositiveRate.toFixed(2)}%`,
        suggestion: 'Consider pattern optimization'
      });
    }

    return originalPatterns;
  }
}
