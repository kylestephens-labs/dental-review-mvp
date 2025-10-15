import { describe, test, expect, beforeEach } from 'vitest';
import { 
  isFeatureEnabled, 
  updateFeatureFlag, 
  getFeatureFlag,
  featureFlagConfig 
} from '../lib/feature-flags';

describe('Feature Flags', () => {
  beforeEach(() => {
    // Reset feature flags to default state
    Object.keys(featureFlagConfig.flags).forEach(flagName => {
      const flag = featureFlagConfig.flags[flagName];
      updateFeatureFlag(flagName, {
        enabled: flagName === 'BASIC_INTAKE_FORM',
        rolloutPercentage: flagName === 'BASIC_INTAKE_FORM' ? 100 : 0,
        environments: ['development', 'staging', 'production', 'test']
      });
    });
  });

  test('should enable basic intake form by default', () => {
    // Don't reset in this test, use the default state
    expect(isFeatureEnabled('BASIC_INTAKE_FORM')).toBe(true);
  });

  test('should disable new features by default', () => {
    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM')).toBe(false);
    expect(isFeatureEnabled('DYNAMIC_CONTENT')).toBe(false);
  });

  test('should handle rollout percentages correctly', () => {
    updateFeatureFlag('ENHANCED_INTAKE_FORM', {
      enabled: true,
      rolloutPercentage: 50
    });

    // Test with different user IDs
    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM', 'user1')).toBe(true);
    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM', 'user2')).toBe(false);
  });

  test('should update feature flags correctly', () => {
    updateFeatureFlag('ENHANCED_INTAKE_FORM', {
      enabled: true,
      rolloutPercentage: 100
    });

    const flag = getFeatureFlag('ENHANCED_INTAKE_FORM');
    expect(flag?.enabled).toBe(true);
    expect(flag?.rolloutPercentage).toBe(100);
  });

  test('should handle unknown feature flags gracefully', () => {
    expect(isFeatureEnabled('UNKNOWN_FLAG')).toBe(false);
  });

  test('should respect environment settings', () => {
    updateFeatureFlag('ENHANCED_INTAKE_FORM', {
      enabled: true,
      rolloutPercentage: 100,
      environments: ['development']
    });

    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM', undefined, 'development')).toBe(true);
    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM', undefined, 'production')).toBe(false);
  });

  test('should handle 100% rollout correctly', () => {
    updateFeatureFlag('ENHANCED_INTAKE_FORM', {
      enabled: true,
      rolloutPercentage: 100
    });

    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM', 'user1')).toBe(true);
    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM', 'user2')).toBe(true);
    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM', 'user3')).toBe(true);
  });

  test('should handle 0% rollout correctly', () => {
    updateFeatureFlag('ENHANCED_INTAKE_FORM', {
      enabled: true,
      rolloutPercentage: 0
    });

    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM', 'user1')).toBe(false);
    expect(isFeatureEnabled('ENHANCED_INTAKE_FORM', 'user2')).toBe(false);
  });

  test('should get all feature flags', () => {
    const flags = Object.keys(featureFlagConfig.flags);
    expect(flags).toContain('BASIC_INTAKE_FORM');
    expect(flags).toContain('ENHANCED_INTAKE_FORM');
    expect(flags).toContain('DYNAMIC_CONTENT');
    expect(flags).toContain('ADVANCED_ANALYTICS');
    expect(flags).toContain('AUTO_SAVE');
  });

  test('should update timestamp when flag is modified', () => {
    const originalTime = getFeatureFlag('ENHANCED_INTAKE_FORM')?.updatedAt;
    
    // Wait a bit to ensure timestamp difference
    setTimeout(() => {
      updateFeatureFlag('ENHANCED_INTAKE_FORM', {
        enabled: true
      });
      
      const updatedTime = getFeatureFlag('ENHANCED_INTAKE_FORM')?.updatedAt;
      expect(updatedTime).not.toBe(originalTime);
    }, 100);
  });
});
