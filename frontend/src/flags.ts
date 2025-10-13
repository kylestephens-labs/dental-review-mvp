/**
 * Frontend Feature Flag Registry
 * 
 * This file contains the centralized registry for all frontend feature flags.
 * Each flag must have a name, owner, expiry date, and default value.
 * 
 * Usage: Import and use isEnabled('FLAG_NAME') to check if a flag is enabled.
 * The linter will enforce that all flags used in code are registered here.
 */

export interface FeatureFlagDefinition {
  /** The unique name of the feature flag */
  name: string;
  /** The owner/team responsible for this flag */
  owner: string;
  /** Expiry date in ISO format - flag should be removed after this date */
  expiry: string;
  /** Default enabled state */
  default: boolean;
  /** Optional description of what this flag controls */
  description?: string;
  /** Optional rollout percentage (0-100) */
  rolloutPercentage?: number;
  /** Optional environments where this flag is available */
  environments?: ('development' | 'staging' | 'production')[];
}

/**
 * Centralized registry of all frontend feature flags
 * 
 * IMPORTANT: All flags used in the codebase must be registered here.
 * The ESLint rule will fail if you use isEnabled('UNKNOWN_FLAG') without
 * registering it in this registry first.
 */
export const FRONTEND_FLAGS: Record<string, FeatureFlagDefinition> = {
  // Basic intake form (always enabled)
  BASIC_INTAKE_FORM: {
    name: 'BASIC_INTAKE_FORM',
    owner: 'frontend-team',
    expiry: '2025-12-31T23:59:59Z',
    default: true,
    description: 'Basic intake form functionality',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production']
  },

  // Enhanced intake form
  ENHANCED_INTAKE_FORM: {
    name: 'ENHANCED_INTAKE_FORM',
    owner: 'frontend-team',
    expiry: '2025-06-30T23:59:59Z',
    default: false,
    description: 'Enhanced intake form with validation and auto-save',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  },

  // Dynamic content
  DYNAMIC_CONTENT: {
    name: 'DYNAMIC_CONTENT',
    owner: 'content-team',
    expiry: '2025-08-31T23:59:59Z',
    default: false,
    description: 'Dynamic content generation based on user preferences',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  },

  // Advanced analytics
  ADVANCED_ANALYTICS: {
    name: 'ADVANCED_ANALYTICS',
    owner: 'analytics-team',
    expiry: '2025-07-31T23:59:59Z',
    default: false,
    description: 'Enhanced analytics and tracking',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  },

  // Auto-save functionality
  AUTO_SAVE: {
    name: 'AUTO_SAVE',
    owner: 'frontend-team',
    expiry: '2025-05-31T23:59:59Z',
    default: false,
    description: 'Auto-save form data to prevent data loss',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  },

  // Google Calendar integration
  GOOGLE_CALENDAR_INTEGRATION: {
    name: 'GOOGLE_CALENDAR_INTEGRATION',
    owner: 'integrations-team',
    expiry: '2025-09-30T23:59:59Z',
    default: false,
    description: 'Google Calendar OAuth and data ingestion',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  },

  // Outlook integration
  OUTLOOK_INTEGRATION: {
    name: 'OUTLOOK_INTEGRATION',
    owner: 'integrations-team',
    expiry: '2025-09-30T23:59:59Z',
    default: false,
    description: 'Outlook/Graph OAuth and data ingestion',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  },

  // CSV upload feature
  CSV_UPLOAD_FEATURE: {
    name: 'CSV_UPLOAD_FEATURE',
    owner: 'data-team',
    expiry: '2025-08-15T23:59:59Z',
    default: false,
    description: 'CSV upload endpoint for patient data',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  },

  // Front desk mode
  FRONT_DESK_MODE: {
    name: 'FRONT_DESK_MODE',
    owner: 'frontend-team',
    expiry: '2025-07-15T23:59:59Z',
    default: false,
    description: 'Front-Desk POST endpoint for manual patient entry',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  },

  // Review ingestion
  REVIEW_INGESTION: {
    name: 'REVIEW_INGESTION',
    owner: 'data-team',
    expiry: '2025-10-31T23:59:59Z',
    default: false,
    description: 'Nightly reviews fetch and upsert from Google Places',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  },

  // Weekly digest
  WEEKLY_DIGEST: {
    name: 'WEEKLY_DIGEST',
    owner: 'notifications-team',
    expiry: '2025-11-30T23:59:59Z',
    default: false,
    description: 'Weekly digest email with metrics and top quotes',
    rolloutPercentage: 0,
    environments: ['development', 'staging', 'production']
  }
};

/**
 * Check if a feature flag is enabled
 * 
 * @param flagName - The name of the feature flag to check
 * @param userId - Optional user ID for rollout percentage calculation
 * @param environment - Optional environment override
 * @returns true if the flag is enabled, false otherwise
 * 
 * @throws Error if the flag is not registered in FRONTEND_FLAGS
 */
export function isEnabled(
  flagName: string,
  userId?: string,
  environment?: string
): boolean {
  // Check if flag is registered
  const flag = FRONTEND_FLAGS[flagName];
  if (!flag) {
    throw new Error(`Feature flag '${flagName}' is not registered in FRONTEND_FLAGS registry. Please add it to frontend/src/flags.ts`);
  }

  // Check if flag has expired
  const now = new Date();
  const expiryDate = new Date(flag.expiry);
  if (now > expiryDate) {
    console.warn(`Feature flag '${flagName}' has expired on ${flag.expiry}. Consider removing it.`);
    return false;
  }

  // Check environment
  const currentEnv = environment || 
    (typeof import.meta !== 'undefined' && import.meta.env 
      ? import.meta.env.MODE 
      : process.env.NODE_ENV) || 'development';
  
  if (flag.environments && !flag.environments.includes(currentEnv as 'development' | 'staging' | 'production')) {
    return false;
  }

  // Check environment variables first (production override)
  const envFlag = typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env[`VITE_FEATURE_${flagName}`]
    : process.env[`VITE_FEATURE_${flagName}`];
  
  if (envFlag !== undefined) {
    return envFlag === 'true';
  }

  // Use default value
  if (!flag.default) {
    return false;
  }

  // Handle rollout percentage
  if (flag.rolloutPercentage !== undefined && userId) {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash) % 100 < flag.rolloutPercentage;
  }

  return flag.rolloutPercentage === 100 || flag.rolloutPercentage === undefined;
}

/**
 * Get all registered feature flags
 */
export function getAllFlags(): Record<string, FeatureFlagDefinition> {
  return { ...FRONTEND_FLAGS };
}

/**
 * Get a specific feature flag definition
 */
export function getFlag(flagName: string): FeatureFlagDefinition | undefined {
  return FRONTEND_FLAGS[flagName];
}

/**
 * Check if a flag is registered
 */
export function isFlagRegistered(flagName: string): boolean {
  return flagName in FRONTEND_FLAGS;
}
