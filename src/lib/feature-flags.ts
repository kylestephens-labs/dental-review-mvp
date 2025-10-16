export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  environments: ('development' | 'staging' | 'production' | 'test')[]; // 'test' bypasses env override to honor config mutations
  dependencies?: string[];
  metrics?: {
    successRate?: number;
    errorRate?: number;
    performanceImpact?: number;
  };
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  defaultRolloutPercentage: number;
  enableMetrics: boolean;
  enableABTesting: boolean;
}

// Default configuration
export const featureFlagConfig: FeatureFlagConfig = {
  flags: {
    // Existing features (always enabled)
    BASIC_INTAKE_FORM: {
      name: 'BASIC_INTAKE_FORM',
      enabled: true,
      rolloutPercentage: 100,
      description: 'Basic intake form functionality',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },
    
    // New features (disabled by default)
    ENHANCED_INTAKE_FORM: {
      name: 'ENHANCED_INTAKE_FORM',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Enhanced intake form with validation and auto-save',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },
    
    DYNAMIC_CONTENT: {
      name: 'DYNAMIC_CONTENT',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Dynamic content generation based on user preferences',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },
    
    ADVANCED_ANALYTICS: {
      name: 'ADVANCED_ANALYTICS',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Enhanced analytics and tracking',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },
    
    AUTO_SAVE: {
      name: 'AUTO_SAVE',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Auto-save form data to prevent data loss',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },

    COMMIT_SIZE_CHECK: {
      name: 'COMMIT_SIZE_CHECK',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Kill switch for commit size check in prove quality gates',
      createdAt: '2025-01-18T00:00:00Z',
      updatedAt: '2025-01-18T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },

    // Dental Project Feature Flags (from tasks.md analysis)
    GOOGLE_CALENDAR_INTEGRATION: {
      name: 'GOOGLE_CALENDAR_INTEGRATION',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Google Calendar OAuth and data ingestion',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },

    OUTLOOK_INTEGRATION: {
      name: 'OUTLOOK_INTEGRATION',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Outlook/Graph OAuth and data ingestion',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },

    CSV_UPLOAD_FEATURE: {
      name: 'CSV_UPLOAD_FEATURE',
      enabled: false,
      rolloutPercentage: 0,
      description: 'CSV upload endpoint for patient data',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },

    FRONT_DESK_MODE: {
      name: 'FRONT_DESK_MODE',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Front-Desk POST endpoint for manual patient entry',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },

    REVIEW_INGESTION: {
      name: 'REVIEW_INGESTION',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Nightly reviews fetch and upsert from Google Places',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    },

    WEEKLY_DIGEST: {
      name: 'WEEKLY_DIGEST',
      enabled: false,
      rolloutPercentage: 0,
      description: 'Weekly digest email with metrics and top quotes',
      createdAt: '2024-10-12T00:00:00Z',
      updatedAt: '2024-10-12T00:00:00Z',
      environments: ['development', 'staging', 'production', 'test']
    }
  },
  
  defaultRolloutPercentage: 0,
  enableMetrics: true,
  enableABTesting: false
};

// Feature flag utilities
export function isFeatureEnabled(
  flagName: string, 
  userId?: string,
  environment?: string
): boolean {
  // Check environment variables first (all environments)
  // Handle both Vite (import.meta.env) and Node.js (process.env) environments
  const envFlag = typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env[`VITE_FEATURE_${flagName}`]
    : process.env[`VITE_FEATURE_${flagName}`];
  if (envFlag !== undefined) {
    return envFlag === 'true';
  }

  // Fall back to local config (development/test)
  const flag = featureFlagConfig.flags[flagName];
  if (!flag) {
    console.warn(`Feature flag '${flagName}' not found`);
    return false;
  }
  
  // Check environment
  const currentEnv = environment || 
    (typeof import.meta !== 'undefined' && import.meta.env 
      ? import.meta.env.MODE 
      : process.env.NODE_ENV) || 'development';
  if (!flag.environments.includes(currentEnv as 'development' | 'staging' | 'production' | 'test')) {
    return false;
  }
  
  if (!flag.enabled) return false;
  
  // Handle rollout percentage
  if (flag.rolloutPercentage !== undefined && userId) {
    // FNV-1a hash function for consistent user distribution
    let hash = 2166136261;
    for (let i = 0; i < userId.length; i++) {
      hash ^= userId.charCodeAt(i);
      hash *= 16777619;
    }
    return Math.abs(hash) % 100 < flag.rolloutPercentage;
  }
  
  // If no userId provided, honor rolloutPercentage: 100% = enabled, 0% = disabled, undefined = enabled
  return flag.rolloutPercentage === 100 || flag.rolloutPercentage === undefined;
}

export function updateFeatureFlag(
  flagName: string, 
  updates: Partial<FeatureFlag>
): void {
  const flag = featureFlagConfig.flags[flagName];
  if (flag) {
    featureFlagConfig.flags[flagName] = {
      ...flag,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }
}

export function getFeatureFlag(flagName: string): FeatureFlag | undefined {
  return featureFlagConfig.flags[flagName];
}

export function getAllFeatureFlags(): Record<string, FeatureFlag> {
  return { ...featureFlagConfig.flags };
}
