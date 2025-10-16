// Centralized performance monitoring utility
// Provides structured performance tracking and regression detection

import { logger } from '../../logger.js';

export interface PerformanceMetrics {
  // Timing metrics
  startTime: number;
  endTime: number;
  duration: number;
  
  // Memory metrics
  memoryStart: NodeJS.MemoryUsage;
  memoryEnd: NodeJS.MemoryUsage;
  memoryDelta: number;
  peakMemory: number;
  
  // Operation-specific metrics
  operationsCount: number;
  errorsCount: number;
  cacheHits: number;
  cacheMisses: number;
  
  // Performance thresholds
  thresholds: {
    maxDuration: number;
    maxMemoryDelta: number;
    maxOperationsPerSecond: number;
  };
  
  // Regression detection
  regression: {
    durationRegression: boolean;
    memoryRegression: boolean;
    performanceRegression: boolean;
    baseline?: PerformanceBaseline;
  };
}

export interface PerformanceBaseline {
  operation: string;
  averageDuration: number;
  averageMemoryDelta: number;
  averageOperationsPerSecond: number;
  sampleCount: number;
  lastUpdated: string;
  thresholds: {
    duration: number;
    memory: number;
    operations: number;
  };
}

export interface PerformanceSnapshot {
  timestamp: string;
  operation: string;
  metrics: PerformanceMetrics;
  context: {
    mode: string;
    filesProcessed: number;
    concurrency: number;
  };
}

export class PerformanceMonitor {
  private static baselines: Map<string, PerformanceBaseline> = new Map();
  private static snapshots: PerformanceSnapshot[] = [];
  private static readonly MAX_SNAPSHOTS = 100;
  private static readonly BASELINE_SAMPLE_SIZE = 10;

  /**
   * Start monitoring a performance operation
   */
  static startOperation(operation: string): PerformanceMetrics {
    const startTime = Date.now();
    const memoryStart = process.memoryUsage();
    
    return {
      startTime,
      endTime: 0,
      duration: 0,
      memoryStart,
      memoryEnd: memoryStart,
      memoryDelta: 0,
      peakMemory: memoryStart.heapUsed,
      operationsCount: 0,
      errorsCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      thresholds: {
        maxDuration: 5000, // 5 seconds
        maxMemoryDelta: 50 * 1024 * 1024, // 50MB
        maxOperationsPerSecond: 1000
      },
      regression: {
        durationRegression: false,
        memoryRegression: false,
        performanceRegression: false
      }
    };
  }

  /**
   * End monitoring and calculate final metrics
   */
  static endOperation(metrics: PerformanceMetrics, operation: string): PerformanceMetrics {
    const endTime = Date.now();
    const memoryEnd = process.memoryUsage();
    
    metrics.endTime = endTime;
    metrics.duration = endTime - metrics.startTime;
    metrics.memoryEnd = memoryEnd;
    metrics.memoryDelta = memoryEnd.heapUsed - metrics.memoryStart.heapUsed;
    metrics.peakMemory = Math.max(metrics.peakMemory, memoryEnd.heapUsed);
    
    // Calculate operations per second
    const operationsPerSecond = metrics.operationsCount > 0 
      ? (metrics.operationsCount / (metrics.duration / 1000))
      : 0;
    
    // Check for regressions
    const baseline = this.getBaseline(operation);
    if (baseline) {
      metrics.regression.baseline = baseline;
      metrics.regression.durationRegression = metrics.duration > baseline.thresholds.duration;
      metrics.regression.memoryRegression = metrics.memoryDelta > baseline.thresholds.memory;
      metrics.regression.performanceRegression = operationsPerSecond < baseline.thresholds.operations;
    }
    
    // Store snapshot
    this.storeSnapshot(operation, metrics);
    
    // Update baseline
    this.updateBaseline(operation, metrics);
    
    return metrics;
  }

  /**
   * Record an operation within the current monitoring session
   */
  static recordOperation(metrics: PerformanceMetrics): void {
    metrics.operationsCount++;
  }

  /**
   * Record an error within the current monitoring session
   */
  static recordError(metrics: PerformanceMetrics): void {
    metrics.errorsCount++;
  }

  /**
   * Record cache hit/miss within the current monitoring session
   */
  static recordCacheHit(metrics: PerformanceMetrics): void {
    metrics.cacheHits++;
  }

  static recordCacheMiss(metrics: PerformanceMetrics): void {
    metrics.cacheMisses++;
  }

  /**
   * Get performance baseline for an operation
   */
  static getBaseline(operation: string): PerformanceBaseline | undefined {
    return this.baselines.get(operation);
  }

  /**
   * Get all performance baselines
   */
  static getAllBaselines(): Map<string, PerformanceBaseline> {
    return new Map(this.baselines);
  }

  /**
   * Get recent performance snapshots
   */
  static getRecentSnapshots(operation?: string, limit: number = 10): PerformanceSnapshot[] {
    const filtered = operation 
      ? this.snapshots.filter(s => s.operation === operation)
      : this.snapshots;
    
    return filtered.slice(-limit);
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  static isPerformanceAcceptable(metrics: PerformanceMetrics): boolean {
    return metrics.duration <= metrics.thresholds.maxDuration &&
           metrics.memoryDelta <= metrics.thresholds.maxMemoryDelta &&
           metrics.errorsCount === 0;
  }

  /**
   * Get performance summary for reporting
   */
  static getPerformanceSummary(): {
    totalOperations: number;
    averageDuration: number;
    totalMemoryDelta: number;
    regressionCount: number;
    baselineCount: number;
  } {
    const recentSnapshots = this.getRecentSnapshots(undefined, 50);
    
    if (recentSnapshots.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        totalMemoryDelta: 0,
        regressionCount: 0,
        baselineCount: this.baselines.size
      };
    }

    const totalDuration = recentSnapshots.reduce((sum, s) => sum + s.metrics.duration, 0);
    const totalMemoryDelta = recentSnapshots.reduce((sum, s) => sum + s.metrics.memoryDelta, 0);
    const regressionCount = recentSnapshots.filter(s => 
      s.metrics.regression.durationRegression || 
      s.metrics.regression.memoryRegression || 
      s.metrics.regression.performanceRegression
    ).length;

    return {
      totalOperations: recentSnapshots.length,
      averageDuration: totalDuration / recentSnapshots.length,
      totalMemoryDelta,
      regressionCount,
      baselineCount: this.baselines.size
    };
  }

  /**
   * Store performance snapshot
   */
  private static storeSnapshot(operation: string, metrics: PerformanceMetrics): void {
    const snapshot: PerformanceSnapshot = {
      timestamp: new Date().toISOString(),
      operation,
      metrics: { ...metrics },
      context: {
        mode: 'functional', // This would be passed from context
        filesProcessed: 0, // This would be passed from context
        concurrency: 4 // This would be passed from context
      }
    };

    this.snapshots.push(snapshot);
    
    // Keep only recent snapshots
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-this.MAX_SNAPSHOTS);
    }
  }

  /**
   * Update performance baseline for an operation
   */
  private static updateBaseline(operation: string, metrics: PerformanceMetrics): void {
    const existing = this.baselines.get(operation);
    const operationsPerSecond = metrics.operationsCount > 0 
      ? (metrics.operationsCount / (metrics.duration / 1000))
      : 0;

    if (!existing) {
      // Create new baseline
      this.baselines.set(operation, {
        operation,
        averageDuration: metrics.duration,
        averageMemoryDelta: metrics.memoryDelta,
        averageOperationsPerSecond: operationsPerSecond,
        sampleCount: 1,
        lastUpdated: new Date().toISOString(),
        thresholds: {
          duration: metrics.duration * 1.5, // 50% tolerance
          memory: metrics.memoryDelta * 2, // 100% tolerance
          operations: operationsPerSecond * 0.8 // 20% tolerance
        }
      });
    } else {
      // Update existing baseline using exponential moving average
      const alpha = 0.1; // Smoothing factor
      const newBaseline: PerformanceBaseline = {
        operation,
        averageDuration: (1 - alpha) * existing.averageDuration + alpha * metrics.duration,
        averageMemoryDelta: (1 - alpha) * existing.averageMemoryDelta + alpha * metrics.memoryDelta,
        averageOperationsPerSecond: (1 - alpha) * existing.averageOperationsPerSecond + alpha * operationsPerSecond,
        sampleCount: existing.sampleCount + 1,
        lastUpdated: new Date().toISOString(),
        thresholds: {
          duration: Math.max(existing.thresholds.duration, metrics.duration * 1.5),
          memory: Math.max(existing.thresholds.memory, metrics.memoryDelta * 2),
          operations: Math.min(existing.thresholds.operations, operationsPerSecond * 0.8)
        }
      };
      
      this.baselines.set(operation, newBaseline);
    }
  }

  /**
   * Log performance metrics with structured output
   */
  static logPerformanceMetrics(operation: string, metrics: PerformanceMetrics): void {
    const summary = this.getPerformanceSummary();
    
    logger.info(`Performance metrics for ${operation}`, {
      duration: `${metrics.duration}ms`,
      memoryDelta: `${Math.round(metrics.memoryDelta / 1024 / 1024)}MB`,
      operations: metrics.operationsCount,
      errors: metrics.errorsCount,
      cacheHitRate: metrics.cacheHits + metrics.cacheMisses > 0 
        ? `${Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)}%`
        : 'N/A',
      regression: {
        duration: metrics.regression.durationRegression,
        memory: metrics.regression.memoryRegression,
        performance: metrics.regression.performanceRegression
      },
      acceptable: this.isPerformanceAcceptable(metrics),
      summary
    });

    // Log regression warnings
    if (metrics.regression.durationRegression) {
      logger.warn(`Performance regression detected: ${operation} duration exceeded baseline`, {
        current: `${metrics.duration}ms`,
        baseline: `${metrics.regression.baseline?.averageDuration}ms`,
        threshold: `${metrics.regression.baseline?.thresholds.duration}ms`
      });
    }

    if (metrics.regression.memoryRegression) {
      logger.warn(`Memory regression detected: ${operation} memory usage exceeded baseline`, {
        current: `${Math.round(metrics.memoryDelta / 1024 / 1024)}MB`,
        baseline: `${Math.round((metrics.regression.baseline?.averageMemoryDelta || 0) / 1024 / 1024)}MB`,
        threshold: `${Math.round((metrics.regression.baseline?.thresholds.memory || 0) / 1024 / 1024)}MB`
      });
    }
  }

  /**
   * Clear all performance data (useful for testing)
   */
  static clear(): void {
    this.baselines.clear();
    this.snapshots = [];
  }
}
