// Unified flag registry system
// Provides centralized flag loading and validation from all sources

import { readFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../../logger.js';

export interface FlagMetadata {
  name: string;
  owner?: string;
  expiry?: string;
  default?: boolean;
  enabled?: boolean;
  description?: string;
  rolloutPercentage?: number;
  environments?: string[];
  createdAt?: string;
  updatedAt?: string;
  source: 'runtime' | 'frontend' | 'backend';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFlags: string[];
  invalidMetadata: string[];
}

export interface RegistryMetrics {
  totalFlags: number;
  runtimeFlags: number;
  frontendFlags: number;
  backendFlags: number;
  loadingDuration: number;
  validationDuration: number;
  errorCount: number;
  cacheHits: number;
  cacheMisses: number;
}

export class UnifiedFlagRegistry {
  private runtimeFlags: Record<string, FlagMetadata> = {};
  private frontendFlags: Record<string, FlagMetadata> = {};
  private backendFlags: Record<string, FlagMetadata> = {};
  private cache: Map<string, FlagMetadata> = new Map();
  private loadingStartTime: number = 0;
  private validationStartTime: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  /**
   * Load all flags from all sources in parallel
   */
  static async loadAllFlags(workingDirectory: string): Promise<UnifiedFlagRegistry> {
    const registry = new UnifiedFlagRegistry();
    registry.loadingStartTime = Date.now();

    try {
      // Load all flag sources in parallel
      const [runtimeFlags, frontendFlags, backendFlags] = await Promise.all([
        registry.loadRuntimeFlags(workingDirectory),
        registry.loadFrontendFlags(workingDirectory),
        registry.loadBackendFlags(workingDirectory)
      ]);

      registry.runtimeFlags = runtimeFlags;
      registry.frontendFlags = frontendFlags;
      registry.backendFlags = backendFlags;

      // Build unified cache
      registry.buildCache();

      logger.info('Unified flag registry loaded successfully', {
        runtimeFlags: Object.keys(runtimeFlags).length,
        frontendFlags: Object.keys(frontendFlags).length,
        backendFlags: Object.keys(backendFlags).length,
        totalFlags: registry.getTotalFlagCount()
      });

      return registry;

    } catch (error) {
      logger.error('Failed to load unified flag registry', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Check if a flag is registered in any registry
   */
  isRegistered(flagName: string): boolean {
    return this.cache.has(flagName) || 
           flagName in this.runtimeFlags || 
           flagName in this.frontendFlags || 
           flagName in this.backendFlags;
  }

  /**
   * Get complete metadata for a flag from any source
   */
  getFlagMetadata(flagName: string): FlagMetadata | null {
    // Check cache first
    if (this.cache.has(flagName)) {
      this.cacheHits++;
      return this.cache.get(flagName)!;
    }

    this.cacheMisses++;

    // Check all registries
    if (flagName in this.runtimeFlags) {
      return this.runtimeFlags[flagName];
    }
    if (flagName in this.frontendFlags) {
      return this.frontendFlags[flagName];
    }
    if (flagName in this.backendFlags) {
      return this.backendFlags[flagName];
    }

    return null;
  }

  /**
   * Validate flag registration and metadata
   */
  validateFlags(flags: string[]): ValidationResult {
    this.validationStartTime = Date.now();
    
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFlags: [],
      invalidMetadata: []
    };

    for (const flagName of flags) {
      const metadata = this.getFlagMetadata(flagName);
      
      if (!metadata) {
        result.isValid = false;
        result.missingFlags.push(flagName);
        result.errors.push(`Flag '${flagName}' is not registered in any registry`);
        continue;
      }

      // Validate metadata based on source
      const validationErrors = this.validateFlagMetadata(flagName, metadata);
      if (validationErrors.length > 0) {
        result.isValid = false;
        result.invalidMetadata.push(flagName);
        result.errors.push(...validationErrors);
      }

      // Check for warnings
      const warnings = this.checkFlagWarnings(flagName, metadata);
      result.warnings.push(...warnings);
    }

    return result;
  }

  /**
   * Get registry metrics for monitoring
   */
  async getRegistryMetrics(): Promise<RegistryMetrics> {
    return {
      totalFlags: this.getTotalFlagCount(),
      runtimeFlags: Object.keys(this.runtimeFlags).length,
      frontendFlags: Object.keys(this.frontendFlags).length,
      backendFlags: Object.keys(this.backendFlags).length,
      loadingDuration: Date.now() - this.loadingStartTime,
      validationDuration: this.validationStartTime > 0 ? Date.now() - this.validationStartTime : 0,
      errorCount: 0, // This would be tracked during loading
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses
    };
  }

  /**
   * Get all flags from a specific source
   */
  getFlagsBySource(source: 'runtime' | 'frontend' | 'backend'): Record<string, FlagMetadata> {
    switch (source) {
      case 'runtime':
        return { ...this.runtimeFlags };
      case 'frontend':
        return { ...this.frontendFlags };
      case 'backend':
        return { ...this.backendFlags };
      default:
        return {};
    }
  }

  /**
   * Get all flags from all sources
   */
  getAllFlags(): Record<string, FlagMetadata> {
    return {
      ...this.runtimeFlags,
      ...this.frontendFlags,
      ...this.backendFlags
    };
  }

  /**
   * Load runtime flags from src/lib/feature-flags.ts
   */
  private async loadRuntimeFlags(workingDirectory: string): Promise<Record<string, FlagMetadata>> {
    try {
      const flagsPath = join(workingDirectory, 'src', 'lib', 'feature-flags.ts');
      const content = await readFile(flagsPath, 'utf-8');
      
      const flags: Record<string, FlagMetadata> = {};
      
      // Extract featureFlagConfig.flags object using regex
      const match = content.match(/export const featureFlagConfig[^=]*=\s*{([\s\S]*?)};/);
      if (!match) {
        logger.warn('Could not find featureFlagConfig in runtime configuration');
        return flags;
      }

      // Parse flag definitions
      const flagMatches = content.matchAll(/(\w+):\s*{[\s\S]*?name:\s*['"`](\w+)['"`][\s\S]*?enabled:\s*(true|false)[\s\S]*?rolloutPercentage:\s*(\d+)[\s\S]*?description:\s*['"`]([^'"`]*)['"`][\s\S]*?createdAt:\s*['"`]([^'"`]*)['"`][\s\S]*?updatedAt:\s*['"`]([^'"`]*)['"`][\s\S]*?environments:\s*\[([\s\S]*?)\]/g);
      
      for (const match of flagMatches) {
        const [, , name, enabled, rolloutPercentage, description, createdAt, updatedAt, environments] = match;
        flags[name] = {
          name,
          enabled: enabled === 'true',
          rolloutPercentage: parseInt(rolloutPercentage, 10),
          description,
          createdAt,
          updatedAt,
          environments: environments.split(',').map(env => env.trim().replace(/['"]/g, '').replace(/[\[\]]/g, '')),
          source: 'runtime'
        };
      }

      // Fallback: extract flag names if detailed parsing failed
      if (Object.keys(flags).length === 0) {
        const flagNameMatches = content.matchAll(/(\w+):\s*{/g);
        for (const match of flagNameMatches) {
          const flagName = match[1];
          if (flagName !== 'flags' && flagName !== 'defaultRolloutPercentage' && flagName !== 'enableMetrics' && flagName !== 'enableABTesting') {
            flags[flagName] = {
              name: flagName,
              enabled: false,
              rolloutPercentage: 0,
              description: 'Feature flag',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              environments: ['development', 'staging', 'production', 'test'],
              source: 'runtime'
            };
          }
        }
      }

      return flags;

    } catch (error) {
      logger.warn('Failed to load runtime flags', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {};
    }
  }

  /**
   * Load frontend flags from frontend/src/flags.ts
   */
  private async loadFrontendFlags(workingDirectory: string): Promise<Record<string, FlagMetadata>> {
    try {
      const flagsPath = join(workingDirectory, 'frontend', 'src', 'flags.ts');
      const content = await readFile(flagsPath, 'utf-8');
      
      const flags: Record<string, FlagMetadata> = {};
      
      // Extract FRONTEND_FLAGS object using regex
      const match = content.match(/export const FRONTEND_FLAGS[^=]*=\s*{([\s\S]*?)};/);
      if (!match) {
        return flags;
      }

      // Parse flag definitions
      const flagMatches = content.matchAll(/(\w+):\s*{[\s\S]*?name:\s*['"`](\w+)['"`][\s\S]*?owner:\s*['"`]([^'"`]+)['"`][\s\S]*?expiry:\s*['"`]([^'"`]+)['"`][\s\S]*?default:\s*(true|false)[\s\S]*?description:\s*['"`]([^'"`]*)['"`][\s\S]*?rolloutPercentage:\s*(\d+)[\s\S]*?environments:\s*\[([\s\S]*?)\]/g);
      
      for (const match of flagMatches) {
        const [, , name, owner, expiry, defaultVal, description, rolloutPercentage, environments] = match;
        flags[name] = {
          name,
          owner,
          expiry,
          default: defaultVal === 'true',
          description,
          rolloutPercentage: parseInt(rolloutPercentage, 10),
          environments: environments.split(',').map(env => env.trim().replace(/['"]/g, '').replace(/[\[\]]/g, '')),
          source: 'frontend'
        };
      }

      // Fallback: extract flag names if detailed parsing failed
      if (Object.keys(flags).length === 0) {
        const flagNameMatches = content.matchAll(/(\w+):\s*{/g);
        for (const match of flagNameMatches) {
          const flagName = match[1];
          if (flagName !== 'flags' && flagName !== 'defaultRolloutPercentage' && flagName !== 'enableMetrics' && flagName !== 'enableABTesting') {
            flags[flagName] = {
              name: flagName,
              owner: 'unknown',
              expiry: '2025-12-31T23:59:59Z',
              default: false,
              description: 'Feature flag',
              rolloutPercentage: 0,
              environments: ['development', 'staging', 'production'],
              source: 'frontend'
            };
          }
        }
      }

      return flags;

    } catch (error) {
      logger.warn('Failed to load frontend flags', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {};
    }
  }

  /**
   * Load backend flags from backend/src/flags.ts
   */
  private async loadBackendFlags(workingDirectory: string): Promise<Record<string, FlagMetadata>> {
    try {
      const flagsPath = join(workingDirectory, 'backend', 'src', 'flags.ts');
      const content = await readFile(flagsPath, 'utf-8');
      
      const flags: Record<string, FlagMetadata> = {};
      
      // Extract BACKEND_FLAGS object using regex
      const match = content.match(/export const BACKEND_FLAGS[^=]*=\s*{([\s\S]*?)};/);
      if (!match) {
        return flags;
      }

      // Parse flag definitions
      const flagMatches = content.matchAll(/(\w+):\s*{[\s\S]*?name:\s*['"`](\w+)['"`][\s\S]*?owner:\s*['"`]([^'"`]+)['"`][\s\S]*?expiry:\s*['"`]([^'"`]+)['"`][\s\S]*?default:\s*(true|false)[\s\S]*?description:\s*['"`]([^'"`]*)['"`][\s\S]*?rolloutPercentage:\s*(\d+)[\s\S]*?environments:\s*\[([\s\S]*?)\]/g);
      
      for (const match of flagMatches) {
        const [, , name, owner, expiry, defaultVal, description, rolloutPercentage, environments] = match;
        flags[name] = {
          name,
          owner,
          expiry,
          default: defaultVal === 'true',
          description,
          rolloutPercentage: parseInt(rolloutPercentage, 10),
          environments: environments.split(',').map(env => env.trim().replace(/['"]/g, '').replace(/[\[\]]/g, '')),
          source: 'backend'
        };
      }

      // Fallback: extract flag names if detailed parsing failed
      if (Object.keys(flags).length === 0) {
        const flagNameMatches = content.matchAll(/(\w+):\s*{/g);
        for (const match of flagNameMatches) {
          const flagName = match[1];
          if (flagName !== 'flags' && flagName !== 'defaultRolloutPercentage' && flagName !== 'enableMetrics' && flagName !== 'enableABTesting') {
            flags[flagName] = {
              name: flagName,
              owner: 'unknown',
              expiry: '2025-12-31T23:59:59Z',
              default: false,
              description: 'Feature flag',
              rolloutPercentage: 0,
              environments: ['development', 'staging', 'production'],
              source: 'backend'
            };
          }
        }
      }

      return flags;

    } catch (error) {
      logger.warn('Failed to load backend flags', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {};
    }
  }

  /**
   * Build unified cache for fast lookups
   */
  private buildCache(): void {
    this.cache.clear();
    
    // Add all flags to cache with source priority (runtime > frontend > backend)
    const allFlags = {
      ...this.backendFlags,
      ...this.frontendFlags,
      ...this.runtimeFlags
    };

    for (const [flagName, metadata] of Object.entries(allFlags)) {
      this.cache.set(flagName, metadata);
    }
  }

  /**
   * Get total flag count across all sources
   */
  private getTotalFlagCount(): number {
    return Object.keys(this.runtimeFlags).length + 
           Object.keys(this.frontendFlags).length + 
           Object.keys(this.backendFlags).length;
  }

  /**
   * Validate flag metadata based on source requirements
   */
  private validateFlagMetadata(flagName: string, metadata: FlagMetadata): string[] {
    const errors: string[] = [];

    // Frontend and backend flags require owner and expiry
    if (metadata.source === 'frontend' || metadata.source === 'backend') {
      if (!metadata.owner || metadata.owner === 'unknown') {
        errors.push(`Flag '${flagName}' in ${metadata.source} registry is missing required 'owner' field`);
      }
      if (!metadata.expiry) {
        errors.push(`Flag '${flagName}' in ${metadata.source} registry is missing required 'expiry' field`);
      } else {
        // Check if expiry date is valid
        const expiryDate = new Date(metadata.expiry);
        if (isNaN(expiryDate.getTime())) {
          errors.push(`Flag '${flagName}' in ${metadata.source} registry has invalid expiry date: ${metadata.expiry}`);
        }
      }
    }

    // Runtime flags require enabled field
    if (metadata.source === 'runtime') {
      if (metadata.enabled === undefined) {
        errors.push(`Flag '${flagName}' in runtime registry is missing required 'enabled' field`);
      }
    }

    return errors;
  }

  /**
   * Check for flag warnings (non-critical issues)
   */
  private checkFlagWarnings(flagName: string, metadata: FlagMetadata): string[] {
    const warnings: string[] = [];

    // Check for expired flags
    if (metadata.expiry) {
      const expiryDate = new Date(metadata.expiry);
      const now = new Date();
      if (now > expiryDate) {
        warnings.push(`Flag '${flagName}' has expired on ${metadata.expiry}`);
      }
    }

    // Check for flags with no description
    if (!metadata.description || metadata.description === 'Feature flag') {
      warnings.push(`Flag '${flagName}' has no meaningful description`);
    }

    // Check for flags with 0% rollout
    if (metadata.rolloutPercentage === 0) {
      warnings.push(`Flag '${flagName}' has 0% rollout percentage`);
    }

    return warnings;
  }
}
