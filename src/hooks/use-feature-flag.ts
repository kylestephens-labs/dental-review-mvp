import { useState, useEffect } from 'react';
import { isFeatureEnabled, getFeatureFlag, type FeatureFlag } from '@/lib/feature-flags';

export function useFeatureFlag(flagName: string, userId?: string) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [flag, setFlag] = useState<FeatureFlag | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlag = () => {
      const flagData = getFeatureFlag(flagName);
      const enabled = isFeatureEnabled(flagName, userId);
      
      setFlag(flagData);
      setIsEnabled(enabled);
      setLoading(false);
    };

    checkFlag();
    
    // Listen for feature flag updates (if using external service)
    const interval = setInterval(checkFlag, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [flagName, userId]);

  return {
    isEnabled,
    flag,
    loading,
    // Helper methods
    isDisabled: !isEnabled,
    rolloutPercentage: flag?.rolloutPercentage || 0,
    description: flag?.description || ''
  };
}

// Hook for multiple feature flags
export function useFeatureFlags(flagNames: string[], userId?: string) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlags = () => {
      const flagStates: Record<string, boolean> = {};
      
      flagNames.forEach(flagName => {
        flagStates[flagName] = isFeatureEnabled(flagName, userId);
      });
      
      setFlags(flagStates);
      setLoading(false);
    };

    checkFlags();
    
    const interval = setInterval(checkFlags, 5000);
    return () => clearInterval(interval);
  }, [flagNames, userId]);

  return { flags, loading };
}
