// Structured logs (CI friendly)
// Supports both human-readable and JSON output modes

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
  }>;
  totalMs: number;
  success: boolean;
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

  // Generate final prove report
  generateReport(mode: string, checks: Array<{ id: string; ok: boolean; ms: number; reason?: string }>): ProveResult {
    const totalMs = Date.now() - this.startTime;
    const success = checks.every(check => check.ok);

    const report: ProveResult = {
      mode,
      checks,
      totalMs,
      success
    };

    if (this.isJsonMode) {
      console.log(JSON.stringify({ type: 'prove-report', ...report }));
    } else {
      this.result(`Prove completed in ${totalMs}ms`, { success, mode, checks: checks.length });
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