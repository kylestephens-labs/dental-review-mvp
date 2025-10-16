/**
 * Shared error message utilities for prove checks
 * Provides consistent, actionable error messages across all checks
 */

import { ErrorContextEnhancer, type EnhancedErrorContext } from './error-context-enhancer.js';
import { logger } from '../../logger.js';

export interface ErrorContext {
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  detectedPatterns?: string[];
  suggestions?: string[];
  unregisteredFlags?: string[];
  missingOwner?: string[];
  missingExpiry?: string[];
  missingMetadata?: string[];
  invalidValues?: string[];
  registeredFlags?: string[];
}

export class ErrorMessageBuilder {
  /**
   * Build enhanced kill-switch specific error messages with actionable suggestions
   */
  static buildKillSwitchError(context: ErrorContext): string {
    const enhancedContext = ErrorContextEnhancer.enhanceErrorContext(context, 'kill-switch-missing');
    return this.buildEnhancedKillSwitchError(enhancedContext);
  }

  /**
   * Build enhanced kill-switch error with rich context
   */
  private static buildEnhancedKillSwitchError(context: EnhancedErrorContext): string {
    const { filePath, lineNumber, detectedPatterns = [], suggestions = [], codeSnippets = [], quickFixes = [], documentationLinks = [], troubleshootingSteps = [] } = context;
    
    let message = this.buildErrorHeader('Feature commit requires a kill switch for safety', context);
    
    // Add file location with enhanced formatting
    if (filePath) {
      message += this.formatFileLocation(filePath, lineNumber);
    }
    
    // Add severity indicator
    message += this.formatSeverityIndicator(context.severity);
    
    // Add detected patterns with better formatting
    if (detectedPatterns.length > 0) {
      message += `\n🔍 Detected patterns: ${this.formatPatternList(detectedPatterns)}\n`;
    }
    
    // Add code snippets
    if (codeSnippets.length > 0) {
      message += "\n💻 Code examples:\n";
      codeSnippets.forEach((snippet, index) => {
        message += `\n${index + 1}. ${snippet.description || 'Example'}\n`;
        message += this.formatCodeBlock(snippet.code, snippet.language);
      });
    }
    
    // Add suggestions with better formatting
    message += "\n💡 Recommended kill-switch patterns:\n";
    const displaySuggestions = suggestions.length > 0 ? suggestions : this.getDefaultKillSwitchSuggestions();
    displaySuggestions.forEach((suggestion, index) => {
      message += `   ${index + 1}. ${suggestion}\n`;
    });
    
    // Add quick fixes
    if (quickFixes.length > 0) {
      message += "\n⚡ Quick fixes:\n";
      quickFixes.forEach((fix, index) => {
        message += `   ${index + 1}. ${fix.title} (${Math.round(fix.confidence * 100)}% confidence)\n`;
        message += `      ${fix.description}\n`;
        if (fix.code) {
          message += `      ${this.formatCodeBlock(fix.code, 'typescript', true)}\n`;
        }
      });
    }
    
    // Add troubleshooting steps
    if (troubleshootingSteps.length > 0) {
      message += "\n🔧 Troubleshooting steps:\n";
      troubleshootingSteps.forEach(step => {
        message += `   ${step.step}. ${step.title}\n`;
        message += `      ${step.description}\n`;
        if (step.expectedOutcome) {
          message += `      Expected: ${step.expectedOutcome}\n`;
        }
        if (step.verificationCommand) {
          message += `      Verify: ${step.verificationCommand}\n`;
        }
      });
    }
    
    // Add documentation links
    if (documentationLinks.length > 0) {
      message += "\n📚 Documentation:\n";
      documentationLinks.forEach(link => {
        message += `   • ${link.title}: ${link.url}\n`;
        message += `     ${link.description}\n`;
      });
    }
    
    return message;
  }

  /**
   * Build enhanced feature flag lint specific error messages
   */
  static buildFlagLintError(context: ErrorContext): string {
    const enhancedContext = ErrorContextEnhancer.enhanceErrorContext(context, 'flag-lint-error');
    return this.buildEnhancedFlagLintError(enhancedContext);
  }

  /**
   * Build enhanced flag lint error with rich context
   */
  private static buildEnhancedFlagLintError(context: EnhancedErrorContext): string {
    const { 
      unregisteredFlags = [], 
      missingOwner = [], 
      missingExpiry = [], 
      missingMetadata = [],
      invalidValues = [],
      filePath,
      quickFixes = [],
      documentationLinks = [],
      troubleshootingSteps = []
    } = context;
    
    let message = this.buildErrorHeader('Feature flag validation failed', context);
    
    if (filePath) {
      message += this.formatFileLocation(filePath);
    }
    
    message += this.formatSeverityIndicator(context.severity);
    
    const errors = [];
    
    if (unregisteredFlags.length > 0) {
      errors.push(`❌ Unregistered flags: ${this.formatFlagList(unregisteredFlags)}`);
      errors.push(`   → Add these flags to the flag registry first`);
    }
    
    if (missingOwner.length > 0) {
      errors.push(`❌ Flags missing owner: ${this.formatFlagList(missingOwner)}`);
      errors.push(`   → Add owner: "owner": "team-name" to flag metadata`);
    }
    
    if (missingExpiry.length > 0) {
      errors.push(`❌ Flags missing expiry: ${this.formatFlagList(missingExpiry)}`);
      errors.push(`   → Add expiry: "expiry": "2024-12-31" to flag metadata`);
    }
    
    if (missingMetadata.length > 0) {
      errors.push(`❌ Flags missing metadata: ${this.formatFlagList(missingMetadata)}`);
      errors.push(`   → Add complete metadata: owner, expiry, description`);
    }
    
    if (invalidValues.length > 0) {
      errors.push(`❌ Invalid flag values: ${this.formatFlagList(invalidValues)}`);
      errors.push(`   → Check flag values match expected format`);
    }
    
    if (errors.length === 0) {
      message += "✅ All flags are properly configured!";
    } else {
      message += errors.join("\n\n");
    }
    
    // Add quick fixes
    if (quickFixes.length > 0) {
      message += "\n\n⚡ Quick fixes:\n";
      quickFixes.forEach((fix, index) => {
        message += `   ${index + 1}. ${fix.title} (${Math.round(fix.confidence * 100)}% confidence)\n`;
        message += `      ${fix.description}\n`;
        if (fix.code) {
          message += `      ${this.formatCodeBlock(fix.code, 'typescript', true)}\n`;
        }
      });
    }
    
    // Add troubleshooting steps
    if (troubleshootingSteps.length > 0) {
      message += "\n🔧 Troubleshooting steps:\n";
      troubleshootingSteps.forEach(step => {
        message += `   ${step.step}. ${step.title}\n`;
        message += `      ${step.description}\n`;
        if (step.expectedOutcome) {
          message += `      Expected: ${step.expectedOutcome}\n`;
        }
        if (step.verificationCommand) {
          message += `      Verify: ${step.verificationCommand}\n`;
        }
      });
    }
    
    // Add documentation links
    if (documentationLinks.length > 0) {
      message += "\n📚 Documentation:\n";
      documentationLinks.forEach(link => {
        message += `   • ${link.title}: ${link.url}\n`;
        message += `     ${link.description}\n`;
      });
    }
    
    return message;
  }

  /**
   * Build flag registration validation error messages
   */
  static buildFlagRegistrationError(context: ErrorContext): string {
    const { unregisteredFlags = [], filePath, lineNumber } = context;
    
    let message = "🚨 Kill-switch flags not registered in flag registry.\n\n";
    
    if (filePath) {
      message += `📍 File: ${filePath}`;
      if (lineNumber) {
        message += `:${lineNumber}`;
      }
      message += "\n\n";
    }
    
    message += `❌ Unregistered flags: ${unregisteredFlags.join(", ")}\n\n`;
    message += "💡 Fix this by:\n";
    message += `   1. Adding flags to the flag registry\n`;
    message += `   2. Ensuring flags are properly defined in all environments\n`;
    message += `   3. Verifying flag names match exactly\n\n`;
    message += "📚 Learn more: https://docs.example.com/feature-flags#registration";
    
    return message;
  }

  /**
   * Get pattern-specific suggestions for kill-switch implementations
   */
  static getKillSwitchSuggestions(pattern: string): string[] {
    const suggestions: Record<string, string[]> = {
      'useFeatureFlag': [
        'const { isEnabled } = useFeatureFlag("FEATURE_NAME");',
        'if (isEnabled("FEATURE_NAME")) { /* feature code */ }'
      ],
      'isEnabled': [
        'if (isEnabled("FEATURE_NAME")) { /* feature code */ }',
        'const enabled = isEnabled("FEATURE_NAME");'
      ],
      'isFeatureEnabled': [
        'if (isFeatureEnabled("FEATURE_NAME")) { /* feature code */ }',
        'const enabled = isFeatureEnabled("FEATURE_NAME");'
      ],
      'envVar': [
        'process.env.FEATURE_NAME_ENABLED === "true"',
        'if (process.env.FEATURE_NAME_ENABLED) { /* feature code */ }'
      ],
      'killSwitch': [
        'const KILL_SWITCH_FEATURE_NAME = true;',
        'if (KILL_SWITCH_FEATURE_NAME) { /* feature code */ }'
      ],
      'config': [
        'config.features.featureName',
        'if (config.features.featureName) { /* feature code */ }'
      ],
      'toggle': [
        'toggle.enableFeatureName',
        'if (toggle.enableFeatureName) { /* feature code */ }'
      ],
      'import': [
        'import { useFeatureFlag } from "@/hooks/use-feature-flag";',
        'import { isEnabled } from "@/lib/feature-flags";'
      ],
      'rollout': [
        'rolloutPercentage > 0',
        'if (rolloutPercentage > 0) { /* feature code */ }'
      ]
    };
    
    return suggestions[pattern] || [
      'Add a feature flag check to enable/disable this feature',
      'Use useFeatureFlag("FEATURE_NAME") or isEnabled("FEATURE_NAME")',
      'Add environment variable: process.env.FEATURE_NAME_ENABLED'
    ];
  }

  /**
   * Build generic error message with context
   */
  static buildGenericError(message: string, context: ErrorContext): string {
    const { filePath, lineNumber, columnNumber } = context;
    
    let fullMessage = `🚨 ${message}\n\n`;
    
    if (filePath) {
      fullMessage += `📍 File: ${filePath}`;
      if (lineNumber) {
        fullMessage += `:${lineNumber}`;
        if (columnNumber) {
          fullMessage += `:${columnNumber}`;
        }
      }
      fullMessage += "\n\n";
    }
    
    return fullMessage;
  }

  /**
   * Build success message with helpful information
   */
  static buildSuccessMessage(message: string, context: ErrorContext): string {
    const { detectedPatterns = [], registeredFlags = [] } = context;
    
    let successMessage = `✅ ${message}\n\n`;
    
    if (detectedPatterns.length > 0) {
      successMessage += `🔍 Detected patterns: ${detectedPatterns.join(", ")}\n`;
    }
    
    if (registeredFlags.length > 0) {
      successMessage += `📋 Registered flags: ${registeredFlags.join(", ")}\n`;
    }
    
    return successMessage;
  }

  /**
   * Format file location for error messages
   */
  static formatFileLocation(filePath: string, lineNumber?: number, columnNumber?: number): string {
    let location = filePath;
    if (lineNumber) {
      location += `:${lineNumber}`;
      if (columnNumber) {
        location += `:${columnNumber}`;
      }
    }
    return location;
  }

  /**
   * Build actionable fix suggestions based on error type
   */
  static buildFixSuggestions(errorType: string, context: ErrorContext): string[] {
    const suggestions: Record<string, string[]> = {
      'kill-switch-missing': [
        'Add a feature flag check before implementing the feature',
        'Use useFeatureFlag() hook for React components',
        'Use isEnabled() function for conditional logic',
        'Add environment variable check for server-side code',
        'Create a KILL_SWITCH constant for simple toggles'
      ],
      'flag-unregistered': [
        'Add the flag to the flag registry',
        'Check flag name spelling and case',
        'Ensure flag is defined in all environments',
        'Verify flag is exported from the registry'
      ],
      'flag-missing-metadata': [
        'Add owner field to flag metadata',
        'Add expiry date to flag metadata',
        'Add description to flag metadata',
        'Ensure all required fields are present'
      ],
      'flag-invalid-format': [
        'Check flag name follows naming convention',
        'Verify flag value is valid',
        'Ensure flag type matches expected format',
        'Check for typos in flag definition'
      ]
    };
    
    return suggestions[errorType] || ['Review the error details and fix accordingly'];
  }

  /**
   * Build error header with consistent formatting
   */
  private static buildErrorHeader(title: string, context: EnhancedErrorContext): string {
    const severityEmoji = this.getSeverityEmoji(context.severity);
    const categoryBadge = this.getCategoryBadge(context.category);
    
    let header = `${severityEmoji} ${title}`;
    if (categoryBadge) {
      header += ` ${categoryBadge}`;
    }
    header += "\n\n";
    
    return header;
  }

  /**
   * Format file location with enhanced styling
   */
  private static formatFileLocation(filePath: string, lineNumber?: number, columnNumber?: number): string {
    let location = `📍 File: ${filePath}`;
    if (lineNumber) {
      location += `:${lineNumber}`;
      if (columnNumber) {
        location += `:${columnNumber}`;
      }
    }
    return location + "\n\n";
  }

  /**
   * Format severity indicator
   */
  private static formatSeverityIndicator(severity: string): string {
    const severityMap: Record<string, string> = {
      'low': '🟢 Low severity',
      'medium': '🟡 Medium severity',
      'high': '🟠 High severity',
      'critical': '🔴 Critical severity'
    };
    
    return `\n${severityMap[severity] || '⚠️ Unknown severity'}\n\n`;
  }

  /**
   * Format pattern list with better readability
   */
  private static formatPatternList(patterns: string[]): string {
    if (patterns.length === 0) return 'None detected';
    if (patterns.length === 1) return patterns[0];
    if (patterns.length <= 3) return patterns.join(', ');
    return `${patterns.slice(0, 2).join(', ')} and ${patterns.length - 2} more`;
  }

  /**
   * Format flag list with better readability
   */
  private static formatFlagList(flags: string[]): string {
    if (flags.length === 0) return 'None';
    if (flags.length === 1) return `\`${flags[0]}\``;
    if (flags.length <= 3) return flags.map(f => `\`${f}\``).join(', ');
    return `${flags.slice(0, 2).map(f => `\`${f}\``).join(', ')} and ${flags.length - 2} more`;
  }

  /**
   * Format code block with optional inline styling
   */
  private static formatCodeBlock(code: string, language: string = 'typescript', inline: boolean = false): string {
    if (inline) {
      return `\`${code}\``;
    }
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  /**
   * Get severity emoji
   */
  private static getSeverityEmoji(severity: string): string {
    const emojiMap: Record<string, string> = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🟠',
      'critical': '🔴'
    };
    return emojiMap[severity] || '⚠️';
  }

  /**
   * Get category badge
   */
  private static getCategoryBadge(category: string): string {
    const badgeMap: Record<string, string> = {
      'validation': '[VALIDATION]',
      'configuration': '[CONFIG]',
      'runtime': '[RUNTIME]',
      'build': '[BUILD]',
      'test': '[TEST]'
    };
    return badgeMap[category] || '';
  }

  /**
   * Get default kill-switch suggestions
   */
  private static getDefaultKillSwitchSuggestions(): string[] {
    return [
      'const { isEnabled } = useFeatureFlag("FEATURE_NAME");',
      'if (isEnabled("FEATURE_NAME")) { /* feature code */ }',
      'process.env.FEATURE_NAME_ENABLED === "true"',
      'const KILL_SWITCH_FEATURE_NAME = true;',
      'config.features.featureName'
    ];
  }
}

/**
 * Utility functions for common error message patterns
 */
export class ErrorMessageUtils {
  /**
   * Extract file path and line number from error context
   */
  static extractLocation(context: ErrorContext): string {
    if (!context.filePath) return '';
    
    let location = context.filePath;
    if (context.lineNumber) {
      location += `:${context.lineNumber}`;
      if (context.columnNumber) {
        location += `:${context.columnNumber}`;
      }
    }
    return location;
  }

  /**
   * Format list of items for display in error messages
   */
  static formatList(items: string[], maxItems: number = 5): string {
    if (items.length === 0) return '';
    
    const displayItems = items.slice(0, maxItems);
    const hasMore = items.length > maxItems;
    
    let formatted = displayItems.join(', ');
    if (hasMore) {
      formatted += ` (and ${items.length - maxItems} more)`;
    }
    
    return formatted;
  }

  /**
   * Create a code block for suggestions
   */
  static formatCodeBlock(code: string, language: string = 'typescript'): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  /**
   * Create a bulleted list for suggestions
   */
  static formatBulletList(items: string[]): string {
    return items.map(item => `• ${item}`).join('\n');
  }
}
