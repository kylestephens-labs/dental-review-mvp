// Pattern compilation cache for optimized regex performance
// Provides intelligent caching and compilation optimization for feature flag detection

import { logger } from '../../logger.js';

export interface CachedPattern {
  pattern: RegExp;
  source: string;
  flags: string;
  compiledAt: number;
  hitCount: number;
  lastUsed: number;
}

export interface PatternCacheMetrics {
  totalPatterns: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageCompilationTime: number;
  memoryUsage: number;
  evictedPatterns: number;
}

export class PatternCache {
  private static cache: Map<string, CachedPattern> = new Map();
  private static maxSize: number = 100;
  private static ttl: number = 5 * 60 * 1000; // 5 minutes
  private static cleanupInterval: number = 60 * 1000; // 1 minute
  private static lastCleanup: number = Date.now();
  
  // Performance tracking
  private static cacheHits: number = 0;
  private static cacheMisses: number = 0;
  private static compilationTimes: number[] = [];
  private static evictedPatterns: number = 0;

  /**
   * Get or compile a regex pattern with caching
   */
  static getPattern(source: string, flags: string = 'gm'): RegExp {
    const key = `${source}|${flags}`;
    const now = Date.now();
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && (now - cached.compiledAt) < this.ttl) {
      cached.hitCount++;
      cached.lastUsed = now;
      this.cacheHits++;
      return cached.pattern;
    }

    // Cache miss - compile new pattern
    this.cacheMisses++;
    const compilationStart = Date.now();
    
    try {
      const pattern = new RegExp(source, flags);
      const compilationTime = Date.now() - compilationStart;
      this.compilationTimes.push(compilationTime);
      
      // Store in cache
      const cachedPattern: CachedPattern = {
        pattern,
        source,
        flags,
        compiledAt: now,
        hitCount: 1,
        lastUsed: now
      };
      
      this.cache.set(key, cachedPattern);
      
      // Cleanup if needed
      this.cleanupIfNeeded();
      
      logger.info(`Compiled new pattern: ${source}`, {
        compilationTime: `${compilationTime}ms`,
        cacheSize: this.cache.size,
        hitRate: this.getHitRate()
      });
      
      return pattern;
      
    } catch (error) {
      logger.error(`Failed to compile pattern: ${source}`, {
        error: error instanceof Error ? error.message : String(error),
        flags
      });
      throw error;
    }
  }

  /**
   * Get multiple patterns efficiently
   */
  static getPatterns(sources: string[], flags: string = 'gm'): RegExp[] {
    return sources.map(source => this.getPattern(source, flags));
  }

  /**
   * Pre-compile commonly used patterns
   */
  static precompileCommonPatterns(): void {
    const commonPatterns = [
      // Feature flag patterns
      '(?:^|[^a-zA-Z_])useFeatureFlag\\s*\\(\\s*[\'"`]([^\'"`]+)[\'"`]',
      '(?:^|[^a-zA-Z_])isEnabled\\s*\\(\\s*[\'"`]([^\'"`]+)[\'"`]',
      '(?:^|[^a-zA-Z_])isFeatureEnabled\\s*\\(\\s*[\'"`]([^\'"`]+)[\'"`]',
      
      // Kill switch patterns
      '(?:^|[^a-zA-Z_])KILL_SWITCH_[A-Z_]+',
      '(?:^|[^a-zA-Z_])process\\.env\\.[A-Z_]+_ENABLED',
      '(?:^|[^a-zA-Z_])config\\s*[=:].*enabled',
      '(?:^|[^a-zA-Z_])toggle\\s*[=:]',
      '(?:^|[^a-zA-Z_])import.*flags|from.*flags',
      '(?:^|[^a-zA-Z_])rolloutPercentage\\s*:\\s*\\d+',
      
      // Configuration patterns
      'export const featureFlagConfig[^=]*=\\s*{([\\s\\S]*?)};',
      'export const FRONTEND_FLAGS[^=]*=\\s*{([\\s\\S]*?)};',
      'export const BACKEND_FLAGS[^=]*=\\s*{([\\s\\S]*?)};',
      '(\\w+):\\s*{',
      
      // File path patterns
      '^src/',
      '^backend/src/',
      '^api/',
      '^lib/',
      '^components/',
      '^pages/',
      '^app/',
      '\\.(ts|tsx|js|jsx)$'
    ];

    logger.info('Pre-compiling common patterns', {
      patternCount: commonPatterns.length,
      cacheSize: this.cache.size
    });

    for (const source of commonPatterns) {
      this.getPattern(source, 'gm');
    }

    logger.info('Pattern pre-compilation complete', {
      cacheSize: this.cache.size,
      hitRate: this.getHitRate()
    });
  }

  /**
   * Get cache metrics for monitoring
   */
  static getMetrics(): PatternCacheMetrics {
    const now = Date.now();
    const totalPatterns = this.cache.size;
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    const averageCompilationTime = this.compilationTimes.length > 0 
      ? this.compilationTimes.reduce((sum, time) => sum + time, 0) / this.compilationTimes.length 
      : 0;
    
    // Estimate memory usage (rough calculation)
    const memoryUsage = totalPatterns * 200; // Rough estimate per pattern

    return {
      totalPatterns,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate,
      averageCompilationTime,
      memoryUsage,
      evictedPatterns: this.evictedPatterns
    };
  }

  /**
   * Clear cache and reset metrics
   */
  static clear(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.compilationTimes = [];
    this.evictedPatterns = 0;
    this.lastCleanup = Date.now();
    
    logger.info('Pattern cache cleared');
  }

  /**
   * Get cache hit rate
   */
  private static getHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  /**
   * Cleanup expired and least-used patterns
   */
  private static cleanupIfNeeded(): void {
    const now = Date.now();
    
    // Only cleanup if interval has passed or cache is too large
    if (now - this.lastCleanup < this.cleanupInterval && this.cache.size <= this.maxSize) {
      return;
    }

    this.lastCleanup = now;
    
    // Remove expired patterns
    for (const [key, pattern] of this.cache.entries()) {
      if (now - pattern.compiledAt > this.ttl) {
        this.cache.delete(key);
        this.evictedPatterns++;
      }
    }

    // If still too large, remove least-used patterns
    if (this.cache.size > this.maxSize) {
      const patterns = Array.from(this.cache.entries());
      patterns.sort((a, b) => a[1].hitCount - b[1].hitCount);
      
      const toRemove = patterns.slice(0, this.cache.size - this.maxSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
        this.evictedPatterns++;
      }
    }

    logger.info('Pattern cache cleanup completed', {
      cacheSize: this.cache.size,
      evictedPatterns: this.evictedPatterns,
      hitRate: this.getHitRate()
    });
  }

  /**
   * Get cache statistics for debugging
   */
  static getStats(): {
    cacheSize: number;
    hitRate: number;
    topPatterns: Array<{ source: string; hits: number; lastUsed: string }>;
    memoryUsage: number;
  } {
    const patterns = Array.from(this.cache.values());
    const topPatterns = patterns
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 10)
      .map(p => ({
        source: p.source.substring(0, 50) + (p.source.length > 50 ? '...' : ''),
        hits: p.hitCount,
        lastUsed: new Date(p.lastUsed).toISOString()
      }));

    return {
      cacheSize: this.cache.size,
      hitRate: this.getHitRate(),
      topPatterns,
      memoryUsage: this.cache.size * 200 // Rough estimate
    };
  }

  /**
   * Warm up cache with frequently used patterns
   */
  static warmup(): void {
    logger.info('Warming up pattern cache...');
    this.precompileCommonPatterns();
    
    const metrics = this.getMetrics();
    logger.info('Pattern cache warmup complete', metrics);
  }
}
