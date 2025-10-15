// Shared feature flag detection engine
// Provides unified pattern detection logic for all prove checks

import { exec } from '../../utils/exec.js';
import { logger } from '../../logger.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

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
}

export interface PatternDetectionResult {
  flagNames: string[];
  killSwitchPatterns: string[];
  metrics: DetectionMetrics;
}

export class FeatureFlagDetector {
  // Comprehensive pattern definitions for all feature flag and kill switch detection
  static readonly PATTERNS = {
    // Feature flag usage patterns
    useFeatureFlag: /useFeatureFlag\s*\(\s*['"`]([^'"`]+)['"`]/g,
    isEnabled: /isEnabled\s*\(\s*['"`]([^'"`]+)['"`]/g,
    isFeatureEnabled: /isFeatureEnabled\s*\(\s*['"`]([^'"`]+)['"`]/g,
    
    // Kill switch patterns
    killSwitch: /KILL_SWITCH_/g,
    envVar: /process\.env\.[A-Z_]+_ENABLED/g,
    config: /config\s*[=:].*enabled/g,
    toggle: /toggle\s*[=:]/g,
    import: /import.*flags|from.*flags/g,
    rollout: /rolloutPercentage\s*:\s*\d+/g,
    
    // Feature flag configuration patterns
    flagConfig: /export const featureFlagConfig[^=]*=\s*{([\s\S]*?)};/,
    frontendFlags: /export const FRONTEND_FLAGS[^=]*=\s*{([\s\S]*?)};/,
    backendFlags: /export const BACKEND_FLAGS[^=]*=\s*{([\s\S]*?)};/,
    flagDefinition: /(\w+):\s*{/g,
    
    // Production code patterns
    productionCode: [
      /^src\//,           // Frontend source code
      /^backend\/src\//,  // Backend source code
      /^api\//,           // API code
      /^lib\//,           // Library code
      /^components\//,    // React components
      /^pages\//,         // Next.js pages
      /^app\//,           // App directory
      /\.(ts|tsx|js|jsx)$/ // TypeScript/JavaScript files
    ]
  };

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
    const startTime = Date.now();
    const memoryStart = process.memoryUsage();
    
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
      }
    };

    try {
      // Try ripgrep first for better performance
      const ripgrepResult = await this.detectWithRipgrep(workingDirectory, patterns, metrics);
      if (ripgrepResult) {
        metrics.detectionDuration = Date.now() - startTime;
        metrics.memoryUsage = process.memoryUsage().heapUsed - memoryStart.heapUsed;
        return ripgrepResult;
      }

      // Fallback to file reading method
      logger.warn('Ripgrep failed, using alternative file reading method');
      const alternativeResult = await this.detectWithFileReading(workingDirectory, patterns, metrics);
      
      metrics.detectionDuration = Date.now() - startTime;
      metrics.memoryUsage = process.memoryUsage().heapUsed - memoryStart.heapUsed;
      
      return alternativeResult;

    } catch (error) {
      metrics.errorCount++;
      metrics.detectionDuration = Date.now() - startTime;
      metrics.memoryUsage = process.memoryUsage().heapUsed - memoryStart.heapUsed;
      
      logger.error('Feature flag detection failed', {
        error: error instanceof Error ? error.message : String(error),
        metrics
      });

      return {
        flagNames: [],
        killSwitchPatterns: [],
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
    const startTime = Date.now();
    const memoryStart = process.memoryUsage();
    
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
      }
    };

    const killSwitchPatterns: string[] = [];
    const fileReadingStart = Date.now();

    try {
      for (const file of files) {
        try {
          const filePath = join(workingDirectory, file);
          const content = await readFile(filePath, 'utf-8');
          
          const filteredContent = this.filterComments(content);
          const patternMatchingStart = Date.now();
          
          for (const pattern of patterns) {
            const matches = filteredContent.match(pattern);
            if (matches) {
              killSwitchPatterns.push(...matches);
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
      metrics.detectionDuration = Date.now() - startTime;
      metrics.memoryUsage = process.memoryUsage().heapUsed - memoryStart.heapUsed;

      return {
        flagNames: [],
        killSwitchPatterns,
        metrics
      };

    } catch (error) {
      metrics.errorCount++;
      metrics.detectionDuration = Date.now() - startTime;
      metrics.memoryUsage = process.memoryUsage().heapUsed - memoryStart.heapUsed;
      
      logger.error('Kill switch pattern detection failed', {
        error: error instanceof Error ? error.message : String(error),
        metrics
      });

      return {
        flagNames: [],
        killSwitchPatterns: [],
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

      // Extract flag names from ripgrep output
      const flagNames = new Set<string>();
      const lines = result.stdout.split('\n').filter(line => line.trim());
      
      logger.info(`Processing ${lines.length} lines from ripgrep output`);
      
      for (const line of lines) {
        const codePart = line.includes(':') ? line.split(':').slice(2).join(':') : line;
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
            flagNames.add(match[1]);
          }
        }
      }
      
      metrics.patternMatchCount = flagNames.size;
      logger.info(`Extracted ${flagNames.size} unique flags: ${Array.from(flagNames).join(', ')}`);

      return {
        flagNames: Array.from(flagNames),
        killSwitchPatterns: [],
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
          const content = await readFile(join(workingDirectory, file), 'utf-8');
          const filteredContent = this.filterComments(content);
          
          for (const pattern of patterns) {
            const matches = filteredContent.matchAll(pattern);
            for (const match of matches) {
              if (match[1]) {
                flagNames.add(match[1]);
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
        metrics
      };

    } catch (error) {
      logger.warn('Alternative detection method failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        flagNames: [],
        killSwitchPatterns: [],
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
   * Filter out comment lines from content
   */
  static filterComments(content: string): string {
    const lines = content.split('\n').filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && 
             !trimmed.startsWith('*') && 
             !trimmed.startsWith('/*') &&
             !trimmed.startsWith('#') &&
             !line.includes('* Usage:') &&
             !line.includes('* The ESLint rule');
    });
    
    return lines.join('\n');
  }

  /**
   * Check if a line is a comment
   */
  private static isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('*') || 
           trimmed.startsWith('/*') ||
           trimmed.startsWith('#') ||
           line.includes('* Usage:') ||
           line.includes('* The ESLint rule') ||
           line.includes('* Each flag must have') ||
           line.includes('* The linter will enforce');
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
           file.includes('frontend') ||
           file.includes('backend') ||
           file.includes('docs') ||
           file.includes('coverage') ||
           file.includes('playwright-report') ||
           file.includes('test-results');
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
}
