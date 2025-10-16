// Intelligent flag registry caching system
// Provides TTL-based caching, memory optimization, and smart invalidation

import { logger } from '../../logger.js';
import { FlagMetadata } from './flag-registry.js';

export interface CachedFlagData {
  runtimeFlags: Record<string, FlagMetadata>;
  frontendFlags: Record<string, FlagMetadata>;
  backendFlags: Record<string, FlagMetadata>;
  totalFlags: number;
  loadedAt: number;
  sourceHashes: {
    runtime: string;
    frontend: string;
    backend: string;
  };
  memoryUsage: number;
}

export interface FlagCacheMetrics {
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalLoads: number;
  averageLoadTime: number;
  memoryUsage: number;
  evictedEntries: number;
  lastCleanup: number;
  ttlHits: number;
  ttlMisses: number;
}

export class FlagCache {
  private static cache: Map<string, CachedFlagData> = new Map();
  private static maxSize: number = 10; // Maximum number of cached registries
  private static ttl: number = 2 * 60 * 1000; // 2 minutes TTL
  private static cleanupInterval: number = 30 * 1000; // 30 seconds
  private static lastCleanup: number = Date.now();
  
  // Performance tracking
  private static cacheHits: number = 0;
  private static cacheMisses: number = 0;
  private static totalLoads: number = 0;
  private static loadTimes: number[] = [];
  private static evictedEntries: number = 0;
  private static ttlHits: number = 0;
  private static ttlMisses: number = 0;

  /**
   * Get cached flag data or load fresh if not available/expired
   */
  static async getOrLoad(
    workingDirectory: string,
    loadFunction: () => Promise<{
      runtimeFlags: Record<string, FlagMetadata>;
      frontendFlags: Record<string, FlagMetadata>;
      backendFlags: Record<string, FlagMetadata>;
    }>
  ): Promise<CachedFlagData> {
    const cacheKey = this.generateCacheKey(workingDirectory);
    const now = Date.now();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.loadedAt) < this.ttl) {
      this.cacheHits++;
      this.ttlHits++;
      logger.info('Flag cache hit', {
        cacheKey,
        age: `${now - cached.loadedAt}ms`,
        totalFlags: cached.totalFlags,
        memoryUsage: `${Math.round(cached.memoryUsage / 1024)}KB`
      });
      return cached;
    }

    // Cache miss or expired
    this.cacheMisses++;
    if (cached) {
      this.ttlMisses++;
    }

    logger.info('Flag cache miss, loading fresh data', {
      cacheKey,
      reason: cached ? 'expired' : 'not found',
      ttl: `${this.ttl}ms`
    });

    // Load fresh data
    const loadStart = Date.now();
    const freshData = await loadFunction();
    const loadTime = Date.now() - loadStart;
    
    this.totalLoads++;
    this.loadTimes.push(loadTime);

    // Calculate memory usage
    const memoryUsage = this.calculateMemoryUsage(freshData);

    // Create cached entry
    const cachedData: CachedFlagData = {
      ...freshData,
      totalFlags: Object.keys(freshData.runtimeFlags).length + 
                 Object.keys(freshData.frontendFlags).length + 
                 Object.keys(freshData.backendFlags).length,
      loadedAt: now,
      sourceHashes: {
        runtime: this.generateSourceHash(freshData.runtimeFlags),
        frontend: this.generateSourceHash(freshData.frontendFlags),
        backend: this.generateSourceHash(freshData.backendFlags)
      },
      memoryUsage
    };

    // Store in cache
    this.cache.set(cacheKey, cachedData);

    // Cleanup if needed
    this.cleanupIfNeeded();

    logger.info('Flag data loaded and cached', {
      cacheKey,
      loadTime: `${loadTime}ms`,
      totalFlags: cachedData.totalFlags,
      memoryUsage: `${Math.round(memoryUsage / 1024)}KB`,
      cacheSize: this.cache.size
    });

    return cachedData;
  }

  /**
   * Invalidate cache for a specific working directory
   */
  static invalidate(workingDirectory: string): void {
    const cacheKey = this.generateCacheKey(workingDirectory);
    if (this.cache.delete(cacheKey)) {
      logger.info('Flag cache invalidated', { cacheKey });
    }
  }

  /**
   * Clear all cached data
   */
  static clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalLoads = 0;
    this.loadTimes = [];
    this.evictedEntries = 0;
    this.ttlHits = 0;
    this.ttlMisses = 0;
    this.lastCleanup = Date.now();
    
    logger.info('Flag cache cleared', { clearedEntries: size });
  }

  /**
   * Get cache metrics for monitoring
   */
  static getMetrics(): FlagCacheMetrics {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    const averageLoadTime = this.loadTimes.length > 0 
      ? this.loadTimes.reduce((sum, time) => sum + time, 0) / this.loadTimes.length 
      : 0;
    
    // Calculate total memory usage
    let totalMemoryUsage = 0;
    for (const entry of this.cache.values()) {
      totalMemoryUsage += entry.memoryUsage;
    }

    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate,
      totalLoads: this.totalLoads,
      averageLoadTime,
      memoryUsage: totalMemoryUsage,
      evictedEntries: this.evictedEntries,
      lastCleanup: this.lastCleanup,
      ttlHits: this.ttlHits,
      ttlMisses: this.ttlMisses
    };
  }

  /**
   * Get cache statistics for debugging
   */
  static getStats(): {
    cacheSize: number;
    hitRate: number;
    averageLoadTime: number;
    memoryUsage: number;
    entries: Array<{
      key: string;
      age: number;
      flags: number;
      memory: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, data]) => ({
      key: key.substring(0, 20) + '...',
      age: now - data.loadedAt,
      flags: data.totalFlags,
      memory: Math.round(data.memoryUsage / 1024)
    }));

    return {
      cacheSize: this.cache.size,
      hitRate: this.getHitRate(),
      averageLoadTime: this.loadTimes.length > 0 
        ? this.loadTimes.reduce((sum, time) => sum + time, 0) / this.loadTimes.length 
        : 0,
      memoryUsage: Array.from(this.cache.values())
        .reduce((sum, entry) => sum + entry.memoryUsage, 0),
      entries
    };
  }

  /**
   * Warm up cache with pre-loaded data
   */
  static async warmup(
    workingDirectory: string,
    loadFunction: () => Promise<{
      runtimeFlags: Record<string, FlagMetadata>;
      frontendFlags: Record<string, FlagMetadata>;
      backendFlags: Record<string, FlagMetadata>;
    }>
  ): Promise<void> {
    logger.info('Warming up flag cache...');
    await this.getOrLoad(workingDirectory, loadFunction);
    
    const metrics = this.getMetrics();
    logger.info('Flag cache warmup complete', metrics);
  }

  /**
   * Generate cache key for working directory
   */
  private static generateCacheKey(workingDirectory: string): string {
    // Use a simple hash of the working directory path
    return Buffer.from(workingDirectory).toString('base64').substring(0, 16);
  }

  /**
   * Generate source hash for change detection
   */
  private static generateSourceHash(flags: Record<string, FlagMetadata>): string {
    const flagNames = Object.keys(flags).sort();
    const flagData = flagNames.map(name => `${name}:${flags[name].source}:${flags[name].updatedAt || ''}`);
    return Buffer.from(flagData.join('|')).toString('base64').substring(0, 16);
  }

  /**
   * Calculate memory usage of flag data
   */
  private static calculateMemoryUsage(data: {
    runtimeFlags: Record<string, FlagMetadata>;
    frontendFlags: Record<string, FlagMetadata>;
    backendFlags: Record<string, FlagMetadata>;
  }): number {
    // Rough estimation based on object size
    const runtimeSize = JSON.stringify(data.runtimeFlags).length;
    const frontendSize = JSON.stringify(data.frontendFlags).length;
    const backendSize = JSON.stringify(data.backendFlags).length;
    
    // Add overhead for object structure
    return (runtimeSize + frontendSize + backendSize) * 1.5;
  }

  /**
   * Get cache hit rate
   */
  private static getHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  /**
   * Cleanup expired and least-used entries
   */
  private static cleanupIfNeeded(): void {
    const now = Date.now();
    
    // Only cleanup if interval has passed or cache is too large
    if (now - this.lastCleanup < this.cleanupInterval && this.cache.size <= this.maxSize) {
      return;
    }

    this.lastCleanup = now;
    
    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.loadedAt > this.ttl) {
        this.cache.delete(key);
        this.evictedEntries++;
      }
    }

    // If still too large, remove least recently used entries
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].loadedAt - b[1].loadedAt);
      
      const toRemove = entries.slice(0, this.cache.size - this.maxSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
        this.evictedEntries++;
      }
    }

    logger.info('Flag cache cleanup completed', {
      cacheSize: this.cache.size,
      evictedEntries: this.evictedEntries,
      hitRate: this.getHitRate()
    });
  }

  /**
   * Check if cache is healthy
   */
  static isHealthy(): boolean {
    const metrics = this.getMetrics();
    return metrics.hitRate > 50 && metrics.memoryUsage < 10 * 1024 * 1024; // 10MB limit
  }

  /**
   * Get cache health status
   */
  static getHealthStatus(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (metrics.hitRate < 50) {
      issues.push(`Low hit rate: ${metrics.hitRate.toFixed(1)}%`);
      recommendations.push('Consider increasing TTL or improving cache key strategy');
    }

    if (metrics.memoryUsage > 10 * 1024 * 1024) {
      issues.push(`High memory usage: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
      recommendations.push('Consider reducing max cache size or TTL');
    }

    if (metrics.evictedEntries > metrics.totalLoads * 0.5) {
      issues.push(`High eviction rate: ${metrics.evictedEntries} evictions`);
      recommendations.push('Consider increasing max cache size');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}
