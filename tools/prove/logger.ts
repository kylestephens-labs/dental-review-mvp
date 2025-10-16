// Structured logs (CI friendly)
// Supports both human-readable and JSON output modes

import { writeFileSync } from 'fs';
import { join } from 'path';

export interface LogEntry {
  level: 'header' | 'info' | 'success' | 'error' | 'result';
  message: string;
  timestamp: string;
  data?: unknown;
}

export interface ProveResult {
  mode: string;
  checks: Array<{
    id: string;
    ok: boolean;
    ms: number;
    reason?: string;
    // Enhanced performance tracking
    performanceMetrics?: {
      memoryDelta?: number;
      operationsCount?: number;
      cacheHitRate?: number;
      regressionDetected?: boolean;
    };
  }>;
  totalMs: number;
  success: boolean;
  // Enhanced performance summary
  performanceSummary?: {
    totalOperations: number;
    averageDuration: number;
    totalMemoryDelta: number;
    regressionCount: number;
    baselineCount: number;
  };
}

/**
 * Pure helper function to format prove report data
 */
export function formatReport({ 
  mode, 
  checks, 
  totalMs, 
  performanceSummary 
}: { 
  mode: string; 
  checks: Array<{ 
    id: string; 
    ok: boolean; 
    ms: number; 
    reason?: string;
    performanceMetrics?: {
      memoryDelta?: number;
      operationsCount?: number;
      cacheHitRate?: number;
      regressionDetected?: boolean;
    };
  }>; 
  totalMs: number;
  performanceSummary?: {
    totalOperations: number;
    averageDuration: number;
    totalMemoryDelta: number;
    regressionCount: number;
    baselineCount: number;
  };
}): ProveResult {
  const success = checks.every(check => check.ok);

  return {
    mode,
    checks,
    totalMs,
    success,
    performanceSummary
  };
}

class Logger {
  private isJsonMode: boolean;
  private startTime: number;
  private entries: LogEntry[] = [];

  constructor() {
    this.isJsonMode = process.env.PROVE_JSON === '1';
    this.startTime = Date.now();
  }

  private createEntry(level: LogEntry['level'], message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    };
  }

  private log(entry: LogEntry): void {
    this.entries.push(entry);

    if (this.isJsonMode) {
      // JSON mode: output structured JSON
      console.log(JSON.stringify(entry));
    } else {
      // Human mode: output formatted text
      const prefix = this.getPrefix(entry.level);
      const message = entry.data ? `${entry.message} ${JSON.stringify(entry.data)}` : entry.message;
      console.log(`${prefix} ${message}`);
    }
  }

  private getPrefix(level: LogEntry['level']): string {
    switch (level) {
      case 'header':
        return '🔍';
      case 'info':
        return 'ℹ️ ';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'result':
        return '📊';
      default:
        return '  ';
    }
  }

  header(message: string, data?: unknown): void {
    this.log(this.createEntry('header', message, data));
  }

  info(message: string, data?: unknown): void {
    this.log(this.createEntry('info', message, data));
  }

  success(message: string, data?: unknown): void {
    this.log(this.createEntry('success', message, data));
  }

  error(message: string, data?: unknown): void {
    this.log(this.createEntry('error', message, data));
  }

  result(message: string, data?: unknown): void {
    this.log(this.createEntry('result', message, data));
  }

  warn(message: string, data?: unknown): void {
    this.log(this.createEntry('info', `⚠️  ${message}`, data));
  }

  // Enhanced performance logging
  performance(operation: string, metrics: {
    duration: number;
    memoryDelta: number;
    operationsCount: number;
    cacheHitRate?: number;
    regressionDetected?: boolean;
    baseline?: {
      duration: number;
      memory: number;
      operations: number;
    };
  }): void {
    const performanceData = {
      operation,
      duration: `${metrics.duration}ms`,
      memoryDelta: `${Math.round(metrics.memoryDelta / 1024 / 1024)}MB`,
      operations: metrics.operationsCount,
      cacheHitRate: metrics.cacheHitRate ? `${Math.round(metrics.cacheHitRate)}%` : 'N/A',
      regression: metrics.regressionDetected || false,
      baseline: metrics.baseline ? {
        duration: `${metrics.baseline.duration}ms`,
        memory: `${Math.round(metrics.baseline.memory / 1024 / 1024)}MB`,
        operations: metrics.baseline.operations
      } : null
    };

    this.log(this.createEntry('info', `📊 Performance: ${operation}`, performanceData));
  }

  // Generate final prove report
  generateReport(
    mode: string, 
    checks: Array<{ 
      id: string; 
      ok: boolean; 
      ms: number; 
      reason?: string;
      performanceMetrics?: {
        memoryDelta?: number;
        operationsCount?: number;
        cacheHitRate?: number;
        regressionDetected?: boolean;
      };
    }>,
    performanceSummary?: {
      totalOperations: number;
      averageDuration: number;
      totalMemoryDelta: number;
      regressionCount: number;
      baselineCount: number;
    }
  ): ProveResult {
    const totalMs = Date.now() - this.startTime;
    const report = formatReport({ mode, checks, totalMs, performanceSummary });

    // Write report to JSON file
    try {
      const reportPath = join(process.cwd(), 'prove-report.json');
      writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
      this.info(`Prove report written to prove-report.json`);
    } catch (error) {
      this.warn(`Failed to write prove-report.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (this.isJsonMode) {
      console.log(JSON.stringify({ type: 'prove-report', ...report }));
    } else {
      const performanceInfo = performanceSummary ? 
        ` | Performance: ${performanceSummary.totalOperations} ops, ${Math.round(performanceSummary.averageDuration)}ms avg, ${performanceSummary.regressionCount} regressions` : '';
      this.result(`Prove completed in ${totalMs}ms${performanceInfo}`, { 
        success: report.success, 
        mode, 
        checks: checks.length,
        performance: performanceSummary
      });
    }

    return report;
  }

  // Get all log entries (useful for testing)
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  // Clear entries (useful for testing)
  clear(): void {
    this.entries = [];
    this.startTime = Date.now();
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };