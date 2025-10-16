// Centralized error handling for prove checks
// Provides robust error handling, categorization, and recovery strategies

import { logger } from '../../logger.js';

export enum ErrorType {
  DETECTION_ERROR = 'detection_error',
  REGISTRY_ERROR = 'registry_error',
  VALIDATION_ERROR = 'validation_error',
  FILE_READ_ERROR = 'file_read_error',
  ROLLOUT_ERROR = 'rollout_error',
  CONFIGURATION_ERROR = 'configuration_error',
  NETWORK_ERROR = 'network_error',
  PERMISSION_ERROR = 'permission_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  filePath?: string;
  flagName?: string;
  operation?: string;
  workingDirectory?: string;
  additionalInfo?: Record<string, any>;
}

export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context: ErrorContext;
  recoverable: boolean;
  suggestions: string[];
  timestamp: number;
}

export interface ErrorRecoveryResult {
  success: boolean;
  recoveredData?: any;
  fallbackUsed: boolean;
  warnings: string[];
}

export class ErrorHandler {
  private static errorCounts: Map<ErrorType, number> = new Map();
  private static errorHistory: ErrorDetails[] = [];
  private static maxHistorySize = 100;

  /**
   * Handle and categorize errors with appropriate recovery strategies
   */
  static handleError(
    error: unknown,
    context: ErrorContext,
    operation: string
  ): ErrorDetails {
    const errorDetails = this.categorizeError(error, context, operation);
    
    // Track error statistics
    this.trackError(errorDetails);
    
    // Log error with appropriate level
    this.logError(errorDetails);
    
    // Store in history
    this.addToHistory(errorDetails);
    
    return errorDetails;
  }

  /**
   * Attempt to recover from an error with fallback strategies
   */
  static async attemptRecovery(
    errorDetails: ErrorDetails,
    fallbackOperation?: () => Promise<any>
  ): Promise<ErrorRecoveryResult> {
    const result: ErrorRecoveryResult = {
      success: false,
      fallbackUsed: false,
      warnings: []
    };

    try {
      switch (errorDetails.type) {
        case ErrorType.FILE_READ_ERROR:
          result.success = await this.recoverFromFileReadError(errorDetails);
          break;
        
        case ErrorType.DETECTION_ERROR:
          result.success = await this.recoverFromDetectionError(errorDetails);
          break;
        
        case ErrorType.REGISTRY_ERROR:
          result.success = await this.recoverFromRegistryError(errorDetails);
          break;
        
        case ErrorType.VALIDATION_ERROR:
          result.success = await this.recoverFromValidationError(errorDetails);
          break;
        
        default:
          if (fallbackOperation) {
            result.recoveredData = await fallbackOperation();
            result.success = true;
            result.fallbackUsed = true;
            result.warnings.push('Used fallback operation due to error');
          }
      }
    } catch (recoveryError) {
      result.warnings.push(`Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`);
    }

    return result;
  }

  /**
   * Get error statistics for monitoring
   */
  static getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: ErrorDetails[];
    errorRate: number;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const errorsByType = Object.fromEntries(this.errorCounts) as Record<ErrorType, number>;
    const errorsBySeverity = this.groupErrorsBySeverity();
    const recentErrors = this.errorHistory.slice(-10);
    const errorRate = this.calculateErrorRate();

    return {
      totalErrors,
      errorsByType,
      errorsBySeverity,
      recentErrors,
      errorRate
    };
  }

  /**
   * Clear error history and reset counters
   */
  static clearHistory(): void {
    this.errorCounts.clear();
    this.errorHistory = [];
    logger.info('Error history cleared');
  }

  /**
   * Get error recovery suggestions for a specific error type
   */
  static getRecoverySuggestions(errorType: ErrorType): string[] {
    const suggestions: Record<ErrorType, string[]> = {
      [ErrorType.DETECTION_ERROR]: [
        'Check if ripgrep is installed and accessible',
        'Verify file permissions for the working directory',
        'Try using alternative detection method',
        'Check for file encoding issues'
      ],
      [ErrorType.REGISTRY_ERROR]: [
        'Verify flag registry files exist and are readable',
        'Check file permissions for flag configuration files',
        'Validate flag configuration syntax',
        'Try clearing flag cache and reloading'
      ],
      [ErrorType.VALIDATION_ERROR]: [
        'Check flag metadata completeness',
        'Verify required fields (owner, expiry) are present',
        'Validate date formats in expiry fields',
        'Check for typos in flag names'
      ],
      [ErrorType.FILE_READ_ERROR]: [
        'Check file permissions',
        'Verify file exists and is not corrupted',
        'Try reading with different encoding',
        'Check for file locks or access conflicts'
      ],
      [ErrorType.ROLLOUT_ERROR]: [
        'Validate rollout percentage values',
        'Check rollout configuration syntax',
        'Verify environment configurations',
        'Check for missing rollout metadata'
      ],
      [ErrorType.CONFIGURATION_ERROR]: [
        'Verify prove configuration file syntax',
        'Check environment variables',
        'Validate configuration values',
        'Check for missing required settings'
      ],
      [ErrorType.NETWORK_ERROR]: [
        'Check network connectivity',
        'Verify remote service availability',
        'Check firewall settings',
        'Try with retry mechanism'
      ],
      [ErrorType.PERMISSION_ERROR]: [
        'Check file and directory permissions',
        'Verify user has required access',
        'Check for file locks',
        'Try running with appropriate privileges'
      ],
      [ErrorType.UNKNOWN_ERROR]: [
        'Check logs for more details',
        'Try running with debug mode',
        'Verify system resources',
        'Contact support with error details'
      ]
    };

    return suggestions[errorType] || ['Check logs for more information'];
  }

  /**
   * Categorize error based on type and context
   */
  private static categorizeError(
    error: unknown,
    context: ErrorContext,
    operation: string
  ): ErrorDetails {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const originalError = error instanceof Error ? error : undefined;

    // Determine error type based on message patterns and context
    let type = ErrorType.UNKNOWN_ERROR;
    let severity = ErrorSeverity.MEDIUM;
    let recoverable = true;

    if (errorMessage.includes('ENOENT') || errorMessage.includes('file not found')) {
      type = ErrorType.FILE_READ_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
      type = ErrorType.PERMISSION_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (errorMessage.includes('ripgrep') || errorMessage.includes('detection')) {
      type = ErrorType.DETECTION_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else if (errorMessage.includes('registry') || errorMessage.includes('flag')) {
      type = ErrorType.REGISTRY_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      type = ErrorType.VALIDATION_ERROR;
      severity = ErrorSeverity.LOW;
    } else if (errorMessage.includes('rollout') || errorMessage.includes('percentage')) {
      type = ErrorType.ROLLOUT_ERROR;
      severity = ErrorSeverity.LOW;
    } else if (errorMessage.includes('config') || errorMessage.includes('configuration')) {
      type = ErrorType.CONFIGURATION_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      type = ErrorType.NETWORK_ERROR;
      severity = ErrorSeverity.MEDIUM;
    }

    // Determine if error is critical
    if (errorMessage.includes('fatal') || errorMessage.includes('critical')) {
      severity = ErrorSeverity.CRITICAL;
      recoverable = false;
    }

    return {
      type,
      severity,
      message: errorMessage,
      originalError,
      context: {
        ...context,
        operation
      },
      recoverable,
      suggestions: this.getRecoverySuggestions(type),
      timestamp: Date.now()
    };
  }

  /**
   * Track error statistics
   */
  private static trackError(errorDetails: ErrorDetails): void {
    const currentCount = this.errorCounts.get(errorDetails.type) || 0;
    this.errorCounts.set(errorDetails.type, currentCount + 1);
  }

  /**
   * Log error with appropriate level
   */
  private static logError(errorDetails: ErrorDetails): void {
    const logData = {
      type: errorDetails.type,
      severity: errorDetails.severity,
      context: errorDetails.context,
      recoverable: errorDetails.recoverable,
      suggestions: errorDetails.suggestions.slice(0, 3) // Log first 3 suggestions
    };

    switch (errorDetails.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`Critical error in ${errorDetails.context.operation}`, logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error(`High severity error in ${errorDetails.context.operation}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`Medium severity error in ${errorDetails.context.operation}`, logData);
        break;
      case ErrorSeverity.LOW:
        logger.info(`Low severity error in ${errorDetails.context.operation}`, logData);
        break;
    }
  }

  /**
   * Add error to history
   */
  private static addToHistory(errorDetails: ErrorDetails): void {
    this.errorHistory.push(errorDetails);
    
    // Keep only recent errors
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Group errors by severity
   */
  private static groupErrorsBySeverity(): Record<ErrorSeverity, number> {
    const counts: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    for (const error of this.errorHistory) {
      counts[error.severity]++;
    }

    return counts;
  }

  /**
   * Calculate error rate (errors per minute)
   */
  private static calculateErrorRate(): number {
    if (this.errorHistory.length === 0) return 0;
    
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    const recentErrors = this.errorHistory.filter(error => error.timestamp > oneMinuteAgo);
    
    return recentErrors.length;
  }

  /**
   * Recovery strategies for different error types
   */
  private static async recoverFromFileReadError(errorDetails: ErrorDetails): Promise<boolean> {
    // Try alternative file reading methods
    logger.info('Attempting file read error recovery', {
      filePath: errorDetails.context.filePath,
      suggestions: errorDetails.suggestions.slice(0, 2)
    });
    return false; // Placeholder - implement specific recovery logic
  }

  private static async recoverFromDetectionError(errorDetails: ErrorDetails): Promise<boolean> {
    // Try alternative detection methods
    logger.info('Attempting detection error recovery', {
      operation: errorDetails.context.operation,
      suggestions: errorDetails.suggestions.slice(0, 2)
    });
    return false; // Placeholder - implement specific recovery logic
  }

  private static async recoverFromRegistryError(errorDetails: ErrorDetails): Promise<boolean> {
    // Try clearing cache and reloading
    logger.info('Attempting registry error recovery', {
      operation: errorDetails.context.operation,
      suggestions: errorDetails.suggestions.slice(0, 2)
    });
    return false; // Placeholder - implement specific recovery logic
  }

  private static async recoverFromValidationError(errorDetails: ErrorDetails): Promise<boolean> {
    // Try partial validation or skip problematic flags
    logger.info('Attempting validation error recovery', {
      flagName: errorDetails.context.flagName,
      suggestions: errorDetails.suggestions.slice(0, 2)
    });
    return false; // Placeholder - implement specific recovery logic
  }
}
