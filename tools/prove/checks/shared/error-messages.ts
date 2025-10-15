/**
 * Shared error message utilities for prove checks
 * Provides consistent, actionable error messages across all checks
 */

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
}

export class ErrorMessageBuilder {
  /**
   * Build kill-switch specific error messages with actionable suggestions
   */
  static buildKillSwitchError(context: ErrorContext): string {
    const { filePath, lineNumber, detectedPatterns = [], suggestions = [] } = context;
    
    let message = "🚨 Feature commit requires a kill switch for safety.\n\n";
    
    if (filePath) {
      message += `📍 File: ${filePath}`;
      if (lineNumber) {
        message += `:${lineNumber}`;
      }
      message += "\n\n";
    }
    
    message += "💡 Add one of these kill-switch patterns:\n";
    
    if (suggestions.length > 0) {
      suggestions.forEach((suggestion, index) => {
        message += `   ${index + 1}. ${suggestion}\n`;
      });
    } else {
      // Default suggestions if none provided
      message += `   1. const { isEnabled } = useFeatureFlag("FEATURE_NAME");\n`;
      message += `   2. if (isEnabled("FEATURE_NAME")) { /* feature code */ }\n`;
      message += `   3. process.env.FEATURE_NAME_ENABLED === "true"\n`;
      message += `   4. const KILL_SWITCH_FEATURE_NAME = true;\n`;
      message += `   5. config.features.featureName\n`;
    }
    
    if (detectedPatterns.length > 0) {
      message += `\n🔍 Detected patterns: ${detectedPatterns.join(", ")}\n`;
    }
    
    message += "\n📚 Learn more: https://docs.example.com/feature-flags#kill-switches";
    
    return message;
  }

  /**
   * Build feature flag lint specific error messages
   */
  static buildFlagLintError(context: ErrorContext): string {
    const { 
      unregisteredFlags = [], 
      missingOwner = [], 
      missingExpiry = [], 
      missingMetadata = [],
      invalidValues = [],
      filePath 
    } = context;
    
    let message = "🚨 Feature flag validation failed.\n\n";
    
    if (filePath) {
      message += `📍 File: ${filePath}\n\n`;
    }
    
    const errors = [];
    
    if (unregisteredFlags.length > 0) {
      errors.push(`❌ Unregistered flags: ${unregisteredFlags.join(", ")}`);
      errors.push(`   → Add these flags to the flag registry first`);
    }
    
    if (missingOwner.length > 0) {
      errors.push(`❌ Flags missing owner: ${missingOwner.join(", ")}`);
      errors.push(`   → Add owner: "owner": "team-name" to flag metadata`);
    }
    
    if (missingExpiry.length > 0) {
      errors.push(`❌ Flags missing expiry: ${missingExpiry.join(", ")}`);
      errors.push(`   → Add expiry: "expiry": "2024-12-31" to flag metadata`);
    }
    
    if (missingMetadata.length > 0) {
      errors.push(`❌ Flags missing metadata: ${missingMetadata.join(", ")}`);
      errors.push(`   → Add complete metadata: owner, expiry, description`);
    }
    
    if (invalidValues.length > 0) {
      errors.push(`❌ Invalid flag values: ${invalidValues.join(", ")}`);
      errors.push(`   → Check flag values match expected format`);
    }
    
    if (errors.length === 0) {
      message += "✅ All flags are properly configured!";
    } else {
      message += errors.join("\n\n");
    }
    
    message += "\n\n📚 Learn more: https://docs.example.com/feature-flags#metadata";
    
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
