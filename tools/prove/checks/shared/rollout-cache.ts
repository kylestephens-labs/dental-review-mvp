// Rollout validation cache for performance optimization
// Caches parsed configurations and validation results to avoid repeated processing

import { logger } from '../../logger.js';
import { type FlagDefinition, type RolloutValidationResult, type GradualRolloutResult, type RolloutMetrics } from './rollout-validator.js';

export interface CachedValidationResult {
  result: RolloutValidationResult;
  timestamp: number;
  ttl: number;
  fileHash: string;
}

export interface CachedGradualRolloutResult {
  result: GradualRolloutResult;
  timestamp: number;
  ttl: number;
  flagsHash: string;
}

export interface CachedMetrics {
  metrics: RolloutMetrics;
  timestamp: number;
  ttl: number;
  flagsHash: string;
}

export interface CachedFlagDefinition {
  definition: FlagDefinition;
  timestamp: number;
  ttl: number;
  contentHash: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
  averageAccessTime: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  cleanupInterval: number;
  enableMemoryOptimization: boolean;
  enableCompression: boolean;
}

export class RolloutCache {
  private static validationCache = new Map<string, CachedValidationResult>();
  private static gradualRolloutCache = new Map<string, CachedGradualRolloutResult>();
  private static metricsCache = new Map<string, CachedMetrics>();
  private static flagDefinitionCache = new Map<string, CachedFlagDefinition>();
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    memoryUsage: 0,
    hitRate: 0,
    averageAccessTime: 0
  };
  private static config: CacheConfig = {
    maxSize: 1000,
    defaultTtl: 300000, // 5 minutes
    cleanupInterval: 60000, // 1 minute
    enableMemoryOptimization: true,
    enableCompression: false
  };
  private static cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize cache with configuration
   */
  static initialize(config?: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    this.startCleanupTimer();
    logger.info('Rollout cache initialized', { config: this.config });
  }

  /**
   * Get cached validation result
   */
  static getValidationResult(flagName: string, contentHash: string): RolloutValidationResult | null {
    const startTime = Date.now();
    const key = `${flagName}:${contentHash}`;
    
    const cached = this.validationCache.get(key);
    if (cached && this.isValid(cached)) {
      this.stats.hits++;
      this.updateAccessTime(Date.now() - startTime);
      logger.info('Cache hit for validation result', { flagName, key });
      return cached.result;
    }
    
    if (cached) {
      this.validationCache.delete(key);
      this.stats.evictions++;
    }
    
    this.stats.misses++;
    this.updateAccessTime(Date.now() - startTime);
    logger.info('Cache miss for validation result', { flagName, key });
    return null;
  }

  /**
   * Set cached validation result
   */
  static setValidationResult(
    flagName: string, 
    contentHash: string, 
    result: RolloutValidationResult,
    ttl?: number
  ): void {
    const key = `${flagName}:${contentHash}`;
    const cached: CachedValidationResult = {
      result,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      fileHash: contentHash
    };
    
    this.validationCache.set(key, cached);
    this.updateCacheSize();
    this.enforceMaxSize();
    
    logger.info('Cached validation result', { flagName, key, ttl: cached.ttl });
  }

  /**
   * Get cached gradual rollout result
   */
  static getGradualRolloutResult(flagsHash: string): GradualRolloutResult | null {
    const startTime = Date.now();
    
    const cached = this.gradualRolloutCache.get(flagsHash);
    if (cached && this.isValid(cached)) {
      this.stats.hits++;
      this.updateAccessTime(Date.now() - startTime);
      logger.info('Cache hit for gradual rollout result', { flagsHash });
      return cached.result;
    }
    
    if (cached) {
      this.gradualRolloutCache.delete(flagsHash);
      this.stats.evictions++;
    }
    
    this.stats.misses++;
    this.updateAccessTime(Date.now() - startTime);
    logger.info('Cache miss for gradual rollout result', { flagsHash });
    return null;
  }

  /**
   * Set cached gradual rollout result
   */
  static setGradualRolloutResult(
    flagsHash: string, 
    result: GradualRolloutResult,
    ttl?: number
  ): void {
    const cached: CachedGradualRolloutResult = {
      result,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      flagsHash
    };
    
    this.gradualRolloutCache.set(flagsHash, cached);
    this.updateCacheSize();
    this.enforceMaxSize();
    
    logger.info('Cached gradual rollout result', { flagsHash, ttl: cached.ttl });
  }

  /**
   * Get cached metrics
   */
  static getMetrics(flagsHash: string): RolloutMetrics | null {
    const startTime = Date.now();
    
    const cached = this.metricsCache.get(flagsHash);
    if (cached && this.isValid(cached)) {
      this.stats.hits++;
      this.updateAccessTime(Date.now() - startTime);
      logger.info('Cache hit for metrics', { flagsHash });
      return cached.metrics;
    }
    
    if (cached) {
      this.metricsCache.delete(flagsHash);
      this.stats.evictions++;
    }
    
    this.stats.misses++;
    this.updateAccessTime(Date.now() - startTime);
    logger.info('Cache miss for metrics', { flagsHash });
    return null;
  }

  /**
   * Set cached metrics
   */
  static setMetrics(
    flagsHash: string, 
    metrics: RolloutMetrics,
    ttl?: number
  ): void {
    const cached: CachedMetrics = {
      metrics,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      flagsHash
    };
    
    this.metricsCache.set(flagsHash, cached);
    this.updateCacheSize();
    this.enforceMaxSize();
    
    logger.info('Cached metrics', { flagsHash, ttl: cached.ttl });
  }

  /**
   * Get cached flag definition
   */
  static getFlagDefinition(contentHash: string): FlagDefinition | null {
    const startTime = Date.now();
    
    const cached = this.flagDefinitionCache.get(contentHash);
    if (cached && this.isValid(cached)) {
      this.stats.hits++;
      this.updateAccessTime(Date.now() - startTime);
      logger.info('Cache hit for flag definition', { contentHash });
      return cached.definition;
    }
    
    if (cached) {
      this.flagDefinitionCache.delete(contentHash);
      this.stats.evictions++;
    }
    
    this.stats.misses++;
    this.updateAccessTime(Date.now() - startTime);
    logger.info('Cache miss for flag definition', { contentHash });
    return null;
  }

  /**
   * Set cached flag definition
   */
  static setFlagDefinition(
    contentHash: string, 
    definition: FlagDefinition,
    ttl?: number
  ): void {
    const cached: CachedFlagDefinition = {
      definition,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      contentHash
    };
    
    this.flagDefinitionCache.set(contentHash, cached);
    this.updateCacheSize();
    this.enforceMaxSize();
    
    logger.info('Cached flag definition', { contentHash, ttl: cached.ttl });
  }

  /**
   * Generate hash for flag content
   */
  static generateContentHash(content: string): string {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate hash for multiple flags
   */
  static generateFlagsHash(flags: FlagDefinition[]): string {
    const content = flags
      .map(flag => `${flag.name}:${flag.content}`)
      .sort()
      .join('|');
    return this.generateContentHash(content);
  }

  /**
   * Check if cached item is still valid
   */
  private static isValid(cached: { timestamp: number; ttl: number }): boolean {
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * Update cache size and memory usage
   */
  private static updateCacheSize(): void {
    this.stats.size = 
      this.validationCache.size + 
      this.gradualRolloutCache.size + 
      this.metricsCache.size + 
      this.flagDefinitionCache.size;
    
    this.stats.memoryUsage = process.memoryUsage().heapUsed;
  }

  /**
   * Update average access time
   */
  private static updateAccessTime(accessTime: number): void {
    const totalAccesses = this.stats.hits + this.stats.misses;
    this.stats.averageAccessTime = 
      (this.stats.averageAccessTime * (totalAccesses - 1) + accessTime) / totalAccesses;
  }

  /**
   * Enforce maximum cache size
   */
  private static enforceMaxSize(): void {
    if (this.stats.size <= this.config.maxSize) return;
    
    // Remove oldest items from each cache
    const caches = [
      { cache: this.validationCache, name: 'validation' },
      { cache: this.gradualRolloutCache, name: 'gradualRollout' },
      { cache: this.metricsCache, name: 'metrics' },
      { cache: this.flagDefinitionCache, name: 'flagDefinition' }
    ];
    
    for (const { cache, name } of caches) {
      if (cache.size > 0) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
        this.stats.evictions++;
        logger.info('Evicted oldest item from cache', { cache: name, key: oldestKey });
      }
    }
  }

  /**
   * Start cleanup timer
   */
  private static startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired cache entries
   */
  private static cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Clean validation cache
    for (const [key, cached] of this.validationCache.entries()) {
      if (!this.isValid(cached)) {
        this.validationCache.delete(key);
        cleanedCount++;
      }
    }
    
    // Clean gradual rollout cache
    for (const [key, cached] of this.gradualRolloutCache.entries()) {
      if (!this.isValid(cached)) {
        this.gradualRolloutCache.delete(key);
        cleanedCount++;
      }
    }
    
    // Clean metrics cache
    for (const [key, cached] of this.metricsCache.entries()) {
      if (!this.isValid(cached)) {
        this.metricsCache.delete(key);
        cleanedCount++;
      }
    }
    
    // Clean flag definition cache
    for (const [key, cached] of this.flagDefinitionCache.entries()) {
      if (!this.isValid(cached)) {
        this.flagDefinitionCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.updateCacheSize();
      logger.info('Cleaned up expired cache entries', { cleanedCount });
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheStats {
    this.updateCacheSize();
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;
    
    return { ...this.stats };
  }

  /**
   * Clear all caches
   */
  static clear(): void {
    this.validationCache.clear();
    this.gradualRolloutCache.clear();
    this.metricsCache.clear();
    this.flagDefinitionCache.clear();
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0,
      averageAccessTime: 0
    };
    
    logger.info('All caches cleared');
  }

  /**
   * Get cache configuration
   */
  static getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  static updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.cleanupInterval) {
      this.startCleanupTimer();
    }
    
    logger.info('Cache configuration updated', { config: this.config });
  }

  /**
   * Preload cache with common patterns
   */
  static preloadCommonPatterns(): void {
    const commonPatterns = [
      'rolloutPercentage: 0',
      'rolloutPercentage: 10',
      'rolloutPercentage: 25',
      'rolloutPercentage: 50',
      'rolloutPercentage: 100',
      'environments: [\'staging\', \'production\']',
      'default: false',
      'default: true'
    ];
    
    commonPatterns.forEach(pattern => {
      const hash = this.generateContentHash(pattern);
      // Preload with minimal data to warm up cache
      this.setFlagDefinition(hash, {
        name: 'PRELOAD',
        content: pattern,
        filePath: 'preload',
        lineNumber: 1
      }, 60000); // 1 minute TTL for preloaded data
    });
    
    logger.info('Preloaded common patterns', { patternCount: commonPatterns.length });
  }

  /**
   * Shutdown cache and cleanup
   */
  static shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clear();
    logger.info('Rollout cache shutdown complete');
  }
}
