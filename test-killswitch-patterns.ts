// Test file for enhanced kill-switch pattern detection
// This file contains various flag patterns to test the enhanced detection

// Test useFeatureFlag() pattern
const { isEnabled } = useFeatureFlag("NEW_FEATURE_FLAG");

// Test isEnabled() pattern
if (isEnabled("EXISTING_FEATURE")) {
  console.log("Feature is enabled");
}

// Test isFeatureEnabled() pattern
if (isFeatureEnabled("ADVANCED_FEATURE")) {
  console.log("Advanced feature is enabled");
}

// Test KILL_SWITCH_ pattern
const KILL_SWITCH_NEW_FEATURE = true;

// Test environment variable pattern
if (process.env.FEATURE_NEW_UI_ENABLED === "true") {
  console.log("New UI feature enabled");
}

// Test config pattern
const config = {
  features: {
    newDashboard: true,
    advancedAnalytics: false
  }
};

// Test toggle pattern
const toggle = {
  enableNewFeature: true,
  disableOldFeature: false
};

// Test import pattern
import { useFeatureFlag } from './flags';
import { isEnabled } from './feature-flags';

// Test rollout pattern
const rolloutConfig = {
  rolloutPercentage: 50,
  environments: ['staging', 'production']
};

// Test non-flag code (should not be detected)
const regularVariable = "not a flag";
const normalFunction = () => "not a flag pattern";
