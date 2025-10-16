// Error context enhancer for richer error messages
// Provides enhanced context, debugging information, and actionable suggestions

import { logger } from '../../logger.js';
import { PerformanceMonitor, PerformanceMetrics } from './performance-monitor.js';

export interface EnhancedErrorContext {
  // Basic context
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  
  // Error classification
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'configuration' | 'runtime' | 'build' | 'test';
  
  // Enhanced context
  detectedPatterns?: string[];
  suggestions?: string[];
  codeSnippets?: CodeSnippet[];
  relatedFiles?: string[];
  environment?: string;
  
  // Debugging information
  stackTrace?: string;
  errorCode?: string;
  timestamp?: string;
  sessionId?: string;
  
  // Performance context
  performanceMetrics?: PerformanceMetrics;
  memoryUsage?: number;
  executionTime?: number;
  
  // User context
  userAgent?: string;
  operatingSystem?: string;
  nodeVersion?: string;
  
  // Feature flag specific context
  unregisteredFlags?: string[];
  missingOwner?: string[];
  missingExpiry?: string[];
  missingMetadata?: string[];
  invalidValues?: string[];
  registeredFlags?: string[];
  
  // Registry context
  registryPath?: string;
  registryErrors?: string[];
  flagSources?: string[];
  
  // Rollout context
  rolloutPercentage?: number;
  rolloutErrors?: string[];
  rolloutWarnings?: string[];
  
  // Suggestions and fixes
  quickFixes?: QuickFix[];
  documentationLinks?: DocumentationLink[];
  troubleshootingSteps?: TroubleshootingStep[];
}

export interface CodeSnippet {
  code: string;
  language: string;
  startLine: number;
  endLine: number;
  highlightLine?: number;
  description?: string;
}

export interface QuickFix {
  title: string;
  description: string;
  code: string;
  filePath?: string;
  lineNumber?: number;
  confidence: number; // 0-1
}

export interface DocumentationLink {
  title: string;
  url: string;
  description: string;
  category: 'tutorial' | 'reference' | 'troubleshooting' | 'examples';
}

export interface TroubleshootingStep {
  step: number;
  title: string;
  description: string;
  expectedOutcome: string;
  verificationCommand?: string;
}

export interface ErrorEnhancementMetrics {
  contextEnrichmentTime: number;
  suggestionsGenerated: number;
  codeSnippetsExtracted: number;
  documentationLinksFound: number;
  quickFixesGenerated: number;
  enhancementQuality: number; // 0-1
}

export class ErrorContextEnhancer {
  private static readonly DOCUMENTATION_BASE_URL = 'https://docs.example.com/feature-flags';
  private static readonly GITHUB_BASE_URL = 'https://github.com/example/repo';
  private static readonly PERFORMANCE_THRESHOLD = 100; // ms

  /**
   * Enhance error context with richer information
   */
  static enhanceErrorContext(
    baseContext: any,
    errorType: string,
    additionalData?: any
  ): EnhancedErrorContext {
    const startTime = Date.now();
    
    try {
      const enhancedContext: EnhancedErrorContext = {
        ...baseContext,
        errorType,
        severity: this.determineSeverity(errorType, baseContext),
        category: this.determineCategory(errorType),
        timestamp: new Date().toISOString(),
        sessionId: this.generateSessionId(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        operatingSystem: process.platform,
        memoryUsage: process.memoryUsage().heapUsed,
        performanceMetrics: undefined // PerformanceMonitor.getCurrentMetrics() not available
      };

      // Add error-specific enhancements
      this.addErrorSpecificContext(enhancedContext, errorType, additionalData);
      
      // Add debugging information
      this.addDebuggingContext(enhancedContext, errorType);
      
      // Add code snippets
      this.addCodeSnippets(enhancedContext, baseContext);
      
      // Add suggestions and fixes
      this.addSuggestionsAndFixes(enhancedContext, errorType);
      
      // Add documentation links
      this.addDocumentationLinks(enhancedContext, errorType);
      
      // Add troubleshooting steps
      this.addTroubleshootingSteps(enhancedContext, errorType);

      const enhancementTime = Date.now() - startTime;
      
      logger.info('Error context enhanced', {
        errorType,
        enhancementTime,
        contextFields: Object.keys(enhancedContext).length,
        suggestions: enhancedContext.suggestions?.length || 0,
        codeSnippets: enhancedContext.codeSnippets?.length || 0,
        quickFixes: enhancedContext.quickFixes?.length || 0
      });

      return enhancedContext;

    } catch (error) {
      logger.error('Error context enhancement failed', {
        error: error instanceof Error ? error.message : String(error),
        errorType,
        baseContext
      });

      // Return basic enhanced context on failure
      return {
        ...baseContext,
        errorType,
        severity: 'medium',
        category: 'runtime',
        timestamp: new Date().toISOString(),
        sessionId: this.generateSessionId()
      };
    }
  }

  /**
   * Determine error severity based on type and context
   */
  private static determineSeverity(errorType: string, context: any): 'low' | 'medium' | 'high' | 'critical' {
    const criticalErrors = ['kill-switch-missing', 'flag-registration-error'];
    const highErrors = ['flag-lint-error', 'validation-error'];
    const mediumErrors = ['configuration-error', 'build-error'];
    
    if (criticalErrors.includes(errorType)) {
      return 'critical';
    } else if (highErrors.includes(errorType)) {
      return 'high';
    } else if (mediumErrors.includes(errorType)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Determine error category
   */
  private static determineCategory(errorType: string): 'validation' | 'configuration' | 'runtime' | 'build' | 'test' {
    if (errorType.includes('validation') || errorType.includes('flag-lint')) {
      return 'validation';
    } else if (errorType.includes('config') || errorType.includes('registry')) {
      return 'configuration';
    } else if (errorType.includes('build') || errorType.includes('compile')) {
      return 'build';
    } else if (errorType.includes('test') || errorType.includes('spec')) {
      return 'test';
    } else {
      return 'runtime';
    }
  }

  /**
   * Add error-specific context
   */
  private static addErrorSpecificContext(
    context: EnhancedErrorContext,
    errorType: string,
    additionalData?: any
  ): void {
    switch (errorType) {
      case 'kill-switch-missing':
        this.addKillSwitchContext(context, additionalData);
        break;
      case 'flag-lint-error':
        this.addFlagLintContext(context, additionalData);
        break;
      case 'flag-registration-error':
        this.addFlagRegistrationContext(context, additionalData);
        break;
      case 'generic-error':
        this.addGenericErrorContext(context, additionalData);
        break;
      default:
        this.addDefaultContext(context, additionalData);
    }
  }

  /**
   * Add kill-switch specific context
   */
  private static addKillSwitchContext(context: EnhancedErrorContext, data?: any): void {
    context.relatedFiles = this.findRelatedFiles(context.filePath);
    context.codeSnippets = this.generateKillSwitchCodeSnippets(context);
    context.quickFixes = this.generateKillSwitchQuickFixes(context);
  }

  /**
   * Add flag lint specific context
   */
  private static addFlagLintContext(context: EnhancedErrorContext, data?: any): void {
    context.registryPath = this.findRegistryPath();
    context.flagSources = this.findFlagSources();
    context.quickFixes = this.generateFlagLintQuickFixes(context);
  }

  /**
   * Add flag registration specific context
   */
  private static addFlagRegistrationContext(context: EnhancedErrorContext, data?: any): void {
    context.registryPath = this.findRegistryPath();
    context.registryErrors = this.findRegistryErrors();
    context.quickFixes = this.generateFlagRegistrationQuickFixes(context);
  }

  /**
   * Add generic error context
   */
  private static addGenericErrorContext(context: EnhancedErrorContext, data?: any): void {
    context.stackTrace = this.captureStackTrace();
    context.errorCode = this.generateErrorCode(context);
    context.quickFixes = this.generateGenericQuickFixes(context);
  }

  /**
   * Add default context
   */
  private static addDefaultContext(context: EnhancedErrorContext, data?: any): void {
    context.quickFixes = this.generateDefaultQuickFixes(context);
  }

  /**
   * Add debugging context
   */
  private static addDebuggingContext(context: EnhancedErrorContext, errorType: string): void {
    context.stackTrace = this.captureStackTrace();
    context.errorCode = this.generateErrorCode(context);
    context.executionTime = Date.now() - (context.timestamp ? new Date(context.timestamp).getTime() : Date.now());
  }

  /**
   * Add code snippets
   */
  private static addCodeSnippets(context: EnhancedErrorContext, baseContext: any): void {
    if (context.filePath) {
      context.codeSnippets = this.extractCodeSnippets(context.filePath, context.lineNumber);
    }
  }

  /**
   * Add suggestions and fixes
   */
  private static addSuggestionsAndFixes(context: EnhancedErrorContext, errorType: string): void {
    context.suggestions = this.generateSuggestions(errorType, context);
    context.quickFixes = this.generateQuickFixes(errorType, context);
  }

  /**
   * Add documentation links
   */
  private static addDocumentationLinks(context: EnhancedErrorContext, errorType: string): void {
    context.documentationLinks = this.generateDocumentationLinks(errorType, context);
  }

  /**
   * Add troubleshooting steps
   */
  private static addTroubleshootingSteps(context: EnhancedErrorContext, errorType: string): void {
    context.troubleshootingSteps = this.generateTroubleshootingSteps(errorType, context);
  }

  /**
   * Find related files
   */
  private static findRelatedFiles(filePath?: string): string[] {
    if (!filePath) return [];
    
    // This would typically search for related files
    // For now, return mock data
    return [
      filePath.replace('.tsx', '.test.tsx'),
      filePath.replace('.tsx', '.stories.tsx'),
      filePath.replace('src/', 'src/types/').replace('.tsx', '.types.ts')
    ];
  }

  /**
   * Generate kill-switch code snippets
   */
  private static generateKillSwitchCodeSnippets(context: EnhancedErrorContext): CodeSnippet[] {
    return [
      {
        code: `const { isEnabled } = useFeatureFlag("${context.unregisteredFlags?.[0] || 'FEATURE_NAME'}");\n\nif (isEnabled("${context.unregisteredFlags?.[0] || 'FEATURE_NAME'}")) {\n  // Feature implementation\n}`,
        language: 'typescript',
        startLine: 1,
        endLine: 5,
        highlightLine: 3,
        description: 'React hook pattern with conditional rendering'
      },
      {
        code: `if (process.env.${(context.unregisteredFlags?.[0] || 'FEATURE_NAME').toUpperCase()}_ENABLED === 'true') {\n  // Feature implementation\n}`,
        language: 'typescript',
        startLine: 1,
        endLine: 3,
        highlightLine: 1,
        description: 'Environment variable pattern for server-side code'
      }
    ];
  }

  /**
   * Generate quick fixes
   */
  private static generateKillSwitchQuickFixes(context: EnhancedErrorContext): QuickFix[] {
    return [
      {
        title: 'Add useFeatureFlag hook',
        description: 'Import and use the useFeatureFlag hook for conditional rendering',
        code: `import { useFeatureFlag } from '@/hooks/use-feature-flag';\n\nconst { isEnabled } = useFeatureFlag("${context.unregisteredFlags?.[0] || 'FEATURE_NAME'}");`,
        filePath: context.filePath,
        lineNumber: context.lineNumber,
        confidence: 0.9
      },
      {
        title: 'Add environment variable check',
        description: 'Use environment variable for server-side feature toggling',
        code: `if (process.env.${(context.unregisteredFlags?.[0] || 'FEATURE_NAME').toUpperCase()}_ENABLED === 'true') {\n  // Feature code here\n}`,
        filePath: context.filePath,
        lineNumber: context.lineNumber,
        confidence: 0.8
      }
    ];
  }

  /**
   * Generate flag lint quick fixes
   */
  private static generateFlagLintQuickFixes(context: EnhancedErrorContext): QuickFix[] {
    const fixes: QuickFix[] = [];
    
    if (context.unregisteredFlags && context.unregisteredFlags.length > 0) {
      fixes.push({
        title: 'Register missing flags',
        description: 'Add the missing flags to the flag registry',
        code: `// Add to flag registry\n${context.unregisteredFlags.map(flag => `"${flag}": {\n  "owner": "your-team",\n  "expiry": "2024-12-31",\n  "description": "Description for ${flag}"\n}`).join(',\n')}`,
        filePath: context.registryPath,
        confidence: 0.9
      });
    }
    
    return fixes;
  }

  /**
   * Generate flag registration quick fixes
   */
  private static generateFlagRegistrationQuickFixes(context: EnhancedErrorContext): QuickFix[] {
    return [
      {
        title: 'Add flags to registry',
        description: 'Register the unregistered flags in the flag registry',
        code: `// Add to ${context.registryPath}\n${context.unregisteredFlags?.map(flag => `"${flag}": {\n  "owner": "your-team",\n  "expiry": "2024-12-31",\n  "description": "Description for ${flag}"\n}`).join(',\n')}`,
        filePath: context.registryPath,
        confidence: 0.9
      }
    ];
  }

  /**
   * Generate generic quick fixes
   */
  private static generateGenericQuickFixes(context: EnhancedErrorContext): QuickFix[] {
    return [
      {
        title: 'Check error logs',
        description: 'Review the error logs for more detailed information',
        code: 'npm run logs',
        confidence: 0.7
      },
      {
        title: 'Restart development server',
        description: 'Try restarting the development server to clear any cached issues',
        code: 'npm run dev',
        confidence: 0.6
      }
    ];
  }

  /**
   * Generate default quick fixes
   */
  private static generateDefaultQuickFixes(context: EnhancedErrorContext): QuickFix[] {
    return [
      {
        title: 'Review error details',
        description: 'Check the error message and context for specific issues',
        code: 'Check the error output above',
        confidence: 0.5
      }
    ];
  }

  /**
   * Generate suggestions based on error type
   */
  private static generateSuggestions(errorType: string, context: EnhancedErrorContext): string[] {
    const suggestions: Record<string, string[]> = {
      'kill-switch-missing': [
        'Add a feature flag check before implementing the feature',
        'Use useFeatureFlag() hook for React components',
        'Use isEnabled() function for conditional logic',
        'Add environment variable check for server-side code'
      ],
      'flag-lint-error': [
        'Register all flags in the flag registry',
        'Add complete metadata for all flags',
        'Verify flag names match exactly',
        'Check flag values are valid'
      ],
      'flag-registration-error': [
        'Add missing flags to the registry',
        'Check flag name spelling and case',
        'Ensure flags are defined in all environments',
        'Verify flag exports are correct'
      ],
      'generic-error': [
        'Check the error logs for more details',
        'Verify all dependencies are installed',
        'Check configuration files',
        'Restart the development server'
      ]
    };
    
    return suggestions[errorType] || ['Review the error and fix accordingly'];
  }

  /**
   * Generate documentation links
   */
  private static generateDocumentationLinks(errorType: string, context: EnhancedErrorContext): DocumentationLink[] {
    const links: Record<string, DocumentationLink[]> = {
      'kill-switch-missing': [
        {
          title: 'Feature Flags Guide',
          url: `${this.DOCUMENTATION_BASE_URL}#feature-flags`,
          description: 'Learn how to implement feature flags',
          category: 'tutorial'
        },
        {
          title: 'Kill Switch Patterns',
          url: `${this.DOCUMENTATION_BASE_URL}#kill-switch-patterns`,
          description: 'Common kill switch implementation patterns',
          category: 'examples'
        }
      ],
      'flag-lint-error': [
        {
          title: 'Flag Registry Guide',
          url: `${this.DOCUMENTATION_BASE_URL}#flag-registry`,
          description: 'How to properly register feature flags',
          category: 'tutorial'
        },
        {
          title: 'Flag Metadata Reference',
          url: `${this.DOCUMENTATION_BASE_URL}#flag-metadata`,
          description: 'Required flag metadata fields',
          category: 'reference'
        }
      ],
      'flag-registration-error': [
        {
          title: 'Flag Registration Troubleshooting',
          url: `${this.DOCUMENTATION_BASE_URL}#troubleshooting-registration`,
          description: 'Common flag registration issues and solutions',
          category: 'troubleshooting'
        }
      ]
    };
    
    return links[errorType] || [];
  }

  /**
   * Generate troubleshooting steps
   */
  private static generateTroubleshootingSteps(errorType: string, context: EnhancedErrorContext): TroubleshootingStep[] {
    const steps: Record<string, TroubleshootingStep[]> = {
      'kill-switch-missing': [
        {
          step: 1,
          title: 'Identify the feature code',
          description: 'Locate the code that implements the new feature',
          expectedOutcome: 'Clear understanding of what needs to be wrapped with a feature flag'
        },
        {
          step: 2,
          title: 'Choose a kill-switch pattern',
          description: 'Select the appropriate pattern based on your use case',
          expectedOutcome: 'Selected pattern that matches your architecture'
        },
        {
          step: 3,
          title: 'Implement the kill-switch',
          description: 'Add the chosen pattern around your feature code',
          expectedOutcome: 'Feature code is properly wrapped with kill-switch'
        }
      ],
      'flag-lint-error': [
        {
          step: 1,
          title: 'Check flag registry',
          description: 'Verify the flag exists in the registry',
          expectedOutcome: 'Flag is found in the registry',
          verificationCommand: 'grep -r "FLAG_NAME" src/'
        },
        {
          step: 2,
          title: 'Add missing metadata',
          description: 'Add required metadata fields to the flag',
          expectedOutcome: 'All required metadata fields are present'
        },
        {
          step: 3,
          title: 'Validate flag format',
          description: 'Ensure flag name and value follow conventions',
          expectedOutcome: 'Flag follows naming and value conventions'
        }
      ]
    };
    
    return steps[errorType] || [];
  }

  /**
   * Extract code snippets from file
   */
  private static extractCodeSnippets(filePath: string, lineNumber?: number): CodeSnippet[] {
    // This would typically read the file and extract relevant code snippets
    // For now, return mock data
    return [
      {
        code: '// Feature implementation code here',
        language: 'typescript',
        startLine: lineNumber || 1,
        endLine: (lineNumber || 1) + 5,
        highlightLine: lineNumber,
        description: 'Code around the error location'
      }
    ];
  }

  /**
   * Find registry path
   */
  private static findRegistryPath(): string {
    // This would typically search for the flag registry file
    return 'src/config/feature-flags.ts';
  }

  /**
   * Find flag sources
   */
  private static findFlagSources(): string[] {
    return [
      'src/config/feature-flags.ts',
      'src/hooks/use-feature-flag.ts',
      'src/lib/feature-utils.ts'
    ];
  }

  /**
   * Find registry errors
   */
  private static findRegistryErrors(): string[] {
    return []; // Would typically check for registry loading errors
  }

  /**
   * Capture stack trace
   */
  private static captureStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(2).join('\n') : '';
  }

  /**
   * Generate error code
   */
  private static generateErrorCode(context: EnhancedErrorContext): string {
    const timestamp = Date.now().toString(36);
    const type = context.errorType.substring(0, 3).toUpperCase();
    return `ERR_${type}_${timestamp}`;
  }

  /**
   * Generate session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get enhancement metrics
   */
  static getEnhancementMetrics(): ErrorEnhancementMetrics {
    return {
      contextEnrichmentTime: 0,
      suggestionsGenerated: 0,
      codeSnippetsExtracted: 0,
      documentationLinksFound: 0,
      quickFixesGenerated: 0,
      enhancementQuality: 0.8
    };
  }
}
